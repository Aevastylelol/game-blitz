import { ProgramBuilder } from './webgl/mod';

class Canvas {
    private canvas: HTMLCanvasElement;
    private gl: WebGL2RenderingContext;

    constructor(canvas_id: string) {
        this.canvas = Canvas.get_canvas_element(canvas_id);

        this.gl = this.canvas.getContext('webgl2' || 'experimental-webgl2');
    }

    public readonly width = (): number => {
        return this.canvas.width;
    }

    public readonly height = (): number => {
        return this.canvas.height;
    }

    public readonly context = (): WebGL2RenderingContext => {
        return this.gl;
    }

    public readonly event_target = (): EventTarget => {
        return this.canvas;
    }

    public readonly set_client_dimensions = (): this => {
        return this.set_dimensions(
            Math.floor(this.canvas.clientWidth * (window.devicePixelRatio || 1)),
            Math.floor(this.canvas.clientHeight * (window.devicePixelRatio || 1))
        );
    }

    public readonly set_dimensions = (width: number, height: number): this => {
        this.canvas.width = width;
        this.canvas.height = height;

        this.gl.viewport(0, 0, width, height);

        return this;
    }

    public readonly clear_color = (r: number, g: number, b: number, a: number): this => {
        this.gl.clearColor(r, g, b, a);

        return this;
    }

    public readonly clear = (): this => {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        return this;
    }

    public readonly rect = (): ClientRect => {
        return this.canvas.getBoundingClientRect();
    }

    public readonly program_builder = (): ProgramBuilder => {
        return new ProgramBuilder().with_gl(this.gl);
    }

    private static readonly get_canvas_element = (id: string): HTMLCanvasElement | null => {
        return document.getElementById(id) as HTMLCanvasElement;
    }
}

export { Canvas };
