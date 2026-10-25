'use client';

import dynamic from 'next/dynamic';

// PixiJS touches window/WebGL, so the scene is client-only.
const LilyBouquet = dynamic(() => import('./LilyBouquet'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">Growing the bouquet…</p>
    </div>
  ),
});

export default function BouquetStage() {
  return (
    <div className="h-screen w-full bg-black">
      <LilyBouquet />
    </div>
  );
}
