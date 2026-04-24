"use client";

import { Share2, Globe, Link as LinkIcon } from "lucide-react";
import { FaInstagram, FaTwitter, FaLinkedinIn } from "react-icons/fa";

export default function TopReferrers({ data = [] }: { data?: any[] }) {
    // İsme göre ikon seçen motor
    const getIcon = (name: string) => {
        if (name === "Instagram") return <FaInstagram size={14} className="text-pink-500" />;
        if (name === "Twitter / X") return <FaTwitter size={14} className="text-blue-400" />;
        if (name === "LinkedIn") return <FaLinkedinIn size={14} className="text-blue-700" />;
        if (name === "Direct / Email") return <LinkIcon size={14} className="text-gray-400" />;
        return <Globe size={14} className="text-gray-500" />;
    };

    // Veri yoksa boş durum göster
    if (!data || data.length === 0) {
        return (
            <div className="bg-[#050505] border border-[#1A1A1A] rounded-[2rem] p-8 h-full flex flex-col items-center justify-center opacity-50">
                <Globe size={24} className="mb-4 text-gray-600" />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">No referer data yet</p>
            </div>
        );
    }

    return (
        <div className="bg-[#050505] border border-[#1A1A1A] rounded-[2rem] p-8 hover:border-white/5 transition-all h-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="font-black text-sm uppercase italic tracking-tighter text-gray-300">Top Referrers</h3>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Traffic Source Domains</p>
                </div>
                <Share2 size={16} className="text-gray-700" />
            </div>

            <div className="space-y-6">
                {data.map((source, i) => (
                    <div key={i} className="group">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-center group-hover:border-blue-500/50 transition-all">
                                    {getIcon(source.name)}
                                </div>
                                <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors tracking-tight">
                                    {source.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono font-bold text-white tabular-nums">{source.value}</span>
                                <span className="text-[10px] font-mono text-gray-600 w-8 text-right tabular-nums">{source.pct}%</span>
                            </div>
                        </div>

                        <div className="h-1.5 w-full bg-[#0A0A0A] rounded-full overflow-hidden border border-[#111]">
                            <div
                                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                                style={{ width: `${source.pct}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}