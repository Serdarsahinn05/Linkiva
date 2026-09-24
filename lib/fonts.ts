import { Geist, Geist_Mono } from "next/font/google";

// Geist for everything; Geist Mono only for numbers and data (DESIGN.md §5).
export const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist", display: "swap" });
export const geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-geist-mono", display: "swap" });

export const fontVariables = `${geist.variable} ${geistMono.variable}`;
