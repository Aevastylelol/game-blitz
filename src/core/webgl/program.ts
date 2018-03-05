class ProgramBuilder {
    private gl: WebGL2RenderingContext;
    private vshader_source: string;
    private fshader_source: string;
    private tf_varyings: string[];
    private tf_buffer_mode: number;

    constructor() {
        this.gl = null;
        this.vshader_source = '';
        this.fshader_source = '';
        this.tf_varyings = [];
        this.tf_buffer_mode = 0;
    }

    public readonly with_gl = (gl: WebGL2RenderingContext): this => {
        this.gl = gl;

        return this;
    }

    public readonly with_vshader_source = (vshader_source: string): this => {
        this.vshader_source = vshader_source;

        return this;
    }

    public readonly with_fshader_source = (fhsader_source: string): this => {
        this.fshader_source = fhsader_source;

        return this;
    }

    public readonly with_transform_feedback_varyings = (
        varyings: string[],
        buffer_mode: 'INTERLEAVED_ATTRIBS' | 'SEPARATE_ATTRIBS'
    ): this => {
        this.tf_varyings = varyings;
        this.tf_buffer_mode = this.gl[buffer_mode];

        return this;
    }

    public readonly build = (): Program => {
        const program = new Program(
            this.gl,
            this.vshader_source,
            this.fshader_source,
            this.tf_varyings,
            this.tf_buffer_mode
        );

        return program;
    }
}

class Program {
    private readonly id: WebGLProgram;

    constructor(
        private readonly gl: WebGL2RenderingContext,
        private readonly vshader_source: string,
        private readonly fshader_source: string,
        private readonly tf_varyings: string[],
        private readonly tf_buffer_mode: number
    ) {
        this.id = Program.create_program(gl, vshader_source, fshader_source);

        if (tf_varyings.length) {
            this.bind();

            gl.transformFeedbackVaryings(
                this.id,
                this.tf_varyings,
                this.tf_buffer_mode
            );

            this.relink();
            this.unbind();
        }
    }

    public static readonly compile = (gl: WebGL2RenderingContext, shader_type: number, shader_source: string): WebGLShader => {
        const shader = gl.createShader(shader_type);

        gl.shaderSource(shader, shader_source);
        gl.compileShader(shader);

        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) === false) {
            console.error(gl.getShaderInfoLog(shader));

            return;
        }

        return shader;
    }

    public static readonly create_program = (
        gl: WebGL2RenderingContext,
        vshader_source: string,
        fshader_source: string
    ): WebGLProgram => {
        const vshader = Program.compile(gl, gl.VERTEX_SHADER, vshader_source);
        const fshader = Program.compile(gl, gl.FRAGMENT_SHADER, fshader_source);

        const program = gl.createProgram();

        gl.attachShader(program, vshader);
        gl.attachShader(program, fshader);

        gl.deleteShader(vshader);
        gl.deleteShader(fshader);

        gl.linkProgram(program);

        if (gl.getProgramParameter(program, gl.LINK_STATUS) === false) {
            console.error(gl.getProgramInfoLog(program));
            gl.deleteProgram(program);

            return;
        }

        return program;
    }

    public readonly set_uniform1f = (name: string, value: number) => {
        const location = this.gl.getUniformLocation(this.id, name);

        this.gl.uniform1f(location, value);
    }

    public readonly set_uniform_mat4fv = (name: string, data: Float32Array) => {
        const location = this.gl.getUniformLocation(this.id, name);

        this.gl.uniformMatrix4fv(location, false, data);
    }

    public readonly get_attrib_location = (name: string): number => {
        return this.gl.getAttribLocation(this.id, name);
    }

    public readonly context = (): WebGL2RenderingContext => {
        return this.gl;
    }

    public readonly relink = () => {
        this.gl.linkProgram(this.id);
    }

    public readonly bind = () => {
        this.gl.useProgram(this.id);
    }

    public readonly unbind = () => {
        this.gl.useProgram(null);
    }

    public readonly drop = () => {
        this.gl.deleteProgram(this.id);
    }
}

export { ProgramBuilder, Program };
