
class Color {
    public r: number;
    public g: number;
    public b: number;
    public a: number;

    private readonly res: Uint32Array;
    private readonly rgba: Uint8Array;

    constructor(r: number, g: number, b: number, a: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;

        this.res = new Uint32Array(1);
        this.rgba = new Uint8Array(this.res.buffer);
    }

    public readonly hash = (): number => {
        this.res[0] = 0;

        this.rgba[3] = this.a * 0xFF;
        this.rgba[2] = this.b * 0xFF;
        this.rgba[1] = this.g * 0xFF;
        this.rgba[0] = this.r * 0xFF;

        return this.res[0];
    }

    public static readonly from_u8 = (r: number, g: number, b: number, a: number) => {
        return new Color(r / 255, g / 255, b / 255, a);
    }

    public static readonly from_hash = (hash: number): Color => {
        hash |= 0;

        return new Color(
            (hash & 0xFF) / 0xFF,
            (hash & 0xFFFF >>> 8) / 0xFF,
            (hash & 0xFFFFFF >>> 16) / 0xFF,
            (hash >>> 24) / 0xFF
        );
    }
}

export { Color };
