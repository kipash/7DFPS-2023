import { AudioSource, GameObject, IGameObject, getTempVector, getWorldPosition, serializable } from "@needle-tools/engine";
import { Vector3, Quaternion, Vector2, MathUtils, Object3D } from "three";
import { Player } from "../../Character/Framework/Player";
import { degToRad } from "three/src/math/MathUtils";
import { Gun } from "./Gun";
import { FakeProjectile } from "./FakeProjectile";
import { PlayAudio } from "../PlayAudio";

class FakeProjectileModel {
    start: Vector3 = new Vector3();
    end: Vector3 = new Vector3();
    duration: number = 1;
}

export class HitScanGun extends Gun {
    @serializable()
    maxDistance: number = 150;

    @serializable()
    damage: number = 64;

    @serializable(PlayAudio)
    shootSFX?: PlayAudio;

    @serializable()
    fireRate: number = 0;

    @serializable()
    accuracyNoise: number = 1;

    @serializable(Object3D)
    fakeProjectilePrefab?: Object3D;

    @serializable()
    fakeProjectileSpeed: number = 100;

    awake(): void {
        super.awake();

        this.context.connection.beginListen(`projectile-${this.guid}`, this.spawnProjectile);
    }

    onDestroy(): void {
        super.onDestroy();

        this.context.connection.stopListen(`projectile-${this.guid}`, this.spawnProjectile);
    }

    update(): void {
        if (!this.ourPlayer || !this.ourPlayer.isInitialized) return;

        if (this.context.input.getPointerDown(0) && this.ourPlayer.isLocalPlayer) {
            this.fire();
        }
    }

    //@dontSerialize
    fireVisually(origin: Vector3, fwd: Vector3, impactPos: Vector3 | null, impactNorm: Vector3 | null) {
        let start = origin;
        let end = impactPos;
        if (!end) {
            end = getTempVector(origin).addScaledVector(fwd, this.maxDistance);
        }

        const t = start.distanceTo(end) / this.fakeProjectileSpeed;

        const data = {
            start: start,
            end: end,
            duration: t
        } as FakeProjectileModel;

        this.shootSFX?.play();
        
        this.context.connection.send(`projectile-${this.guid}`, data);
        this.spawnProjectile(data);
    }

    protected spawnProjectile = (model: FakeProjectileModel) => {
        if (!this.fakeProjectilePrefab) return;

        const obj = GameObject.instantiate(this.fakeProjectilePrefab, { parent: this.context.scene.children[0] });
        if (obj) {
            obj.visible = true;
            obj.getComponent(FakeProjectile)?.initialize(model.start, model.end, model.duration);
        }
    }

    //@dontSerialize
    firePhysicially(origin: Vector3, fwd: Vector3): { object: IGameObject | null; impactPos: Vector3 | null; impactNorm: Vector3 | null; } {
        const result = Gun.raycastAndGetNormal(origin, fwd, this.maxDistance, true, (comp) => {
            const player = comp.gameObject.getComponentInParent(Player);
            if (this.ourPlayer && player === this.ourPlayer)
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

        // apply inaccuracy
        const noise = degToRad(this.accuracyNoise / 2);
        const noiseVec = new Vector2(MathUtils.randFloat(-noise, noise), MathUtils.randFloat(-noise, noise));
        noiseVec.clampLength(0, 1);

        const q1 = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), noiseVec.x);
        const q2 = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), noiseVec.y);
        fwd.applyQuaternion(q2.multiply(q1));

        const result = this.firePhysicially(origin, fwd);

        const player = result.object?.getComponentInParent(Player);
        if (player) {
            /* console.log(`HIT: ${this.context.connection.usersInRoom().indexOf(player.playerState?.owner!)}`); */
            player.dealDamage(this.damage);
        }

        this.fireVisually(this.worldPosition, fwd, result.impactPos, result.impactNorm);
    }
}
