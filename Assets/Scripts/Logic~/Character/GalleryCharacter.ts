import { POVCamera } from "./Camera/POVCamera.js";
import { CommonAvatar } from "./Misc/CommonAvatar.js";
import { ViewModeFlags } from "./Camera/ViewMode.js";
import { Player } from "./Framework/Player.js";
import { SimplePointerInput } from "./Input/SimplePointerInput.js";
import { TeleportNavigation } from "./Physics/TeleportNavigation.js";
import { SyncedTransform, serializable } from "@needle-tools/engine";

export class GalleryCharacter extends Player {
    @serializable()
    overrideModuleSettings: boolean = true;

    @serializable()
    headHeight: number = 1.6;

    @serializable()
    teleportationSpeed: number = 3;

    private camera?: POVCamera;
    private avatar?: CommonAvatar;

    awake(): void {
        super.awake();

        this.camera = this.ensureModule(POVCamera, mod => {
            if(this.overrideModuleSettings)
                mod.offset.set(0, this.headHeight, 0);
        });
        
        this.ensureModule(TeleportNavigation, mod => { 
            if(this.overrideModuleSettings)
                mod.positionSmoothing = this.teleportationSpeed;
        });

        this.ensureModule(SimplePointerInput);
        this.avatar = this.gameObject.getComponentInChildren(CommonAvatar)!;
    }

    protected initialize(findModules?: boolean): void {
        super.initialize(findModules);

        this.camera?.switchPerson(ViewModeFlags.FirstPerson);
        this.avatar?.setPerson(ViewModeFlags.FirstPerson);

        // locate SyncedTransform and request ownership on local player
        if (this.isLocalPlayer)
            this.gameObject.getComponent(SyncedTransform)?.requestOwnership();
    }
}