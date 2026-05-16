import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Skill Bridge — Campus Intelligence & Gamification Engine",
    template: "%s | Skill Bridge",
  },
  description:
    "Skill Bridge is a unified campus intelligence platform that transforms your career dreams into daily actionable tasks, tracks academic progress in real-time, and rewards you with a gamified coin economy.",
  keywords: ["skill bridge", "campus", "gamification", "student productivity", "academic tracking", "dream skills"],
  authors: [{ name: "Skill Bridge Team" }],
  themeColor: "#00FF41",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#050A05] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
