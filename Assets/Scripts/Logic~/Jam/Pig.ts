import { AudioSource, GameObject, Mathf, findObjectsOfType, getComponentInChildren, serializable } from "@needle-tools/engine";
import { StandardCharacter } from "../Character/StandardCharacter";
import { Gun } from "./Guns/Gun";
import { PlayAudio } from "./PlayAudio";
import { Vector2 } from "three";

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

    awake(): void {
        super.awake();

        const gun = this.gameObject.getComponentInChildren(Gun);
        if (gun) {
            gun.onFire.addEventListener((offset: Vector2) => {
                const x = Mathf.random(-offset.x, offset.x);
                const y = Mathf.random(-offset.y, offset.y);
                this.camera.addLook(x, y);
            });
        }
    }

    update(): void {
        super.update();
    }
}