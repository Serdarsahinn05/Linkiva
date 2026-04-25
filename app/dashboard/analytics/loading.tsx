export default function AnalyticsLoading() {
    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-pulse w-full">
            {/* Başlık */}
            <div className="w-64 h-10 bg-[#1A1A1A] rounded-xl mb-8"></div>

            {/* Üstteki 4'lü Stat Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="h-28 bg-black border border-[#1A1A1A] rounded-3xl"></div>
                <div className="h-28 bg-black border border-[#1A1A1A] rounded-3xl"></div>
                <div className="h-28 bg-black border border-[#1A1A1A] rounded-3xl"></div>
                <div className="h-28 bg-black border border-[#1A1A1A] rounded-3xl"></div>
            </div>

            {/* Büyük Grafik (Activity Overview) */}
            <div className="h-[400px] bg-black border border-[#1A1A1A] rounded-[2.5rem] p-8 flex flex-col justify-between">
                <div className="w-48 h-6 bg-[#111] rounded-md"></div>
                <div className="w-full h-[250px] bg-gradient-to-t from-purple-900/20 to-transparent rounded-b-xl border-b-2 border-purple-900/50"></div>
            </div>
        </div>
    );
}