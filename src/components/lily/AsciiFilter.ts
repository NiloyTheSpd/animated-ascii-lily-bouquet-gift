import { Filter, GlProgram, UniformGroup, defaultFilterVert } from 'pixi.js';

const fragment = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uCellSize;
uniform float uColorBoost;

float glyph(float lum, vec2 uv) {
    vec2 c = uv - 0.5;
    float ax = abs(c.x);
    float ay = abs(c.y);
    
    // Crisp thresholds for 100% ASCII look
    if (lum < 0.1) return 0.0;
    if (lum < 0.25) return (ax < 0.15 && ay < 0.15) ? 1.0 : 0.0; // Dot
    if (lum < 0.4) return (ay < 0.1 && ax < 0.4) ? 1.0 : 0.0; // Dash -
    if (lum < 0.55) return (abs(ay - 0.2) < 0.1 && ax < 0.4) ? 1.0 : 0.0; // Equals =
    if (lum < 0.7) return ((ay < 0.1 && ax < 0.4) || (ax < 0.1 && ay < 0.4)) ? 1.0 : 0.0; // Plus +
    if (lum < 0.85) { 
        // Hash #
        float lines = (abs(ay - 0.2) < 0.1 || abs(ax - 0.2) < 0.1) ? 1.0 : 0.0;
        return (ax < 0.4 && ay < 0.4 && lines == 1.0) ? 1.0 : 0.0;
    }
    
    // Dense @
    float outer = ((ax > 0.2 && ax < 0.4) || (ay > 0.2 && ay < 0.4)) ? 1.0 : 0.0;
    float inner = (ax < 0.1 && ay < 0.1) ? 1.0 : 0.0;
    return ((outer == 1.0 || inner == 1.0) && (ax < 0.4 && ay < 0.4)) ? 1.0 : 0.0;
}

void main() {
    vec2 pixelSize = 1.0 / max(uResolution, vec2(1.0));
    vec2 cellUvSize = max(vec2(uCellSize) * pixelSize, vec2(0.00001));
    
    // Snap to the center of the current cell
    vec2 cellCenter = (floor(vTextureCoord / cellUvSize) + 0.5) * cellUvSize;
    
    vec4 color = texture(uTexture, cellCenter);
    
    if (color.a < 0.05) {
        finalColor = vec4(0.0);
        return;
    }

    // Calculate perceptual luminance
    float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    lum = clamp(lum * uColorBoost, 0.0, 1.0);
    
    // Local coordinates within the cell (0.0 -> 1.0)
    vec2 local = fract(vTextureCoord / cellUvSize);
    
    // Get the crisp binary mask for the character
    float mask = glyph(lum, local);
    
    // Apply purely binary mask (no fuzzy edges) multiplied by the cell color
    finalColor = vec4(color.rgb * uColorBoost * mask, color.a * mask);
}
`;

export class AsciiFilter extends Filter {
    constructor(cellSize = 7, colorBoost = 1.05) {
        const asciiUniforms = new UniformGroup({
            uCellSize: { value: cellSize, type: 'f32' },
            uColorBoost: { value: colorBoost, type: 'f32' },
            uResolution: { value: [800, 600], type: 'vec2<f32>' },
        });

        super({
            glProgram: GlProgram.from({
                vertex: defaultFilterVert,
                fragment,
            }),
            resources: {
                asciiUniforms,
            },
            padding: 0, // No padding needed for direct quantization
        });
    }

    get uniforms() {
        return (this.resources.asciiUniforms as UniformGroup).uniforms as {
            uCellSize: number;
            uColorBoost: number;
            uResolution: number[];
        };
    }

    get cellSize() {
        return this.uniforms.uCellSize;
    }

    set cellSize(value: number) {
        this.uniforms.uCellSize = value;
    }

    get colorBoost() {
        return this.uniforms.uColorBoost;
    }

    set colorBoost(value: number) {
        this.uniforms.uColorBoost = value;
    }

    set resolutionUniform(res: [number, number]) {
        this.uniforms.uResolution = res;
    }
}
