import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PL 예상 라인업",
  description: "프리미어리그 남은 경기 예상 선발과 승률",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#07140d] font-sans text-zinc-100">
        <header className="border-b border-emerald-900/60 bg-[#0b1f14]/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight text-emerald-100">
              PL 예상 라인업
            </Link>
            <span className="text-xs text-emerald-200/70">남은 경기 · 선발 · 승률</span>
          </div>
        </header>
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
