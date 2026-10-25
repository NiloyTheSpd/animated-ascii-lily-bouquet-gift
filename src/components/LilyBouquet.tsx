'use client';

import { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Rectangle } from 'pixi.js';
import { Lily } from './lily/Lily';
import { Stem } from './lily/Stem';
import { Wrap } from './lily/Wrap';
import { AsciiFilter } from './lily/AsciiFilter';

type FlowerConfig = {
  x: number;
  y: number;
  color: number;
  scale: number;
  depth: number;
};

type GreeneryConfig = {
  x: number;
  y: number;
  leafBoost: number;
  shade: number;
};

/**
 * Twenty-one lush lilies packed into one tight, overlapping dome — the bloom
 * cluster of a hand-tied bouquet. Higher on screen = further back (z-sorted at build).
 */
const FLOWERS: FlowerConfig[] = [
  { x: 0.5, y: 0.397, color: 0xf6efe1, scale: 1.08, depth: 1.0 },
  { x: 0.425, y: 0.333, color: 0xd8162e, scale: 0.88, depth: 0.62 },
  { x: 0.575, y: 0.333, color: 0xf3dfcf, scale: 0.88, depth: 0.62 },
  { x: 0.442, y: 0.459, color: 0xf7f2dd, scale: 0.9, depth: 0.86 },
  { x: 0.558, y: 0.459, color: 0xe89bc4, scale: 0.9, depth: 0.86 },
  { x: 0.5, y: 0.273, color: 0xdd7ad9, scale: 0.76, depth: 0.5 },
  { x: 0.36, y: 0.4, color: 0xd0b246, scale: 0.82, depth: 0.7 },
  { x: 0.64, y: 0.4, color: 0x84263d, scale: 0.82, depth: 0.7 },
  { x: 0.402, y: 0.527, color: 0xdfd932, scale: 0.84, depth: 0.95 },
  { x: 0.598, y: 0.527, color: 0x7d0b12, scale: 0.84, depth: 0.95 },
  { x: 0.455, y: 0.569, color: 0xf3cfd7, scale: 0.82, depth: 1.0 },
  { x: 0.545, y: 0.569, color: 0xd8162e, scale: 0.82, depth: 1.0 },
  { x: 0.316, y: 0.465, color: 0xe89bc4, scale: 0.78, depth: 0.6 },
  { x: 0.684, y: 0.465, color: 0xd8162e, scale: 0.78, depth: 0.6 },
  { x: 0.434, y: 0.602, color: 0xf6efe1, scale: 0.78, depth: 1.0 },
  { x: 0.566, y: 0.602, color: 0xd0b246, scale: 0.78, depth: 1.0 },
  { x: 0.5, y: 0.612, color: 0xe0556f, scale: 0.82, depth: 1.0 },
  { x: 0.528, y: 0.43, color: 0xf3cfd7, scale: 0.66, depth: 0.9 },
  { x: 0.368, y: 0.3, color: 0xf3cfd7, scale: 0.7, depth: 0.5 },
  { x: 0.632, y: 0.3, color: 0xf6d4a0, scale: 0.7, depth: 0.5 },
  { x: 0.5, y: 0.195, color: 0xff9eb8, scale: 0.68, depth: 0.42 },
];

/** Leafy fillers peeking out around the dome — no flowers, just greens. */
const GREENERY: GreeneryConfig[] = [
  { x: 0.3, y: 0.34, leafBoost: 1.7, shade: 0.6 },
  { x: 0.7, y: 0.34, leafBoost: 1.7, shade: 0.6 },
  { x: 0.382, y: 0.245, leafBoost: 1.35, shade: 0.52 },
  { x: 0.618, y: 0.245, leafBoost: 1.35, shade: 0.52 },
  { x: 0.5, y: 0.178, leafBoost: 1.2, shade: 0.46 },
  { x: 0.27, y: 0.42, leafBoost: 1.5, shade: 0.55 },
  { x: 0.73, y: 0.42, leafBoost: 1.5, shade: 0.55 },
];

/**
 * Bloom choreography: the front / lowest flowers open first and the cascade
 * rises up the dome, like a bouquet waking up. Rank 0 = front-most.
 */
const BLOOM_RANK = new Map<FlowerConfig, number>(
  [...FLOWERS].sort((a, b) => b.y - a.y).map((config, index) => [config, index]),
);
const FLOWER_STEM_DELAY = (config: FlowerConfig) => 0.05 + (BLOOM_RANK.get(config) ?? 0) * 0.045;
const LILY_DELAY = (config: FlowerConfig) => 0.18 + (BLOOM_RANK.get(config) ?? 0) * 0.045;

const ASCII_CELL_SIZE = 4;
const COLOR_BOOST = 1.25;

/**
 * The shader compares `uCellSize` against the render target's *device* pixels,
 * so a raw CSS-px constant would shrink the glyphs on high-DPR phones
 * (a 4px cell becomes 1.33 CSS px at DPR 3). Scaling by the pixel ratio keeps
 * every glyph the same physical size on every screen.
 */
function asciiCellSize(dpr: number, portrait: boolean) {
  const base = ASCII_CELL_SIZE * dpr;
  // Phones get slightly larger cells: at small physical sizes the finer
  // desktop grid turns the bloom into visual noise.
  return portrait ? base * 1.15 : base;
}

/**
 * The renderer's effective pixel ratio. Pixi caps `resolution` at 2, so on a
 * 3x phone the canvas backing store is 2x CSS pixels — not 3x. The ASCII
 * cell must be scaled by this value to stay physically consistent.
 */
function renderRatio(resolution: number) {
  return resolution || 1;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function LilyBouquet() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [restartSeed, setRestartSeed] = useState(0);
  const [initError, setInitError] = useState<string | null>(null);

  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    let disposed = false;
    let app: Application | null = null;
    let cleanup = () => {};

    const start = async () => {
      try {
        setInitError(null);

        const pixi = new Application();
        await pixi.init({
          resizeTo: host,
          background: '#000000',
          antialias: true,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          preference: 'webgl',
          powerPreference: 'high-performance',
        });

        if (disposed) {
          pixi.destroy(true, { children: true, texture: true });
          return;
        }

        app = pixi;
        pixi.canvas.style.width = '100%';
        pixi.canvas.style.height = '100%';
        pixi.canvas.style.display = 'block';
        host.appendChild(pixi.canvas);

      const world = new Container();
      const starLayer = new Graphics();
      const constellationLayer = new Graphics();
      const meteorLayer = new Graphics();
      const heartsLayer = new Graphics();
      const particlesLayer = new Graphics();
      const bouquet = new Container();
      const sparkleLayer = new Graphics();
      const asciiFilter = new AsciiFilter(ASCII_CELL_SIZE, COLOR_BOOST);
      asciiFilter.resolutionUniform = [pixi.screen.width, pixi.screen.height];

      // Keep the glyph grid at a constant physical size across DPRs.
      // Invoked after `measure` is defined (see buildBouquet).
      const applyCellSize = () => {
        const portrait = pixi.screen.height > pixi.screen.width;
        asciiFilter.cellSize = asciiCellSize(renderRatio(pixi.renderer.resolution), portrait);
      };

      world.addChild(starLayer);
      world.addChild(constellationLayer);
      world.addChild(meteorLayer);
      world.addChild(heartsLayer);
      world.addChild(particlesLayer);
      world.addChild(bouquet);
      world.addChild(sparkleLayer);
      world.filters = [asciiFilter];
      world.filterArea = new Rectangle(0, 0, pixi.screen.width, pixi.screen.height);
      pixi.stage.addChild(world);

      const stems: Stem[] = [];
      const greenery: Stem[] = [];
      const lilies: Lily[] = [];
      const wrap = new Wrap();
      const elapsed = { value: 0 };

      // Soft rose-and-white glow motes rising around the bouquet
      const particleColors = [0xffffff, 0xffc9d8, 0xffe3ec];
      const particles = Array.from({ length: 90 }, () => ({
        x: Math.random(),
        y: Math.random(),
        size: 0.5 + Math.random() * 1.4,
        drift: 0.008 + Math.random() * 0.028,
        twinkle: Math.random() * Math.PI * 2,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
      }));

      const pickColor = (list: number[]) => list[Math.floor(Math.random() * list.length)];

      // Romantic starry sky behind everything — the ASCII filter turns these
      // into tiny twinkling glyphs, just like a embroidered night sky
      const starColors = [0xffffff, 0xffe9f2, 0xffd9e6, 0xfff3d6];
      const stars = Array.from({ length: 150 }, () => ({
        x: Math.random(),
        y: Math.random(),
        size: 0.4 + Math.random() * 1.3,
        rate: 0.5 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        color: pickColor(starColors),
      }));

      // A few large slowly-pulsing four-point stars (like the reference art)
      const bigStars = Array.from({ length: 6 }, () => ({
        x: Math.random(),
        y: Math.random() * 0.62,
        size: 5 + Math.random() * 7,
        phase: Math.random() * Math.PI * 2,
        color: pickColor([0xffffff, 0xfff0c8, 0xffd9e6]),
      }));

      // Little hearts drifting up around the bouquet
      const hearts = Array.from({ length: 8 }, () => ({
        x: 0.18 + Math.random() * 0.64,
        y: Math.random(),
        size: 10 + Math.random() * 8,
        rise: 0.012 + Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2,
        color: pickColor([0xffa8c4, 0xff8fb0, 0xffc2d4]),
      }));

      // Twinkling sparks that pop in and out over the blooms
      const sparkles = Array.from({ length: 26 }, () => ({
        flower: Math.floor(Math.random() * FLOWERS.length),
        ox: (Math.random() - 0.5) * 130,
        oy: (Math.random() - 0.5) * 120,
        size: 2.5 + Math.random() * 4.5,
        life: Math.random(),
        rate: 0.25 + Math.random() * 0.55,
        color: pickColor([0xffffff, 0xffe2ec, 0xfff0b8]),
      }));

      const drawStar4 = (g: Graphics, x: number, y: number, s: number, color: number, alpha: number) => {
        const k = s * 0.24;
        g.poly([x, y - s, x + k, y - k, x + s, y, x + k, y + k, x, y + s, x - k, y + k, x - s, y, x - k, y - k])
          .fill({ color, alpha });
      };

      const drawPlus = (g: Graphics, x: number, y: number, s: number, color: number, alpha: number) => {
        g.rect(x - s * 0.18, y - s, s * 0.36, s * 2).fill({ color, alpha });
        g.rect(x - s, y - s * 0.18, s * 2, s * 0.36).fill({ color, alpha });
      };

      const drawHeart = (g: Graphics, x: number, y: number, s: number, color: number, alpha: number) => {
        g.moveTo(x, y + s * 0.9)
          .bezierCurveTo(x - s * 1.2, y + s * 0.1, x - s * 0.7, y - s * 0.9, x, y - s * 0.3)
          .bezierCurveTo(x + s * 0.7, y - s * 0.9, x + s * 1.2, y + s * 0.1, x, y + s * 0.9)
          .fill({ color, alpha });
      };

      // A heart drawn in stars — the signature of the night sky
      const HEART_POINTS = Array.from({ length: 12 }, (_, i) => {
        const t = (i / 12) * Math.PI * 2;
        return {
          x: (16 * Math.pow(Math.sin(t), 3)) / 115,
          y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 115,
        };
      });

      // Occasional shooting stars — an event, not a loop
      type Meteor = { x: number; y: number; vx: number; vy: number; life: number; ttl: number };
      const meteors: Meteor[] = [];
      let meteorCountdown = 2.4;

      bouquet.addChild(wrap.container);

      /** Geometry of the bouquet for the current screen size. */
      const measure = () => {
        const w = pixi.screen.width;
        const h = pixi.screen.height;
        const u = clamp(Math.min(w / 860, h / 720), 0.5, 1.15);

        return {
          w,
          h,
          u,
          tieX: w * 0.5,
          tieY: h * 0.82,
          domeWidth: Math.min(w * 0.84, h * 1.1),
          // The dome scales inside a bounded box so portrait screens keep a
          // compact, round bouquet instead of a stretched column.
          domeCenterY: h * 0.4,
          domeHeight: Math.min(h * 0.56, w * 1.15),
        };
      };

      const flowerPos = (config: FlowerConfig, m: ReturnType<typeof measure>) => ({
        x: m.tieX + (config.x - 0.5) * m.domeWidth,
        y: m.domeCenterY + (config.y - 0.4) * m.domeHeight,
      });

      const greeneryPos = (config: GreeneryConfig, m: ReturnType<typeof measure>) => ({
        x: m.tieX + (config.x - 0.5) * m.domeWidth,
        y: m.domeCenterY + (config.y - 0.4) * m.domeHeight,
      });

      const buildBouquet = () => {
        lilies.forEach((lily) => lily.container.destroy({ children: true }));
        stems.forEach((stem) => stem.graphics.destroy());
        greenery.forEach((stem) => stem.graphics.destroy());

        lilies.length = 0;
        stems.length = 0;
        greenery.length = 0;
        bouquet.removeChildren();
        bouquet.addChild(wrap.container);

        const m = measure();
        applyCellSize();

        // Greens first (furthest back), then flower stems, then blooms, then wrap
        GREENERY.forEach((config) => {
          const pos = greeneryPos(config, m);
          const stem = new Stem({ shade: config.shade, leafBoost: config.leafBoost, arcStrength: 0.2, growRate: 1.1 });
          stem.setLayout({
            tieX: m.tieX,
            tieY: m.tieY,
            flowerX: pos.x,
            flowerY: pos.y,
            scale: m.u,
          }, true);
          greenery.push(stem);
          bouquet.addChild(stem.graphics);
        });

        FLOWERS.forEach((config) => {
          const pos = flowerPos(config, m);
          const stem = new Stem({ shade: 0.82 + config.depth * 0.18, arcStrength: 0.16 + config.depth * 0.16, growRate: 1.3 });
          stem.setLayout({
            tieX: m.tieX,
            tieY: m.tieY,
            flowerX: pos.x,
            flowerY: pos.y,
            scale: m.u,
          }, true);
          stems.push(stem);
          bouquet.addChild(stem.graphics);
        });

        [...FLOWERS].sort((a, b) => a.y - b.y).forEach((config) => {
          const pos = flowerPos(config, m);
          const lily = new Lily({
            x: pos.x,
            y: pos.y,
            color: config.color,
            // keeps neighbouring heads lush and overlapping without mush
            baseScale: config.scale * 0.72 * m.u,
            delay: LILY_DELAY(config),
            depth: config.depth,
          });
          lilies.push(lily);
          bouquet.addChild(lily.container);
        });

        wrap.setLayout({
          tieX: m.tieX,
          tieY: m.tieY,
          scale: m.u,
          bottomY: m.h * 1.05,
          maxWidth: m.w * 0.2,
        }, true);
      };

      const restart = () => {
        elapsed.value = 0;
        const m = measure();

        greenery.forEach((stem, index) => {
          const config = GREENERY[index];
          const pos = greeneryPos(config, m);
          stem.setLayout({ tieX: m.tieX, tieY: m.tieY, flowerX: pos.x, flowerY: pos.y, scale: m.u }, true);
          stem.reset(index * 0.03);
        });

        stems.forEach((stem, index) => {
          const config = FLOWERS[index];
          const pos = flowerPos(config, m);
          stem.setLayout({ tieX: m.tieX, tieY: m.tieY, flowerX: pos.x, flowerY: pos.y, scale: m.u }, true);
          stem.reset(FLOWER_STEM_DELAY(config));
        });

        lilies.forEach((lily, index) => {
          const config = [...FLOWERS].sort((a, b) => a.y - b.y)[index];
          const pos = flowerPos(config, m);
          lily.reset(pos.x, pos.y);
        });

        wrap.reset();
      };

      buildBouquet();
      restart();


      // Reduced motion: render the settled end state immediately (Hallmark floor:
      // content is visible with motion off — no half-grown stems or missing wrap)
      if (reducedMotion) {
        greenery.forEach((stem) => stem.update(4, 1));
        stems.forEach((stem) => stem.update(4, 1));
        wrap.update(3, 1, 0);
      }

      const onResize = () => {
        world.filterArea = new Rectangle(0, 0, pixi.screen.width, pixi.screen.height);
        asciiFilter.resolutionUniform = [pixi.screen.width, pixi.screen.height];

        const m = measure();
        // Orientation can flip between portrait and landscape, which changes
        // the cell size and the dome shape.
        applyCellSize();

        greenery.forEach((stem, index) => {
          const config = GREENERY[index];
          const pos = greeneryPos(config, m);
          stem.setLayout({ tieX: m.tieX, tieY: m.tieY, flowerX: pos.x, flowerY: pos.y, scale: m.u });
        });

        stems.forEach((stem, index) => {
          const config = FLOWERS[index];
          const pos = flowerPos(config, m);
          stem.setLayout({ tieX: m.tieX, tieY: m.tieY, flowerX: pos.x, flowerY: pos.y, scale: m.u });
        });

        lilies.forEach((lily, index) => {
          const config = [...FLOWERS].sort((a, b) => a.y - b.y)[index];
          const pos = flowerPos(config, m);
          lily.container.position.set(pos.x, pos.y);
        });

        wrap.setLayout({
          tieX: m.tieX,
          tieY: m.tieY,
          scale: m.u,
          bottomY: m.h * 1.05,
          maxWidth: m.w * 0.2,
        });
      };

      const update = (ticker: { deltaMS: number }) => {
        if (!app) return;

        const deltaSeconds = ticker.deltaMS / 1000;
        const speedValue = reducedMotion ? 0 : 1;

        elapsed.value += deltaSeconds * Math.max(0.001, speedValue);
        const motion = reducedMotion ? 0 : 1;

        // twinkling starfield
        starLayer.clear();
        for (const star of stars) {
          const tw = Math.sin(elapsed.value * star.rate + star.phase) * 0.5 + 0.5;
          starLayer
            .circle(star.x * pixi.screen.width, star.y * pixi.screen.height, star.size)
            .fill({ color: star.color, alpha: 0.18 + tw * 0.62 });
        }

        // a heart drawn in stars, fading in once the bouquet is up
        constellationLayer.clear();
        const appearRaw = clamp((elapsed.value - 2.1) / 1.7, 0, 1);
        const appear = reducedMotion ? 1 : appearRaw * appearRaw * (3 - 2 * appearRaw);
        if (appear > 0.01) {
          const aspect = Math.min(1, (pixi.screen.width / pixi.screen.height) * 1.4);
          const cx = 0.155 * pixi.screen.width;
          const cy = 0.27 * pixi.screen.height;
          const pts = HEART_POINTS.map((p) => ({
            x: cx + p.x * aspect * pixi.screen.width,
            y: cy + p.y * pixi.screen.height,
          }));

          constellationLayer.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i <= pts.length; i += 1) {
            constellationLayer.lineTo(pts[i % pts.length].x, pts[i % pts.length].y);
          }
          constellationLayer.stroke({ width: 1.5, color: 0xffd3e0, alpha: 0.3 * appear, cap: 'round', join: 'round' });

          pts.forEach((p, i) => {
            const tw = 0.72 + (Math.sin(elapsed.value * (1.1 + (i % 4) * 0.35) + i * 1.7) * 0.5 + 0.5) * 0.28;
            constellationLayer
              .circle(p.x, p.y, i === 6 ? 3.4 : 2.7)
              .fill({ color: 0xfff3f8, alpha: appear * tw });
          });
        }

        // shooting stars: rare bright streaks across the upper sky
        meteorLayer.clear();
        if (!reducedMotion) {
          meteorCountdown -= deltaSeconds;
          if (meteorCountdown <= 0 && meteors.length < 2) {
            const dir = Math.random() > 0.5 ? 1 : -1;
            const speed = 0.26 + Math.random() * 0.18;
            const angle = 0.3 + Math.random() * 0.22;
            meteors.push({
              x: 0.18 + Math.random() * 0.64,
              y: 0.04 + Math.random() * 0.2,
              vx: Math.cos(angle) * speed * dir,
              vy: Math.sin(angle) * speed,
              life: 0,
              ttl: 1.6 + Math.random() * 0.8,
            });
            meteorCountdown = 3.5 + Math.random() * 3;
          }

          for (let i = meteors.length - 1; i >= 0; i -= 1) {
            const meteor = meteors[i];
            meteor.life += deltaSeconds;
            if (meteor.life > meteor.ttl) {
              meteors.splice(i, 1);
              continue;
            }
            meteor.x += meteor.vx * deltaSeconds;
            meteor.y += meteor.vy * deltaSeconds;

            const envelope = 0.3 + Math.sin(Math.PI * (meteor.life / meteor.ttl)) * 0.7;
            const headX = meteor.x * pixi.screen.width;
            const headY = meteor.y * pixi.screen.height;

            for (let k = 0; k < 12; k += 1) {
              const back = k / 12;
              meteorLayer
                .circle(
                  headX - meteor.vx * back * 0.14 * pixi.screen.width,
                  headY - meteor.vy * back * 0.14 * pixi.screen.height,
                  k === 0 ? 3 : Math.max(0.9, 2.4 - k * 0.16),
                )
                .fill({ color: k < 3 ? 0xffffff : 0xffe4ae, alpha: envelope * Math.pow(1 - back, 1.35) });
            }

            drawStar4(meteorLayer, headX, headY, 5.5, 0xffffff, envelope);
          }
        }

        // rising hearts with a gentle sway (frozen when motion is reduced)
        heartsLayer.clear();
        if (motion > 0) {
          for (const heart of hearts) {
            heart.y -= heart.rise * deltaSeconds * motion;
            if (heart.y < -0.06) {
              heart.y = 1.06;
              heart.x = 0.18 + Math.random() * 0.64;
            }
            const sway = Math.sin(elapsed.value * 0.9 + heart.phase) * 14;
            const pulse = 0.8 + (Math.sin(elapsed.value * 1.6 + heart.phase) * 0.5 + 0.5) * 0.3;
            drawHeart(
              heartsLayer,
              heart.x * pixi.screen.width + sway,
              heart.y * pixi.screen.height,
              heart.size * pulse,
              heart.color,
              0.9,
            );
          }
        }

        particlesLayer.clear();
        for (const particle of particles) {
          particle.y -= particle.drift * deltaSeconds * (28 + particle.size * 10) * motion;
          if (particle.y < -0.03) {
            particle.y = 1.03;
            particle.x = Math.random();
          }

          const alpha = 0.16 + (Math.sin(elapsed.value * 1.3 + particle.twinkle) * 0.5 + 0.5) * 0.42;
          particlesLayer
            .circle(particle.x * pixi.screen.width, particle.y * pixi.screen.height, particle.size)
            .fill({ color: particle.color, alpha });
        }

        // large pulsing four-point stars + sparks popping over the blooms
        sparkleLayer.clear();
        for (const big of bigStars) {
          const pulse = 0.7 + (Math.sin(elapsed.value * 1.1 + big.phase) * 0.5 + 0.5) * 0.5;
          drawStar4(
            sparkleLayer,
            big.x * pixi.screen.width,
            big.y * pixi.screen.height,
            big.size * pulse,
            big.color,
            0.85,
          );
        }

        for (const sparkle of sparkles) {
          sparkle.life += deltaSeconds * sparkle.rate * motion;
          if (sparkle.life > 1) {
            sparkle.life = 0;
            sparkle.flower = Math.floor(Math.random() * FLOWERS.length);
            sparkle.ox = (Math.random() - 0.5) * 130;
            sparkle.oy = (Math.random() - 0.5) * 120;
          }
          const host = lilies[sparkle.flower];
          if (!host) continue;
          const fade = Math.sin(Math.PI * Math.min(sparkle.life, 1));
          drawPlus(
            sparkleLayer,
            host.container.x + sparkle.ox,
            host.container.y + sparkle.oy,
            sparkle.size * (0.6 + fade * 0.8),
            sparkle.color,
            0.15 + fade * 0.8,
          );
        }

        greenery.forEach((stem) => stem.update(deltaSeconds, speedValue));
        stems.forEach((stem) => stem.update(deltaSeconds, speedValue));
        lilies.forEach((lily) => lily.update(elapsed.value, deltaSeconds, speedValue, reducedMotion));
        wrap.update(deltaSeconds, speedValue, elapsed.value);
      };

      pixi.canvas.addEventListener('click', restart);
      pixi.renderer.on('resize', onResize);
      pixi.ticker.add(update);

        cleanup = () => {
          pixi.ticker.remove(update);
          pixi.renderer.off('resize', onResize);
          pixi.canvas.removeEventListener('click', restart);
          if (pixi.canvas.parentNode === host) {
            host.removeChild(pixi.canvas);
          }
          pixi.destroy(true, { children: true, texture: true });
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown Pixi initialization error';
        setInitError(message);
      }
    };

    start();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [reducedMotion, restartSeed]);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="nebula-a absolute -inset-[12%] bg-[radial-gradient(circle_at_28%_30%,rgba(150,60,120,0.15),transparent_54%)]" />
        <div className="nebula-b absolute -inset-[12%] bg-[radial-gradient(circle_at_74%_16%,rgba(96,54,150,0.13),transparent_50%),radial-gradient(circle_at_56%_84%,rgba(200,70,110,0.11),transparent_46%)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(190,60,110,0.18),transparent_42%),radial-gradient(circle_at_50%_108%,rgba(50,130,75,0.13),transparent_32%),radial-gradient(circle_at_16%_10%,rgba(130,70,190,0.13),transparent_30%),radial-gradient(circle_at_85%_16%,rgba(230,100,150,0.11),transparent_26%)]" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_54%,rgba(0,0,0,0.5)_100%)]" />

      <div className="love-rise pointer-events-none absolute inset-x-0 top-[4%] z-10 flex flex-col items-center gap-0.5 px-3 text-center sm:gap-1 sm:top-[6%] sm:px-6">
        <div className="love-breathe flex max-w-full flex-col items-center gap-1 sm:gap-2">
          <h1 className="font-love text-[26px] leading-[1.15] tracking-[0.02em] text-white/95 [text-shadow:0_0_26px_rgba(255,150,180,0.45),0_2px_16px_rgba(0,0,0,0.9)] sm:text-[42px]">
            I love you
          </h1>
          <p className="font-love text-[30px] leading-[1.2] tracking-[0.01em] text-rose-200 [text-shadow:0_0_34px_rgba(255,120,160,0.6),0_2px_18px_rgba(0,0,0,0.9)] sm:text-[52px]">
            Bushra&nbsp;my&nbsp;jaan
          </p>
        </div>
      </div>

      {initError ? (
        <div className="absolute right-4 top-20 z-20 max-w-xs rounded-2xl border border-rose-500/30 bg-rose-950/60 p-3 text-rose-100 shadow-2xl backdrop-blur sm:right-6 sm:top-24">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-rose-200/70">Renderer error</p>
          <p className="mt-1 text-xs leading-relaxed text-rose-50/90">{initError}</p>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 px-4 text-center sm:bottom-4">
        <p className="font-mono text-[9px] uppercase leading-relaxed tracking-[0.18em] text-white/25 sm:text-[10px] sm:tracking-[0.34em]">
          tap the bouquet to make it bloom again
        </p>
      </div>
    </div>
  );
}
