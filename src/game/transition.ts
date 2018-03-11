import { ThreadCallback } from './../core/mod';

type TransitionFunction = (delta: number, step_callbackfn: (step: number) => void) => ThreadCallback;

class Transition {
    public readonly duration: number;

    constructor(duration: number) {
        this.duration = duration;
    }

    public readonly linear = (delta: number, callbackfn: (step: number) => void): ThreadCallback => (done: () => void = () => { }) => {
        const start_time = Date.now();

        let last = 0;
        let now = 0;

        const loop = () => {
            const time_passed = Date.now() - start_time;

            if (time_passed < this.duration) {
                now = time_passed / this.duration * delta;

                callbackfn(now - last);

                last = now;

                window.requestAnimationFrame(loop)
            } else {
                now = delta;

                callbackfn(now - last);

                done();
            }
        };

        window.requestAnimationFrame(loop);
    }

    public readonly accelerated = (delta: number, callbackfn: (step: number) => void): ThreadCallback => (done: () => void = () => { }) => {
        const a = delta / (this.duration ** 2);

        const start_time = Date.now();

        let last = 0;
        let now = 0;

        const loop = () => {
            const time_passed = Date.now() - start_time;

            if (time_passed < this.duration) {
                now = a * (time_passed ** 2);

                callbackfn(now - last);

                last = now;

                window.requestAnimationFrame(loop)
            } else {
                now = delta;

                callbackfn(now - last);

                done();
            }
        };

        window.requestAnimationFrame(loop);
    }
}

export { Transition, TransitionFunction };
