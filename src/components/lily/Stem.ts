import { Graphics } from 'pixi.js';

export interface StemLayout {
    tieX: number;
    tieY: number;
    flowerX: number;
    flowerY: number;
    scale: number;
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

interface LeafSpec {
    pos: number;
    side: number;
    length: number;
    droop: number;
}

/**
 * A single bouquet stem. All stems share one root (the tie point) and fan
 * outward to their flower head, exactly like a hand-tied bouquet.
 * The stem is drawn as a tapered filled ribbon with drooping leaves.
 */
export class Stem {
    public readonly graphics = new Graphics();

    private layout: StemLayout = { tieX: 0, tieY: 0, flowerX: 0, flowerY: 0, scale: 1 };

    private rootX = 0;
    private rootY = 0;
    private flowerX = 0;
    private flowerY = 0;
    private scale = 1;

    private growProgress = 0;
    private pendingDelay = 0;
    private readonly jitter: number;
    private readonly arcStrength: number;
    private readonly growRate: number;
    private readonly leaves: LeafSpec[] = [];
    private readonly shade: number;

    constructor(options: { shade?: number; leafBoost?: number; arcStrength?: number; growRate?: number } = {}) {
        this.jitter = (Math.random() - 0.5) * 7;
        this.arcStrength = options.arcStrength ?? 0.24 + Math.random() * 0.14;
        this.shade = options.shade ?? 1;
        this.growRate = options.growRate ?? 0.85;

        const leafCount = Math.round((3 + Math.floor(Math.random() * 3)) * (options.leafBoost ?? 1));
        for (let i = 0; i < leafCount; i += 1) {
            this.leaves.push({
                pos: 0.16 + Math.random() * 0.68,
                side: Math.random() > 0.5 ? 1 : -1,
                length: (26 + Math.random() * 30) * (options.leafBoost ?? 1),
                droop: 0.18 + Math.random() * 0.34,
            });
        }
    }

    public reset(startDelaySeconds = 0) {
        this.growProgress = 0;
        this.pendingDelay = startDelaySeconds;
        this.graphics.clear();
    }

    public setLayout(layout: StemLayout, resetProgress = false) {
        this.layout = layout;
        this.scale = layout.scale;

        // All stems spring from the same tie point (tiny jitter for a natural bundle)
        this.rootX = layout.tieX + this.jitter * layout.scale;
        this.rootY = layout.tieY + (Math.random() - 0.5) * 4 * layout.scale;
        this.flowerX = layout.flowerX;
        this.flowerY = layout.flowerY;

        if (resetProgress) {
            this.growProgress = 0;
            this.graphics.clear();
        }
    }

    public update(deltaSeconds: number, speed: number) {
        // Choreographed entrance: each stem waits for its cue in the cascade
        if (speed > 0 && this.pendingDelay > 0) {
            this.pendingDelay -= deltaSeconds;
            if (this.pendingDelay > 0) {
                this.graphics.clear();
                return;
            }
        }

        this.growProgress = Math.min(1, this.growProgress + deltaSeconds * this.growRate * speed);

        const t = 1 - Math.pow(1 - this.growProgress, 2.1);
        if (t <= 0.001) {
            this.graphics.clear();
            return;
        }

        const u = this.scale;
        const controlX = lerp(this.rootX, this.flowerX, 0.42) + (this.flowerX - this.rootX) * this.arcStrength;
        const controlY = lerp(this.rootY, this.flowerY, 0.5);

        const pointAt = (amount: number) => {
            const mt = 1 - amount;
            return {
                x: mt * mt * this.rootX + 2 * mt * amount * controlX + amount * amount * this.flowerX,
                y: mt * mt * this.rootY + 2 * mt * amount * controlY + amount * amount * this.flowerY,
            };
        };

        const tangentAt = (amount: number) => {
            const mt = 1 - amount;
            return {
                x: 2 * mt * (controlX - this.rootX) + 2 * amount * (this.flowerX - controlX),
                y: 2 * mt * (controlY - this.rootY) + 2 * amount * (this.flowerY - controlY),
            };
        };

        this.graphics.clear();

        // Tapered ribbon: base thick near the tie, slim at the flower head
        const steps = 26;
        const baseHalf = 6.2 * u;
        const tipHalf = 2.3 * u;
        const left: { x: number; y: number }[] = [];
        const right: { x: number; y: number }[] = [];
        const spine: { x: number; y: number }[] = [];
        const count = Math.max(2, Math.floor(steps * t) + 1);

        for (let i = 0; i < count; i += 1) {
            const amount = (i / (count - 1)) * t;
            const p = pointAt(amount);
            const tan = tangentAt(amount);
            const len = Math.max(0.0001, Math.hypot(tan.x, tan.y));
            const nx = -tan.y / len;
            const ny = tan.x / len;
            const half = lerp(baseHalf, tipHalf, i / (count - 1));

            left.push({ x: p.x + nx * half, y: p.y + ny * half });
            right.push({ x: p.x - nx * half, y: p.y - ny * half });
            spine.push(p);
        }

        this.graphics.moveTo(left[0].x, left[0].y);
        for (let i = 1; i < left.length; i += 1) this.graphics.lineTo(left[i].x, left[i].y);
        for (let i = right.length - 1; i >= 0; i -= 1) this.graphics.lineTo(right[i].x, right[i].y);
        this.graphics.closePath().fill({ color: this.tint(0x2fae57), alpha: 1 });

        // Bright highlight along the spine for a lit, fresh-cut look
        this.graphics.moveTo(spine[0].x + 2.2 * u, spine[0].y);
        for (let i = 1; i < spine.length; i += 1) {
            this.graphics.lineTo(spine[i].x + lerp(2.2, 0.4, i / (spine.length - 1)) * u, spine[i].y);
        }
        this.graphics.stroke({ width: Math.max(1.4, 2.6 * u), color: this.tint(0x8dff9b), alpha: 0.85, cap: 'round', join: 'round' });

        // Leaves unfurl once the stem has grown past their anchor
        this.leaves.forEach((leaf) => {
            if (t <= leaf.pos + 0.04) return;

            const anchor = pointAt(leaf.pos);
            const localGrow = clamp((t - leaf.pos) / 0.24, 0, 1);
            this.drawLeaf(anchor.x, anchor.y, leaf.side, leaf.length * localGrow * u, leaf.droop);
        });
    }

    private drawLeaf(x: number, y: number, side: number, length: number, droop: number) {
        if (length < 2) return;

        // Bouquet leaves fan out and gently droop downward
        const tipX = x + side * length * 0.92;
        const tipY = y + length * droop * 0.55;
        const midX = x + side * length * 0.42;
        const midY = y - length * 0.18;

        this.graphics
            .moveTo(x, y)
            .bezierCurveTo(
                x + side * length * 0.16,
                y - length * 0.2,
                midX,
                midY,
                tipX,
                tipY,
            )
            .bezierCurveTo(
                x + side * length * 0.26,
                y + length * droop * 0.42,
                x + side * length * 0.06,
                y + length * droop * 0.2,
                x,
                y,
            )
            .closePath()
            .fill({ color: this.tint(0x37c266), alpha: 0.92 });

        this.graphics
            .moveTo(x, y)
            .quadraticCurveTo(x + side * length * 0.3, y + length * 0.02, tipX, tipY)
            .stroke({ width: Math.max(1.2, 2 * this.scale), color: this.tint(0xa8f79e), alpha: 0.9, cap: 'round', join: 'round' });
    }

    /** Darken a colour for stems tucked at the back of the bouquet. */
    private tint(color: number) {
        const r = clamp(((color >> 16) & 0xff) * this.shade, 0, 255);
        const g = clamp(((color >> 8) & 0xff) * this.shade, 0, 255);
        const b = clamp((color & 0xff) * this.shade, 0, 255);

        return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
    }
}
