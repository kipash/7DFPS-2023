import { Behaviour, Context, EventList, Gizmos, ICollider, LogType, Vec2, Vec3, getWorldDirection, showBalloonMessage } from "@needle-tools/engine";
import { Vector3, Ray, SkinnedMesh } from "three";
import { Player } from "../../Character/Framework/Player";
import RAPIER from "@dimforge/rapier3d-compat";
import { radToDeg } from "three/src/math/MathUtils";

export class Gun extends Behaviour {
    protected ourPlayer?: Player;
    awake() {
        this.ourPlayer = this.gameObject.getComponentInParent(Player)!;
    }

    // Got to solve hitting myself
    static raycastAndGetNormal(origin: Vector3, direction: Vector3, maxDistance?: number, solid?: boolean, validateFunc?: (IComponent) => boolean)
        : null | { point: Vector3, normal: Vector3, collider: ICollider } {
        const engine = Context.Current.physics.engine!;
        const world = engine.world as RAPIER.World;

        if (maxDistance === undefined) maxDistance = Infinity;
        if (solid === undefined) solid = true;

        direction.normalize();
        const ray = new RAPIER.Ray(new RAPIER.Vector3(origin.x, origin.y, origin.z), new RAPIER.Vector3(direction.x, direction.y, direction.z));

        const hit = world.castRayAndGetNormal(ray, maxDistance, solid, undefined, undefined, undefined, undefined, (c) => {
            const engine = Context.Current.physics.engine!;
            const comp = engine.getComponent(c);
            return comp ? validateFunc?.(comp) ?? false : false;
        });
        if (hit) {
            const point = ray.pointAt(hit.toi);
            const normal = hit.normal;
            const vec = new Vector3();
            const nor = new Vector3();
            vec.set(point.x, point.y, point.z);
            nor.set(normal.x, normal.y, normal.z);
            return { point: vec, normal: nor, collider: engine.getComponent(hit.collider) as ICollider };
        }
        return null;
    }
}