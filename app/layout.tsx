import type { Metadata } from "next";

import { AppProviders } from "@/providers/app-providers";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ProFlow",
    template: "%s | ProFlow",
  },
  description:
    "Plataforma multiempresa para gestão de climatização, elétrica, refrigeração e T.I.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/proflow-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/proflow-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "ProFlow",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
