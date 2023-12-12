import { GameObject, Gizmos, IComponent, Mathf, SyncedTransform, WaitForSeconds, findObjectsOfType, getTempVector, lookAtInverse, randomNumber, serializable } from "@needle-tools/engine";
import { Player } from "../Character/Framework/Player";
import { CharacterPhysics, CharacterPhysics_MovementMode, CharacterPhysics_Scheme } from "../Character/Physics/CharacterPhysics";
import { CommonAvatar } from "../Character/Misc/CommonAvatar";
import { CommonCharacterAnimations } from "../Character/Misc/CommonCharacterAnimations";
import { ViewModeFlags } from "../Character/Camera/ViewMode";
import { Pig } from "./Pig";
import { NavMesh } from "./NavMesh";
import { Object3D, Vector2, Vector3 } from "three";
import { Gun } from "./Gun";
import { CommonCharacterInput_Scheme } from "../Character/Input/DesktopCharacterInput";

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

    @serializable(Gun)
    gun?: Gun;

    protected physics!: CharacterPhysics;
    protected avatar?: CommonAvatar;

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

        // get optional modules
        this.avatar = this.gameObject.getComponentInChildren(CommonAvatar)!;
        this.avatar.setPerson(ViewModeFlags.ThirdPerson);

        super.initialize(findModules);

        // locate SyncedTransform and request ownership on local player
        if (this.isLocalPlayer)
            this.gameObject.getComponent(SyncedTransform)?.requestOwnership();

        if (this.isLocalPlayer) {
            this.startCoroutine(this.updatePathLoop());
            this.startCoroutine(this.findTargetLoop());
            this.startCoroutine(this.targetVisibilityLoop());
        }
    }

    private pathfindInterval = -1;
    private *updatePathLoop() {
        this.pathfindInterval = randomNumber(0.3, 0.5);//(1.8, 2.2);
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

    private *targetVisibilityLoop() {
        const delay = randomNumber(0.4, 0.6);
        while (true) {
            this.checkTargetVisibility();
            yield WaitForSeconds(delay);
        }
    }

    private target?: Player;
    private autoFindTarget() {
        if (this.target && !this.target.isDead) return;

        var players: Player[] = [];
        findObjectsOfType(Player, players, this.context);

        players = players
            .filter(x => x != this && x.gameObject !== null && x.gameObject !== undefined)
            .filter(x => !x.isDead)
            .filter(x => x instanceof Pig)
            .sort((a, b) => {
                return a.gameObject.worldPosition.distanceTo(this.gameObject.worldPosition) - b.gameObject.worldPosition.distanceTo(this.gameObject.worldPosition);
            });

        this.target = players.at(0);
    }

    earlyUpdate(): void {
        super.earlyUpdate();

        if (!this.isLocalPlayer) return;

        this.move();

        if(this.isTargetVisible) {
            //this.aim();
        }
    }

    private aim() {
        if(!this.gun || !this.target) return;

        const goal = getTempVector(this.target.worldPosition);
        goal.y += 1.5;
        this.gun.gameObject.lookAt(goal);

        this.gun.fire();
    }

    private isTargetVisible: boolean = false;
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
    }

    private currentPath: Vector3[] = [];
    private currentPathIndex: number = -1;
    private lastValidNavPos: Vector3 | null = null;
    private updatePath() {
        if (!this.target || this.target.isDead || this.isDead) return;
        
        // don't pathfind when not grounded
        const physics = this.state as CharacterPhysics_Scheme;
        if (!physics.characterIsGrounded) return;

        let path = NavMesh.FindPath(this.worldPosition, this.target.worldPosition, this.lastValidNavPos);
        /* if(!path && NavMesh.IsOnNavMesh(this.worldPosition) && this.currentPath[this.currentPathIndex] != undefined) {
            path = [ this.currentPath[this.currentPathIndex] ];
        } */

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

    private arriveMargin: number = 0.4;
    /* private posLastFrame: Vector3 | null = null; */
    private refFwd = new Vector3(0, 0, 1);
    move() {
        if(!this.currentPath) return;
        const targetPos = this.currentPath[this.currentPathIndex];
        if(targetPos === undefined) return;

        this.lastValidNavPos = targetPos;

        const dis = this.worldPosition.distanceTo(targetPos);
        if(dis < this.arriveMargin) {
            this.currentPathIndex++;
        }

        const dir = getTempVector(targetPos).sub(this.worldPosition);
        
        dir.y = 0;
        dir.normalize();

        /* Gizmos.DrawLabel(new Vector3(0, 2, 0), `${this.currentPathIndex + 1}/${this.currentPath.length}`, 0.1, 0, 0xffffff, 0x000000, this.gameObject); */
        /* Gizmos.DrawDirection(this.worldPosition, dir, 0x00ff00, 0, false, 1); */
        
        const input = this.frameState as CommonCharacterInput_Scheme;
        input.moveDeltaX = -dir.x;
        input.moveDeltaY = dir.z;
        
        const physics = this.state as CharacterPhysics_Scheme;
        physics.characterDirection = this.refFwd;
    }

    die(): void {
        if (this._isDead) return;

        super.die();

        if (this.isLocalPlayer) {
            GameObject.destroySynced(this.gameObject);
        }
    }
}