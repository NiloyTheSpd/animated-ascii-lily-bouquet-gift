import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// "Hugh is Life" — a handwritten script with heart glyphs for I / J / M.
// Licensed for personal use only.
const hughIsLife = localFont({
  src: "./fonts/HughIsLife.ttf",
  variable: "--font-love",
  display: "swap",
  weight: "400",
});

const SITE_URL = "https://lily4bushra.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "I Love You Bushra My Jaan",
  description:
    "A bouquet of ASCII lilies that blooms for you. Tap the bouquet to watch it grow again.",
  keywords: [
    "ASCII art",
    "PixiJS",
    "bouquet",
    "lily",
    "generative art",
    "WebGL",
    "ASCII bouquet",
    "romantic gift",
  ],
  authors: [{ name: "Niloy" }],
  creator: "Niloy",
  applicationName: "ASCII Lily Bouquet",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48 64x64" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "ASCII Lily Bouquet",
    title: "I Love You Bushra My Jaan",
    description: "A bouquet of ASCII lilies that blooms for you.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "A bouquet of ASCII lilies blooming under a starry night sky",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "I Love You Bushra My Jaan",
    description: "A bouquet of ASCII lilies that blooms for you.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${hughIsLife.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
