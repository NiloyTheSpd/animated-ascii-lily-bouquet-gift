import { Container, Graphics } from 'pixi.js';

interface LilyOptions {
    x: number;
    y: number;
    color: number;
    baseScale: number;
    delay: number;
    /** 0 = tucked at the back of the bouquet, 1 = front bloom (drives shading) */
    depth?: number;
}

interface PetalData {
    graphic: Graphics;
    baseRotation: number;
    openRotation: number;
    swayOffset: number;
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

export class Lily {
    public readonly container = new Container();

    private readonly shadow = new Graphics();
    private readonly center = new Graphics();
    private readonly stamenLayer = new Graphics();
    private readonly petals: PetalData[] = [];
    private readonly options: LilyOptions;

    private age = 0;
    private bloom = 0;
    private readonly tilt = (Math.random() - 0.5) * 0.85;
    private readonly depth: number;

    constructor(options: LilyOptions) {
        this.options = options;
        this.depth = options.depth ?? 1;

        this.container.position.set(options.x, options.y);
        this.container.scale.set(0.06);
        this.container.rotation = this.tilt;
        this.container.alpha = 0;

        this.build();
    }

    public reset(x?: number, y?: number) {
        this.age = 0;
        this.bloom = 0;
        this.container.scale.set(0.06);
        this.container.alpha = 0;
        this.container.rotation = this.tilt;

        if (typeof x === 'number') this.container.x = x;
        if (typeof y === 'number') this.container.y = y;
    }

    public update(time: number, deltaSeconds: number, speed: number, reducedMotion = false) {
        if (reducedMotion) {
            this.bloom = 1;
            this.container.alpha = 1;
            this.container.scale.set(this.options.baseScale);
            this.petals.forEach((petal) => {
                petal.graphic.rotation = petal.openRotation;
                petal.graphic.scale.y = 1;
                petal.graphic.alpha = 1;
            });
            return;
        }

        this.age += deltaSeconds * speed;
        const phase = clamp((this.age - this.options.delay) / 1.3, 0, 1);
        this.bloom = 1 - Math.pow(1 - phase, 3);

        const pulse = 1 + Math.sin(time * 0.8 + this.tilt * 10) * 0.016;
        this.container.alpha = this.bloom;
        this.container.scale.set((0.05 + this.bloom * 0.95) * this.options.baseScale * pulse);
        this.container.rotation = this.tilt + Math.sin(time * 0.35 + this.tilt) * 0.02;

        // Back blooms sit slightly dimmer so the dome reads with depth
        this.shadow.alpha = this.bloom * (0.85 - this.depth * 0.3);

        this.petals.forEach((petal, index) => {
            const stagger = clamp((this.bloom - index * 0.035) / 0.9, 0, 1);
            // ease-out-back: each petal reflexes slightly past open, then settles
            const petalEase = 1 + 1.9 * Math.pow(stagger - 1, 3) + 0.9 * Math.pow(stagger - 1, 2);
            const living = Math.sin(time * 0.8 + petal.swayOffset) * 0.04;
            const shimmer = 0.94 + (Math.sin(time * 1.15 + petal.swayOffset * 1.7) * 0.5 + 0.5) * 0.06;

            petal.graphic.rotation = petal.baseRotation + (petal.openRotation - petal.baseRotation) * petalEase + living;
            petal.graphic.scale.y = 0.2 + Math.max(0, petalEase) * 0.8;
            petal.graphic.alpha = shimmer;
        });

        this.center.scale.set(0.75 + this.bloom * 0.25);
        this.stamenLayer.alpha = 1.0;
    }

    private build() {
        this.drawShadow();

        const petalCount = 6;

        for (let i = 0; i < petalCount; i += 1) {
            const petal = new Graphics();
            const outer = i % 2 === 0;
            const length = (outer ? 172 : 140) + Math.random() * 18;
            const width = (outer ? 64 : 52) + Math.random() * 11;
            const rotation = (Math.PI * 2 * i) / petalCount;

            this.drawPetal(petal, length, width, outer ? this.shaded(this.options.color) : this.shaded(this.shiftColor(this.options.color, -0.1)), outer);
            const baseRotation = rotation + (outer ? 0.75 : 0.5);
            const openRotation = rotation + (Math.random() - 0.5) * 0.18;

            petal.rotation = baseRotation;
            petal.alpha = 0;
            petal.scale.y = 0.1;

            this.petals.push({
                graphic: petal,
                baseRotation,
                openRotation,
                swayOffset: Math.random() * Math.PI * 2,
            });

            this.container.addChild(petal);
        }

        this.drawCenter();
        this.drawStamens();

        this.container.addChild(this.center);
        this.container.addChild(this.stamenLayer);
    }

    /**
     * A dreamy colored aura in the bloom's own hue, wrapped around a dark
     * separation halo so overlapping heads stay readable inside the cluster.
     */
    private drawShadow() {
        this.shadow.clear();
        const radius = 130;
        this.shadow.circle(0, 0, radius * 1.14).fill({ color: this.options.color, alpha: 0.05 });
        this.shadow.circle(0, 0, radius * 0.94).fill({ color: this.options.color, alpha: 0.055 });
        this.shadow.circle(0, 0, radius).fill({ color: 0x000000, alpha: 0.15 });
        this.shadow.circle(0, 0, radius * 0.74).fill({ color: 0x000000, alpha: 0.15 });
        this.shadow.circle(0, 0, radius * 0.5).fill({ color: 0x000000, alpha: 0.15 });
        this.container.addChild(this.shadow);
    }

    private drawPetal(graphic: Graphics, length: number, width: number, color: number, _outer: boolean) {
        const tipGlow = this.shiftColor(color, 0.24);
        const spotColor = this.shiftColor(color, -0.38);
        const rimColor = this.shiftColor(color, -0.3);

        graphic.clear();

        graphic
            .moveTo(0, 0)
            .bezierCurveTo(
                -width * 0.96,
                -length * 0.22,
                -width * 0.55,
                -length * 0.8,
                0,
                -length,
            )
            .bezierCurveTo(
                width * 0.55,
                -length * 0.8,
                width * 0.96,
                -length * 0.22,
                0,
                0,
            )
            .closePath()
            .fill({ color, alpha: 1.0 });

        graphic
            .moveTo(0, -length * 0.52)
            .bezierCurveTo(
                -width * 0.12,
                -length * 0.74,
                -width * 0.04,
                -length * 0.9,
                0,
                -length * 0.98,
            )
            .bezierCurveTo(
                width * 0.04,
                -length * 0.9,
                width * 0.12,
                -length * 0.74,
                0,
                -length * 0.52,
            )
            .closePath()
            .fill({ color: tipGlow, alpha: 1.0 });

        graphic
            .moveTo(0, -4)
            .quadraticCurveTo(-width * 0.06, -length * 0.34, 0, -length * 0.96)
            .stroke({ width: 4.5, color: 0x4e120f, alpha: 1.0, cap: 'round', join: 'round' });

        graphic
            .moveTo(0, -2)
            .quadraticCurveTo(width * 0.05, -length * 0.38, 0, -length * 0.92)
            .stroke({ width: 2.6, color: 0xfff6df, alpha: 1.0, cap: 'round', join: 'round' });

        // Dark silhouette rim keeps overlapping petals readable
        graphic
            .moveTo(0, 0)
            .bezierCurveTo(
                -width * 0.96,
                -length * 0.22,
                -width * 0.55,
                -length * 0.8,
                0,
                -length,
            )
            .bezierCurveTo(
                width * 0.55,
                -length * 0.8,
                width * 0.96,
                -length * 0.22,
                0,
                0,
            )
            .closePath()
            .stroke({ width: 3, color: rimColor, alpha: 0.9, cap: 'round', join: 'round' });

        // Bold speckles clustered toward the throat, like a real stargazer
        for (let i = 0; i < 18; i += 1) {
            const sx = (Math.random() - 0.5) * width * 0.72;
            const sy = -length * (0.14 + Math.random() * 0.4);
            const radius = 2 + Math.random() * 2.6;

            graphic.circle(sx, sy, radius).fill({ color: spotColor, alpha: 1.0 });
        }
    }

    private drawCenter() {
        this.center.clear();
        this.center.circle(0, 0, 14).fill({ color: this.shaded(0x96b344), alpha: 1.0 });
        this.center.circle(0, 0, 7.5).fill({ color: this.shaded(0x506818), alpha: 1.0 });
    }

    private drawStamens() {
        this.stamenLayer.clear();

        const count = 8;
        for (let i = 0; i < count; i += 1) {
            const angle = -Math.PI * 0.45 + (i / (count - 1)) * Math.PI * 0.9 + (Math.random() - 0.5) * 0.18;
            const length = 48 + Math.random() * 26;
            const tipX = Math.cos(angle) * length;
            const tipY = Math.sin(angle) * length - 14;

            this.stamenLayer
                .moveTo(0, 0)
                .quadraticCurveTo(tipX * 0.32, tipY * 0.4 - 12, tipX, tipY)
                .stroke({ width: 3.4, color: this.shaded(0xf8e7a4), alpha: 1.0, cap: 'round', join: 'round' });

            this.stamenLayer.ellipse(tipX, tipY, 6.5, 4.5).fill({ color: this.shaded(0x6b2b1a), alpha: 1.0 });
            this.stamenLayer.ellipse(tipX, tipY, 3.2, 2.4).fill({ color: this.shaded(0xd08b57), alpha: 1.0 });
        }
    }

    /**
     * Shade the palette for blooms tucked toward the back of the dome, then
     * lift any fill that is too dark to survive ASCII quantization into a
     * dense glyph band (= / + / # / @) so every bloom reads lush and solid.
     */
    private shaded(color: number) {
        const amount = 0.68 + this.depth * 0.32;
        const shifted = this.shiftColor(color, amount - 1);
        const lum = this.luminance(shifted);
        const floor = 0.52 + this.depth * 0.16;

        if (lum < floor) {
            return this.shiftColor(shifted, floor / Math.max(lum, 0.01) - 1);
        }

        return shifted;
    }

    private luminance(color: number) {
        return (((color >> 16) & 0xff) * 0.299 + ((color >> 8) & 0xff) * 0.587 + (color & 0xff) * 0.114) / 255;
    }

    private shiftColor(color: number, amount: number) {
        const r = clamp(((color >> 16) & 0xff) * (1 + amount), 0, 255);
        const g = clamp(((color >> 8) & 0xff) * (1 + amount), 0, 255);
        const b = clamp((color & 0xff) * (1 + amount), 0, 255);

        return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
    }
}
