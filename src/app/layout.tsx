import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#00FF41",
};

export const metadata: Metadata = {
  title: {
    default: "Skill Bridge — Campus Intelligence & Gamification Engine",
    template: "%s | Skill Bridge",
  },
  description:
    "Skill Bridge is a unified campus intelligence platform that transforms your career dreams into daily actionable tasks, tracks academic progress in real-time, and rewards you with a gamified coin economy.",
  keywords: ["skill bridge", "campus", "gamification", "student productivity", "academic tracking", "dream skills"],
  authors: [{ name: "Skill Bridge Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Skill Bridge",
    title: "Skill Bridge — Campus Intelligence & Gamification Engine",
    description: "Transform your campus experience with AI-powered skill tracking, gamification, and academic intelligence.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`min-h-screen bg-[#050A05] text-white antialiased ${inter.variable} ${jetbrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
