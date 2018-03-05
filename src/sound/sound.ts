
class Track {
    private readonly audio: HTMLAudioElement;
    private is_off: boolean;

    constructor(src: string) {
        this.audio = new Audio(src);
        this.is_off = true;
    }

    public readonly volume = (volume: number): this => {
        this.audio.volume = volume / 100;

        return this;
    }

    public readonly autoplay_on = (): this => {
        this.audio.autoplay = true;

        return this;
    }

    public readonly autoplay_off = (): this => {
        this.audio.autoplay = false;

        return this;
    }

    public readonly repeat_on = (): this => {
        this.audio.loop = true;

        return this;
    }

    public readonly repeat_off = (): this => {
        this.audio.loop = false;

        return this;
    }

    public readonly play = (): this => {
        if (!this.is_off) {
            this.audio.play();
        }

        return this;
    }

    public readonly stop = (): this => {
        this.audio.pause();

        return this;
    }

    public readonly reset = (): this => {
        this.audio.currentTime = 0;

        return this;
    }

    public readonly off = (): this => {
        this.is_off = true;

        return this;
    }

    public readonly on = (): this => {
        this.is_off = false;

        return this;
    }
}

class BackgroundSound {
    private static instance: BackgroundSound

    public readonly main_theme: Track;


    private constructor() {
        this.main_theme = new Track('./sound/main-theme.mp3').volume(50);
    }

    public static readonly instance_of = (): BackgroundSound => {
        if (BackgroundSound.instance === void 0) {
            BackgroundSound.instance = new BackgroundSound();
        }

        return BackgroundSound.instance;
    }
}

class SoundFX {
    private static instance: SoundFX;

    public readonly hide: Track;
    public readonly shift: Track;


    private constructor() {
        this.hide = new Track('./sound/hide.mp3');
        this.shift = new Track('./sound/shift.mp3');
    }

    public static readonly instance_of = (): SoundFX => {
        if (SoundFX.instance === void 0) {
            SoundFX.instance = new SoundFX();
        }

        return SoundFX.instance;
    }
}

export { BackgroundSound, SoundFX };
