"use client";

import { useState, useEffect } from "react";
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Info } from "lucide-react";

export default function ActivityHeatmap({ data = [] }: { data?: any[] }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const range = 365;
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - range);

    return (
        <div className="bg-[#050505] border border-[#1A1A1A] rounded-[2rem] p-6 hover:border-white/5 transition-all w-full overflow-hidden">
            <div className="flex justify-between items-center mb-8 px-2">
                <div>
                    <h3 className="font-black text-sm uppercase italic tracking-tighter text-gray-300">Annual Activity</h3>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Yearly Contribution Map</p>
                </div>
            </div>

            <div className="w-full flex items-center justify-center min-h-[130px]">
                <div className="w-full">
                    {mounted ? (
                        <CalendarHeatmap
                            startDate={startDate}
                            endDate={today}
                            values={data}
                            gutterSize={1.5}
                            classForValue={(value) => {
                                if (!value || value.count === 0) return 'fill-[#111]';
                                if (value.count === 1) return 'fill-green-900/40';
                                if (value.count === 2) return 'fill-green-700/60';
                                if (value.count === 3) return 'fill-green-500/80';
                                return 'fill-green-400';
                            }}
                        />
                    ) : (
                        <div className="w-full h-[100px] bg-white/5 animate-pulse rounded-xl"></div>
                    )}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#111] pt-4 px-2">
                <div className="flex items-center gap-2">
                    <Info size={10} className="text-gray-700" />
                    <span className="text-[8px] text-gray-700 font-bold uppercase italic">Global interaction heatmap</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter">Less</span>
                    <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map(v => (
                            <div key={v} className={`w-2 h-2 rounded-[1px] ${
                                v === 0 ? "bg-[#111]" :
                                    v === 1 ? "bg-green-900/40" :
                                        v === 2 ? "bg-green-700/60" :
                                            v === 3 ? "bg-green-500/80" : "bg-green-400"
                            }`}></div>
                        ))}
                    </div>
                    <span className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter">More</span>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .react-calendar-heatmap { width: 100% !important; height: auto !important; }
                .react-calendar-heatmap rect { rx: 1px; ry: 1px; }
                .react-calendar-heatmap text { font-size: 5px; fill: #333; font-weight: 900; }
                .react-calendar-heatmap .fill-[#111] { fill: #111; }
                .react-calendar-heatmap .fill-green-900\\/40 { fill: #064e3b; }
                .react-calendar-heatmap .fill-green-700\\/60 { fill: #15803d; }
                .react-calendar-heatmap .fill-green-500\\/80 { fill: #22c55e; }
                .react-calendar-heatmap .fill-green-400 { fill: #4ade80; }
            ` }} />
        </div>
    );
}