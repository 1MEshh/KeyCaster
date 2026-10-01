import type { Metadata } from "next";
import { JetBrains_Mono, Roboto_Mono, Fira_Code } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KeyCaster | Audio-First SRS Typing Client",
  description:
    "Zero-latency audio-first spelling practice client with SuperMemo-2 (SM-2) Spaced Repetition and Monkeytype customization.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KeyCaster",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} ${robotoMono.variable} ${firaCode.variable}`}
    >
      <head>
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="font-mono bg-bg text-text antialiased min-h-screen flex flex-col selection:bg-main selection:text-bg">
        {children}
      </body>
    </html>
  );
}
