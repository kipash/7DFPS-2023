import { Behaviour, EventList, Mathf, Text, WaitForFrames, WaitForSeconds, delay, randomNumber, serializable } from "@needle-tools/engine";
import { GameManager } from "./GameManager";
import { Enemy } from "./Enemy";
import { Object3D } from "three";

export class WaveManager extends Behaviour {
    @serializable(GameManager)
    gameManager!: GameManager;

    @serializable()
    unitInterval: number = 10;

    @serializable()
    unitCount: number = 10;

    @serializable(Text)
    waveLabel?: Text;

    // @nonSerialized
    @serializable(EventList)
    onEnemySpawned: EventList = new EventList();

    private currentEnemies: Enemy[] = [];

    private isSpawningAWave: boolean = false;
    async spawnWave() {
        if (this.isSpawningAWave) return;
        
        console.log(`SPAWNING WAVE: ${this.unitCount} units`);
        this.isSpawningAWave = true;

        for (let i = 0; i < this.unitCount; i++) {
            const enemy = await this.gameManager.spawnEnemy() as Enemy;
            this.currentEnemies.push(enemy!);

            //enemy.gameObject.visible = false;
            
            // wait 1 frame
            await delay(1);

            // pick spawnspot
            //enemy.gameObject.visible = true;
            this.onEnemySpawned?.invoke(enemy!.gameObject);

        }

        this.isSpawningAWave = false;
    }

    private unitsAlive: number = 0;
    update() {
        if(!this.gameManager.isReady || !GameManager.isMaster) return;

        this.unitsAlive = this.currentEnemies.filter(x => x && !x.isDead).length;

        // Auto kill clipped units
        this.currentEnemies.forEach(x => { 
            if(x && x.worldPosition.y < -50) {
                x.die();
            }
        });
        
        if (this.unitsAlive == 0) {
            this.currentEnemies.length = 0;
            this.spawnWave();
        }

        if(this.waveLabel) {
            this.waveLabel.text = `${this.unitsAlive} / ${this.unitCount}`;
        }
    }
}