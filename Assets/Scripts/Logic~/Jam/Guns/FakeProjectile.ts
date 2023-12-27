import { Behaviour, GameObject, Mathf, getTempVector } from "@needle-tools/engine";
import { Vector3 } from "three";

export class FakeProjectile extends Behaviour {
    private startTime: number = 0;
    private startPos: Vector3 = new Vector3();
    private endPos: Vector3 = new Vector3();
    private duration: number = 0;

    private isInitialized = false;
    initialize(start: Vector3, end: Vector3, duration: number) {
        this.isInitialized = true;
        this.startTime = this.context.time.time;
        this.startPos.copy(start);
        this.endPos.copy(end);
        this.duration = duration;
    }

    update(): void {
        if (!this.isInitialized) return;

        const time = this.context.time.time;
        const t = Mathf.clamp01((time - this.startTime) / this.duration);
        this.gameObject.position.copy(this.startPos).lerp(this.endPos, t);
        this.gameObject.lookAt(this.endPos);
        if(t >= 1) {
            GameObject.destroy(this.gameObject);
        }
    }
}