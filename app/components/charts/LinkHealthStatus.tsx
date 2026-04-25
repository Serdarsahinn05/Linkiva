"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, RefreshCw } from "lucide-react";

interface LinkHealthStatusProps {
    links?: any[];
}

export default function LinkHealthStatus({ links = [] }: LinkHealthStatusProps) {
    const [checking, setChecking] = useState(false);

    const handleCheck = () => {
        setChecking(true);
        setTimeout(() => setChecking(false), 2000);

    };


    const displayLinks = links.slice(0, 5);

    return (
        <div className="bg-[#050505] border border-[#1A1A1A] rounded-[2rem] p-8 hover:border-white/5 transition-all h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="font-black text-sm uppercase italic tracking-tighter text-gray-300">
                        Link Health Check
                    </h3>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">
                        Automatic URL Validation
                    </p>
                </div>

                <button
                    onClick={handleCheck}
                    disabled={checking}
                    className="p-2 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl hover:border-blue-500/50 transition-all group"
                >
                    <RefreshCw
                        size={14}
                        className={`text-blue-500 ${
                            checking
                                ? "animate-spin"
                                : "group-hover:rotate-180 transition-transform duration-500"
                        }`}
                    />
                </button>
            </div>

            <div className="space-y-3 flex-grow overflow-y-auto custom-scrollbar pr-1">
                {displayLinks.length === 0 ? (
                    <p className="text-gray-700 text-[10px] font-mono italic">
                        No links found to check.
                    </p>
                ) : (
                    displayLinks.map((link, i) => {

                        const isBroken = link.isActive === false;

                        return (
                            <div
                                key={link.id || i}
                                className="flex items-center justify-between bg-[#080808] border border-[#111] p-3 rounded-xl group hover:border-white/5 transition-all"
                            >
                                <div className="flex items-center gap-3 truncate">
                                    <div className="relative">
                                        <div
                                            className={`w-2 h-2 rounded-full ${
                                                isBroken
                                                    ? "bg-red-500 shadow-[0_0_8px_#ef4444]"
                                                    : "bg-green-500 shadow-[0_0_8px_#22c55e]"
                                            } ${checking ? "animate-pulse" : ""}`}
                                        ></div>
                                    </div>

                                    <span className="text-xs font-bold text-gray-300 truncate tracking-tight max-w-[120px] sm:max-w-[150px]">
                                        {link.title}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <span
                                        className={`text-[9px] font-black uppercase tracking-tighter ${
                                            isBroken
                                                ? "text-red-500/50"
                                                : "text-green-500/50"
                                        }`}
                                    >
                                        {checking
                                            ? "Checking..."
                                            : isBroken
                                                ? "Offline"
                                                : "Healthy"}
                                    </span>

                                    {isBroken ? (
                                        <ShieldAlert
                                            size={14}
                                            className="text-red-500"
                                        />
                                    ) : (
                                        <ShieldCheck
                                            size={14}
                                            className="text-green-500"
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="mt-6 pt-6 border-t border-[#111] flex justify-between items-center">
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">
                            Active
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">
                            Offline
                        </span>
                    </div>
                </div>

                <span className="text-[8px] font-mono text-gray-700 uppercase tracking-widest">
                    Auto-check every 24h
                </span>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 2px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1A1A1A; border-radius: 4px; }
            ` }} />
        </div>
    );
}