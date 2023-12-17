import { Animator, AssetReference, GameObject, delay, getTempVector, serializable } from "@needle-tools/engine";
import { Object3D, Quaternion } from "three";
import { Gun } from "./Gun";
import { Projectile } from "./Projectile";


export class ProjectileGun extends Gun {
    @serializable(Object3D)
    origin!: Object3D;

    @serializable(AssetReference)
    projectile!: AssetReference;

    @serializable()
    fireRate: number = 1;

    @serializable()
    power: number = 0.1;

    @serializable()
    spin: number = 15;

    @serializable(Animator)
    animator?: Animator;

    /* @serializable(AudioSource)
    shootSFX?: AudioSource; */
    update(): void {
        if (!this.ourPlayer || !this.ourPlayer.isInitialized) return;

        if (this.context.input.getPointerDown(0) && this.ourPlayer.isLocalPlayer) {
            this.fire();
        }
    }

    private fireStamp = Number.MIN_SAFE_INTEGER;
    async fire() {
        if (!this.ourPlayer) return;

        if (this.context.time.time - this.fireStamp < this.fireRate) return;

        this.fireStamp = this.context.time.time;

        const projectileObj = await this.projectile.instantiateSynced(this.context.scene.children[0], false) as GameObject;
        if (!projectileObj) return;

        this.animator?.play("Fire");

        projectileObj.worldPosition = this.origin.getWorldPosition(getTempVector());
        projectileObj.worldQuaternion = this.origin.getWorldQuaternion(new Quaternion());
        const projectile = projectileObj?.getComponent(Projectile);
        if (projectile) {
            projectile.initialize(this.ourPlayer.isLocalPlayer);
            await delay(this.context.time.deltaTime * 3 * 1000); // wait 1 - 3 frames, otherwise projectile won't get launched
            projectile.launch(this.power, this.spin);
        }

        // sfx
        //this.shootSFX?.stop();
        //this.shootSFX?.play();
    }
}
