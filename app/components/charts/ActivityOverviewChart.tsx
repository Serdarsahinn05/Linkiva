"use client";

import { useState } from "react";
import { Line } from "react-chartjs-2";
import { Activity } from "lucide-react";
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export default function ActivityOverviewChart({ data }: { data?: any }) {
    const [timeRange, setTimeRange] = useState<'hourly' | 'daily'>('hourly');

    // Veri yoksa çökmesin diye boş state
    const currentData = data ? data[timeRange] : { labels: [], visits: [], clicks: [] };

    const chartData = {
        labels: currentData.labels,
        datasets: [
            {
                label: 'Views',
                data: currentData.visits,
                borderColor: '#a855f7', // Purple
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
            },
            {
                label: 'Clicks',
                data: currentData.clicks,
                borderColor: '#3b82f6', // Blue
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleColor: '#888',
                bodyColor: '#fff',
                borderColor: '#333',
                borderWidth: 1,
                padding: 12,
            }
        },
        scales: {
            x: { grid: { display: false, drawBorder: false }, ticks: { color: '#666', font: { size: 10 } } },
            y: { grid: { color: '#1A1A1A', drawBorder: false }, ticks: { color: '#666', font: { size: 10 }, stepSize: 10 } }
        },
        interaction: { mode: 'nearest' as const, axis: 'x' as const, intersect: false }
    };

    return (
        <div className="bg-[#050505] border border-[#1A1A1A] rounded-[2rem] p-8 hover:border-white/5 transition-all">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h3 className="font-black text-sm uppercase italic tracking-tighter text-gray-300">Activity Overview</h3>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Traffic vs Engagement</p>
                </div>

                <div className="flex bg-[#0A0A0A] border border-[#1A1A1A] p-1 rounded-xl">
                    <button onClick={() => setTimeRange('hourly')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${timeRange === 'hourly' ? "bg-white text-black" : "text-gray-500 hover:text-white"}`}>24h</button>
                    <button onClick={() => setTimeRange('daily')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${timeRange === 'daily' ? "bg-white text-black" : "text-gray-500 hover:text-white"}`}>7d</button>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
}