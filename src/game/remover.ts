import { Block } from './block';

class Remover {
    private readonly block: Block;
    private readonly cols: Map<number, Set<number>>;

    constructor(block: Block) {
        this.block = block;
        this.cols = new Map();
    }

    public readonly columns = (): Readonly<Map<number, Readonly<Set<number>>>> => {
        return this.cols;
    }

    public readonly empty = (): boolean => {
        return this.cols.size === 0;
    }

    public readonly add = (x: number, y: number): this => {
        const hash = this.block.hash_from(x, y);

        if (this.cols.has(x)) {
            const col = this.cols.get(x);

            col.add(hash)
        } else {
            this.cols.set(x, new Set([hash]));
        }

        return this;
    }
}

export { Remover };