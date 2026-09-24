import { Bricolage_Grotesque, Geist, Geist_Mono, Newsreader, Nunito } from "next/font/google";

// Geist for everything; Geist Mono only for numbers and data (DESIGN.md §5).
export const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist", display: "swap" });
export const geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-geist-mono", display: "swap" });

// Profile font choices (themes/index.ts). preload: false, so a browser only downloads the one a profile uses.
const serif = Newsreader({ subsets: ["latin", "latin-ext"], variable: "--font-serif", display: "swap", preload: false });
const rounded = Nunito({ subsets: ["latin", "latin-ext"], variable: "--font-rounded", display: "swap", preload: false });
const grotesk = Bricolage_Grotesque({ subsets: ["latin", "latin-ext"], variable: "--font-grotesk", display: "swap", preload: false });

export const fontVariables = [geist, geistMono, serif, rounded, grotesk].map((f) => f.variable).join(" ");
