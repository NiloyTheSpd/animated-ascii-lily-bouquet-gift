'use client';

import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      theme="dark"
      toastOptions={{
        classNames: {
          toast:
            'group rounded-2xl border border-rose-500/20 bg-rose-950/70 text-rose-50 shadow-2xl backdrop-blur',
          description: 'text-rose-100/70',
          actionButton: 'bg-rose-500 text-white hover:bg-rose-400',
          cancelButton: 'bg-white/10 text-rose-100 hover:bg-white/20',
        },
      }}
    />
  );
}
