"use client";

import { ExternalLink } from "lucide-react";

interface LinkItemProps {
    link: {
        id: string;
        title: string;
        url: string;
        thumbnail?: string | null;
    };
    theme: string;
}

export default function LinkItem({ link, theme }: LinkItemProps) {
    const isGlass = theme === 'glass';

    return (
        <a
            // TAKİP MOTORUNU BAĞLADIĞIMIZ YER BURASI:
            href={`/api/click?linkId=${link.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`
                group relative flex items-center p-4 w-full transition-all duration-300 active:scale-[0.98] rounded-3xl border
                ${isGlass
                ? "bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/15 hover:border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]"
                : "bg-white/5 border-white/5 hover:bg-white hover:text-black hover:border-white shadow-lg"
            }
            `}
        >
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center mr-4">
                {link.thumbnail ? (
                    <img
                        src={link.thumbnail}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <ExternalLink size={16} className="opacity-20" />
                    </div>
                )}
            </div>

            <span className="flex-grow font-bold tracking-tight text-base">
                {link.title}
            </span>

            <div className={`p-2 rounded-full transition-all duration-300 ${isGlass ? "bg-white/5" : "bg-black/20 group-hover:bg-black/10"}`}>
                <ExternalLink size={14} className="opacity-40 group-hover:opacity-100" />
            </div>
        </a>
    );
}