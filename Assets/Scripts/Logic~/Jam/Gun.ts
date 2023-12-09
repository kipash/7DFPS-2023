import { AudioSource, Behaviour, GameObject, Gizmos, ICollider, IGameObject, LogType, Vec2, Vec3, getTempVector, getWorldDirection, getWorldPosition, serializable, showBalloonMessage } from "@needle-tools/engine";
import { Vector3, Ray, Object3D } from "three";
import { Player } from "../Character/Framework/Player";
import RAPIER from "@dimforge/rapier3d-compat";

export class Gun extends Behaviour {

    @serializable()
    maxDistance: number = 150;

    @serializable()
    damage: number = 64;

    @serializable(AudioSource)
    gunshotAudioSource?: AudioSource;


    private ourPlayer?: Player;
    awake() {
        this.ourPlayer = this.gameObject.getComponentInParent(Player)!;
    }

    update(): void {
        if(!this.ourPlayer || !this.ourPlayer.isInitialized) return;
        if (this.ourPlayer.isLocalPlayer !== this.gameObject.activeSelf) {
            this.gameObject.activeSelf = this.ourPlayer.isLocalPlayer;
        }

        if (this.context.input.getPointerDown(0) && this.ourPlayer.isLocalPlayer) {
            this.fire();
        }
    }

    fireVisually(origin: Vector3, impactPos: Vector3 | null, impactNorm: Vector3 | null) {
        this.gunshotAudioSource?.stop();
        this.gunshotAudioSource?.play();

        if (impactPos && impactNorm) {
            /* console.log("Hit!"); */
        }
        else {
            
        }
    }

    firePhysicially(origin: Vector3, fwd: Vector3): { object: IGameObject | null, impactPos: Vector3 | null, impactNorm: Vector3 | null } {
        const physics = this.context.physics.engine;
        const result = this.raycastAndGetNormal(origin, fwd, this.maxDistance);
        //Gizmos.DrawDirection(origin, fwd, 0xff0000, 5, false, this.maxDistance);

        if (result) {
            return { object: result.collider.gameObject, impactPos: result.point, impactNorm: result.normal! };
        }
        else {
            return { object: null, impactPos: null, impactNorm: null };
        }
    }

    fire() {
        const origin = getWorldPosition(this.gameObject, getTempVector());

        // WTF i can't use this.forward and why it is 0,0,0 ?!?!?!
        const q = this.gameObject.worldQuaternion;
        const fwd = getTempVector().set(0, 0, 1).applyQuaternion(q);
        const result = this.firePhysicially(origin, fwd);

        const player = result.object?.getComponentInParent(Player);
        if (player) {
            /* console.log(`HIT: ${this.context.connection.usersInRoom().indexOf(player.playerState?.owner!)}`); */
            player.dealDamage(this.damage);
        }

        this.fireVisually(this.worldPosition, result.impactPos, result.impactNorm);
    }

    // Got to solve hitting myself
    raycastAndGetNormal(origin: Vector3, direction: Vector3, maxDistance?: number, solid?: boolean)
        : null | { point: Vector3, normal: Vector3, collider: ICollider } {

        const engine = this.context.physics.engine!;
        const world = engine.world as RAPIER.World;

        if (maxDistance === undefined) maxDistance = Infinity;
        if (solid === undefined) solid = true;

        direction.normalize();
        const ray = new RAPIER.Ray(new RAPIER.Vector3(origin.x, origin.y, origin.z), new RAPIER.Vector3(direction.x, direction.y, direction.z));

        const hit = world.castRayAndGetNormal(ray, maxDistance, solid, undefined, undefined, undefined, undefined, (c) => {
            const player = engine.getComponent(c)?.gameObject.getComponentInParent(Player);
            if(this.ourPlayer && player === this.ourPlayer) return false;

            return true;
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