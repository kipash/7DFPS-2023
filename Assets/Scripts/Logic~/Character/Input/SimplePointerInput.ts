import { serializable } from "@needle-tools/engine";
import { PlayerModule, PlayerModuleType } from "../Framework/PlayerModule.js";
import { Vector2 } from "three";

export type SimplePointerInput_Scheme = {
    lookDeltaX?: number;
    lookDeltaY?: number;
    pointerPositionRC?: Vector2;
    hasClicked?: boolean;
    isPointerMouse?: boolean;
}

export class SimplePointerInput extends PlayerModule {
    @serializable()
    dragOrLockPointerId: number = 0;

    get type() { return PlayerModuleType.input; }

    moduleEarlyUpdate(): void {
        const input = this.context.input
        const state = this.frameState as SimplePointerInput_Scheme;
        
        // look
        state.lookDeltaX ??= 0;
        state.lookDeltaY ??= 0;
        if (input.getPointerPressed(this.dragOrLockPointerId)) {
            const mouseDelta = input.getPointerPositionDelta(this.dragOrLockPointerId)!;
            state.lookDeltaX += mouseDelta.x / this.context.domWidth;
            state.lookDeltaY -= mouseDelta.y / this.context.domHeight; // y is inverted
        }

        // pointer position raycast space
        state.pointerPositionRC ??= new Vector2();
        state.pointerPositionRC.copy(input.getPointerPositionRC(this.dragOrLockPointerId)!);            

        // click
        state.hasClicked ??= false;
        state.hasClicked = input.getPointerClicked(this.dragOrLockPointerId);

        // is mouse?
        state.isPointerMouse = input.getIsMouse(this.dragOrLockPointerId);
    }
}
