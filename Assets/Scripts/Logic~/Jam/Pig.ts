import { AudioSource, GameObject, findObjectsOfType, serializable } from "@needle-tools/engine";
import { StandardCharacter } from "../Character/StandardCharacter";
import { Gun } from "./Gun";

export class Pig extends StandardCharacter {

    @serializable(AudioSource)
    getHitSFX?: AudioSource;

    die(): void {
        if(this.isDead) return;

        super.die();

        if(this.isLocalPlayer) {
            console.log("You died!");
            GameObject.destroy(this.camera);
            GameObject.destroySynced(this.gameObject, this.context, true);
        }
    }

    protected onRecieveDamage(dmg: number) {
        super.onRecieveDamage(dmg);
        
        if(this.getHitSFX && this.isLocalPlayer) {
            this.getHitSFX.stop();
            this.getHitSFX.play();
        }
    }

    update(): void {
        super.update();
    }
}