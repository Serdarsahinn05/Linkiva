import { Metadata } from 'next';
import Link from 'next/link';


export const metadata: Metadata = {
    title: "Profil Bulunamadı | Linkiva",
    description: "Böyle bir Linkiva profili henüz oluşturulmamış.",
    openGraph: {
        title: "Profil Bulunamadı | Linkiva",
        description: "Böyle bir Linkiva profili henüz oluşturulmamış.",
        images: [{ url: 'https://linkiva.space/linkiva_default_og.png', width: 1200, height: 630 }]
    },
    twitter: {
        card: "summary_large_image",
        images: ['https://linkiva.space/linkiva_default_og.png']
    }
};

export default function NotFound() {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white p-6">
            <h1 className="text-6xl font-black mb-4 drop-shadow-lg">404</h1>
            <p className="text-gray-400 mb-8 text-center font-medium">
                Aradığın profil bulunamadı veya silinmiş.
            </p>
            <Link
                href="/"
                className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
                Linkiva'ya Dön
            </Link>
        </div>
    );
}