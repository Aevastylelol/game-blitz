import { Color } from './color';
import { Transition, TransitionFunction } from './transition';

class BlockBuilder {
    private size: number;
    private padding: number;
    private colors: Map<number, Color>;

    private swap_transition: TransitionFunction;
    private hide_transition: TransitionFunction;
    private shift_transition: TransitionFunction;
    private select_transition: TransitionFunction;

    constructor() {
        this.size = 32;
        this.padding = 8 / 10;
        this.colors = new Map();
        this.swap_transition = new Transition(250)['linear'];
        this.hide_transition = new Transition(250)['linear'];
        this.shift_transition = new Transition(250)['linear'];
        this.select_transition = new Transition(250)['linear'];
    }

    public readonly with_size = (size: number): this => {
        this.size = size;

        return this;
    }

    public readonly with_border_size = (border_size: number): this => {
        this.padding = 1 - border_size / this.size;

        return this;
    }

    public readonly with_color = (color: Color): this => {
        this.colors.set(color.hash(), color);

        return this;
    }

    public readonly with_swap_transition = (duration: number, timing_fn: 'linear'): this => {
        this.swap_transition = new Transition(duration)[timing_fn];

        return this;
    }

    public readonly with_hide_transition = (duration: number, timing_fn: 'linear' | 'accelerated'): this => {
        this.hide_transition = new Transition(duration)[timing_fn];

        return this
    }

    public readonly with_shift_transition = (duration: number, timing_fn: 'linear' | 'accelerated'): this => {
        this.shift_transition = new Transition(duration)[timing_fn];

        return this;
    }

    public readonly with_select_transition = (duration: number, timing_fn: 'linear' | 'accelerated'): this => {
        this.select_transition = new Transition(duration)[timing_fn];

        return this;
    }

    public readonly build = (): Block => {
        return new Block(
            this.size,
            this.padding,
            this.colors,

            this.swap_transition,
            this.hide_transition,
            this.shift_transition,
            this.select_transition
        );
    };
}

class Block {
    private readonly hash: Uint32Array;
    private readonly block: Uint16Array;

    constructor(
        public readonly size: number,
        public readonly padding: number,
        public readonly colors: Map<number, Color>,

        public readonly swap_transition: TransitionFunction,
        public readonly hide_transition: TransitionFunction,
        public readonly shift_transition: TransitionFunction,
        public readonly select_transition: TransitionFunction,
    ) {
        this.hash = new Uint32Array(1);
        this.block = new Uint16Array(this.hash.buffer);
    }

    public readonly hash_from = (x: number, y: number): number => {
        this.block[0] = y;
        this.block[1] = x;

        return this.hash[0];
    }

    public readonly from = (hash: number): { x: number, y: number } => {
        this.hash[0] = hash;

        return { x: this.block[1], y: this.block[0] };
    }
}

export { Block, BlockBuilder }
