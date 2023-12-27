import { Behaviour, EventList, Mathf, Text, WaitForFrames, WaitForSeconds, delay, randomNumber, serializable } from "@needle-tools/engine";
import { GameManager } from "./GameManager";
import { Enemy } from "./Enemy";
import { Object3D } from "three";
import { PlayAudio } from "./PlayAudio";

export class WaveManager extends Behaviour {
    @serializable(GameManager)
    gameManager!: GameManager;

    @serializable()
    unitInterval: number = 2;

    @serializable()
    unitCount: number = 10;

    @serializable()
    delayWaveStart: number = 2;

    @serializable()
    delayBetweenWaves: number = 10;

    @serializable(Text)
    waveLabel?: Text;

    // @nonSerialized
    @serializable(EventList)
    onEnemySpawned: EventList = new EventList();

    @serializable(PlayAudio)
    waveStartAudio?: PlayAudio;

    @serializable(PlayAudio)
    waveFinishedAudio?: PlayAudio;

    @serializable(PlayAudio)
    gameOver?: PlayAudio;

    awake(): void {
        this.gameManager.onPlayerSpawned?.addEventListener(() => {
            if(GameManager.isMaster)
                this.spawnWave();
        });
    }

    private isSpawningAWave: boolean = false;
    async spawnWave() {
        if (this.isSpawningAWave) return;
        
        this.waveStartAudio?.play();
        this.isSpawningAWave = true;

        await delay(this.delayWaveStart * 1000);

        const unitsToSpawn = this.unitCount;// * Math.max(1, this.context.connection.usersInRoom().length);

        for (let i = 0; i < unitsToSpawn; i++) {
            const enemy = await this.gameManager.spawnEnemy() as Enemy;

            //enemy.gameObject.visible = false;
            
            await delay(1);

            // pick spawnspot
            //enemy.gameObject.visible = true;
            this.onEnemySpawned?.invoke(enemy!.gameObject);

            await delay(1000 * this.unitInterval);
        }

        while (this.gameManager.enemiesAlive > 0) {
            await delay(250);
        }
        
        this.waveFinishedAudio?.play();

        await delay(this.delayBetweenWaves * 1000);

        this.isSpawningAWave = false;

        this.spawnWave();
    }
}