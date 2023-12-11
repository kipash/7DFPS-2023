import { AssetReference, Behaviour, Context, EventList, GameObject, IGameObject, PlayerState, RoomEvents, UserJoinedOrLeftRoomModel, isDevEnvironment, serializable } from "@needle-tools/engine";
import { Player } from "../Character/Framework/Player";
import { Pig } from "./Pig";
import { Enemy } from "./Enemy";
import { Vector3 } from "three";

export class GameManager extends Behaviour {
    @serializable(AssetReference)
    playerAsset?: AssetReference;

    @serializable(AssetReference)
    enemyAsset?: AssetReference;

    // @nonSerialized
    @serializable(EventList)
    onPlayerSpawned?: EventList;

    private static _isMaster: boolean = false;
    public static get isMaster(): boolean { return this._isMaster; }

    private static calculateIsMaster(): boolean {
        const net = Context.Current.connection;
        return net.isInRoom && net.usersInRoom().indexOf(net.connectionId!) === 0;
    }
    
    private _isReady: boolean = false;
    get isReady(): boolean { return this._isReady }

    awake(): void {
        this.watchTabVisible();
        this.context.connection.joinRoom(isDevEnvironment() ? "kippy_004" : "default");
    }

    start(): void {
        this.context.targetFrameRate = undefined; //unlock framerate
    }

    onEnable(): void {
        this.context.connection.beginListen(RoomEvents.RoomStateSent, this.onJoinedRoom);
        this.context.connection.beginListen(RoomEvents.UserLeftRoom, this.onOtherUserLeft);
    }
    onDisable(): void {
        this.context.connection.stopListen(RoomEvents.RoomStateSent, this.onJoinedRoom)
        this.context.connection.stopListen(RoomEvents.UserLeftRoom, this.onOtherUserLeft)
    }

    private onJoinedRoom = (_model) => {
        this.spawnPlayer();
        this._isReady = true;
        GameManager._isMaster = GameManager.calculateIsMaster();
    }

    private onOtherUserLeft = (_model) => {
        GameManager._isMaster = GameManager.calculateIsMaster();
        /* const net = this.context.connection;
        const model = _model.data as unknown as UserJoinedOrLeftRoomModel;
        const index = net.usersInRoom().indexOf(model.userId);
        if(index === 0) {
            console.log("MASTER DISCONNECTED");
            net.leaveRoom();
        } */
    }

    async spawnPlayer(): Promise<Player | null> {
        if(!this.playerAsset) return null;

        const playerObj = await this.spawnAsset(this.playerAsset);

        const player = playerObj.getComponent(Pig)!;
        player.onDie.addEventListener(() => { 
            this.onJoinedRoom(null); // respawn
        });

        this.onPlayerSpawned?.invoke(playerObj);

        return player;
    }
    
    async spawnEnemy(): Promise<Enemy | null> {
        if(!this.enemyAsset) return null;

        const enemyObj = await this.spawnAsset(this.enemyAsset);

        const enemy = enemyObj.getComponent(Enemy)!;
        return enemy;
    }

    // TODO: implement PR to remove timeout duplication
    private defaultPos = new Vector3(0, 0, 0);
    async spawnAsset(asset: AssetReference) : Promise<IGameObject> {
        const instance = await asset.instantiateSynced({ parent: this.gameObject, position: this.defaultPos}, true) as GameObject;
        instance.visible = true;
        if (instance) {
            const state = GameObject.getComponent(instance, PlayerState)!;
            state.owner = this.context.connection.connectionId!;
        }
        else{
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