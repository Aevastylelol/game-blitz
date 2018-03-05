import { Block, BlockBuilder } from './block';
import { Field } from './field';
import { FieldRenderer } from './field_renderer';
import { FieldAnimation } from './field_animation';
import { Remover } from './remover';
import { Canvas, Sequencer, Sequence, SequenceCallback } from './../core/mod';
import { SoundFX } from './../sound/sound'

class GameBuilder {
    private canvas: Canvas;
    private width: number;
    private height: number;
    private x_origin: number;
    private y_origin: number;
    private block: Block;

    constructor() {
        // default
        this.canvas = null;
        this.width = 8;
        this.height = 8;
        this.x_origin = 0;
        this.y_origin = 0;
        this.block = new BlockBuilder().build();
    }

    public readonly with_origin = (x: number, y: number): this => {
        this.x_origin = x;
        this.y_origin = y;

        return this;
    }

    public readonly with_canvas = (canvas: Canvas): this => {
        this.canvas = canvas;

        return this;
    }

    public readonly with_dimensions = (width: number, height: number): this => {
        this.width = width;
        this.height = height;

        return this;
    }

    public readonly with_block = (block: Block): this => {
        this.block = block;

        return this;
    }

    public readonly build = (): Game => {
        const field = new Field(this.x_origin, this.y_origin, this.width, this.height, this.block);
        const field_renderer = new FieldRenderer(this.canvas, field);
        const field_animation = new FieldAnimation(field_renderer);

        return new Game(
            field,
            field_renderer,
            field_animation
        );
    }
}

class ScoreCounter {
    private readonly list: Set<Remover>;

    constructor() {
        this.list = new Set();
    }

    public readonly add = (remover: Remover): this => {
        this.list.add(remover);

        return this;
    }

    public readonly count = () => {
        let size = 0;

        this.list.forEach(remover => remover.columns().forEach(blocks => size += blocks.size));

        if (size > 3) {
            return 30 * (size - 3);
        } else {
            return 30;
        }
    }
}

class Game {
    private readonly sequencer: Sequencer;
    private total_score: number = 0;
    private selected_block: { x: number, y: number };

    constructor(
        public readonly field: Field,
        private readonly field_renderer: FieldRenderer,
        public readonly field_animation: FieldAnimation,
    ) {
        this.sequencer = new Sequencer();

        const renderer_width = this.field_renderer.grid.x_unit * this.field.block.padding * this.field.block.size;
        const renderer_height = this.field_renderer.grid.y_unit * this.field.block.padding * this.field.block.size;

        const gl = this.field_renderer.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.field_renderer.buffers[0]);

        this.field.generate((x, y, id, color) => {
            this.field_renderer.set_sprite_data(
                0,
                this.field_renderer.grid.x_from(x),
                this.field_renderer.grid.y_from(y),
                renderer_width,
                renderer_height,
                this.field.block.colors.get(color)
            );

            gl.bufferSubData(gl.ARRAY_BUFFER, this.field_renderer.get_buffer_offset(id), this.field_renderer.sprites[0]);
        });

        gl.bindVertexArray(this.field_renderer.arrays[0]);

        this.field_renderer.program_main.bind();
        this.field_renderer.canvas.clear();

        gl.drawArrays(gl.TRIANGLES, 0, this.field_renderer.sprite_count);

        this.field_renderer.program_main.unbind();

        this.rebuild();
    }

    public score = (): number => {
        return this.total_score;
    }

    public readonly select = (pos: { x: number, y: number }) => {
        const block = this.field.grid.block_from(pos);

        if (!this.field.contains_block(block.x, block.y)) {
            return;
        }
        
        this.set_selected_block(block);
        this.sequencer.next(this.field_animation.select_block(block.x, block.y));
    }

    public readonly selected_swap_with = (pos: { x: number, y: number }) => {
        const sequence = new Sequence();

        const block = this.field.grid.block_from(pos);

        if (!this.field.contains_block(block.x, block.y)) {
            return;
        }

        const selected_block = this.take_selected_block();

        const delta_x = selected_block.x - block.x;
        const delta_y = selected_block.y - block.y;

        let swapped = false;

        if (
            delta_x === 1 && delta_y === 0 || delta_x === -1 && delta_y === 0 ||
            delta_y === 1 && delta_x === 0 || delta_y === -1 && delta_x === 0
        ) {
            if (delta_x !== 0) {
                swapped = this.swap_x(selected_block, block, sequence);
            } else {
                swapped = this.swap_y(selected_block, block, sequence);
            }
        }

        if (swapped) {
            sequence
                .with(this.balance())
                .with(this.rebuild());
        } else {
            this.set_selected_block(block);
            sequence.with(this.field_animation.select_block(block.x, block.y));
        }

        this.sequencer.next(sequence.run);
    }

    public readonly is_selected_block = (): boolean => {
        return this.selected_block !== void 0;
    }

    private readonly set_selected_block = (selected: { x: number, y: number }) => {
        this.selected_block = selected;
    }

    private readonly take_selected_block = (): { x: number, y: number } => {
        const block = this.selected_block;

        this.selected_block = void 0;

        return block;
    }

    private readonly rebuild = (): SequenceCallback => {
        const sequence = new Sequence();

        while (!this.field.playable()) {
            const remover = new Remover(this.field.block);

            this.field.for_each((x, y, _) => remover.add(x, y));

            sequence.with(this.remove_with_animation(remover));
        }

        return sequence.run;
    }

    private readonly balance = () => {
        const score_counter = new ScoreCounter();
        const sequence = new Sequence();

        while (true) {
            const remover = new Remover(this.field.block);

            this.field.for_each((x, y, id) => {
                const color = this.field.get_color(id);

                const { top, left, right, bottom } = this.field.count_all(x, y, color);

                const is_row = left + right > 1;
                const is_col = top + bottom > 1;

                if (is_row || is_col) {
                    remover.add(x, y);

                    if (is_row) {
                        for (let i = left; i !== 0; --i) {
                            remover.add(x - i, y);
                        }
                        for (let i = right; i !== 0; --i) {
                            remover.add(x + i, y);
                        }
                    }

                    if (is_col) {
                        for (let i = top; i !== 0; --i) {
                            remover.add(x, y - i);
                        }
                        for (let i = bottom; i !== 0; --i) {
                            remover.add(x, y + i);
                        }
                    }
                }
            });

            if (!remover.empty()) {
                sequence.with(this.remove_with_animation(remover));
                score_counter.add(remover);
            } else {
                this.total_score += score_counter.count();

                break;
            }
        }

        return sequence.run;
    }

    private readonly remove_with_animation = (remover: Remover) => {
        const sequence = new Sequence();

        const hide_animation_cb = [] as SequenceCallback[];
        const remove_animation_cb = [] as SequenceCallback[];

        for (const [col, hash_blocks] of remover.columns().entries()) {
            const { shift_sub_columns, new_colors } = this.field.remove_from_columns(hash_blocks.values());

            remove_animation_cb.push(this.field_animation.remove_from_column(col, shift_sub_columns, new_colors));

            for (const hash of hash_blocks.values()) {
                const { x, y } = this.field.block.from(hash);

                hide_animation_cb.push(this.field_animation.hide_block(x, y));
            }
        }

        sequence
            .with(done => {
                SoundFX.instance_of().hide.reset().play();
                done();
            })
            .with(done => {
                const last_cb = hide_animation_cb.pop();

                for (const cb of hide_animation_cb) cb();

                last_cb(done);
            })
            .with(done => {
                const last_cb = remove_animation_cb.pop();

                for (const cb of remove_animation_cb) cb();

                last_cb(done);
            })
            .with(done => {
                SoundFX.instance_of().shift.reset().play();
                done();
            });

        return sequence.run;
    }

    private swap_x = (
        a_block: { x: number, y: number },
        b_block: { x: number, y: number },
        sequence: Sequence,
    ): boolean => {
        const x_swap = this.field.x_swap_for(a_block, b_block);

        if (!x_swap.swappable) {
            return false;
        }
        const remover = new Remover(this.field.block);

        const left_block = x_swap.left_block;
        const right_block = x_swap.right_block;

        if (x_swap.is_left || x_swap.is_left_col) {

            remover.add(left_block.x, left_block.y);

            if (x_swap.is_left) {
                remover
                    .add(left_block.x - 2, left_block.y)
                    .add(left_block.x - 1, left_block.y);
            }

            if (x_swap.is_left_col) {
                for (let i = x_swap.left_block_bottom; i !== 0; --i) {
                    remover.add(left_block.x, left_block.y + i);
                }

                for (let i = x_swap.left_block_top; i !== 0; --i) {
                    remover.add(left_block.x, left_block.y - i);
                }
            }
        }

        if (x_swap.is_right || x_swap.is_right_col) {
            remover.add(right_block.x, right_block.y);

            if (x_swap.is_right) {
                remover
                    .add(right_block.x + 2, right_block.y)
                    .add(right_block.x + 1, right_block.y);
            }

            if (x_swap.is_right_col) {
                for (let i = x_swap.right_block_bottom; i !== 0; --i) {
                    remover.add(right_block.x, right_block.y + i);
                }

                for (let i = x_swap.right_block_top; i !== 0; --i) {
                    remover.add(right_block.x, right_block.y - i);
                }
            }
        }

        this.field.swap_by_id(x_swap.left_block_id, x_swap.right_block_id);

        this.total_score += new ScoreCounter().add(remover).count();

        sequence
            .with(this.field_animation.swap_blocks(0, left_block, right_block))
            .with(this.remove_with_animation(remover));

        return true;
    }

    private swap_y = (
        a_block: { x: number, y: number },
        b_block: { x: number, y: number },
        sequence: Sequence,
    ): boolean => {
        const y_swap = this.field.y_swap_for(a_block, b_block);

        if (!y_swap.swappable) {
            return false;
        }
        const remover = new Remover(this.field.block);

        const { top_block, bottom_block } = y_swap;

        if (y_swap.is_bottom || y_swap.is_bottom_row) {
            remover.add(bottom_block.x, bottom_block.y);

            if (y_swap.is_bottom) {
                remover
                    .add(bottom_block.x, bottom_block.y + 2)
                    .add(bottom_block.x, bottom_block.y + 1);
            }

            if (y_swap.is_bottom_row) {
                for (let i = y_swap.bottom_block_left; i !== 0; --i) {
                    remover.add(bottom_block.x - i, bottom_block.y);
                }

                for (let i = y_swap.bottom_block_right; i !== 0; --i) {
                    remover.add(bottom_block.x + i, bottom_block.y);
                }
            }
        }

        if (y_swap.is_top || y_swap.is_top_row) {
            remover.add(top_block.x, top_block.y);

            if (y_swap.is_top) {
                remover
                    .add(top_block.x, top_block.y - 2)
                    .add(top_block.x, top_block.y - 1);
            }

            if (y_swap.is_top_row) {
                for (let i = y_swap.top_block_left; i !== 0; --i) {
                    remover.add(top_block.x - i, top_block.y);
                }

                for (let i = y_swap.top_block_right; i !== 0; --i) {
                    remover.add(top_block.x + i, top_block.y);
                }
            }
        }

        this.field.swap_by_id(y_swap.top_block_id, y_swap.bottom_block_id);

        this.total_score += new ScoreCounter().add(remover).count();

        sequence
            .with(this.field_animation.swap_blocks(1, top_block, bottom_block))
            .with(this.remove_with_animation(remover));

        return true;
    }
}

export { Game, GameBuilder };
