import { BackgroundSound, SoundFX } from './../sound/sound';
import { Color } from './color';
import { Field } from './field';
import { FieldRenderer } from './field_renderer';
import { Parallel, ThreadCallback } from './../core/mod';


class FieldAnimation {
    public readonly field: Field;
    public readonly renderer: FieldRenderer;

    constructor(field_renderer: FieldRenderer) {
        this.field = field_renderer.field;
        this.renderer = field_renderer;
    }
    public readonly unselect_block = (x: number, y: number) => {
        const renderer = this.renderer;
        const gl = this.renderer.gl;

        this.renderer.program_main.bind();
        renderer.canvas.clear();

        gl.bindBuffer(gl.ARRAY_BUFFER, renderer.buffers[0]);
        gl.bindVertexArray(this.renderer.arrays[0]);

        gl.drawArrays(gl.TRIANGLES, 0, this.renderer.sprite_count);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.renderer.program_main.unbind();
    }

    public readonly select_block = (x: number, y: number): ThreadCallback => (done: () => void) => {
        const renderer = this.renderer;
        const gl = this.renderer.gl;

        const renderer_block_x = renderer.grid.x_from(x)
        const renderer_block_y = renderer.grid.y_from(y);
        const renderer_block_width = renderer.grid.x_unit * this.field.block.size * this.field.block.padding;
        const renderer_block_height = renderer.grid.y_unit * this.field.block.size * this.field.block.padding;

        const renderer_border_x = renderer_block_x - renderer_block_width / 2;
        const renderer_border_y = renderer_block_y + renderer_block_height / 2;
        const renderer_border_width = renderer_block_width * 2;
        const renderer_border_height = renderer_block_height * 2;
        const renderer_border_size_width = renderer_block_width / 6;
        const renderer_border_size_height = renderer_block_height / 6;

        gl.bindBuffer(gl.ARRAY_BUFFER, renderer.buffers[0]);
        gl.getBufferSubData(gl.ARRAY_BUFFER, renderer.get_buffer_offset(this.field.id_from(x, y)), renderer.sprites[0]);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        const color = new Color(renderer.sprites[0][3], renderer.sprites[0][4], renderer.sprites[0][5], renderer.sprites[0][6]);

        gl.bindBuffer(gl.ARRAY_BUFFER, renderer.buffers[1]);

        this.renderer.set_sprite_data(
            0,
            renderer_border_x,
            renderer_border_y,
            renderer_border_size_width,
            renderer_border_height,
            color
        );
        gl.bufferSubData(gl.ARRAY_BUFFER, renderer.get_buffer_offset(0), renderer.sprites[0]);

        this.renderer.set_sprite_data(0,
            renderer_border_x,
            renderer_border_y - renderer_border_height + renderer_border_size_height,
            renderer_border_width,
            renderer_border_size_height,
            color
        );
        gl.bufferSubData(gl.ARRAY_BUFFER, renderer.get_buffer_offset(1), renderer.sprites[0]);

        this.renderer.set_sprite_data(
            0,
            renderer_border_x + renderer_border_width - renderer_border_size_width,
            renderer_border_y,
            renderer_border_size_width,
            renderer_border_height,
            color
        );
        gl.bufferSubData(gl.ARRAY_BUFFER, renderer.get_buffer_offset(2), renderer.sprites[0]);

        this.renderer.set_sprite_data(
            0,
            renderer_border_x,
            renderer_border_y,
            renderer_border_width,
            renderer_border_size_height,
            color
        );
        gl.bufferSubData(gl.ARRAY_BUFFER, renderer.get_buffer_offset(3), renderer.sprites[0]);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        const scale = new Float32Array([
            renderer_block_width / renderer_border_width, 0.0, 0.0, 0.0,
            0.0, renderer_block_height / renderer_border_height, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
        ]);

        const move_in_center = new Float32Array([
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            -(renderer_block_x + renderer_block_width / 2), -(renderer_block_y - renderer_block_height / 2), 0.0, 1.0
        ]);

        const move_back = new Float32Array([
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            renderer_block_x + renderer_block_width / 2, renderer_block_y - renderer_block_height / 2, 0.0, 1.0
        ]);

        const delta_sx = 1 - renderer_block_width / renderer_border_width;
        const delta_sy = 1 - renderer_block_height / renderer_border_height;

        const step_cb = (step: number) => {
            scale[0] += step * delta_sx;
            scale[5] += step * delta_sy;

            renderer.program_scale.bind();
            renderer.canvas.clear();

            renderer.program_scale.set_uniform_mat4fv('scale', scale);
            renderer.program_scale.set_uniform_mat4fv('move_in_center', move_in_center);
            renderer.program_scale.set_uniform_mat4fv('move_back', move_back);

            gl.bindBuffer(gl.ARRAY_BUFFER, renderer.buffers[1]);
            gl.bindVertexArray(this.renderer.arrays[1]);

            gl.drawArrays(gl.TRIANGLES, 0, 4 * 6);

            gl.bindVertexArray(null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            this.renderer.program_scale.unbind();
            this.renderer.program_main.bind();

            gl.bindBuffer(gl.ARRAY_BUFFER, renderer.buffers[0]);
            gl.bindVertexArray(this.renderer.arrays[0]);

            gl.drawArrays(gl.TRIANGLES, 0, this.renderer.sprite_count);

            gl.bindVertexArray(null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            this.renderer.program_main.unbind();
        };

        this.field.block.select_transition(1, step_cb)(done);
    }

    public readonly hide_block = (x: number, y: number): ThreadCallback => (done: () => void) => {
        const src_offset = this.renderer.get_buffer_offset(this.field.id_from(x, y));

        const gl = this.renderer.gl;
        const sprite = this.renderer.sprites[2];

        const step_sb = (step: number) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.renderer.buffers[0]);
            gl.getBufferSubData(gl.ARRAY_BUFFER, src_offset, sprite);

            const dx = this.renderer.grid.x_unit * step;
            const dy = this.renderer.grid.y_unit * step;

            sprite[0] += dx;
            sprite[1] -= dy;

            sprite[7] += dx;
            sprite[8] += dy;

            sprite[14] -= dx;
            sprite[15] += dy;

            sprite[21] += dx;
            sprite[22] -= dy;

            sprite[28] -= dx;
            sprite[29] += dy;

            sprite[35] -= dx;
            sprite[36] -= dy;

            gl.bufferSubData(gl.ARRAY_BUFFER, src_offset, sprite);
            gl.bindVertexArray(this.renderer.arrays[0]);

            this.renderer.program_main.bind();
            this.renderer.canvas.clear();

            gl.drawArrays(gl.TRIANGLES, 0, this.renderer.sprite_count);

            gl.bindVertexArray(null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            this.renderer.program_main.unbind();
        }

        this.field.block.hide_transition(this.field.block.size * this.field.block.padding / 2, step_sb)(done);
    }

    public readonly swap_blocks = (
        axis: 0 | 1,
        fst_block: { x: number, y: number },
        snd_block: { x: number, y: number }
    ): ThreadCallback => (done: () => void) => {
        const fst_block_id = this.field.id_from(fst_block.x, fst_block.y);
        const snd_block_id = this.field.id_from(snd_block.x, snd_block.y);

        const fst_src_offset = this.renderer.get_buffer_offset(fst_block_id);
        const snd_src_offset = this.renderer.get_buffer_offset(snd_block_id);

        const gl = this.renderer.gl;
        const sprites = this.renderer.sprites;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.renderer.buffers[0]);

        gl.getBufferSubData(gl.ARRAY_BUFFER, fst_src_offset, sprites[0]);
        gl.getBufferSubData(gl.ARRAY_BUFFER, snd_src_offset, sprites[1]);

        gl.bufferSubData(gl.ARRAY_BUFFER, fst_src_offset, sprites[1]);
        gl.bufferSubData(gl.ARRAY_BUFFER, snd_src_offset, sprites[0]);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        const delta = sprites[1][axis] - sprites[0][axis];

        const step_cb = (step: number) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.renderer.buffers[0]);
            gl.getBufferSubData(gl.ARRAY_BUFFER, fst_src_offset, sprites[0]);
            gl.getBufferSubData(gl.ARRAY_BUFFER, snd_src_offset, sprites[1]);

            sprites[0][axis] -= step;
            sprites[0][7 + axis] -= step;
            sprites[0][14 + axis] -= step;
            sprites[0][21 + axis] -= step;
            sprites[0][28 + axis] -= step;
            sprites[0][35 + axis] -= step;

            sprites[1][axis] += step;
            sprites[1][7 + axis] += step;
            sprites[1][14 + axis] += step;
            sprites[1][21 + axis] += step;
            sprites[1][28 + axis] += step;
            sprites[1][35 + axis] += step;

            gl.bindBuffer(gl.ARRAY_BUFFER, this.renderer.buffers[0]);
            gl.bufferSubData(gl.ARRAY_BUFFER, fst_src_offset, sprites[0]);
            gl.bufferSubData(gl.ARRAY_BUFFER, snd_src_offset, sprites[1]);
            gl.bindVertexArray(this.renderer.arrays[0]);

            this.renderer.program_main.bind();
            this.renderer.canvas.clear();

            gl.drawArrays(gl.TRIANGLES, 0, this.renderer.sprite_count);

            gl.bindVertexArray(null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            this.renderer.program_main.unbind();
        };

        this.field.block.swap_transition(delta, step_cb)(done);
    }

    public readonly remove_from_column = (
        column: number,
        shift_sub_columns: Array<{ start: number, end: number, offset: number }>,
        new_colors: Uint32Array
    ): ThreadCallback => (done: () => void) => {
        const renderer = this.renderer;

        const start_col = this.field.start_col_id(column);
        const start_col_offset = renderer.get_buffer_offset(start_col);

        const gl = renderer.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, renderer.buffers[0]);

        let shift_count = 0;

        shift_sub_columns.forEach(({ start, end, offset }) => {
            shift_count = offset;

            for (let k = end + shift_count; k >= start + shift_count; --k) {
                gl.getBufferSubData(gl.ARRAY_BUFFER, start_col_offset + renderer.get_buffer_offset(k - shift_count), renderer.sprites[0]);
                gl.bufferSubData(gl.ARRAY_BUFFER, start_col_offset + renderer.get_buffer_offset(k), renderer.sprites[0]);
            }
        });

        const renderer_x = renderer.grid.x_from(column);
        const renderer_width = renderer.grid.x_unit * this.field.block.padding * this.field.block.size;
        const renderer_height = renderer.grid.y_unit * this.field.block.padding * this.field.block.size;

        for (let i = 0; i !== shift_count; ++i) {
            renderer.set_sprite_data(
                0,
                renderer_x,
                renderer.grid.y_from(0) + (shift_count - i) * renderer.grid.y_unit * this.field.block.size,
                renderer_width,
                renderer_height,
                this.field.block.colors.get(new_colors[i])
            );

            gl.bufferSubData(gl.ARRAY_BUFFER, start_col_offset + renderer.get_buffer_offset(i), renderer.sprites[0]);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        const left_limit = renderer_x;
        const right_limit = renderer_x + renderer.grid.x_unit * this.field.block.size;

        const transition_parallel = new Parallel();

        shift_sub_columns.forEach((col, i) => {
            const start_offset = start_col_offset + (i + 1 !== shift_sub_columns.length ?
                renderer.get_buffer_offset(col.start + col.offset) : 0);
            const end_offset = start_col_offset + renderer.get_buffer_offset(col.end + col.offset);

            const start_sprite = renderer.sprites[0];
            const end_sprite = renderer.sprites[1];

            const step_cb = (step: number) => {
                gl.bindBuffer(gl.ARRAY_BUFFER, renderer.buffers[0]);
                gl.getBufferSubData(gl.ARRAY_BUFFER, start_offset, start_sprite);
                gl.getBufferSubData(gl.ARRAY_BUFFER, end_offset, end_sprite);
                gl.bindBuffer(gl.ARRAY_BUFFER, null);

                renderer.program_shift.bind();
                renderer.program_shift.set_uniform1f('step', step);
                renderer.program_shift.set_uniform1f('left_limit', left_limit);
                renderer.program_shift.set_uniform1f('right_limit', right_limit);
                renderer.program_shift.set_uniform1f('top_limit', start_sprite[1]);
                renderer.program_shift.set_uniform1f('bottom_limit', end_sprite[1] - renderer.grid.y_unit * this.field.block.size);

                gl.bindVertexArray(this.renderer.arrays[0]);
                gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.renderer.transform_feedback);
                gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.renderer.buffers[1]);
                gl.beginTransformFeedback(gl.TRIANGLES);

                renderer.canvas.clear();

                gl.drawArrays(gl.TRIANGLES, 0, this.renderer.sprite_count);

                gl.bindVertexArray(null);
                gl.endTransformFeedback();
                gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
                gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

                renderer.program_shift.unbind();

                this.renderer.swap_buffers(0, 1);
                this.renderer.swap_arrays(0, 1);
            };

            const delta = col.offset * this.field.block.size * renderer.grid.y_unit;

            transition_parallel.with(this.field.block.shift_transition(delta, step_cb));
        });

        transition_parallel.run(done);
    }
}

export { FieldAnimation };
