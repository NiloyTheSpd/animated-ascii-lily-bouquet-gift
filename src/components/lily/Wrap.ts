import { Container, Graphics } from 'pixi.js';

export interface WrapLayout {
    tieX: number;
    tieY: number;
    scale: number;
    bottomY: number;
    maxWidth: number;
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Kraft-paper cone wrap + satin ribbon bow, anchored at the bouquet tie point.
 * The paper grows downward from the tie as the bouquet is "assembled".
 */
export class Wrap {
    public readonly container = new Container();

    private readonly paper = new Graphics();
    private readonly ribbon = new Graphics();

    private layout: WrapLayout = { tieX: 0, tieY: 0, scale: 1, bottomY: 0, maxWidth: 200 };
    private progress = 0;

    constructor() {
        this.container.addChild(this.paper);
        this.container.addChild(this.ribbon);
        this.container.alpha = 0;
    }

    public reset() {
        this.progress = 0;
        this.container.alpha = 0;
    }

    public setLayout(layout: WrapLayout, resetProgress = false) {
        this.layout = layout;
        this.container.position.set(layout.tieX, layout.tieY);

        if (resetProgress) {
            this.reset();
        }
        this.draw();
    }

    public update(deltaSeconds: number, speed: number, time: number) {
        this.progress = Math.min(1, this.progress + deltaSeconds * 1.8 * speed);

        const t = 1 - Math.pow(1 - this.progress, 2.4);
        this.container.alpha = clamp(t * 1.6, 0, 1);
        this.container.scale.set(0.7 + t * 0.3);

        // The bow gives a happy little settle once the paper is on
        const bowPop = clamp((this.progress - 0.55) / 0.3, 0, 1);
        const eased = 1 - Math.pow(1 - bowPop, 3);
        this.ribbon.scale.set(0.4 + eased * 0.6 + Math.sin(time * 0.9) * 0.012);
        this.ribbon.alpha = bowPop <= 0 ? 0 : 1;
    }

    private draw() {
        const u = this.layout.scale;
        const bottomDrop = this.layout.bottomY - this.layout.tieY;

        // The paper's half-width is capped so the cone keeps a believable
        // ~1:1.6 width-to-drop ratio instead of stretching into a spike.
        const ratioCap = bottomDrop * 0.62;
        const topHalf = Math.min(this.layout.maxWidth, ratioCap, 150 * u);
        const bottomHalf = topHalf * 0.3;

        this.paper.clear();

        // Back sheet of paper (darker, slightly wider — the folded under-layer)
        this.paper
            .moveTo(-topHalf * 1.04, -6 * u)
            .quadraticCurveTo(-topHalf * 0.88, bottomDrop * 0.55, -bottomHalf * 1.18, bottomDrop)
            .lineTo(bottomHalf * 1.18, bottomDrop)
            .quadraticCurveTo(topHalf * 0.88, bottomDrop * 0.55, topHalf * 1.04, -6 * u)
            .closePath()
            .fill({ color: 0x5f4026, alpha: 1 });

        // Front sheet (lighter kraft) — tapered cone
        this.paper
            .moveTo(-topHalf * 0.92, 2 * u)
            .quadraticCurveTo(-topHalf * 0.76, bottomDrop * 0.52, -bottomHalf * 1.02, bottomDrop * 0.98)
            .lineTo(bottomHalf * 1.02, bottomDrop * 0.98)
            .quadraticCurveTo(topHalf * 0.76, bottomDrop * 0.52, topHalf * 0.92, 2 * u)
            .closePath()
            .fill({ color: 0x8a5c36, alpha: 1 });

        // Diagonal fold sheen on the front sheet
        this.paper
            .moveTo(-topHalf * 0.92, 2 * u)
            .quadraticCurveTo(-topHalf * 0.44, bottomDrop * 0.3, -bottomHalf * 0.6, bottomDrop * 0.96)
            .lineTo(-bottomHalf * 0.18, bottomDrop * 0.96)
            .quadraticCurveTo(-topHalf * 0.24, bottomDrop * 0.34, -topHalf * 0.56, 2 * u)
            .closePath()
            .fill({ color: 0xa06c40, alpha: 0.75 });

        // Vertical crease strokes for a hand-wrapped feel
        for (let i = -2; i <= 2; i += 1) {
            const off = (i / 2.4) * topHalf * 0.78;
            this.paper
                .moveTo(off * 0.9, 4 * u)
                .quadraticCurveTo(off * 0.68, bottomDrop * 0.5, off * 0.42, bottomDrop * 0.94)
                .stroke({ width: 1.6 * u, color: 0x4a3018, alpha: 0.4, cap: 'round' });
        }

        // Paper rim highlight
        this.paper
            .moveTo(-topHalf * 0.92, 2 * u)
            .quadraticCurveTo(0, 10 * u, topHalf * 0.92, 2 * u)
            .stroke({ width: 2.4 * u, color: 0xc08a52, alpha: 0.9, cap: 'round' });

        // Ribbon tails peeking below the knot
        this.ribbon.clear();

        this.ribbon
            .moveTo(-7 * u, 4 * u)
            .quadraticCurveTo(-20 * u, 34 * u, -9 * u, 64 * u)
            .lineTo(-1 * u, 62 * u)
            .quadraticCurveTo(-10 * u, 30 * u, 1 * u, 5 * u)
            .closePath()
            .fill({ color: 0xd84368, alpha: 1 });

        this.ribbon
            .moveTo(7 * u, 4 * u)
            .quadraticCurveTo(22 * u, 38 * u, 11 * u, 70 * u)
            .lineTo(3 * u, 69 * u)
            .quadraticCurveTo(11 * u, 32 * u, -1 * u, 5 * u)
            .closePath()
            .fill({ color: 0xc2154b, alpha: 1 });

        // Bow loops — two tilted ellipses meeting at the knot (bright tones
        // survive the ASCII luminance quantisation as dense +/= glyphs)
        this.ribbon.ellipse(-25 * u, -7 * u, 27 * u, 14 * u).fill({ color: 0xe8557f, alpha: 1 });
        this.ribbon.ellipse(25 * u, -7 * u, 27 * u, 14 * u).fill({ color: 0xf06a92, alpha: 1 });
        this.ribbon.ellipse(-25 * u, -7 * u, 27 * u, 14 * u).stroke({ width: 2 * u, color: 0xb3123e, alpha: 0.9 });
        this.ribbon.ellipse(25 * u, -7 * u, 27 * u, 14 * u).stroke({ width: 2 * u, color: 0xb3123e, alpha: 0.9 });
        this.ribbon.ellipse(-27 * u, -10 * u, 12 * u, 6 * u).fill({ color: 0xff9eb8, alpha: 0.9 });
        this.ribbon.ellipse(23 * u, -10 * u, 12 * u, 6 * u).fill({ color: 0xff9eb8, alpha: 0.9 });

        // Knot
        this.ribbon.circle(0, 0, 10.5 * u).fill({ color: 0xf27ba0, alpha: 1 });
        this.ribbon.circle(-3 * u, -3 * u, 3.8 * u).fill({ color: 0xffd3e0, alpha: 0.9 });
    }
}
