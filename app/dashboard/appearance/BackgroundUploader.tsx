"use client";

import { useState } from "react";
import { Plus, Check, Loader2, X } from "lucide-react";

type Props = {
    defaultValue: string;
    username: string;
    onUpload?: (url: string) => void; // ✅ URL alacağını belirttik
};

export default function BackgroundUploader({ defaultValue, username, onUpload }: Props) {
    const [bgUrl, setBgUrl] = useState(defaultValue);
    const [isUploading, setIsUploading] = useState(false);

    const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const response = await fetch(`/api/upload?filename=bg-${username}-${Date.now()}.jpg`, {
                method: 'POST',
                body: file,
            });
            const newBlob = await response.json();

            setBgUrl(newBlob.url);
            // ✅ BURASI KRİTİK: Yüklenen URL'i parent'a (Form'a) gönderiyoruz
            if (onUpload) onUpload(newBlob.url);

        } catch (error) {
            console.error("Yükleme hatası:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        setBgUrl("");
        // ✅ Parent'ı da haberdar et ki DB'ye boş string gitsin
        if (onUpload) onUpload("");
    };

    return (
        <div className="relative h-28 group">
            <input id="bg-input" type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />

            <label
                htmlFor="bg-input"
                className={`h-full w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer overflow-hidden relative
                    ${bgUrl ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'}`}
            >
                {isUploading ? (
                    <Loader2 className="animate-spin text-white/50" size={20} />
                ) : bgUrl ? (
                    <>
                        <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity">
                            <img src={bgUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <Check size={18} className="text-emerald-500 relative z-10" />
                        <span className="text-[8px] font-black uppercase text-emerald-500 relative z-10 tracking-widest">Yüklendi</span>
                    </>
                ) : (
                    <>
                        <Plus size={18} className="text-white/30 group-hover:text-white" />
                        <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">Custom BG</span>
                    </>
                )}
            </label>

            {bgUrl && !isUploading && (
                <button type="button" onClick={handleRemove} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-20">
                    <X size={10} />
                </button>
            )}
        </div>
    );
}