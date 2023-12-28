import { AudioSource, Behaviour, Mathf, serializable } from "@needle-tools/engine";
import { WaveManager } from "./WaveManager";
import { GameManager } from "./GameManager";

export class AudioManager extends Behaviour {
    @serializable(AudioSource)
    intermissionMusic?: AudioSource;

    @serializable(AudioSource)
    combatMusic?: AudioSource;

    @serializable()
    fadeSpeed: number = 1;

    @serializable()
    volume: number = 1;

    @serializable(GameManager)
    gameManager?: GameManager;

    private iVolumeOnStart = -1;
    private cVolumeOnStart = -1;

    awake(): void {
        if (this.intermissionMusic) {
            this.intermissionMusic.volume = this.volume;
            this.intermissionMusic.play();
        }

        if (this.combatMusic) {
            this.combatMusic.volume = 0;
            this.combatMusic.play();
        }
    }

    private iT = 1;
    private cT = 0;
    update(): void {
        if(this.gameManager) {
            const e = this.gameManager.enemiesAlive > 0;
            this.iT = e ? 0 : 1;
            this.cT = e ? 1 : 0;
        }

        const dt = this.context.time.deltaTime;

        if (this.intermissionMusic)
            this.intermissionMusic.volume = Mathf.lerp(this.intermissionMusic.volume, this.iT * this.volume, Mathf.clamp01(dt * this.fadeSpeed));

        if (this.combatMusic)
            this.combatMusic.volume = Mathf.lerp(this.combatMusic.volume, this.cT * this.volume, Mathf.clamp01(dt * this.fadeSpeed));
    }
}