import { SequenceCallback } from './../core/sequencer';

type TransitionFunction = (length: number, step_callbackfn: (step: number) => void) => SequenceCallback;

class Transition {
    private readonly count: number;

    constructor(duration: number) {
        this.count = ((duration / (1000 / 30)) | 0) || 1;
    }

    public readonly linear = (delta: number, step_callbackfn: (step: number) => void): SequenceCallback => (done: () => void = () => { }) => {
        const step = delta / this.count;

        let i = 0;

        const loop = () => {
            step_callbackfn(step);

            if (++i === this.count) {
                done();
            } else {
                window.requestAnimationFrame(loop);
            }
        };

        window.requestAnimationFrame(loop);
    }
}

export { Transition, TransitionFunction };
