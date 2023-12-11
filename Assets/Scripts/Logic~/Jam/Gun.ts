import { AudioSource, Behaviour, Context, GameObject, Gizmos, ICollider, IGameObject, LogType, Vec2, Vec3, getTempVector, getWorldDirection, getWorldPosition, randomNumber, serializable, showBalloonMessage } from "@needle-tools/engine";
import { Vector3, Ray, Object3D, Quaternion, Vector2, MathUtils } from "three";
import { Player } from "../Character/Framework/Player";
import RAPIER from "@dimforge/rapier3d-compat";
import { degToRad, radToDeg } from "three/src/math/MathUtils";

export class Gun extends Behaviour {

    @serializable()
    maxDistance: number = 150;

    @serializable()
    damage: number = 64;

    @serializable(AudioSource)
    gunshotAudioSource?: AudioSource;

    @serializable()
    fireRate: number = 0;

    @serializable()
    accuracyNoise: number = 1;

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
        const noise = degToRad(this.accuracyNoise / 2);
        const noiseVec = new Vector2(MathUtils.randFloat(-noise, noise), MathUtils.randFloat(-noise, noise));
        noiseVec.clampLength(0, 1);
        
        const q1 = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), noiseVec.x);
        const q2 = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), noiseVec.y);
        fwd.applyQuaternion(q2.multiply(q1));

        const result = Gun.raycastAndGetNormal(origin, fwd, this.maxDistance, true, (comp) => {
            const player = comp.gameObject.getComponentInParent(Player);
            if(this.ourPlayer && player === this.ourPlayer) 
                return false;
            else
                return true;
        });
        /* Gizmos.DrawDirection(origin, fwd, 0xff0000, 5, false, this.maxDistance); */

        if (result) {
            return { object: result.collider.gameObject, impactPos: result.point, impactNorm: result.normal! };
        }
        else {
            return { object: null, impactPos: null, impactNorm: null };
        }
    }

    private lastShotTime: number = -999;
    fire() {
        const time = this.context.time.time;
        if (time < this.lastShotTime + this.fireRate) return;

        this.lastShotTime = time;

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