import { Mathf, ParticleSystem, serializable } from "@needle-tools/engine";
import { Object3D, Vector3 } from "three";
import { HitScanGun } from "./HitScanGun";


export class GatlingGun extends HitScanGun {
    @serializable(Object3D)
    barrel?: Object3D;

    @serializable()
    maxSpinSpeed: number = 10;

    @serializable()
    spinAcceleration: number = 1;

    @serializable(ParticleSystem)
    muzzleFlash?: ParticleSystem;

    private currentSpinSpeed: number = 0;
    update(): void {
        if (!this.ourPlayer || !this.ourPlayer.isLocalPlayer || !this.ourPlayer.isInitialized) return;

        const lmb = this.context.input.getPointerPressed(0);
        const rmb = this.context.input.getPointerPressed(2);

        this.currentSpinSpeed = Mathf.lerp(this.currentSpinSpeed, (lmb || rmb) ? this.maxSpinSpeed : 0, this.spinAcceleration * this.context.time.deltaTime);

        if (this.barrel) {
            this.barrel.rotateZ(this.currentSpinSpeed * this.context.time.deltaTime);
        }

        if (lmb && this.currentSpinSpeed / this.maxSpinSpeed > 0.9) {
            this.fire();
        }
    }

    fireVisually(origin: Vector3, fwd: Vector3, impactPos: Vector3 | null, impactNorm: Vector3 | null): void {
        super.fireVisually(origin, fwd, impactPos, impactNorm);

        if (this.muzzleFlash) {
            this.muzzleFlash.play();
            //console.log("FIRE");
        }
    }
}
