import { Vector3, MeshStandardMaterial, Color, Material } from "three";

import { PlayerModule, PlayerModuleType } from "../Framework/PlayerModule.js";
import { ViewModeFlags } from "../Camera/ViewMode.js";
import { Player } from "../Framework/Player.js";
import { GameObject, Renderer, serializable } from "@needle-tools/engine";

/** Simple avatar that can adjust itself for first person view */
export class CommonAvatar extends PlayerModule {
    get type() { return PlayerModuleType.none; }
    
    @serializable(GameObject)
    avatarObject?: GameObject;

    @serializable()
    characterZOffset: number = 0.3;

    @serializable(GameObject)
    headBone?: GameObject;

    @serializable(Renderer)
    mainRenderer: Renderer[] = [];

    private zeroScale = new Vector3(0, 0, 0);
    private originalHeadScale?: Vector3;
    awake(): void {
        if (this.headBone) {
            this.originalHeadScale = new Vector3();
            this.originalHeadScale?.copy(this.headBone.scale)
        }
    }

    private currentPerson?: ViewModeFlags;
    setPerson(person: ViewModeFlags) {
        this.currentPerson = person;
    }

    initialize(character: Player): void {
        super.initialize(character);

        // tint the avatar deterministically based on the owner's ID
        if(character.isNetworking) {
            const netID = character.playerState?.owner!;
            this.tintObjects(netID);
        }
    }

    private tintObjects(netID: string) {
        const id = parseInt(netID, 16);
        const uniqueCol = new Color(id);

        this.mainRenderer.forEach(r => {
            for(let i = 0; i < r.sharedMaterials.length; i++) {
                r.sharedMaterials[i] = this.tintMaterial(r.sharedMaterials[i], uniqueCol);
            }
        });
    }

    private tintMaterial(originalMaterial: Material, referenceColor: Color): Material {
        const mat = originalMaterial.clone();

        if (mat instanceof MeshStandardMaterial && originalMaterial instanceof MeshStandardMaterial) {
            // calculate color
            const origHLS = originalMaterial.color.getHSL({ h: 0, s: 0, l: 0 });
            const newHLS = referenceColor.getHSL({ h: 0, s: 0, l: 0 });

            // set color
            mat.color.setHSL(newHLS.h, origHLS.s, origHLS.l);
        }

        return mat;
    }

    // can't be moduleOnBeforeRender because it needs to run after the animator
    onBeforeRender(): void {
        if(!this.player || !this.player.isInitialized || !this.player.isLocalPlayer) return; // disable the override in multiplayer

        if (this.currentPerson != undefined && this.originalHeadScale != undefined) {
            // apply scale every frame since animation's pose contains scale as well (?)
            this.headBone?.scale.copy(this.currentPerson == ViewModeFlags.FirstPerson ? this.zeroScale : this.originalHeadScale)
            const object = this.avatarObject ?? this.gameObject;
            object.position.setZ(this.currentPerson == ViewModeFlags.FirstPerson ? -this.characterZOffset : 0);
        }
    }
}