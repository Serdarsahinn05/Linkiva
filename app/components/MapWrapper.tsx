"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Activity } from "lucide-react";

// SSR kapatıyoruz çünkü harita kütüphaneleri "window" objesi arar ve sunucuda patlar
const WorldMap = dynamic(() => import("./WorldMap"), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-[580px] text-gray-500 font-mono text-xs uppercase tracking-widest animate-pulse">Initializing Map Engine...</div>
});

interface StatItem {
    id: string;
    events: number;
}

interface MapWrapperProps {
    countryStats?: StatItem[];
    cityStats?: StatItem[];
}

export default function MapWrapper({ countryStats = [], cityStats = [] }: MapWrapperProps) {
    const [mapView, setMapView] = useState<"countries" | "cities">("countries");

    // GERÇEK VERİ DÜZENLEMESİ: En çok tıklanan 4 ülkeyi karta basmak için sıralıyoruz
    const sortedCountries = [...countryStats].sort((a, b) => b.events - a.events);
    // Yüzdelik barı hesaplamak için en yüksek tıklamayı referans alıyoruz
    const topCountryEvents = sortedCountries.length > 0 ? sortedCountries[0].events : 1;
    // Toplam etkinlik sayısı
    const totalEvents = countryStats.reduce((a, b) => a + (b.events || 0), 0);

    return (
        <div className="bg-[#050505] border border-[#1A1A1A] p-8 rounded-[2.5rem] flex flex-col relative shadow-2xl h-full w-full">

            {/* 1. BAŞLIK VE MOD SEÇİCİ */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-white font-black text-xl tracking-tight italic uppercase">Geographic Analytics</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                        {countryStats.length} locations • {totalEvents} events
                    </p>
                </div>
                <div className="flex bg-[#0A0A0A] p-1.5 rounded-xl border border-[#1A1A1A]">
                    <button
                        onClick={() => setMapView("countries")}
                        className={`${mapView === 'countries' ? 'bg-[#0EA5E9] text-white shadow-lg' : 'text-gray-600 hover:text-gray-400'} text-[10px] font-black px-5 py-2 rounded-lg transition-all uppercase tracking-tighter`}
                    >
                        Countries
                    </button>
                    <button
                        onClick={() => setMapView('cities')}
                        className={`${mapView === 'cities' ? 'bg-[#0EA5E9] text-white shadow-lg' : 'text-gray-600 hover:text-gray-400'} text-[10px] font-black px-5 py-2 rounded-lg transition-all ml-1 uppercase tracking-tighter`}
                    >
                        Cities
                    </button>
                </div>
            </div>

            {/* 2. LOKASYON KARTLARI (GRID) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {sortedCountries.length > 0 ? sortedCountries.slice(0, 4).map((stat, i) => (
                    <div key={stat.id} className="bg-[#080808] border border-[#151515] p-4 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[9px] font-black text-blue-500/50 italic uppercase tracking-widest">Rank #0{i+1}</span>
                            <div className="h-[1.5px] flex-1 bg-blue-500/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                                    style={{ width: `${(stat.events / topCountryEvents) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-white font-black text-sm tracking-tight">{stat.id === "Unknown" ? "Unknown Region" : stat.id}</span>
                                <span className="text-white font-black text-2xl block mt-1 tracking-tighter">{stat.events}</span>
                            </div>
                            <Activity size={16} className="text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full text-gray-600 text-[10px] font-black uppercase tracking-widest py-8 text-center border border-dashed border-[#1A1A1A] rounded-2xl">
                        Awaiting Location Data...
                    </div>
                )}
            </div>

            {/* 3. HARİTA ALANI (TAM GENİŞLİK) */}
            <div className="relative border border-[#111] rounded-3xl bg-[#030303] overflow-hidden h-[580px]">
                <WorldMap viewMode={mapView} countryStats={countryStats} cityStats={cityStats} />
            </div>

            {/* 4. ALT INTENSITY BAR */}
            <div className="mt-8 flex justify-center">
                <div className="bg-[#080808] border border-[#151515] px-6 py-3 rounded-2xl flex items-center gap-5 shadow-inner">
                    <span className="text-[9px] font-black text-gray-500 italic uppercase tracking-widest">Intensity</span>
                    <div className="flex h-2.5 w-48 rounded-full overflow-hidden border border-black/50">
                        <div className="flex-1 bg-white"></div>
                        <div className="flex-1 bg-blue-200"></div>
                        <div className="flex-1 bg-blue-400"></div>
                        <div className="flex-1 bg-blue-600"></div>
                        <div className="flex-1 bg-blue-900"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}