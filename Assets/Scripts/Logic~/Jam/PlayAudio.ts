import { AudioSource, Behaviour, serializable } from "@needle-tools/engine";

export class PlayAudio extends Behaviour {
    @serializable()
    playOnAwake: boolean = false;

    //@nonSerialized
    clips: string[] = [];

    @serializable(AudioSource)
    audioSource?: AudioSource;

    awake(): void {
        if (this.playOnAwake) {
            this.play();
        }
    }

    play() {
        if (this.clips.length === 0) return;

        const clip = this.clips[Math.floor(Math.random() * this.clips.length)];
        if (this.audioSource) {
            this.audioSource.clip = clip;
            this.audioSource.stop();
            this.audioSource.play();
        }
    }
}