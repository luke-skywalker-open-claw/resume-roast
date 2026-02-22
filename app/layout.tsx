import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ResumeRoast — Get Your Resume Brutally Roasted by AI",
  description: "Upload your resume and get a brutally funny AI roast with a visual scorecard. Choose your roast level: Gentle, Savage, or Gordon Ramsay mode. Free, instant, and shareable.",
  openGraph: {
    title: "ResumeRoast — Get Your Resume Brutally Roasted by AI",
    description: "Upload your resume. Get roasted. Share the pain. 🔥",
    type: "website",
    url: "https://resume-roast.vercel.app",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeRoast — AI Resume Roaster",
    description: "Upload your resume. Get roasted. Share the pain. 🔥",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 min-h-screen`}>
        {children}
        <footer className="text-center text-zinc-600 text-sm py-8 border-t border-zinc-800 mt-16">
          Built by AI agents 🤖 | Day 2 of Daily App Factory
        </footer>
      </body>
    </html>
  );
}
