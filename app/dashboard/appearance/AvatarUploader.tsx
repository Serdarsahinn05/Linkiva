"use client";

import { useState, useRef } from "react";
import { User, Loader2 } from "lucide-react";

export default function AvatarUploader({ defaultUrl }: { defaultUrl: string }) {
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState(defaultUrl);
    const inputFileRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        setUploading(true);
        const file = e.target.files[0];

        try {
            const response = await fetch(`/api/upload?filename=${file.name}`, {
                method: 'POST',
                body: file,
            });
            const newBlob = await response.json();
            setImageUrl(newBlob.url); // Buluttan gelen kalıcı URL'i ekrana yansıt
        } catch (error) {
            console.error("Yükleme hatası:", error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="md:col-span-1 bg-black border border-[#1A1A1A] rounded-[2.5rem] p-8 flex flex-col items-center justify-center space-y-4 shadow-xl">
            {/* KRİTİK NOKTA: Form submit edilince arka planda bu veri Prisma'ya gidecek */}
            <input type="hidden" name="avatarUrl" value={imageUrl} />

            <div
                className="w-24 h-24 rounded-full border-2 border-[#1A1A1A] p-1 overflow-hidden bg-[#080808] relative group cursor-pointer"
                onClick={() => inputFileRef.current?.click()}
            >
                {uploading ? (
                    <div className="w-full h-full flex items-center justify-center bg-[#111]">
                        <Loader2 size={24} className="text-gray-500 animate-spin" />
                    </div>
                ) : imageUrl ? (
                    <img src={imageUrl} alt="Avatar" className="w-full h-full object-cover rounded-full group-hover:opacity-30 transition-all" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#111] group-hover:bg-[#1a1a1a] transition-colors">
                        <User size={40} className="text-gray-700" />
                    </div>
                )}

                {/* Üzerine gelince çıkan "Değiştir" yazısı */}
                {!uploading && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] font-bold uppercase text-white bg-black/70 px-2 py-1 rounded-md">Değiştir</span>
                    </div>
                )}
            </div>

            <input
                ref={inputFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
            />

            <div className="w-full text-center mt-2">
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">
                    {uploading ? "YÜKLENİYOR..." : "FOTOĞRAF SEÇ"}
                </label>
            </div>
        </div>
    );
}