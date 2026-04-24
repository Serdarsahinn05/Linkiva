"use client";

import { Link2, ExternalLink } from "lucide-react";
import { incrementClick } from "@/lib/actions";

interface LinkCardProps {
    link: {
        id: string;
        title: string;
        url: string;
        thumbnail?: string | null;
    };
}

export default function LinkCard({ link }: LinkCardProps) {
    const handleClick = async () => {
        // Arka planda tıklamayı say (Kullanıcıyı bekletmeden)
        incrementClick(link.id);
    };

    return (
        <a
            href={link.url}
            onClick={handleClick}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative w-full bg-[#0A0A0A] border border-[#1A1A1A] hover:border-white/20 p-4 rounded-[1.5rem] flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
        >
            {/* İkon */}
            <div className="w-12 h-12 bg-black border border-[#1A1A1A] rounded-xl flex items-center justify-center overflow-hidden shrink-0 group-hover:border-white/40 transition-colors">
                {link.thumbnail ? (
                    <img src={link.thumbnail} alt="" className="w-full h-full object-contain p-2" />
                ) : (
                    <Link2 size={20} className="text-gray-500" />
                )}
            </div>

            {/* Başlık */}
            <div className="flex-1 min-w-0 text-left">
                <h3 className="font-bold text-white truncate text-base">
                    {link.title}
                </h3>
            </div>

            {/* Sağ Ok */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                <ExternalLink size={18} className="text-gray-500" />
            </div>
        </a>
    );
}