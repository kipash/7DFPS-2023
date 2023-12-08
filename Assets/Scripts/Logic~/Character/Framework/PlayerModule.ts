import { Behaviour } from "@needle-tools/engine";
import { Player } from "./Player.js";

export enum PlayerModuleType {
    none = "none",

    physics = "physics",
    input = "input",
    camera = "camera",

    generic = "generic",
}

export enum PlayerModuleRole {
    local = 1 << 0,
    remote = 1 << 1,
    all = local | remote,
}

/** Modules solve singular areas of character logic */
// @nonSerializable
export abstract class PlayerModule extends Behaviour {
    abstract get type(): PlayerModuleType;
    get allowedRoles() { return PlayerModuleRole.local; }

    protected player!: Player;
    protected get frameState() { return this.player.frameState; }
    protected get state() { return this.player.state; }

    protected _isInitialized: boolean = false;
    get isInitialized() { return this._isInitialized; }
    initialize(player: Player) {
        this.player = player;
        this._isInitialized = true;
    }

    /** When this module was created on the fly and requires extra setup steps*/
    onDynamicallyConstructed() { }

    /** update events */
    moduleEarlyUpdate() { }
    moduleUpdate() { }
    moduleLateUpdate() { }
    moduleOnBeforeRender() { }
}
