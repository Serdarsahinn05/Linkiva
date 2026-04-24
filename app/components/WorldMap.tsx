"use client";

import React, { useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from "react-simple-maps";

const geoUrl = "https://raw.githubusercontent.com/lotusms/world-map-data/main/world.json";

// KRİTİK: DB'den gelen 2'li kodları haritanın 3'lü kodlarına çevirir
const isoMap: Record<string, string> = {
    "TR": "TUR", "US": "USA", "DE": "DEU", "GB": "GBR", "FR": "FRA", "AZ": "AZE", "NL": "NLD", "RU": "RUS"
};

const CITY_COORDS: Record<string, [number, number]> = {
    "Istanbul": [28.97, 41.00], "Ankara": [32.85, 39.92], "Izmir": [27.14, 38.42],
    "New York": [-74.00, 40.71], "London": [-0.12, 51.50], "Berlin": [13.40, 52.52]
};

export default function WorldMap({ viewMode, countryStats = [], cityStats = [] }: any) {
    const [tooltip, setTooltip] = useState<any>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [position, setPosition] = useState({ coordinates: [15, 0], zoom: 1 });

    return (
        <div className="w-full h-full relative">
            <div className="absolute right-4 top-4 flex flex-col gap-1 z-30">
                <button onClick={() => setPosition(p => ({...p, zoom: p.zoom * 1.5}))} className="w-7 h-7 bg-[#111] border border-[#222] text-gray-500 hover:text-white rounded flex items-center justify-center shadow-xl">+</button>
                <button onClick={() => setPosition(p => ({...p, zoom: p.zoom / 1.5}))} className="w-7 h-7 bg-[#111] border border-[#222] text-gray-500 hover:text-white rounded flex items-center justify-center shadow-xl">-</button>
            </div>

            <ComposableMap projectionConfig={{ scale: 140 }} className="w-full h-full" style={{ width: "100%", height: "100%" }}>
                <ZoomableGroup zoom={position.zoom} center={position.coordinates as [number, number]} onMoveEnd={setPosition}>
                    <Geographies geography={geoUrl}>
                        {({ geographies }: { geographies: any[] }) =>
                            geographies.filter(g => g.id !== "ATA").map((geo) => {
                                // DB'den gelen TR'yi TUR yapıp haritada buluyoruz:
                                const d = countryStats.find((s: any) => isoMap[s.id] === geo.id || s.id === geo.id);
                                const isHovered = tooltip?.id === geo.id || (d && tooltip?.id === d.id);

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        // VERİ VARSA MAVİ, YOKSA BEYAZ
                                        fill={isHovered ? "#0F172A" : (viewMode === "cities" ? "#0A0A0A" : (d ? "#0EA5E9" : "#FFFFFF"))}
                                        stroke={isHovered ? "#0EA5E9" : (viewMode === "cities" ? "#1A1A1A" : (d ? "#0EA5E9" : "#E2E8F0"))}
                                        strokeWidth={isHovered ? 1.5 : (d ? 0.8 : 0.4)}
                                        onMouseEnter={() => viewMode === "countries" && d && setTooltip(d)}
                                        onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                                        onMouseLeave={() => setTooltip(null)}
                                        style={{
                                            default: { outline: "none", transition: "all 300ms" },
                                            hover: { outline: "none", cursor: d ? "pointer" : "default" }
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>

                    {viewMode === "cities" && cityStats.map((city: any) => {
                        const coords = CITY_COORDS[city.name];
                        if (!coords) return null;
                        return (
                            <Marker key={city.name} coordinates={coords}>
                                <circle
                                    r={4 / position.zoom} fill="#0EA5E9" stroke="#FFF" strokeWidth={1 / position.zoom} className="animate-pulse cursor-pointer"
                                    onMouseEnter={() => setTooltip({ id: city.name, events: city.events, isCity: true })}
                                    onMouseLeave={() => setTooltip(null)}
                                    onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                                />
                            </Marker>
                        );
                    })}
                </ZoomableGroup>
            </ComposableMap>

            {/* FİYAKALI TOOLTIP */}
            {tooltip && (
                <div
                    className="fixed z-50 bg-[#0F1115] border border-[#1E2228] rounded-xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-none transform -translate-x-1/2 -translate-y-[110%] min-w-[150px]"
                    style={{ left: tooltipPos.x, top: tooltipPos.y }}
                >
                    <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-white font-black text-sm italic tracking-tighter uppercase">{tooltip.id}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-gray-500 uppercase">Events:</span>
                        <span className="text-white">{tooltip.events}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-green-500"></div>
                        <span className="text-[9px] text-green-500 font-black uppercase tracking-widest">Live Now</span>
                    </div>
                </div>
            )}
        </div>
    );
}