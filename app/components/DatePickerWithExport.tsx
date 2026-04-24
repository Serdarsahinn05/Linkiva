"use client";

import { useState } from "react";
import { Calendar, ChevronDown, Download, CheckCircle2 } from "lucide-react";

export default function DatePickerWithExport({ clicks = [], visits = [] }: { clicks?: any[], visits?: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedRange, setSelectedRange] = useState("Last 7 Days");
    const [isExporting, setIsExporting] = useState(false);
    const [exported, setExported] = useState(false);

    const ranges = ["Today", "Last 7 Days", "Last 30 Days", "This Month", "Last Month", "All Time"];

    // GERÇEK EXPORT FONKSİYONU
    const handleExport = () => {
        setIsExporting(true);

        // Arayüz donmasın diye işlemi ufak bir gecikmeyle (animasyon süresi) başlatıyoruz
        setTimeout(() => {
            try {
                // 1. Verileri Birleştir ve Tarihe Göre Sırala
                const combinedData = [
                    ...clicks.map(c => ({
                        Date: new Date(c.createdAt).toLocaleDateString(),
                        Time: new Date(c.createdAt).toLocaleTimeString(),
                        Type: "Link Click",
                        Detail: c.link?.title || "Unknown Link",
                        Location: `${c.city || 'Unknown'}, ${c.country || 'Unknown'}`
                    })),
                    ...visits.map(v => ({
                        Date: new Date(v.createdAt).toLocaleDateString(),
                        Time: new Date(v.createdAt).toLocaleTimeString(),
                        Type: "Profile Visit",
                        Detail: "Main Profile",
                        Location: `${v.city || 'Unknown'}, ${v.country || 'Unknown'}`
                    }))
                ].sort((a, b) => new Date(`${b.Date} ${b.Time}`).getTime() - new Date(`${a.Date} ${a.Time}`).getTime());

                // 2. CSV Başlıkları
                const headers = ["Date", "Time", "Type", "Detail", "Location"];
                const csvRows = [headers.join(",")];

                // 3. Verileri CSV Satırlarına Çevir
                for (const row of combinedData) {
                    const values = headers.map(header => {
                        const val = row[header as keyof typeof row] || "";
                        // Excel'de virgüller karışmasın diye veriyi çift tırnak içine alıyoruz
                        return `"${val.replace(/"/g, '""')}"`;
                    });
                    csvRows.push(values.join(","));
                }

                // 4. CSV Dosyasını Oluştur ve İndir
                const csvString = csvRows.join("\n");
                const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // İşlem başarılı, UI'ı güncelle
                setIsExporting(false);
                setExported(true);
                setTimeout(() => setExported(false), 2000); // 2 saniye sonra normale dön

            } catch (error) {
                console.error("Export işlemi başarısız:", error);
                setIsExporting(false);
            }
        }, 800); // 800ms'lik ufak bir animasyon şovu
    };

    return (
        <div className="flex items-center gap-3 relative z-50">

            {/* DATE PICKER BUTTON */}
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 bg-[#0A0A0A] hover:bg-[#111] border border-[#1A1A1A] hover:border-[#333] px-4 py-2 rounded-xl transition-all"
                >
                    <Calendar size={14} className="text-blue-500" />
                    <span className="text-[10px] font-mono font-bold text-gray-300 uppercase tracking-widest">{selectedRange}</span>
                    <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {/* DROPDOWN MENU */}
                {isOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-[#0A0A0A]/95 backdrop-blur-xl border border-[#1A1A1A] rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2 space-y-1">
                            {ranges.map((range) => (
                                <button
                                    key={range}
                                    onClick={() => {
                                        setSelectedRange(range);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                        selectedRange === range
                                            ? "bg-blue-500/10 text-blue-500"
                                            : "text-gray-500 hover:bg-[#111] hover:text-gray-300"
                                    }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* GERÇEK EXPORT BUTTON */}
            <button
                onClick={handleExport}
                disabled={isExporting || exported}
                className={`flex items-center gap-2 border px-4 py-2 rounded-xl transition-all ${
                    exported
                        ? "bg-green-500/10 border-green-500/30 text-green-500"
                        : "bg-[#0A0A0A] hover:bg-[#111] border-[#1A1A1A] hover:border-[#333] text-gray-300"
                }`}
            >
                {exported ? (
                    <CheckCircle2 size={14} />
                ) : (
                    <Download size={14} className={isExporting ? "animate-bounce text-blue-500" : "text-gray-500"} />
                )}
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
                    {isExporting ? "Exporting..." : exported ? "Saved" : "Export"}
                </span>
            </button>

        </div>
    );
}