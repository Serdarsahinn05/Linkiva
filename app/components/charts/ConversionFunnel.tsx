"use client";

import { Eye, MousePointerClick, Target, ArrowRight } from "lucide-react";

// 1. DÜZELTME: 'any' tipini kaldırıp TypeScript'e uygun Interface yazdık
interface ConversionFunnelProps {
    views?: number;
    clicks?: number;
    topLinkClicks?: number;
}

export default function ConversionFunnel({ views = 0, clicks = 0, topLinkClicks = 0 }: ConversionFunnelProps) {
    // 2. DÜZELTME: Tıklamalar görüntülenmeyi aşarsa bar taşmasın diye Math.min ile %100'e sabitledik
    const viewPct = 100;
    const clickPct = views > 0 ? Math.min((clicks / views) * 100, 100) : 0;
    const targetPct = views > 0 ? Math.min((topLinkClicks / views) * 100, 100) : 0;

    const steps = [
        {
            id: 1,
            label: "Profile Views",
            value: views,
            pct: viewPct,
            dropoff: views > 0 ? Math.max(0, 100 - clickPct) : 0, // Math.max ile negatif dropoff'u engelledik
            icon: <Eye size={16} />,
            color: "bg-purple-500",
            textColor: "text-purple-500",
            bgHover: "hover:border-purple-500/30"
        },
        {
            id: 2,
            label: "Any Link Click",
            value: clicks,
            pct: clickPct,
            dropoff: clicks > 0 ? Math.max(0, ((clicks - topLinkClicks) / clicks) * 100) : 0,
            icon: <MousePointerClick size={16} />,
            color: "bg-blue-500",
            textColor: "text-blue-500",
            bgHover: "hover:border-blue-500/30"
        },
        {
            id: 3,
            label: "Top Target Reached",
            value: topLinkClicks,
            pct: targetPct,
            dropoff: null,
            icon: <Target size={16} />,
            color: "bg-green-500",
            textColor: "text-green-500",
            bgHover: "hover:border-green-500/30"
        }
    ];

    return (
        <div className="bg-[#050505] border border-[#1A1A1A] rounded-[2rem] p-8 hover:border-white/5 transition-all w-full h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="font-black text-sm uppercase italic tracking-tighter text-gray-300">Conversion Funnel</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Kullanıcı tutunma oranı (Drop-off rate)</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-0 relative flex-grow">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex-1 flex flex-col relative group">

                        {/* KART GÖVDESİ */}
                        <div className={`bg-[#0A0A0A] border border-[#111] ${step.bgHover} p-6 rounded-2xl relative z-10 transition-all duration-300 h-full flex flex-col justify-between`}>
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-black border border-[#222] ${step.textColor}`}>
                                        {step.icon}
                                    </div>
                                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{step.label}</span>
                                </div>
                                <div className="flex items-end gap-3 mb-2">
                                    <span className="text-4xl font-mono font-black text-white leading-none tabular-nums">{step.value}</span>
                                </div>
                            </div>

                            {/* PROGRESS BAR */}
                            <div className="mt-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Conversion</span>
                                    <span className={`text-xs font-mono font-bold tabular-nums ${step.textColor}`}>
                                        {step.pct.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${step.color} transition-all duration-1000 ease-out`}
                                        style={{ width: `${step.pct}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* ARA OKLAR VE DÜŞÜŞ ORANI */}
                        {index < steps.length - 1 && (
                            <div className="hidden lg:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-20 items-center justify-center w-8">
                                <div className="bg-[#050505] p-1 rounded-full border border-[#1A1A1A] z-30">
                                    <ArrowRight size={14} className="text-gray-500" />
                                </div>
                                <div className="absolute -top-8 w-max text-center">
                                    <span className="text-[9px] font-mono font-bold text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                                        -{step.dropoff?.toFixed(1)}% drop
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}