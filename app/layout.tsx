import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";


const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});


const jbMono = JetBrains_Mono({
    variable: "--font-jb-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Linkiva",
    description: "Geleceğin link yönetimi...",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${jbMono.variable} antialiased bg-black font-sans`}>
        <Providers>{children}</Providers>
        </body>
        </html>
    );
}