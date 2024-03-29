import { Animator, AssetReference, GameObject, Gizmos, IComponent, Mathf, SyncedTransform, WaitForSeconds, findObjectsOfType, getTempVector, lookAtInverse, randomNumber, serializable } from "@needle-tools/engine";
import { Player } from "../Character/Framework/Player";
import { CharacterPhysics, CharacterPhysics_MovementMode, CharacterPhysics_Scheme } from "../Character/Physics/CharacterPhysics";
import { CommonAvatar } from "../Character/Misc/CommonAvatar";
import { CommonCharacterAnimations } from "../Character/Misc/CommonCharacterAnimations";
import { ViewModeFlags } from "../Character/Camera/ViewMode";
import { Pig } from "./Pig";
import { NavMesh } from "./NavMesh";
import { Object3D, Vector2, Vector3 } from "three";
import { Gun } from "./Guns/Gun";
import { CommonCharacterInput_Scheme } from "../Character/Input/DesktopCharacterInput";
import { HousePlayer } from "./HousePlayer";

export class Enemy extends Player {
    @serializable()
    movementSpeed: number = 28;

    @serializable()
    jumpSpeed: number = 8;

    @serializable()
    cameraXOffset: number = 1;

    @serializable()
    cameraYOffset: number = 1.6;

    @serializable()
    enableSprint: boolean = true;

    @serializable(Object3D)
    lineOfSightRef?: Object3D;

    @serializable()
    attackDistancePig: number = 1;

    @serializable()
    attackDistanceHouse: number = 3;

    @serializable()
    attackRate: number = 1;

    @serializable()
    attackDamage: number = 10;

    @serializable(Animator)
    animator?: Animator;

    @serializable(AssetReference)
    puffEffect?: AssetReference;

    protected physics!: CharacterPhysics;

    initialize(findModules?: boolean): void {
        // create required modules
        this.physics = this.ensureModule(CharacterPhysics, mod => {
            mod.movementSpeed = this.movementSpeed;
            mod.desiredAirbornSpeed = this.jumpSpeed / 2;
            mod.jumpSpeed = this.jumpSpeed;
            mod.movementMode = CharacterPhysics_MovementMode.Turn;
            if (!this.enableSprint)
                mod.sprintModifier = 1;
        });

        super.initialize(findModules);

        // locate SyncedTransform and request ownership on local player
        if (this.isLocalPlayer)
            this.gameObject.getComponent(SyncedTransform)?.requestOwnership();

        if (this.isLocalPlayer) {
            this.startCoroutine(this.updatePathLoop());
            this.startCoroutine(this.findTargetLoop());
            /* this.startCoroutine(this.targetVisibilityLoop()); */
        }
    }

    private pathfindInterval = -1;
    private *updatePathLoop() {
        this.pathfindInterval = randomNumber(1.8, 2.2);
        while (true) {
            this.updatePath();
            yield WaitForSeconds(this.pathfindInterval);
        }
    }

    private *findTargetLoop() {
        const delay = randomNumber(0.8, 1.2);
        while (true) {
            this.autoFindTarget();
            yield WaitForSeconds(delay);
        }
    }

    /* private *targetVisibilityLoop() {
        const delay = randomNumber(0.4, 0.6);
        while (true) {
            this.checkTargetVisibility();
            yield WaitForSeconds(delay);
        }
    } */

    private target?: Player;
    private autoFindTarget() {
        if (this.target && !this.target.isDead) return;

        var players: Player[] = [];
        findObjectsOfType(Player, players, this.context);

        players = players
            .filter(x => x != this && x.gameObject !== null && x.gameObject !== undefined)
            .filter(x => !x.isDead)
            .filter(x => x instanceof Pig || x instanceof HousePlayer)
            .sort((a, b) => {
                return a.gameObject.worldPosition.distanceTo(this.gameObject.worldPosition) - b.gameObject.worldPosition.distanceTo(this.gameObject.worldPosition);
            });

        this.target = players.at(0);
    }

    earlyUpdate(): void {
        super.earlyUpdate();

        if (!this.isLocalPlayer) return;

        this.move();
        this.attack();
    }

    private lastAttackTime: number = Number.MIN_SAFE_INTEGER;
    attack() {
        if (!this.target || this.target.isDead || this.isDead) return;

        const distance = this.worldPosition.distanceTo(this.target.worldPosition);

        // switch distnace based on target type
        const minAttackDistnace = this.target instanceof HousePlayer ? this.attackDistanceHouse : this.attackDistancePig;
        if (distance > minAttackDistnace) return;

        const time = this.context.time.time;
        if (time - this.lastAttackTime < this.attackRate) return;

        this.lastAttackTime = time;
        this.target.dealDamage(this.attackDamage);
        this.animator?.play("Peck");
    }

    /* private isTargetVisible: boolean = false;
    private checkTargetVisibility() {
        if (!this.target || this.target.isDead) return;
        if (!this.lineOfSightRef) return;

        const eyePos = this.lineOfSightRef.getWorldPosition(getTempVector());
        const targetPos = this.target.worldPosition;
        const dir = getTempVector(targetPos).sub(eyePos).normalize();
        const result = Gun.raycastAndGetNormal(eyePos, dir, 50, true, (comp: IComponent) => {
            const player = comp.gameObject.getComponentInParent(Player);
            if (!player) return false;
            return player !== this;
        });

        this.isTargetVisible = result != null;
    } */

    private currentPath: Vector3[] = [];
    private currentPathIndex: number = -1;
    private updatePath() {
        if (!this.target || this.target.isDead || this.isDead) return;

        //console.log("Targetting: ", this.target.gameObject.name);

        /* this.currentPath.length = 0;
        this.currentPath = [this.target.gameObject.getWorldPosition(getTempVector()).clone()];
        this.currentPathIndex = 0; */

        // don't pathfind when not grounded
        const physics = this.state as CharacterPhysics_Scheme;
        if (!physics.characterIsGrounded) return;

        let path = NavMesh.FindPath(this.worldPosition, this.target.worldPosition);

        if (path && path.length != 0) { // debug
            this.currentPath = path;
            this.currentPathIndex = 0;
            /* for (let i = 0; i < path.length - 1; i++) {
                const v1 = path[i];
                const v2 = path[i + 1];
                Gizmos.DrawLine(v1, v2, 0xff0000, this.pathfindInterval, false);
            } */
        }
        else {
            this.currentPathIndex = -1; // no path or update path
        }
    }

    private arriveMargin: number = 0.1;
    /* private posLastFrame: Vector3 | null = null; */
    private refFwd = new Vector3(0, 0, 1);
    move() {
        if (!this.currentPath) return;
        const targetPos = this.currentPath[this.currentPathIndex];
        if (targetPos === undefined) return

        const distance = this.worldPosition.distanceTo(targetPos);
        if (distance < this.arriveMargin) {
            this.currentPathIndex++;

            this.move();
            return;
        }

        const dir = getTempVector(targetPos).sub(this.gameObject.worldPosition);
        if (dir.length() < this.arriveMargin) {
            this.currentPathIndex++;
            this.move();
            return;
        }

        dir.y = 0;
        dir.normalize();

        /* Gizmos.DrawLabel(new Vector3(0, 2, 0), `${this.currentPathIndex + 1}/${this.currentPath.length}`, 0.1, 0, 0xffffff, 0x000000, this.gameObject); */
        /* Gizmos.DrawLine(this.gameObject.worldPosition, targetPos, 0x00ff00, 0, false); */

        // don't move while attacking
        if (this.context.time.time - this.lastAttackTime < this.attackRate) return;

        const input = this.frameState as CommonCharacterInput_Scheme;
        input.moveDeltaX = -dir.x;
        input.moveDeltaY = dir.z;

        const physics = this.state as CharacterPhysics_Scheme;
        physics.characterDirection = this.refFwd;
    }

    async die() {
        if (this._isDead) return;

        super.die();

        if (this.isLocalPlayer) {
            if (this.puffEffect)
                await this.puffEffect.instantiateSynced({ parent: this.context.scene.children[0], position: this.gameObject.getWorldPosition(new Vector3()) });

            GameObject.destroySynced(this.gameObject);
        }
    }
}