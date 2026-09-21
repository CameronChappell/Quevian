import type { Metadata } from "next";
import "./globals.css";
import "./theme.css";
import {ThemeProvider} from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Quevian — Service workspace",
  description: "Quevian IT service management.",
  icons: {
    icon: "/favicon.svg?v=stacked-20260908",
    shortcut: "/favicon.svg?v=stacked-20260908",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased"><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
