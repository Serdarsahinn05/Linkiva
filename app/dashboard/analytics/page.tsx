import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Eye, MousePointerClick, Activity, TrendingDown, TrendingUp, Clock } from "lucide-react";

import MapWrapper from "@/app/components/MapWrapper";
import ActivityOverviewChart from "@/app/components/charts/ActivityOverviewChart";
import TrafficSourcesDonut from "@/app/components/charts/TrafficSourcesDonut";
import TopLinksLeaderboard from "@/app/components/charts/TopLinksLeaderboard";
import DeviceOSBreakdown from "@/app/components/charts/DeviceOSBreakdown";
import LiveActivityFeed from "@/app/components/charts/LiveActivityFeed";
import DatePickerWithExport from "@/app/components/DatePickerWithExport";
import ConversionFunnel from "@/app/components/charts/ConversionFunnel";
import LinkHealthStatus from "@/app/components/charts/LinkHealthStatus";
import TopReferrers from "@/app/components/charts/TopReferrers";
import ActivityHeatmap from "@/app/components/charts/ActivityHeatmap";

export default async function AnalyticsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            links: { include: { clickEvents: true }, orderBy: { clickCount: 'desc' } },
            visits: true
        }
    });

    if (!user) redirect("/login");

    const links = user.links;
    const allClicks = links.flatMap(link => link.clickEvents);

    // --- 1. TEMEL METRİK HESAPLAMALARI ---
    const profileViews = user.visits.length;
    const realTotalClicks = allClicks.length;
    const totalEngagement = profileViews + realTotalClicks;
    const engagementRateValue = profileViews > 0 ? (realTotalClicks / profileViews) * 100 : 0;
    const engagementRate = engagementRateValue.toFixed(1);

    // --- YENİ EKLENEN: GERÇEK TREND HESAPLAMASI (Son 7 Gün vs Önceki 7 Gün) ---
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Ziyaretler
    const currentViews = user.visits.filter(v => new Date(v.createdAt) >= sevenDaysAgo).length;
    const previousViews = user.visits.filter(v => new Date(v.createdAt) >= fourteenDaysAgo && new Date(v.createdAt) < sevenDaysAgo).length;

    // Tıklamalar
    const currentClicks = allClicks.filter(c => new Date(c.createdAt) >= sevenDaysAgo).length;
    const previousClicks = allClicks.filter(c => new Date(c.createdAt) >= fourteenDaysAgo && new Date(c.createdAt) < sevenDaysAgo).length;

    // Etkileşim & Oran
    const currentInteractions = currentViews + currentClicks;
    const previousInteractions = previousViews + previousClicks;
    const currentRate = currentViews > 0 ? (currentClicks / currentViews) * 100 : 0;
    const previousRate = previousViews > 0 ? (previousClicks / previousViews) * 100 : 0;

    // Trend Oranı Bulucu
    const getTrend = (curr: number, prev: number) => {
        if (curr === 0 && prev === 0) return 0;
        if (prev === 0 && curr > 0) return 100;
        const diff = ((curr - prev) / prev) * 100;
        return parseFloat(diff.toFixed(1));
    };

    const viewTrend = getTrend(currentViews, previousViews);
    const clickTrend = getTrend(currentClicks, previousClicks);
    const interactionTrend = getTrend(currentInteractions, previousInteractions);
    const rateTrend = getTrend(currentRate, previousRate);


    // --- 2. BİRLEŞİK GRAFİK VERİSİ (ACTIVITY OVERVIEW) ---
    const hourlyVisits = new Array(24).fill(0);
    const hourlyClicks = new Array(24).fill(0);
    user.visits.forEach(v => hourlyVisits[new Date(v.createdAt).getHours()]++);
    allClicks.forEach(c => hourlyClicks[new Date(c.createdAt).getHours()]++);
    const hourlyLabels = Array.from({length: 24}, (_, i) => `${i % 12 || 12} ${i >= 12 ? 'PM' : 'AM'}`);

    const dailyVisits = new Array(7).fill(0);
    const dailyClicks = new Array(7).fill(0);
    user.visits.forEach(v => { const d = new Date(v.createdAt).getDay(); dailyVisits[d === 0 ? 6 : d - 1]++; });
    allClicks.forEach(c => { const d = new Date(c.createdAt).getDay(); dailyClicks[d === 0 ? 6 : d - 1]++; });

    const chartData = {
        hourly: { labels: hourlyLabels, visits: hourlyVisits, clicks: hourlyClicks },
        daily: { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], visits: dailyVisits, clicks: dailyClicks }
    };

    // --- 3. TRAFİK VE HARİTA VERİSİ ---
    const linkStats = links.map(link => ({
        name: link.title || "Unnamed",
        value: link.clickCount
    })).filter(l => l.value > 0);

    const countryStats = Object.values(allClicks.reduce((acc: any, curr) => {
        const id = curr.country || "Unknown";
        if (!acc[id]) acc[id] = { id, events: 0 };
        acc[id].events += 1;
        return acc;
    }, {}));

    const cityStats = Object.values(allClicks.reduce((acc: any, curr) => {
        const id = curr.city || "Unknown";
        if (!acc[id]) acc[id] = { id, events: 0 };
        acc[id].events += 1;
        return acc;
    }, {}));


    // --- 4. TOP REFERRERS HESAPLAMA ---
    const refererCounts: Record<string, number> = { "Instagram": 0, "Twitter / X": 0, "LinkedIn": 0, "Direct / Email": 0, "Other": 0 };
    allClicks.forEach(click => {
        const ref = (click.referer || "").toLowerCase();
        if (ref.includes("instagram.com")) refererCounts["Instagram"]++;
        else if (ref.includes("t.co") || ref.includes("twitter.com")) refererCounts["Twitter / X"]++;
        else if (ref.includes("linkedin.com")) refererCounts["LinkedIn"]++;
        else if (!ref || ref === "direct" || ref === "null") refererCounts["Direct / Email"]++;
        else refererCounts["Other"]++;
    });

    const referrersData = Object.entries(refererCounts)
        .map(([name, value]) => ({
            name,
            value,
            pct: realTotalClicks > 0 ? Math.round((value / realTotalClicks) * 100) : 0
        }))
        .filter(r => r.value > 0)
        .sort((a, b) => b.value - a.value);

    // --- 5. CİHAZ VE İŞLETİM SİSTEMİ HESAPLAMA ---
    const deviceCounts = { Mobile: 0, Desktop: 0 };
    const osCounts: Record<string, number> = { iOS: 0, Android: 0, Windows: 0, Mac: 0, Other: 0 };

    allClicks.forEach(click => {
        const ua = (click.userAgent || "").toLowerCase();
        if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) deviceCounts.Mobile++;
        else deviceCounts.Desktop++;

        if (ua.includes("iphone") || ua.includes("ipad")) osCounts.iOS++;
        else if (ua.includes("android")) osCounts.Android++;
        else if (ua.includes("windows")) osCounts.Windows++;
        else if (ua.includes("mac os")) osCounts.Mac++;
        else osCounts.Other++;
    });

    // --- 6. ACTIVITY HEATMAP VERİSİ ---
    const heatmapDataMap: Record<string, number> = {};
    allClicks.forEach(click => {
        const dateStr = click.createdAt.toISOString().split('T')[0];
        heatmapDataMap[dateStr] = (heatmapDataMap[dateStr] || 0) + 1;
    });
    const heatmapData = Object.entries(heatmapDataMap).map(([date, count]) => ({
        date,
        count: count > 4 ? 4 : count
    }));

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 pb-20 text-white selection:bg-blue-500/30 font-geistSans">

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">Analytics</h1>
                    <p className="text-gray-500 mt-1 text-sm font-medium">Bağlantılarının performansını Vercel elitliğinde izle.</p>
                </div>
                <DatePickerWithExport clicks={allClicks} visits={user.visits} />
            </div>

            {/* GERÇEK VERİLER BURAYA BAĞLANDI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Profile Views" value={profileViews} trend={viewTrend} icon={<Eye size={18} />} color="purple" />
                <StatCard title="Link Clicks" value={realTotalClicks} trend={clickTrend} icon={<MousePointerClick size={18} />} color="pink" />
                <StatCard title="Total Interactions" value={totalEngagement} trend={interactionTrend} icon={<Activity size={18} />} color="blue" />
                <StatCard
                    title="Engagement Rate"
                    value={`%${engagementRate}`}
                    trend={rateTrend}
                    icon={rateTrend >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    color="green"
                />
            </div>

            {/* Diğer Bileşenler Aynı Kalıyor... */}
            <ActivityOverviewChart data={chartData} />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1"><TrafficSourcesDonut data={linkStats} total={realTotalClicks} /></div>
                <div className="lg:col-span-2"><TopLinksLeaderboard data={linkStats} total={realTotalClicks} /></div>
                <div className="lg:col-span-1"><LinkHealthStatus links={links} /></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1"><DeviceOSBreakdown deviceData={deviceCounts} osData={osCounts} /></div>
                <div className="lg:col-span-2"><LiveActivityFeed initialClicks={allClicks} initialVisits={user.visits} /></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ConversionFunnel views={profileViews} clicks={realTotalClicks} topLinkClicks={linkStats.length > 0 ? linkStats[0].value : 0} />
                </div>
                <div className="lg:col-span-1"><TopReferrers data={referrersData} /></div>
            </div>

            <ActivityHeatmap data={heatmapData} />

            <div className="bg-[#050505] border border-[#1A1A1A] rounded-[2rem] overflow-hidden w-full shadow-2xl">
                <MapWrapper countryStats={countryStats} cityStats={cityStats} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <BottomCard label="Active Days" value="1" icon="📅" />
                <BottomCard label="Daily Average" value={realTotalClicks > 0 ? (realTotalClicks / 1).toFixed(1) : 0} icon="📊" />
                <BottomCard
                    label="Overall Growth"
                    value={interactionTrend === 0 ? "%0" : (interactionTrend > 0 ? `+${interactionTrend}%` : `${interactionTrend}%`)}
                    icon="🚀"
                    highlight={interactionTrend > 0}
                />
            </div>
        </div>
    );
}

// --- YARDIMCI BİLEŞENLER ---

function StatCard({ title, value, trend, icon, color }: any) {
    const colorMap: any = {
        purple: "text-purple-500 bg-purple-500/10",
        pink: "text-pink-500 bg-pink-500/10",
        blue: "text-blue-500 bg-blue-500/10",
        green: "text-green-500 bg-green-500/10"
    };

    const isNeutral = trend === 0;
    const isPositive = trend > 0;

    return (
        <div className="bg-[#050505] border border-[#1A1A1A] p-6 rounded-[2rem] hover:border-white/10 transition-all group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${colorMap[color]}`}>{icon}</div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.15em]">{title}</p>
            <h2 className="text-4xl font-mono font-medium mt-2 tabular-nums tracking-tighter text-white leading-none">{value}</h2>
            <div className="flex items-center gap-2 mt-5">
                {isNeutral ? (
                    <span className="text-[10px] font-black text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded-full border border-gray-500/20">0.0%</span>
                ) : (
                    <span className={`text-[10px] font-black ${isPositive ? 'text-green-500 bg-green-500/10 border border-green-500/20' : 'text-pink-500 bg-pink-500/10 border border-pink-500/20'} px-2 py-0.5 rounded-full`}>
                        {isPositive ? '▲' : '▼'} {Math.abs(trend)}%
                    </span>
                )}
                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter opacity-70">vs last 7 days</span>
            </div>
        </div>
    );
}

function BottomCard({ label, value, icon, highlight }: any) {
    return (
        <div className="bg-[#050505] border border-[#1A1A1A] p-5 rounded-2xl text-center group hover:border-blue-500/30 transition-all">
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                <span className="text-sm grayscale group-hover:grayscale-0 transition-all">{icon}</span> {label}
            </p>
            <h4 className={`text-2xl font-mono font-bold tabular-nums ${highlight ? 'text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'text-white'}`}>{value}</h4>
        </div>
    );
}