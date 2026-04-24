"use client";

import { X } from "lucide-react";
import { updateLink } from "@/lib/actions";
import { useEffect, useState } from "react";

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    link: { id: string; title: string; url: string } | null;
}

export default function EditLinkModal({ isOpen, onClose, link }: EditModalProps) {
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");

    // Modal açıldığında mevcut link bilgilerini inputlara doldur
    useEffect(() => {
        if (link) {
            setTitle(link.title);
            setUrl(link.url);
        }
    }, [link]);

    if (!isOpen || !link) return null;

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-black border border-[#1A1A1A] rounded-[2rem] p-8 relative shadow-2xl">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-black text-white mb-6 tracking-tight">Linki Düzenle.</h2>

                <form action={async (formData) => {
                    await updateLink(link.id, formData);
                    onClose();
                }} className="space-y-4">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Başlık</label>
                        <input
                            name="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-[#080808] border border-[#1A1A1A] rounded-xl px-4 py-3 text-white outline-none focus:border-white transition-colors mt-1"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">URL</label>
                        <input
                            name="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full bg-[#080808] border border-[#1A1A1A] rounded-xl px-4 py-3 text-white outline-none focus:border-white transition-colors mt-1"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-all mt-4">
                        GÜNCELLEMELERİ KAYDET
                    </button>
                </form>
            </div>
        </div>
    );
}