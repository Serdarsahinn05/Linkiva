"use client";

import { X } from "lucide-react";
import { createLink } from "@/lib/actions";

export default function AddLinkModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-black border border-[#1A1A1A] rounded-[2rem] p-8 relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-black text-white mb-6">Yeni Link Ekle.</h2>

                <form action={async (formData) => {
                    await createLink(formData);
                    onClose();
                }} className="space-y-4">
                    <input
                        name="title"
                        placeholder="Başlık (Örn: Instagram)"
                        className="w-full bg-[#080808] border border-[#1A1A1A] rounded-xl px-4 py-3 text-white outline-none focus:border-white transition-colors"
                        required
                    />
                    <input
                        name="url"
                        type="text"
                        placeholder="URL (Örn: github.com/username)"
                        className="w-full bg-[#080808] border border-[#1A1A1A] rounded-xl px-4 py-3 text-white outline-none focus:border-white transition-colors"
                        required
                    />
                    <button type="submit" className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-all">
                        Kaydet
                    </button>
                </form>
            </div>
        </div>
    );
}