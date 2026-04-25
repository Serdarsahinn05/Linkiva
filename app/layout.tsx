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

import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Linkiva | Kendi Bağlantılarını Paylaş',
    description: 'Tüm sosyal medya hesaplarını ve önemli linklerini tek bir sayfada topla.',
    openGraph: {
        title: 'Linkiva | Kendi Bağlantılarını Paylaş',
        description: 'Tüm sosyal medya hesaplarını ve önemli linklerini tek bir sayfada topla.',
        url: 'https://linkiva.space',
        siteName: 'Linkiva',
        images: [
            {
                url: 'https://linkiva.space/linkiva_default_og.png',
                width: 1200,
                height: 630,
                alt: 'Linkiva Default Preview',
            },
        ],
        locale: 'tr_TR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Linkiva',
        description: 'Tüm sosyal medya hesaplarını ve önemli linklerini tek bir sayfada topla.',
        images: ['https://linkiva.space/linkiva_default_og.png'],
    },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${jbMono.variable} antialiased bg-black font-sans`}>
        <Providers>{children}</Providers>
        </body>
        </html>
    );
}