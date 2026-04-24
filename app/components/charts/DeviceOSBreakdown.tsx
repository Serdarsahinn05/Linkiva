"use client";

import { Monitor, Smartphone, Cpu } from "lucide-react";

export default function DeviceOSBreakdown({ deviceData, osData }: { deviceData?: any, osData?: any }) {

    // Cihaz Yüzdeleri Hesaplama
    const totalDevices = (deviceData?.Mobile || 0) + (deviceData?.Desktop || 0);
    const mobilePct = totalDevices > 0 ? Math.round(((deviceData?.Mobile || 0) / totalDevices) * 100) : 0;
    const desktopPct = totalDevices > 0 ? Math.round(((deviceData?.Desktop || 0) / totalDevices) * 100) : 0;

    // OS Yüzdeleri Hesaplama ve Sıralama
    const totalOS = Object.values(osData || {}).reduce((a: any, b: any) => a + b, 0) as number;
    const osList = Object.entries(osData || {})
        .map(([name, val]) => ({
            name,
            val: val as number,
            pct: totalOS > 0 ? Math.round(((val as number) / totalOS) * 100) : 0
        }))
        .filter(os => os.val > 0)
        .sort((a, b) => b.val - a.val);

    return (
        <div className="bg-[#050505] border border-[#1A1A1A] rounded-[2rem] p-8 hover:border-white/5 transition-all h-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="font-black text-sm uppercase italic tracking-tighter text-gray-300">Device & OS</h3>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Platform Breakdown</p>
                </div>
                <Cpu size={16} className="text-gray-700" />
            </div>

            {/* DEVICES */}
            <div className="mb-8">
                <div className="flex justify-between text-xs font-bold mb-3">
                    <span className="flex items-center gap-2 text-gray-400"><Smartphone size={14} className="text-purple-500" /> Mobile</span>
                    <span className="text-white font-mono">{mobilePct}%</span>
                </div>
                <div className="flex justify-between text-xs font-bold mb-3">
                    <span className="flex items-center gap-2 text-gray-400"><Monitor size={14} className="text-blue-500" /> Desktop</span>
                    <span className="text-white font-mono">{desktopPct}%</span>
                </div>

                {/* Birleşik Bar */}
                <div className="h-2 w-full bg-[#0A0A0A] rounded-full overflow-hidden border border-[#111] flex mt-4">
                    <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${mobilePct}%` }}></div>
                    <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${desktopPct}%` }}></div>
                </div>
            </div>

            <div className="w-full h-px bg-[#1A1A1A] mb-8"></div>

            {/* OPERATING SYSTEMS */}
            <div className="space-y-4">
                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-4">Top Operating Systems</p>
                {osList.length > 0 ? osList.map((os, i) => (
                    <div key={i}>
                        <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-gray-400">{os.name}</span>
                            <span className="text-white font-mono">{os.pct}%</span>
                        </div>
                        <div className="h-1 w-full bg-[#0A0A0A] rounded-full overflow-hidden border border-[#111]">
                            <div className="h-full bg-gray-500 transition-all duration-1000" style={{ width: `${os.pct}%` }}></div>
                        </div>
                    </div>
                )) : (
                    <div className="text-xs font-bold text-gray-600 uppercase tracking-widest text-center py-4">No data</div>
                )}
            </div>
        </div>
    );
}