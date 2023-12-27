import { Behaviour, GameObject, RoomEvents, Text, serializable } from "@needle-tools/engine";
import { GameManager } from "./GameManager";
import { Object3D } from "three";
import { Player } from "../Character/Framework/Player";
import { HealthBarUI } from "./HealthBarUI";

export class UIManager extends Behaviour {
    @serializable(GameManager)
    gameManager!: GameManager;

    @serializable(Object3D)
    cross!: Object3D;

    @serializable(Object3D)
    menuUI!: Object3D;

    @serializable(Object3D)
    lobbyUI!: Object3D;

    @serializable(Object3D)
    charSelect!: Object3D;

    @serializable(Object3D)
    preGame!: Object3D;

    @serializable(Object3D)
    startGame!: Object3D;

    @serializable(Object3D)
    awaitingHostLabel!: Object3D;

    @serializable(Text)
    lobbyIdLabel!: Text;

    @serializable(Text)
    lobbyUsersLabel!: Text;

    @serializable(HealthBarUI)
    playerHealthBar?: HealthBarUI;

    awake(): void {
        const net = this.context.connection;
        const userListUpdated = () => {
            this.lobbyUsersLabel.text = `Players: ${net.usersInRoom().length}`;
        }
        net.beginListen(RoomEvents.RoomStateSent, () => {
            this.menuUI.visible = false;
            this.lobbyUI.visible = true;
            const isMaster = GameManager.CalculateIsMaster();
            this.awaitingHostLabel.visible = !isMaster;
            this.startGame.visible = isMaster;
            this.lobbyIdLabel.text = `Lobby ID: ${net.currentRoomName!.replace("7DFPS_", "")}`;
            userListUpdated();
        });
        net.beginListen(RoomEvents.UserJoinedRoom, userListUpdated);
        net.beginListen(RoomEvents.UserLeftRoom, userListUpdated);
        net.beginListen(RoomEvents.LeftRoom, () => {
            this.menuUI.visible = true;
            this.lobbyUI.visible = false;
            this.awaitingHostLabel.visible = false;
            this.startGame.visible = false;
            this.lobbyIdLabel.text = "";
        });

        this.gameManager.onGameStart.addEventListener(() => {
            this.lobbyUI.visible = false;
            this.charSelect.visible = false;
            this.preGame.visible = false;
            this.startGame.visible = false;
        });

        this.gameManager.onPlayerSpawned?.addEventListener((obj: GameObject) => {
            const pl = obj.getComponent(Player);
            if(pl) {
                this.cross.visible = true;
                pl.onDie.addEventListener(() => this.cross.visible = false);
            }
        });

        // force setup
        this.playerHealthBar?.set(0, 1, false, true);
    }

    update(): void {
        const hp = this.gameManager.localPlayer?.hp ?? 0;
        const maxhp = this.gameManager.localPlayer?.maxHealth ?? 0;
        const isAlive = this.gameManager.localPlayer?.isDead == false ?? false;
        this.playerHealthBar?.set(hp, maxhp, isAlive);
    }
}
