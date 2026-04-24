import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google"; // Fontları güncelledik
import "./globals.css";
import { Providers } from "./providers";

// Genel arayüz fontu (Modern ve temiz)
const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

// Sayılar ve teknik detaylar için (Senin favorin)
const jbMono = JetBrains_Mono({
    variable: "--font-jb-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Linkiva",
    description: "Bento grid yapısıyla bağlantılarını yönet.",
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