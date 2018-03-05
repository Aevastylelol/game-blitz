type SequenceCallback = (done?: () => void) => void;

class Sequence {
    private readonly queue: SequenceCallback[]

    constructor() {
        this.queue = [];
    }

    public readonly with = (callback: SequenceCallback): this => {
        this.queue.push(callback);

        return this;
    }

    public readonly run = (done: () => void) => {
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

export { Sequencer, Sequence, SequenceCallback };
