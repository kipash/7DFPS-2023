import { Animator, WaitForFrames, serializable } from "@needle-tools/engine";
import { Vector3, Object3D, SkinnedMesh, Mesh, Group } from "three";
import { HitScanGun } from "./HitScanGun";


export class SniperGun extends HitScanGun {
    /* @serializable(Object3D)
    mesh?: Object3D;

    @serializable()
    fireAnimSpeed: number = 1; */

    @serializable(Animator)
    animator?: Animator;

    fireVisually(origin: Vector3, fwd: Vector3, impactPos: Vector3 | null, impactNorm: Vector3 | null) {
        super.fireVisually(origin, fwd, impactPos, impactNorm);
        /* this.startCoroutine(this.chordAnim()); */

        if (this.animator)
            this.animator.play("Fire");
    }

/*     private *chordAnim() {
        let t = 1;
        const time = this.context.time;
        while(true) {
            t -= time.deltaTime * this.fireAnimSpeed;
            this.setBlendShape(t);
            yield WaitForFrames(1);
            if(t < 0) break;
        }
        t = 0;
        while(true) {
            t += time.deltaTime * this.fireAnimSpeed;
            this.setBlendShape(t);
            yield WaitForFrames(1);
            if(t >= 1) break;
        }
        t = 1;
        this.setBlendShape(t);
    }

    private setBlendShape(value: number) {
        if (!this.mesh) return;

        if (this.mesh instanceof Group) {
            this.mesh.traverse((x) => {
                if (x instanceof Mesh && x.morphTargetInfluences && x.morphTargetInfluences.length > 0) {
                    x.morphTargetInfluences[0] = value;
                }
            });
        }
        else if (this.mesh instanceof Mesh && this.mesh.morphTargetInfluences && this.mesh.morphTargetInfluences.length > 0) {
            this.mesh.morphTargetInfluences[0] = value;
        }
    } */
}
