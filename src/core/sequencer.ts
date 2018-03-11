type SequenceCallback = (done?: () => void) => void;

class Parallel {
    private readonly callbacks: SequenceCallback[];

    constructor() {
        this.callbacks = [];
    }

    public readonly with = (callback: SequenceCallback): this => {
        this.callbacks.push(callback);

        return this;
    }

    public readonly run = (done: () => void = () => { }) => {
        let i = 0;

        const check = () => {
            if (++i === this.callbacks.length) {
                done();
            }
        };

        for (const cb of this.callbacks) cb(check);
    }
}

class Series {
    private readonly queue: SequenceCallback[]

    constructor() {
        this.queue = [];
    }

    public readonly with = (callback: SequenceCallback): this => {
        this.queue.push(callback);

        return this;
    }

    public readonly run = (done: () => void = () => { }) => {
        this.with(done);
        this.done();
    }

    private readonly done = () => {
        if (this.queue.length) {
            this.queue.shift()(this.done);
        }
    }
}

class Sequencer {
    private readonly queue: SequenceCallback[];

    constructor() {
        this.queue = [];
    }

    public readonly next = (callback: SequenceCallback): this => {
        this.queue.push(callback);

        if (this.queue.length === 1) {
            callback(this.done);
        }

        return this;
    }

    private readonly done = () => {
        this.queue.shift();

        if (this.queue.length) {
            this.queue[0](this.done);
        }
    }
}

export { Sequencer, Series, Parallel, SequenceCallback };
