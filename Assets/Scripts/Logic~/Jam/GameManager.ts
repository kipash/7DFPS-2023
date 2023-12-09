import { AssetReference, Behaviour, EventList, GameObject, PlayerState, RoomEvents, isDevEnvironment, serializable } from "@needle-tools/engine";
import { Player } from "../Character/Framework/Player";

export class GameManager extends Behaviour {
    @serializable(AssetReference)
    asset?: AssetReference;

    // @nonSerialized
    @serializable(EventList)
    onPlayerSpawned?: EventList;

    awake(): void {
        this.watchTabVisible();
        this.context.connection.joinRoom(isDevEnvironment() ? "kippy" : "default");
    }

    onEnable(): void {
        this.context.connection.beginListen(RoomEvents.RoomStateSent, this.onJoinedRoom);
    }
    onDisable(): void {
        this.context.connection.stopListen(RoomEvents.RoomStateSent, this.onJoinedRoom)
    }

    private onJoinedRoom = async (_model) => {
        const instance = await this.asset?.instantiateSynced({ parent: this.gameObject }, true);
        if (instance) {
            const state = GameObject.getComponent(instance, PlayerState)!;
            state.owner = this.context.connection.connectionId!;
            
            const player = GameObject.getComponent(instance, Player)!;
            player.onDie.addEventListener(() => { 
                this.onJoinedRoom(null); // respawn
            });

            this.onPlayerSpawned?.invoke(instance);
        }
        else{
            console.warn("PlayerSync: failed instantiating asset!")
        }
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