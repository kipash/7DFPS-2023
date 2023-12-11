import { GameObject, Gizmos, IComponent, Mathf, SyncedTransform, findObjectsOfType, getTempVector, lookAtInverse, randomNumber, serializable } from "@needle-tools/engine";
import { Player } from "../Character/Framework/Player";
import { CharacterPhysics, CharacterPhysics_MovementMode, CharacterPhysics_Scheme } from "../Character/Physics/CharacterPhysics";
import { CommonAvatar } from "../Character/Misc/CommonAvatar";
import { CommonCharacterAnimations } from "../Character/Misc/CommonCharacterAnimations";
import { ViewModeFlags } from "../Character/Camera/ViewMode";
import { Pig } from "./Pig";
import { NavMesh } from "./NavMesh";
import { Object3D, Vector3 } from "three";
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

    private autoDetectIntervalID = -1;
    private autoRepathIntervalID = -1;
    private targetVisibilityIntervalID = -1;
    private pathfindInterval = -1;

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
            this.autoDetectIntervalID = setInterval(() => this.autoFindTarget(), randomNumber(800, 1200));
            this.pathfindInterval = randomNumber(1800, 2200);
            this.autoRepathIntervalID = setInterval(() => this.updatePath(), this.pathfindInterval);
            this.targetVisibilityIntervalID = setInterval(() => this.checkTargetVisibility(), randomNumber(400, 600));
        }
    }

    private stopIntervals() {
        if (this.autoDetectIntervalID != -1)
            clearInterval(this.autoDetectIntervalID);
        if (this.autoRepathIntervalID != -1)
            clearInterval(this.autoRepathIntervalID);
        if (this.targetVisibilityIntervalID != -1)
            clearInterval(this.targetVisibilityIntervalID);
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
            this.aim();
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
    private updatePath() {
        if (!this.target || this.target.isDead) return;
        
        // don't pathfind when not grounded
        const physics = this.state as CharacterPhysics_Scheme;
        if (!physics.characterIsGrounded) return;

        const path = this.currentPath = NavMesh.FindPath(this.worldPosition, this.target.worldPosition);
        if (path && path.length != 0) { // debug
            this.currentPathIndex = 0;
            /* path.unshift(this.worldPosition); */
            /* for (let i = 0; i < path.length - 1; i++) {
                const v1 = path[i];
                const v2 = path[i + 1];
                Gizmos.DrawLine(v1, v2, 0xff0000, this.pathfindInterval / 1000, false);
            } */
        }
        else {
            this.currentPathIndex = -1; // no path or update path
        }
    }

    private arriveMargin: number = 1;
    private posLastFrame: Vector3 | null = null;
    private refFwd = new Vector3(0, 0, 1);
    move() {
        if(!this.currentPath) return;
        const targetPos = this.currentPath[this.currentPathIndex];
        if(targetPos === undefined) return;

        const dis = this.worldPosition.distanceTo(targetPos);
        if(dis < this.arriveMargin) {
            this.currentPathIndex++;
        }

        const dir = getTempVector(targetPos).sub(this.worldPosition);
        
        /* dir.applyQuaternion(this.worldQuaternion); */
        dir.y = 0;
        dir.normalize();

        /* Gizmos.DrawDirection(this.worldPosition, dir, 0x00ff00, 0, false, 1); */
        
        const input = this.frameState as CommonCharacterInput_Scheme;
        input.moveDeltaX = -dir.x;
        input.moveDeltaY = dir.z;
        
        const physics = this.state as CharacterPhysics_Scheme;
        physics.characterDirection = this.refFwd;//getTempVector(this.refFwd).applyQuaternion(this.worldQuaternion);

        this.posLastFrame ??= this.worldPosition.clone();
        const delta = getTempVector(this.worldPosition).sub(this.posLastFrame);

        /* const lookGoal = getTempVector(targetPos);
        lookGoal.y = this.worldPosition.y;
        this.gameObject.lookAt(lookGoal); */
    }

    die(): void {
        if (this._isDead) return;

        super.die();

        if (this.isLocalPlayer) {
            this.stopIntervals();
            GameObject.destroySynced(this.gameObject);
        }
    }
}