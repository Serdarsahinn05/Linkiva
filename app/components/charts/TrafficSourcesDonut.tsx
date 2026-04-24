"use client";

import { PieChart } from "lucide-react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function TrafficSourcesDonut({ data = [], total = 0 }: { data?: any[], total?: number }) {

    // Verileri grafiğe uyarlama
    const labels = data.map(item => item.name);
    const values = data.map(item => item.value);

    // Vercel renk paleti
    const colors = ['#3b82f6', '#a855f7', '#ec4899', '#22c55e', '#eab308', '#f97316'];

    const chartData = {
        labels: labels,
        datasets: [{
            data: values,
            backgroundColor: colors.slice(0, values.length),
            borderColor: '#050505',
            borderWidth: 4,
            hoverOffset: 4
        }]
    };

    const options = {
        cutout: '75%',
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.9)',
                titleColor: '#888',
                bodyColor: '#fff',
                borderColor: '#333',
                borderWidth: 1,
                padding: 12,
            }
        }
    };

    return (
        <div className="bg-[#050505] border border-[#1A1A1A] rounded-[2rem] p-8 hover:border-white/5 transition-all h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="font-black text-sm uppercase italic tracking-tighter text-gray-300">Link Distribution</h3>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Clicks by link</p>
                </div>
                <PieChart size={16} className="text-gray-700" />
            </div>

            {total > 0 ? (
                <div className="relative flex-grow flex items-center justify-center">
                    <div className="w-[180px] h-[180px]">
                        <Doughnut data={chartData} options={options} />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-mono font-black text-white">{total}</span>
                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-1">Clicks</span>
                    </div>
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center text-xs font-bold text-gray-600 uppercase tracking-widest">
                    No clicks yet
                </div>
            )}
        </div>
    );
}