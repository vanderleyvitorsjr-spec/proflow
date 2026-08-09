import type { Metadata, Viewport } from "next";

import { AppProviders } from "@/providers/app-providers";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ProFlow",
    template: "%s | ProFlow",
  },
  description:
    "Plataforma multiempresa para gestão de climatização, elétrica, refrigeração e manutenção.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#020817",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="h-full antialiased">
      <head>
        <link rel="icon" type="image/png" sizes="16x16" href="/proflow-tab-16-v7.png?v=7" />
        <link rel="icon" type="image/png" sizes="32x32" href="/proflow-tab-32-v7.png?v=7" />
        <link rel="icon" type="image/png" sizes="64x64" href="/proflow-tab-64-v7.png?v=7" />
        <link rel="shortcut icon" type="image/png" href="/proflow-tab-32-v7.png?v=7" />
      </head>
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
