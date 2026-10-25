# I Love You Bushra My Jaan

A bouquet of ASCII lilies that blooms for you.

An interactive, hand-tied bouquet rendered entirely in ASCII. Every pixel of the
scene — stems, petals, stars, meteors, drifting hearts — is quantised through a
custom WebGL fragment shader into crisp `@`, `#`, `+`, `=`, `-` glyphs. It grows
from nothing on load, and you can tap it to watch it bloom again.

## Stack

- **Next.js 15** (App Router, React 19)
- **PixiJS 8** for the scene graph and WebGL renderer
- **Tailwind CSS v4** for styling
- **TypeScript** throughout

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## How the ASCII effect works

`src/components/lily/AsciiFilter.ts` is a custom PixiJS `Filter` built on
`GlProgram`. The fragment shader:

1. Snaps each pixel to the centre of its ASCII cell.
2. Samples the source colour at that point.
3. Computes perceptual luminance and maps it to a glyph density band.
4. Renders the matching character shape procedurally (dot, dash, equals, plus,
   hash, or a dense `@`).

Because the glyphs are generated in the shader rather than sampled from a font
atlas, the output stays razor-sharp at any resolution and cell size.

## Project structure

```
src/
  app/
    layout.tsx          # Metadata, fonts, Toaster
    page.tsx            # Renders the bouquet stage
    globals.css         # Tailwind theme + ambient animations
    fonts/
      HughIsLife.ttf    # "Hugh is Life" script face (see Fonts)
  components/
    BouquetStage.tsx    # Client-only wrapper (PixiJS needs the DOM)
    LilyBouquet.tsx     # Scene graph, bloom choreography, effects
    ui/toaster.tsx      # Sonner toast host
    lily/
      Lily.ts           # Petal geometry, speckles, stamens, bloom easing
      Stem.ts           # Tapered stem ribbon with drooping leaves
      Wrap.ts           # Kraft-paper cone and satin ribbon bow
      AsciiFilter.ts    # The ASCII shader
public/
  favicon.svg           # Primary icon
  og-image.png          # 1200x630 social card
  manifest.webmanifest  # PWA manifest
```

## Fonts

The title uses **Hugh is Life**, a handwritten script whose `I`, `J` and `M`
are drawn as little hearts — which is why the greeting reads "I love you" with
a heart for the `I`. It is loaded through `next/font/local` from
`src/app/fonts/HughIsLife.ttf` and exposed to CSS as the `--font-love`
variable (see `.font-love` in `globals.css`).

> The typeface is licensed for **personal use only**. The font file is kept in
> the repository so the greeting renders correctly; remove it and swap
> `--font-love` for a licensed face if you publish this anywhere public.

## Accessibility

The scene respects `prefers-reduced-motion`: the bouquet renders in its settled
end state immediately, with no growth animation, drifting hearts, or meteors.

## Responsive layout

`measure()` in `LilyBouquet.tsx` derives the bouquet geometry from the
viewport, and the two orientations are handled separately.

**Landscape** is the original layout, unchanged: the dome is scaled inside a
bounded box and the kraft cone hangs from the tie point below it.

**Portrait** treats the bouquet as one rigid block — dome, stems and kraft
cone — and shrinks it by a single factor, so a phone shows the *same picture*
as a desktop, just smaller. The reference is the 1440×900 desktop layout,
measured off the real render (dome 990×504, dome centre y 360, tie y 738,
cone bottom y 898, greenery spanning x 0.27–0.73). Nothing is
re-proportioned for the phone:

- the dome keeps the desktop's 1.964 aspect ratio,
- the tie stays at 82% of the screen height, and the kraft cone is cut off by
  the bottom edge exactly as it is on the desktop,
- the cone's radius comes from the same `86 * u` formula the desktop uses, so
  it tapers identically,
- flower size follows the same uniform scale, so the blooms keep their
  proportion to the bouquet.

The greenery fans wider than the blooms do, so it is what sets the width
limit — the bouquet is scaled to keep it clear of the screen edges, and
capped so the topmost bloom always clears the title.

The ASCII cell size scales with the renderer's resolution, so glyphs stay the
same physical size on every screen instead of shrinking on high-DPI phones.

## Deploying

Live at **<https://lily4bushra.vercel.app>**.

The project is configured for Vercel and connected to the GitHub repository,
so every push to `main` deploys automatically.

## Credits

Designed and built with love.
