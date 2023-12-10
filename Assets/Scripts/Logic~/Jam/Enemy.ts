import { GameObject, Gizmos, Mathf, SyncedTransform, findObjectsOfType, serializable } from "@needle-tools/engine";
import { Player } from "../Character/Framework/Player";
import { CharacterPhysics } from "../Character/Physics/CharacterPhysics";
import { CommonAvatar } from "../Character/Misc/CommonAvatar";
import { CommonCharacterAnimations } from "../Character/Misc/CommonCharacterAnimations";
import { ViewModeFlags } from "../Character/Camera/ViewMode";
import { Pig } from "./Pig";
import { NavMesh } from "./NavMesh";

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

    protected physics!: CharacterPhysics;
    protected avatar?: CommonAvatar;
    
    private autoDetectIntervalID = -1;

    initialize(findModules?: boolean): void {
        // create required modules
        this.physics = this.ensureModule(CharacterPhysics, mod => {
            mod.movementSpeed = this.movementSpeed;
            mod.desiredAirbornSpeed = this.jumpSpeed / 2;
            mod.jumpSpeed = this.jumpSpeed;
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

        if(this.isLocalPlayer) {
            this.autoDetectIntervalID = setInterval(() => this.autoFindTarget(), 1000);
        }
    }

    private target?: Player;
    autoFindTarget() {
        if(this.target && !this.target.isDead) return;

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

    update(): void {
        super.update();

        if(!this.isLocalPlayer) return;

        if(this.target && !this.target.isDead) {
            const target = this.target.worldPosition;
            target.y = this.gameObject.worldPosition.y;
            this.gameObject.lookAt(target);

            const path = NavMesh.FindPath(this.worldPosition, this.target.worldPosition);
            if(path) {
                path.unshift(this.worldPosition);
                /* if(path.length == 2) {
                    Gizmos.DrawLine(path[0], path[1], 0xff0000, 0, false);
                } */
                for (let i = 0; i < path.length - 1; i++) {
                    const v1 = path[i];
                    const v2 = path[i + 1];
                    Gizmos.DrawLine(v1, v2, 0xff0000, 0.1, false);
                }
            }
        }
    }

    die(): void {
        if(this._isDead) return;

        super.die();

        if(this.isLocalPlayer) {
            if(this.autoDetectIntervalID != -1)
                clearInterval(this.autoDetectIntervalID);
            GameObject.destroySynced(this.gameObject);
        }
    }
}