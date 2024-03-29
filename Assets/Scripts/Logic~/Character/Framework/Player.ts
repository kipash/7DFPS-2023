import { Behaviour, CapsuleCollider, ConstructorConcrete, EventList, GameObject, Mathf, PlayerState, getComponent, serializable, showBalloonMessage, syncField } from "@needle-tools/engine";
import { PlayerModule, PlayerModuleRole } from "./PlayerModule.js";
import { CharacterState } from "./PlayerState.js";
import { HealthBarUI } from "../../Jam/HealthBarUI.js";

/** Base definition of an Player which has modules that define its capabilities. 
 *  These modules communciate via a state object that holds values */
// @nonSerializable
export abstract class Player extends Behaviour {
    /** Modules that define the character's input, view and motor */
    private _modules!: Set<PlayerModule>;

    /** shared object that modules read from and write into to expose API
        frame state in oppose to state is delated on the beginning of every frame */
    private _frameState!: CharacterState;
    get frameState(): CharacterState { return this._frameState; }

    private _state!: CharacterState;
    get state(): CharacterState { return this._state; }

    private _isInitialized: boolean = false;
    get isInitialized() { return this._isInitialized; }

    //@nonSerialized
    onRoleChanged!: EventList;

    playerState?: PlayerState | null = null;
    get isLocalPlayer(): boolean { return this.playerState?.isLocalPlayer ?? true; }
    get isNetworking(): boolean { return this.context.connection.isInRoom; }

    /** Waits for owner, otherwise initializes right away */
    protected startInitialization(findModules: boolean = true) {
        if (this.isNetworking && this.playerState && !this.playerState.owner) {
            this.playerState.onFirstOwnerChangeEvent.addEventListener(() => {
                this.initialize(findModules);
            });
        }
        else {
            this.initialize(findModules);
        }
    }

    /** Initialize the character and modules. */
    protected initialize(findModules: boolean = true) {
        if (findModules) {
            this.addAllModules();
        }

        this._modules.forEach(module => {
            if (!module.isInitialized)
                module.initialize(this);
        });
        this._isInitialized = true;

        this.roleChanged(this.isLocalPlayer);

        this.resetHealth();
    }

    protected roleChanged(isLocalPlayer: boolean) {
        this.onRoleChanged?.invoke(isLocalPlayer);
    }

    addAllModules() {
        this.gameObject.getComponentsInChildren(PlayerModule).forEach(x => this.addModule(x));
    }

    ensureModule<TModule extends PlayerModule>(type: ConstructorConcrete<TModule>, onModuleCreated?: (instance: TModule) => void): TModule {
        let module = this.gameObject.getComponentInChildren<TModule>(type);
        if (!module) {
            module = this.gameObject.addNewComponent(type)!;
            module.sourceId ||= this.sourceId;
            module.onDynamicallyConstructed();
            onModuleCreated?.(module);
        }
        return module;
    }

    hasModule<Base extends PlayerModule>(type: ConstructorConcrete<Base>): boolean {
        return this.gameObject.getComponentInChildren(type) != null;
    }

    addModule(module: PlayerModule) {
        this._modules.add(module);
    }

    removeModule(module: PlayerModule) {
        this._modules.delete(module);
    }

    // --- Object API ---

    awake() {
        this._modules = new Set();
        this._state = {};
        this._frameState = {};
        this.onRoleChanged = new EventList();
        this.playerState = this.gameObject.getComponent(PlayerState)!;

        this.healthBar?.set(0, 1, false, true);
    }

    start() {
        this.startInitialization(true);
    }

    static allegableForUpdate(player: Player, module: PlayerModule): boolean {
        return module.isInitialized && 0 != (module.allowedRoles & (player.isLocalPlayer ? PlayerModuleRole.local : PlayerModuleRole.remote));
    }

    earlyUpdate(): void {
        // clear frame state
        this._frameState = {};

        this._modules.forEach(module => { if (Player.allegableForUpdate(this, module)) { module.moduleEarlyUpdate(); } });
    }
    update(): void {
        this._modules.forEach(module => { if (Player.allegableForUpdate(this, module)) { module.moduleUpdate(); } });
        this.healthBar?.set(this.hp, this.maxHealth, true);
    }
    lateUpdate(): void {
        this._modules.forEach(module => { if (Player.allegableForUpdate(this, module)) { module.moduleLateUpdate(); } });
    }
    onBeforeRender(): void {
        this._modules.forEach(module => { if (Player.allegableForUpdate(this, module)) { module.moduleOnBeforeRender(); } });
    }

    // ------------ JAM -------------

    @serializable()
    maxHealth: number = 100;

    @serializable(HealthBarUI)
    healthBar?: HealthBarUI;

    onDie: EventList = new EventList();

    @syncField(Player.prototype.onHPChanged)
    protected _hp = 0 ;
    get hp() { return this._hp; }

    protected _isDead: boolean = false;
    get isDead(): boolean { return this._isDead; }

    resetHealth() {
        if(this.isLocalPlayer) {
            this._hp = this.maxHealth;
            this._isDead = false;
        }
    }

    dealDamage(dmg: number) {
        this._hp = Mathf.clamp(this.hp - dmg, 0, 99999999);
    }

    protected onHPChanged(newValue: number, previousValue: number) {
        const diff = newValue - previousValue;
        if(diff < 0) {
            this.onRecieveDamage(diff);
        }

        if (newValue <= 0) {
            this.die();
        }
    }

    protected onRecieveDamage(dmg: number) { }

    die() {
        if(this._isDead) return;
        this._isDead = true; 

        this.onDie?.invoke();
    }
}