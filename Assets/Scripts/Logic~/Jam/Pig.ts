import { AudioSource, GameObject, findObjectsOfType, serializable } from "@needle-tools/engine";
import { StandardCharacter } from "../Character/StandardCharacter";
import { Gun } from "./Guns/Gun";
import { PlayAudio } from "./PlayAudio";

export class Pig extends StandardCharacter {

    @serializable(PlayAudio)
    getHitSFX?: PlayAudio;

    die(): void {
        if(this._isDead) return;

        super.die();

        if(this.isLocalPlayer) {
            GameObject.destroy(this.camera);
            GameObject.destroySynced(this.gameObject);
        }

        console.log("PLAYER DIED");
    }

    protected onRecieveDamage(dmg: number) {
        super.onRecieveDamage(dmg);
        
        if(this.getHitSFX && this.isLocalPlayer) {
            if (this.hp > 0) {
                this.getHitSFX.play();
            }
        }
    }

    update(): void {
        super.update();
    }
}