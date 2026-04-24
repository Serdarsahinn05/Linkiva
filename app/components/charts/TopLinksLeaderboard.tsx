"use client";

import { Trophy } from "lucide-react";

export default function TopLinksLeaderboard({ data = [], total = 0 }: { data?: any[], total?: number }) {

    // Yüzde hesabı ve en yüksekten düşüğe sıralama
    const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 5); // İlk 5'i al

    return (
        <div className="bg-[#050505] border border-[#1A1A1A] rounded-[2rem] p-8 hover:border-white/5 transition-all h-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="font-black text-sm uppercase italic tracking-tighter text-gray-300">Top Links</h3>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Highest performing assets</p>
                </div>
                <Trophy size={16} className="text-yellow-600" />
            </div>

            <div className="space-y-5">
                {sortedData.length > 0 ? sortedData.map((link, i) => {
                    const pct = total > 0 ? Math.round((link.value / total) * 100) : 0;
                    return (
                        <div key={i} className="group cursor-default">
                            <div className="flex justify-between items-end mb-2">
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black w-4 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-700' : 'text-gray-600'}`}>
                                        {i + 1}.
                                    </span>
                                    <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors truncate max-w-[150px] sm:max-w-[200px]">
                                        {link.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-mono font-bold text-white tabular-nums">{link.value}</span>
                                    <span className="text-[10px] font-mono text-gray-600 tabular-nums w-8 text-right">{pct}%</span>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-[#0A0A0A] rounded-full overflow-hidden border border-[#111]">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${i === 0 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`}
                                    style={{ width: `${pct}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-xs font-bold text-gray-600 uppercase tracking-widest py-8 text-center">
                        No links clicked yet
                    </div>
                )}
            </div>
        </div>
    );
}