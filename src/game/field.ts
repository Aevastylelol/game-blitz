import { Block } from './block';

class FieldGrid {
    public readonly x_origin: number;
    public readonly y_origin: number;
    public readonly block: Block;

    constructor(x_origin: number, y_origin: number, block: Block) {
        this.x_origin = x_origin;
        this.y_origin = y_origin;
        this.block = block;
    }

    public readonly cell_from = (pos: { x: number, y: number }): Readonly<{ x: number, y: number }> => {
        const cell = {
            x: ((pos.x - this.x_origin) / this.block.size) | 0,
            y: ((pos.y - this.y_origin) / this.block.size) | 0,
        };

        return cell;
    }

    public readonly is_block = (pos: { x: number, y: number }, cell: Readonly<{ x: number, y: number }>): boolean => {
        return (
            (pos.x - (cell.x * this.block.size + this.x_origin)) <= (this.block.size * this.block.padding) &&
            (pos.y - (cell.y * this.block.size + this.y_origin)) <= (this.block.size * this.block.padding)
        )
    }
}

class Field {
    public readonly grid: FieldGrid;
    public readonly width: number;
    public readonly height: number;
    public readonly min_id: number;
    public readonly max_id: number;

    public readonly block: Block;

    private readonly colors: number[];
    private readonly blocks: Uint32Array;

    constructor(x_origin: number, y_origin: number, width: number, height: number, block: Block) {
        this.grid = new FieldGrid(x_origin, y_origin, block);
        this.width = width;
        this.height = height;
        this.block = block;
        this.min_id = 0;
        this.max_id = this.id_from(width - 1, height - 1);
        this.colors = Array.from(this.block.colors.keys());
        this.blocks = new Uint32Array(this.max_id + 1);
    }

    public readonly playable = (): boolean => {
        for (let id = 0; id !== this.blocks.length; ++id) {
            const { x, y } = this.block_from(id);

            const x_neigs = [] as { x: number, y: number }[];
            const y_neigs = [] as { x: number, y: number }[];

            if (id - this.height >= this.min_id) {
                x_neigs.push({ x: x - 1, y });
            }

            if (id + this.height <= this.max_id) {
                x_neigs.push({ x: x + 1, y });
            }

            if (y - 1 >= 0) {
                y_neigs.push({ x, y: y - 1 });
            }

            if (y + 1 < this.height) {
                y_neigs.push({ x, y: y + 1 });
            }

            for (const block of x_neigs) {
                if (this.x_swap_for({ x, y }, block).swappable) {
                    return true;
                }
            }

            for (const block of y_neigs) {
                if (this.y_swap_for({ x, y }, block).swappable) {
                    return true;
                }
            }
        }

        return false;
    }

    public readonly swap = (a_block: { x: number, y: number }, b_block: { x: number, y: number }) => {
        this.swap_by_id(this.id_from(a_block.x, a_block.y), this.id_from(b_block.x, b_block.y));
    }

    public readonly swap_by_id = (a_block_id: number, b_block_id: number) => {
        const t = this.blocks[a_block_id];
        this.blocks[a_block_id] = this.blocks[b_block_id];
        this.blocks[b_block_id] = t;
    }

    public readonly remove_from_columns = (hash_blocks: Iterable<number>): {
        shift_sub_columns: Array<{ start: number, end: number, offset: number }>,
        new_colors: Uint32Array;
    } => {
        const sorted_blocks = this.sort_blocks(hash_blocks);
        const sub_cols = this.sub_columns(sorted_blocks);
        const col = sub_cols[0].x;
        const start_col = this.start_col_id(col);

        let shift_count = 0;

        const shift_sub_columns = sub_cols.map((sub_col, i) => {
            const start = (i + 1 !== sub_cols.length ? sub_cols[i + 1].y + sub_cols[i + 1].count : 0);
            const end = sub_col.y - 1;

            shift_count += sub_col.count;

            for (let i = end + shift_count; i >= start + shift_count; --i) {
                this.blocks[start_col + i] = this.blocks[start_col + i - shift_count];
            }

            return { start, end, offset: shift_count };
        });

        const new_colors = new Uint32Array(shift_count);

        for (let i = 0; i !== shift_count; ++i) {
            new_colors[i] = this.blocks[start_col + i] = this.gen_color_for(col, i);
        }

        return { shift_sub_columns, new_colors };
    }

    public readonly generate = (callbackfn: (x: number, y: number, id: number, color: number) => void): void => {
        this.for_each((x, y, id) => {
            this.blocks[id] = this.gen_color_for(x, y);

            callbackfn(x, y, id, this.blocks[id]);
        });
    }

    public readonly get_color = (id: number) => {
        return this.blocks[id];
    }

    public readonly contains_block = (x: number, y: number): boolean => {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    public readonly count_left = (x: number, y: number, color: number): number => {
        const id = this.id_from(x, y);

        const first_id = id - this.height;

        if (first_id < this.min_id || this.blocks[first_id] != color) {
            return 0;
        }

        const second_id = first_id - this.height;

        if (second_id < this.min_id || this.blocks[second_id] != color) {
            return 1;
        }

        return 2;
    }

    public readonly count_right = (x: number, y: number, color: number): number => {
        const block_id = this.id_from(x, y);

        const first_id = block_id + this.height;

        if (first_id > this.max_id || this.blocks[first_id] != color) {
            return 0;
        }

        const second_id = first_id + this.height;

        if (second_id > this.max_id || this.blocks[second_id] != color) {
            return 1;
        }

        return 2;
    }

    public readonly count_top = (x: number, y: number, color: number): number => {
        const block_id = this.id_from(x, y);

        const first_id = block_id - 1;

        if ((y - 1) < 0 || this.blocks[first_id] != color) {
            return 0;
        }

        const second_id = first_id - 1;

        if ((y - 2) < 0 || this.blocks[second_id] != color) {
            return 1;
        }

        return 2;
    }

    public readonly count_bottom = (x: number, y: number, color: number): number => {
        const block_id = this.id_from(x, y);

        const first_id = block_id + 1;

        if ((y + 1) >= this.height || this.blocks[first_id] != color) {
            return 0;
        }

        const second_id = first_id + 1;

        if ((y + 2) >= this.height || this.blocks[second_id] != color) {
            return 1;
        }

        return 2;
    }

    public readonly count_all = (x: number, y: number, color: number) => {
        return {
            top: this.count_top(x, y, color),
            left: this.count_left(x, y, color),
            right: this.count_right(x, y, color),
            bottom: this.count_bottom(x, y, color),
        };
    }

    public readonly start_col_id = (x: number): number => {
        return x * this.height;
    }

    public readonly block_from = (id: number): { x: number, y: number } => {
        const x = id / this.height | 0;
        const y = id - x * this.height;

        return { x, y };
    }

    public readonly id_from = (x: number, y: number): number => {
        return x * this.height + y;;
    }

    public readonly for_each = (callbackfn: (x: number, y: number, id: number) => void) => {
        for (let x = 0; x != this.width; ++x) {
            const start = x * this.height;

            for (let y = 0; y != this.height; ++y) {
                const id = start + y;

                callbackfn(x, y, id);
            }
        }
    }

    public readonly x_swap_for = (a_block: { x: number, y: number }, b_block: { x: number, y: number }) => {
        const delta = b_block.x - a_block.x;

        const [left_block, right_block] = (delta === 1 ? [a_block, b_block] : [b_block, a_block]);

        const left_block_id = this.id_from(left_block.x, left_block.y);
        const right_block_id = this.id_from(right_block.x, right_block.y);

        const left_block_top = this.count_top(left_block.x, left_block.y, this.blocks[right_block_id]);
        const left_block_left = this.count_left(left_block.x, left_block.y, this.blocks[right_block_id]);
        const left_block_bottom = this.count_bottom(left_block.x, left_block.y, this.blocks[right_block_id]);
        const right_block_top = this.count_top(right_block.x, right_block.y, this.blocks[left_block_id]);
        const right_block_right = this.count_right(right_block.x, right_block.y, this.blocks[left_block_id]);
        const right_block_bottom = this.count_bottom(right_block.x, right_block.y, this.blocks[left_block_id]);

        const is_left = left_block_left > 1;
        const is_left_col = left_block_top + left_block_bottom > 1;
        const is_right = right_block_right > 1;
        const is_right_col = right_block_top + right_block_bottom > 1;

        const swappable = is_left || is_left_col || is_right || is_right_col;

        return {
            delta,

            left_block,
            left_block_id,
            left_block_top,
            left_block_left,
            left_block_bottom,

            is_left,
            is_left_col,

            right_block,
            right_block_id,
            right_block_top,
            right_block_right,
            right_block_bottom,

            is_right,
            is_right_col,

            swappable
        };
    }

    public readonly y_swap_for = (a_block: { x: number, y: number }, b_block: { x: number, y: number }) => {
        const delta = b_block.y - a_block.y;

        const [top_block, bottom_block] = (delta === 1 ? [a_block, b_block] : [b_block, a_block]);

        const top_block_id = this.id_from(top_block.x, top_block.y);
        const bottom_block_id = this.id_from(bottom_block.x, bottom_block.y);

        const top_block_left = this.count_left(top_block.x, top_block.y, this.blocks[bottom_block_id]);
        const top_block_top = this.count_top(top_block.x, top_block.y, this.blocks[bottom_block_id]);
        const top_block_right = this.count_right(top_block.x, top_block.y, this.blocks[bottom_block_id]);
        const bottom_block_left = this.count_left(bottom_block.x, bottom_block.y, this.blocks[top_block_id]);
        const bottom_block_bottom = this.count_bottom(bottom_block.x, bottom_block.y, this.blocks[top_block_id]);
        const bottom_block_right = this.count_right(bottom_block.x, bottom_block.y, this.blocks[top_block_id]);

        const is_top = top_block_top > 1;
        const is_top_row = top_block_left + top_block_right > 1;
        const is_bottom = bottom_block_bottom > 1;
        const is_bottom_row = bottom_block_left + bottom_block_right > 1;

        const swappable = is_top || is_top_row || is_bottom || is_bottom_row;

        return {
            delta,

            top_block,
            top_block_id,
            top_block_left,
            top_block_top,
            top_block_right,

            is_top,
            is_top_row,

            bottom_block,
            bottom_block_id,
            bottom_block_left,
            bottom_block_bottom,
            bottom_block_right,

            is_bottom,
            is_bottom_row,

            swappable
        };
    }

    private readonly gen_color_for = (x: number, y: number): number => {
        while (true) {
            const n = (Math.random() * this.colors.length) | 0;
            const color = this.colors[n];

            const { top, left, right, bottom } = this.count_all(x, y, color);

            const is_row = left + right > 1;
            const is_col = top + bottom > 1;

            if (!is_row && !is_col) {
                return color;
            }
        }
    }

    private readonly sub_columns = (blocks: Array<{ x: number, y: number }>): Array<{ x: number, y: number, count: number }> => {
        const sub_cols = [] as Array<{ x: number, y: number, count: number }>;

        blocks.forEach(({ x, y }) => {
            const len = sub_cols.length;
            const last_block = len > 0 ? sub_cols[len - 1] : void 0;

            if (len && (y === last_block.y - 1)) {
                last_block.y = y;
                last_block.count += 1;
            } else {
                sub_cols.push({ x, y, count: 1 });
            }
        });

        return sub_cols;
    }

    private readonly sort_blocks = (hashs: Iterable<number>): Array<{ x: number, y: number }> => {
        const sorted_blocks = [] as Array<{ x: number, y: number }>;

        const shift_down_last = () => {
            const len = sorted_blocks.length;
            if (len < 2) {
                return;
            }

            let dst = len - 1;
            const block = sorted_blocks[dst];

            for (let i = len - 2; i >= 0; --i) {
                if (block.y < sorted_blocks[i].y) {
                    break;
                }
                sorted_blocks[i + 1] = sorted_blocks[i];
                dst = i;
            }

            sorted_blocks[dst] = block;
        };

        for (const hash of hashs) {
            sorted_blocks.push(this.block.from(hash));
            shift_down_last();
        }

        return sorted_blocks;
    }
}

export { Field };
