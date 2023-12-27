import { Behaviour, Mathf, StateMachineBehaviour, Text, serializable, setState } from "@needle-tools/engine";
import { Object3D } from "three";

export class HealthBarUI extends Behaviour {
    @serializable(Object3D) 
    parent?: Object3D;

    @serializable(Object3D) 
    fill?: Object3D;

    @serializable(Text)
    label?: Text;

    private currVal = 0;
    private currMax = 0;
    private currentState = false;
    set(value: number, max: number, state: boolean, force = false) {
        if(this.currVal != value || this.currMax != max || this.currentState != state || force) {
            this.currVal = value;
            this.currentState = state;
            this.currMax = max;
            this.apply();
        }
    }   

    private apply() {
        if(this.fill) {
            this.fill.scale.x = Mathf.clamp01(this.currVal / this.currMax);
        }

        if(this.label) {
            this.label.text = `${Math.floor(this.currVal)}`;
        }

        if(this.parent) {
            this.parent.visible = this.currentState;
        }
    }
}