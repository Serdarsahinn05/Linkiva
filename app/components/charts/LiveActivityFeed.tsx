"use client";

import { useState, useEffect } from "react";
import { Activity, MousePointerClick, Eye } from "lucide-react";

export default function LiveActivityFeed({ initialClicks = [], initialVisits = [] }: { initialClicks?: any[], initialVisits?: any[] }) {
    const [mounted, setMounted] = useState(false);


    useEffect(() => {
        setMounted(true);
    }, []);

    const feed = [
        ...initialClicks.map(c => ({
            id: c.id,
            type: 'click',
            message: 'Link clicked',
            time: new Date(c.createdAt),
            location: c.city && c.country ? `${c.city}, ${c.country}` : 'Unknown Location',
            icon: <MousePointerClick size={12} className="text-blue-500" />,
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-500/20"
        })),
        ...initialVisits.map(v => ({
            id: v.id,
            type: 'view',
            message: 'Profile viewed',
            time: new Date(v.createdAt),
            location: v.city && v.country ? `${v.city}, ${v.country}` : 'Unknown Location',
            icon: <Eye size={12} className="text-purple-500" />,
            bgColor: "bg-purple-500/10",
            borderColor: "border-purple-500/20"
        }))
    ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10); // En son 10 olay

    // Tarihi "Just now", "2m ago" gibi formatlama
    const timeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div className="bg-[#050505] border border-[#1A1A1A] rounded-[2rem] p-8 hover:border-white/5 transition-all h-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="font-black text-sm uppercase italic tracking-tighter text-gray-300 flex items-center gap-2">
                        Live Feed <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                    </h3>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Real-time interaction log</p>
                </div>
                <Activity size={16} className="text-gray-700" />
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {/* Sadece tarayıcıda yüklendiğinde listeyi göster (Hydration Error Fix) */}
                {mounted ? (
                    feed.length > 0 ? feed.map((item) => (
                        <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border ${item.borderColor} ${item.bgColor} backdrop-blur-sm`}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-black/50 border border-white/5 flex items-center justify-center shadow-inner">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-200">{item.message}</p>
                                    <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">{item.location}</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-mono text-gray-500">{timeAgo(item.time)}</span>
                        </div>
                    )) : (
                        <div className="text-xs font-bold text-gray-600 uppercase tracking-widest py-8 text-center">
                            No activity yet
                        </div>
                    )
                ) : (
                    // Yüklenene kadar layout zıplamasın diye ufak iskeletler
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="w-full h-14 bg-white/5 animate-pulse rounded-xl"></div>
                    ))
                )}
            </div>

            {/* Scrollbar gizleme stili */}
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1A1A1A; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #333; }
            ` }} />
        </div>
    );
}