import { Mathf, serializable } from "@needle-tools/engine";
import { Object3D } from "three";
import { HitScanGun } from "./HitScanGun";


export class GatlingGun extends HitScanGun {
    @serializable(Object3D)
    barrel?: Object3D;

    @serializable()
    maxSpinSpeed: number = 10;

    @serializable()
    spinAcceleration: number = 1;

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
}
