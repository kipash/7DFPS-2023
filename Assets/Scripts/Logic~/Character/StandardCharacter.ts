import { Player } from "./Framework/Player.js";
import { CharacterPhysics, CharacterPhysics_MovementMode } from "./Physics/CharacterPhysics.js";
import { DesktopCharacterInput } from "./Input/DesktopCharacterInput.js";
import { MobileCharacterInput } from "./Input/MobileCharacterInput.js";
import { POVCamera } from "./Camera/POVCamera.js";
import { ViewModeFlags } from "./Camera/ViewMode.js";
import { CommonAvatar } from "./Misc/CommonAvatar.js";
import { CommonCharacterAudio } from "./Misc/CommonCharacterAudio.js";
import { CommonCharacterAnimations } from "./Misc/CommonCharacterAnimations.js";
import { SyncedTransform, serializable } from "@needle-tools/engine";

/** Character that support FPS and TPS modes */
export class StandardCharacter extends Player {

    @serializable()
    defaultViewMode: ViewModeFlags = ViewModeFlags.ThirdPerson;

    @serializable()
    allowedViewModes: ViewModeFlags = ViewModeFlags.All;

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

    @serializable()
    enableLineOfSight: boolean = true;

    protected camera!: POVCamera;
    protected physics!: CharacterPhysics;
    protected avatar?: CommonAvatar;
    protected audio?: CommonCharacterAudio;
    protected animation?: CommonCharacterAnimations;

    // @nonSerialized
    set person(mode: ViewModeFlags | null) { if (mode) this.switchPerson(mode); }
    // @nonSerialized
    get person(): ViewModeFlags | null { return this.camera?.person; }

    initialize(findModules?: boolean): void {
        // create required modules
        this.ensureModule(DesktopCharacterInput);
        this.ensureModule(MobileCharacterInput);
        this.camera = this.ensureModule(POVCamera, mod => {
            mod.offset.x = this.cameraXOffset * this.gameObject.worldScale.x;
            mod.offset.y = this.cameraYOffset * this.gameObject.worldScale.y;
            mod.enableLineOfSight = this.enableLineOfSight;
        });
        this.physics = this.ensureModule(CharacterPhysics, mod => {
            mod.movementSpeed = this.movementSpeed;
            mod.desiredAirbornSpeed = this.jumpSpeed / 2;
            mod.jumpSpeed = this.jumpSpeed;
            if (!this.enableSprint)
                mod.sprintModifier = 1;
        });

        // get optional modules
        this.avatar = this.gameObject.getComponentInChildren(CommonAvatar)!;
        this.audio = this.gameObject.getComponentInChildren(CommonCharacterAudio)!;
        this.animation = this.gameObject.getComponentInChildren(CommonCharacterAnimations)!;

        super.initialize(findModules);

        // locate SyncedTransform and request ownership on local player
        if (this.isLocalPlayer)
            this.gameObject.getComponentsInChildren(SyncedTransform).forEach(x => x.requestOwnership());

        if (!this.isAllowedPerson(this.defaultViewMode)) this.allowedViewModes |= this.defaultViewMode;
        this.switchPerson(this.defaultViewMode);
        this.camera?.restoreDefault();

        if(!this.isLocalPlayer) {
            console.log(this.camera.camera?.gameObject, this.camera.camera?.gameObject.visible);
        }
    }

    update(): void {
        super.update();

        if(!this.isInitialized) return;

        if (!this.camera || this.context.isInXR) return;
        
        if (this.camera.desiredPerson != this.camera.person)
            this.switchPerson(this.camera.desiredPerson);
    }

    protected isAllowedPerson(person: ViewModeFlags) {
        return (this.allowedViewModes & person) != 0;
    }

    protected switchPerson(newPerson: ViewModeFlags) {
        if (!this.physics || !this.camera) return;
        if (!this.isAllowedPerson(newPerson)) return;

        this.physics.movementMode = newPerson == ViewModeFlags.FirstPerson ? CharacterPhysics_MovementMode.Move : CharacterPhysics_MovementMode.Turn;
        this.physics.forceSetRotation(this.gameObject.quaternion); // set character rotation
        this.avatar?.setPerson(newPerson);
        this.camera.switchPerson(newPerson);
    }
}