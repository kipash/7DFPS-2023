import { Animator, AssetReference, AudioSource, Behaviour, Collider, Collision, Context, EventList, GameObject, Gizmos, ICollider, IGameObject, LogType, Mathf, Rigidbody, SyncedTransform, Vec2, Vec3, delay, findObjectsOfType, getTempVector, getWorldDirection, getWorldPosition, randomNumber, serializable, showBalloonMessage } from "@needle-tools/engine";
import { Vector3, Ray, Object3D, Quaternion, Vector2, MathUtils } from "three";
import { Player } from "../Character/Framework/Player";
import RAPIER from "@dimforge/rapier3d-compat";
import { degToRad, radToDeg } from "three/src/math/MathUtils";

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

export class HitScanGun extends Gun {
    @serializable()
    maxDistance: number = 150;

    @serializable()
    damage: number = 64;

    @serializable(AudioSource)
    gunshootAudioSource?: AudioSource;

    @serializable()
    fireRate: number = 0;

    @serializable()
    accuracyNoise: number = 1;

    update(): void {
        if (!this.ourPlayer || !this.ourPlayer.isInitialized) return;
        if (this.ourPlayer.isLocalPlayer !== this.gameObject.activeSelf) {
            this.gameObject.activeSelf = this.ourPlayer.isLocalPlayer;
        }

        if (this.context.input.getPointerDown(0) && this.ourPlayer.isLocalPlayer) {
            this.fire();
        }
    }

    //@dontSerialize
    fireVisually(origin: Vector3, impactPos: Vector3 | null, impactNorm: Vector3 | null) {
        /* this.gunshotAudioSource?.stop();
        this.gunshotAudioSource?.play(); */

        if (impactPos && impactNorm) {
            /* console.log("Hit!"); */
        }
        else {
            
        }
    }

    //@dontSerialize
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
}

export class GatlingGun extends HitScanGun {
    
}

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

        if(this.context.time.time - this.fireStamp < this.fireRate) return;

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

export class Projectile extends Behaviour {
    @serializable()
    damage: number = 100;

    @serializable()
    blastRadius: number = 1;

    @serializable()
    explodeAfter: number = 1;

    private rigidBody?: Rigidbody;
    private isLocalPlayer = false;
    private collideres: Array<Collider> = [];
    // Hack to avoid SyncedTransform discarding rigidbodies velocity
    awake(): void {
        this.gameObject.getComponentsInChildren(Collider, this.collideres).forEach(x => x.enabled = false);
    }
    start(): void {
        this.rigidBody = this.gameObject.addNewComponent(Rigidbody)!;
        this.collideres.forEach(x => x.enabled = true);
        this.rigidBody.isKinematic = !this.isLocalPlayer;
    }

    private isInitialized = false;
    initialize(isLocalPlayer: boolean) {
        this.isInitialized = true;
        this.launchTime = this.context.time.time;
        this.isLocalPlayer = isLocalPlayer;

        if (isLocalPlayer) {
            const syncTrans = this.gameObject.getComponent(SyncedTransform);
            if(syncTrans) {
                syncTrans.overridePhysics = false;
                syncTrans.requestOwnership();
            }
        }
    }

    private launchTime: number = Number.MAX_SAFE_INTEGER;
    private explodeTimeoutId: number = -1;
    launch(power: number, spin: number) {
        this.launchTime = this.context.time.time;
        if (!this.rigidBody) return;

        const fwd = getTempVector(  ).set(0,0, 1).applyQuaternion(this.gameObject.getWorldQuaternion(new Quaternion()));
        const impulse = fwd.multiplyScalar(power);
        /* this.rigidBody.isKinematic = false; */
        this.rigidBody.resetForcesAndTorques();
        this.rigidBody.wakeUp();
        this.rigidBody.applyImpulse(impulse);
        this.rigidBody.setTorque(randomNumber(-spin, spin), randomNumber(-spin, spin), randomNumber(-spin, spin));

        this.explodeTimeoutId = setTimeout(() => {
            this.explode();
        }, this.explodeAfter * 1000);
    }

    onDestroy(): void {
        if(this.explodeTimeoutId != -1)
            clearTimeout(this.explodeTimeoutId);
    }

    onCollisionEnter(col: Collision) {
        if (this.context.time.time - this.launchTime < 0.1) return;
        if (!this.isLocalPlayer) return;

        const pl = (col.gameObject as GameObject)?.getComponentInParent(Player);
        if(pl) {
            this.explode();
        }
    }

    explode() {
        clearTimeout(this.explodeTimeoutId);
        this.explodeTimeoutId = -1;

        const players: Array<Player> = [];
        findObjectsOfType<Player>(Player, players, this.context);

        //Gizmos.DrawWireSphere(this.worldPosition, this.blastRadius, 0xff0000, 5, false);
        players.forEach(x => {
            const dist = x.gameObject.worldPosition.distanceTo(this.worldPosition);
            if (dist < this.blastRadius) {
                const multiplier = Mathf.clamp01(Mathf.remap(Mathf.clamp(this.blastRadius - dist, 0, this.blastRadius) / this.blastRadius, 0, 0.5, 0, 1));
                x.dealDamage(this.damage * multiplier);
                
                //Gizmos.DrawLine(x.gameObject.worldPosition, this.worldPosition, 0xffff00, 5, false);
                //Gizmos.DrawLabel(getTempVector(this.worldPosition).lerp(x.gameObject.worldPosition, .5), `${(this.damage * multiplier).toFixed(0)}`, 0.2, 5, 0xffffff, 0x000000, this.context.scene.children[0]);
            }
        });

        GameObject.destroySynced(this.gameObject, this.context);
    }    
}