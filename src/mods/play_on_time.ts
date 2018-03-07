import { Game } from './../game/mod'

class PlayOnTime {
    private time_passed: number;

    constructor(
        public duration: number,
        public game: Game
    ) { }

    public readonly start_game = () => {
        this.time_passed = 0;

        setTimeout(this.time_updater, 1000);
    }

    public readonly context = (): Game => {
        return this.game;
    }

    public readonly set_time_callback = (callbackfn: (time_left: number) => void) => {
        this.time_cb = callbackfn;
    }

    public readonly set_game_over_callback = (callbackfn: () => void) => {
        this.game_over_cb = callbackfn;
    }

    private readonly time_updater = () => {
        this.time_passed += 1;
        this.time_cb(this.duration - this.time_passed);

        if (this.time_passed < this.duration) {
            setTimeout(this.time_updater, 1000);
        } else {
            this.game_over_cb();
        }
    }

    private time_cb = (time_left: number) => { };
    private game_over_cb = () => { }
}

export { PlayOnTime };