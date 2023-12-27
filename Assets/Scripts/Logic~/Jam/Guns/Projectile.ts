import { AssetReference, Behaviour, Collider, Collision, GameObject, Mathf, Rigidbody, SyncedTransform, findObjectsOfType, getTempVector, randomNumber, serializable } from "@needle-tools/engine";
import { Quaternion, Vector3 } from "three";
import { Player } from "../../Character/Framework/Player";


export class Projectile extends Behaviour {
    @serializable()
    damage: number = 100;

    @serializable()
    blastRadius: number = 1;

    @serializable()
    explodeAfter: number = 1;

    @serializable(AssetReference)
    explosionEffect?: AssetReference;

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
            if (syncTrans) {
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

        const fwd = getTempVector().set(0, 0, 1).applyQuaternion(this.gameObject.getWorldQuaternion(new Quaternion()));
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
        if (this.explodeTimeoutId != -1)
            clearTimeout(this.explodeTimeoutId);
    }

    onCollisionEnter(col: Collision) {
        if (this.context.time.time - this.launchTime < 0.1) return;
        if (!this.isLocalPlayer) return;

        const pl = (col.gameObject as GameObject)?.getComponentInParent(Player);
        if (pl) {
            this.explode();
        }
    }

    async explode() {
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

        await this.explosionEffect?.instantiateSynced({ parent: this.context.scene.children[0], position: this.gameObject.getWorldPosition(new Vector3()) });
        
        GameObject.destroySynced(this.gameObject, this.context);
    }
}
