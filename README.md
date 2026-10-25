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

## Accessibility

The scene respects `prefers-reduced-motion`: the bouquet renders in its settled
end state immediately, with no growth animation, drifting hearts, or meteors.

## Deploying

The project is configured for Vercel. Connect the GitHub repository in the
Vercel dashboard to get automatic deployments on every push.

## Credits

Designed and built with love.
