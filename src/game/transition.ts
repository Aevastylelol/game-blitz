import { SequenceCallback } from './../core/sequencer';

type TransitionFunction = (delta: number, step_callbackfn: (step: number) => void) => SequenceCallback;

class Transition {
    public readonly duration: number;

    constructor(duration: number) {
        this.duration = duration;
    }

    public readonly linear = (delta: number, callbackfn: (step: number) => void): SequenceCallback => (done: () => void = () => { }) => {
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
}

export { Transition, TransitionFunction };
