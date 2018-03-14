import { Block, BlockTransform, BlockScale } from './shaders/mod';
import { Canvas, Program } from './../core/mod';
import { Color } from './color';
import { Field } from './field';

class RendererGrid {
    constructor(
        public readonly x_origin: number,
        public readonly y_origin: number,
        public readonly x_unit: number,
        public readonly y_unit: number,
        public readonly block_size: number,
    ) { }

    public readonly x_from = (x: number): number => (x * this.block_size + this.x_origin) * this.x_unit - 1;
    public readonly y_from = (y: number): number => 1 - (y * this.block_size + this.y_origin) * this.y_unit;
}

class FieldRenderer {
    public readonly field: Field;
    public readonly grid: RendererGrid;

    public readonly canvas: Canvas;
    public readonly gl: WebGL2RenderingContext;

    public readonly max_sprites: number;
    public readonly vertex_size: number;
    public readonly sprite_size: number;
    public readonly buffer_size: number;
    public readonly sprite_count: number;

    public readonly sprites: [Float32Array, Float32Array, Float32Array, Float32Array];

    public readonly program_main: Program;
    public readonly program_shift: Program;
    public readonly program_scale: Program;

    public readonly buffers: [WebGLBuffer, WebGLBuffer];
    public readonly arrays: [WebGLVertexArrayObject, WebGLVertexArrayObject];
    public readonly transform_feedback: WebGLTransformFeedback;

    constructor(canvas: Canvas, field: Field) {
        this.canvas = canvas;
        this.field = field;

        this.grid = new RendererGrid(
            this.field.grid.x_origin,
            this.field.grid.y_origin,
            2 / canvas.width(),
            2 / canvas.height(),
            field.block.size
        );

        const gl = this.gl = this.canvas.context();

        this.max_sprites = this.field.width * this.field.height;
        this.vertex_size = 7;
        this.sprite_size = this.vertex_size * 6;
        this.buffer_size = this.max_sprites * this.sprite_size;
        this.sprite_count = this.sprite_count = this.max_sprites * 6;

        const buffer = new Float32Array(this.sprite_size * 4);

        this.sprites = [
            buffer.subarray(0, this.sprite_size),
            buffer.subarray(this.sprite_size, this.sprite_size * 2),
            buffer.subarray(this.sprite_size * 2, this.sprite_size * 3),
            buffer.subarray(this.sprite_size * 3, this.sprite_size * 4)
        ];

        this.program_main = this.canvas.program_builder()
            .with_vshader_source(Block.vshader_source)
            .with_fshader_source(Block.fshader_source)
            .build();

        this.program_shift = this.canvas.program_builder()
            .with_vshader_source(BlockTransform.vshader_source)
            .with_fshader_source(BlockTransform.fshader_source)
            .with_transform_feedback_varyings(['new_position', 'v_color'], 'INTERLEAVED_ATTRIBS')
            .build();

        this.program_scale = this.canvas.program_builder()
            .with_vshader_source(BlockScale.vshader_source)
            .with_fshader_source(BlockScale.fshader_source)
            .build();


        this.buffers = [gl.createBuffer(), gl.createBuffer()];
        this.arrays = [gl.createVertexArray(), gl.createVertexArray()];

        for (let i = 0; i !== 2; ++i) {
            const vbo = this.buffers[i];
            const vao = this.arrays[i];

            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, this.buffer_size * 4, gl.DYNAMIC_READ);
            gl.bindVertexArray(vao);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, this.vertex_size * 4, 0);
            gl.vertexAttribPointer(1, 4, gl.FLOAT, false, this.vertex_size * 4, 3 * 4);
            gl.enableVertexAttribArray(0);
            gl.enableVertexAttribArray(1);
            gl.bindVertexArray(null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        this.transform_feedback = gl.createTransformFeedback();
    }

    public readonly get_buffer_offset = (index: number) => {
        return index * this.sprite_size * 4;
    }

    public readonly swap_buffers = (a: 0 | 1, b: 0 | 1) => {
        const t = this.buffers[a];

        this.buffers[a] = this.buffers[b];
        this.buffers[b] = t;
    }

    public readonly swap_arrays = (a: 0 | 1, b: 0 | 1) => {
        const t = this.arrays[a];

        this.arrays[a] = this.arrays[b];
        this.arrays[b] = t;
    }

    public readonly set_sprite_data = (
        sprite: 0 | 1 | 2 | 3,
        x: number, y: number,
        w: number, h: number,
        color: Color
    ) => {
        const data = this.sprites[sprite];

        data[0] = x;
        data[1] = y;

        data[3] = color.r;
        data[4] = color.g;
        data[5] = color.b;
        data[6] = color.a;

        data[7] = x;
        data[8] = y - h;

        data[10] = color.r;
        data[11] = color.g;
        data[12] = color.b;
        data[13] = color.a;

        data[14] = x + w;
        data[15] = y - h;

        data[17] = color.r;
        data[18] = color.g;
        data[19] = color.b;
        data[20] = color.a;

        data[21] = x;
        data[22] = y;

        data[24] = color.r;
        data[25] = color.g;
        data[26] = color.b;
        data[27] = color.a;

        data[28] = x + w;
        data[29] = y - h;

        data[31] = color.r;
        data[32] = color.g;
        data[33] = color.b;
        data[34] = color.a;

        data[35] = x + w;
        data[36] = y;

        data[38] = color.r;
        data[39] = color.g;
        data[40] = color.b;
        data[41] = color.a;
    }
}

export { FieldRenderer };
