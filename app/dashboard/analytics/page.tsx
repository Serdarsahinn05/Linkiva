import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Eye, MousePointerClick, Activity, TrendingDown, Clock } from "lucide-react";


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
    const engagementRate = profileViews > 0 ? ((realTotalClicks / profileViews) * 100).toFixed(1) : "0";

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
        // Cihaz
        if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) deviceCounts.Mobile++;
        else deviceCounts.Desktop++;
        // OS
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

            {/* ÜST HEADER */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">Analytics</h1>
                    <p className="text-gray-500 mt-1 text-sm font-medium">Bağlantılarının performansını Vercel elitliğinde izle.</p>
                </div>
                <DatePickerWithExport clicks={allClicks} visits={user.visits} />
            </div>

            {/* 1. SATIR: ÜST METRİKLER */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Profile Views" value={profileViews} trend="+100.0%" icon={<Eye size={18} />} color="purple" />
                <StatCard title="Link Clicks" value={realTotalClicks} trend="+5.2%" icon={<MousePointerClick size={18} />} color="pink" />
                <StatCard title="Total Interactions" value={totalEngagement} trend="+10.1%" icon={<Activity size={18} />} color="blue" />
                <StatCard title="Engagement Rate" value={`%${engagementRate}`} trend="-1.2%" icon={<TrendingDown size={18} />} color="green" />
            </div>

            {/* 2. SATIR: BİRLEŞİK ANA GRAFİK */}
            <ActivityOverviewChart data={chartData} />

            {/* 3. SATIR: LINK PERFORMANCE & HEALTH CHECK */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <TrafficSourcesDonut data={linkStats} total={realTotalClicks} />
                </div>
                <div className="lg:col-span-2">
                    <TopLinksLeaderboard data={linkStats} total={realTotalClicks} />
                </div>
                <div className="lg:col-span-1">
                    <LinkHealthStatus links={links} />
                </div>
            </div>

            {/* 4. SATIR: CİHAZ DAĞILIMI & CANLI AKIŞ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <DeviceOSBreakdown deviceData={deviceCounts} osData={osCounts} />
                </div>
                <div className="lg:col-span-2">
                    <LiveActivityFeed initialClicks={allClicks} initialVisits={user.visits} />
                </div>
            </div>

            {/* 5. SATIR: DÖNÜŞÜM HUNİSİ & TOP REFERRERS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ConversionFunnel
                        views={profileViews}
                        clicks={realTotalClicks}
                        topLinkClicks={linkStats.length > 0 ? linkStats[0].value : 0}
                    />
                </div>
                <div className="lg:col-span-1">
                    <TopReferrers data={referrersData} />
                </div>
            </div>

            {/* 6. SATIR: ACTIVITY HEATMAP */}
            <ActivityHeatmap data={heatmapData} />

            {/* 7. SATIR: HARİTA */}
            <div className="bg-[#050505] border border-[#1A1A1A] rounded-[2rem] overflow-hidden w-full shadow-2xl">
                <MapWrapper countryStats={countryStats} cityStats={cityStats} />

            </div>

            {/* 8. SATIR: ALT TRACKER KARTLARI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <BottomCard label="Active Days" value="1" icon="📅" />
                <BottomCard label="Daily Average" value={realTotalClicks > 0 ? (realTotalClicks / 1).toFixed(1) : 0} icon="📊" />
                <BottomCard label="Overall Growth" value="+100.0%" icon="🚀" highlight />
            </div>
        </div>
    );
}

// --- UI YARDIMCI BİLEŞENLERİ ---
function StatCard({ title, value, trend, icon, color }: any) {
    const colorMap: any = {
        purple: "text-purple-500 bg-purple-500/10",
        pink: "text-pink-500 bg-pink-500/10",
        blue: "text-blue-500 bg-blue-500/10",
        green: "text-green-500 bg-green-500/10"
    };
    return (
        <div className="bg-[#050505] border border-[#1A1A1A] p-6 rounded-[2rem] hover:border-white/10 transition-all group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${colorMap[color]}`}>{icon}</div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.15em]">{title}</p>
            <h2 className="text-4xl font-mono font-medium mt-2 tabular-nums tracking-tighter text-white leading-none">{value}</h2>
            <div className="flex items-center gap-2 mt-5">
                <span className={`text-[10px] font-black ${trend.startsWith('+') ? 'text-green-500 bg-green-500/10' : 'text-pink-500 bg-pink-500/10'} px-2 py-0.5 rounded-full`}>▲ {trend}</span>
                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter opacity-70">vs last period</span>
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