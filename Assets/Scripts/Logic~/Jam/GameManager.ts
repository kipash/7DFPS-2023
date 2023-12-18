import { AssetReference, Behaviour, Context, EventList, GameObject, IGameObject, InputField, Mathf, PlayerState, RoomEvents, SendQueue, UserJoinedOrLeftRoomModel, isDevEnvironment, randomNumber, serializable } from "@needle-tools/engine";
import { Player } from "../Character/Framework/Player";
import { Pig } from "./Pig";
import { Enemy } from "./Enemy";
import { Object3D, Vector3 } from "three";

export class GameManager extends Behaviour {
    @serializable(AssetReference)
    plinkyAsset?: AssetReference;

    @serializable(AssetReference)
    stinkyAsset?: AssetReference;

    @serializable(AssetReference)
    blinkyAsset?: AssetReference;

    @serializable(AssetReference)
    enemyAsset?: AssetReference;

    // @nonSerialized
    @serializable(EventList)
    onPlayerSpawned?: EventList;

    /* @serializable(Object3D)
    masterLabel?: Object3D; */

    @serializable(InputField)
    lobbyInputField?: InputField;

    private static _isMaster: boolean = false;
    public static get isMaster(): boolean { return this._isMaster; }

    public static CalculateIsMaster(): boolean {
        const net = Context.Current.connection;
        this._isMaster = net.isInRoom && net.usersInRoom().indexOf(net.connectionId!) === 0;
        return this._isMaster;
    }

    awake(): void {
        this.watchTabVisible();
    }

    joinInputFieldLobby() {
        if (this.lobbyInputField) {
            let id = `7DFPS_${this.lobbyInputField.text}`;
            if(id.length > 0)
                this.joinLobby(id);
        }
    }

    joinRandomLobby() {
        this.joinLobby(`7DFPS_${Math.floor(randomNumber(100, 999))}`);
    }

    leaveLobby() {
        const net = this.context.connection;
        if (net.isInRoom)
            net.leaveRoom();
    }

    private joinLobby(id: string) {
        this.context.connection.joinRoom(id);
    }

    start(): void {
        this.context.targetFrameRate = undefined; //unlock framerate
    }

    onEnable(): void {
        this.context.connection.beginListen(RoomEvents.RoomStateSent, this.onJoinedRoom);
        this.context.connection.beginListen(RoomEvents.UserLeftRoom, this.onOtherUserLeft);
        this.context.connection.beginListen("game-start", this.handleGameStart);
    }
    onDisable(): void {
        this.context.connection.stopListen(RoomEvents.RoomStateSent, this.onJoinedRoom);
        this.context.connection.stopListen(RoomEvents.UserLeftRoom, this.onOtherUserLeft);
        this.context.connection.stopListen("game-start", this.handleGameStart);
    }

    private onJoinedRoom = (_model) => {
        GameManager._isMaster = GameManager.CalculateIsMaster();

        /* if (this.masterLabel)
            this.masterLabel.visible = GameManager._isMaster; */
    }

    private onOtherUserLeft = (_model) => {
        /* GameManager._isMaster = GameManager.calculateIsMaster(); */

        /* const net = this.context.connection;
        const model = _model.data as unknown as UserJoinedOrLeftRoomModel;
        const index = net.usersInRoom().indexOf(model.userId);
        if(index === 0) {
            console.log("MASTER DISCONNECTED");
            net.leaveRoom();
        } */
    }

    startGame() {
        if (this._gameHasStarted) return;
        if (!GameManager._isMaster) return;

        this.context.connection.send("game-start");
        this.handleGameStart(null);
    }

    private _gameHasStarted: boolean = false;
    //@nonSerialized
    get gameHasStarted(): boolean { return this._gameHasStarted; }

    @serializable(EventList)
    onGameStart: EventList = new EventList();

    private handleGameStart = async (_model) => {
        this._gameHasStarted = true;
        this.startRespawnLoop();
        this.onGameStart.invoke();
    }

    private async startRespawnLoop() {
        const player = await this.spawnPlayer();
        player?.onDie.addEventListener(() => this.startRespawnLoop());
    }

    private charSelect: number = 0;
    selectCharacter(index: number) {
        this.charSelect = index;
    }

    private players: Player[] = [];
    async spawnPlayer(): Promise<Player | null> {
        if (!this.plinkyAsset) return null;

        const asset = [this.plinkyAsset, this.stinkyAsset, this.blinkyAsset][Mathf.clamp(this.charSelect, 0, 2)]!;
        console.log(asset.uri);
        const playerObj = await this.spawnAsset(asset);

        const player = playerObj.getComponent(Pig)!;
        this.players.push(player);
        player.onDie.addEventListener(() => {
            this.players.splice(this.players.indexOf(player), 1);
        });
        this.onPlayerSpawned?.invoke(playerObj);

        return player;
    }

    update(): void {
        this.players.forEach(x => {
            if(!x.isDead && x.worldPosition.y < -20) {
                x.dealDamage(9999);
            }
        });
    }

    async spawnEnemy(): Promise<Enemy | null> {
        if (!this.enemyAsset) return null;

        const enemyObj = await this.spawnAsset(this.enemyAsset);

        const enemy = enemyObj.getComponent(Enemy)!;
        return enemy;
    }

    // TODO: implement PR to remove timeout duplication / deploy selfhost
    private defaultPos = new Vector3(0, 0, 0);
    async spawnAsset(asset: AssetReference): Promise<IGameObject> {
        const instance = await asset.instantiateSynced({ parent: this.gameObject, position: this.defaultPos }, true) as GameObject;
        instance.visible = true;
        if (instance) {
            const state = GameObject.getComponent(instance, PlayerState)!;
            state.owner = this.context.connection.connectionId!;
        }
        else {
            console.warn("PlayerSync: failed instantiating asset!")
        }

        return instance;
    }

    // IS THIS NEEDED? 
    // TODO: Consider if the jam could do something differently?
    private watchTabVisible() {
        window.addEventListener("visibilitychange", _ => {
            if (document.visibilityState === "visible") {
                for (let i = PlayerState.all.length - 1; i >= 0; i--) {
                    const pl = PlayerState.all[i];
                    if (!pl.owner || !this.context.connection.userIsInRoom(pl.owner)) {
                        pl.doDestroy();
                    }
                }
            }
        });
    }
}