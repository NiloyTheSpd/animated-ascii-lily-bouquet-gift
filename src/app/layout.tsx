import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
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

const playfair = Playfair_Display({
  variable: "--font-love",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = "https://animated-ascii-lily-bouquet-gift.vercel.app";

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
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
