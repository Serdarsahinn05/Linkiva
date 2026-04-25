export default function LinksLoading() {
    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-pulse w-full p-6">
            {/* ÜST BAŞLIK BÖLÜMÜ (Linklerim.) */}
            <div>
                <div className="h-10 bg-[#1A1A1A] rounded-xl w-1/3 mb-4"></div>
                <div className="h-4 bg-[#111] rounded-lg w-2/3"></div>
            </div>

            {/* FİYAKALI 'YENİ LİNK EKLE' BUTONU İSKELETİ */}
            {/* O kesikli (dashed) kenarlığı ve içindeki yapıyı taklit ediyoruz */}
            <div className="h-28 bg-[#0A0A0A] rounded-[2rem] border-2 border-dashed border-[#222] p-8 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                    {/* Yuvarlak simge placeholder */}
                    <div className="w-12 h-12 rounded-full bg-[#111]"></div>
                    {/* Yazılar placeholder */}
                    <div>
                        <div className="h-6 bg-[#111] rounded-md w-24 mb-2"></div>
                        <div className="h-4 bg-[#111] rounded-md w-48"></div>
                    </div>
                </div>
                {/* Sağdaki ok simgesi placeholder */}
                <div className="w-10 h-10 rounded-full bg-blue-900/30"></div>
            </div>

            {/* LİNK KARTLARI LİSTESİ (Sürükle-Bırak Yapısı) */}
            <div className="space-y-4 mt-8">
                {/* 1. LİNK KARTI İSKELETİ */}
                <div className="h-24 bg-black border border-[#1A1A1A] rounded-[2.5rem] p-6 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-4 w-full">
                        {/* Sol: Sürükle-bırak tutamacı */}
                        <div className="w-4 h-6 bg-[#111] rounded"></div>
                        {/* Orta: İsim ve URL */}
                        <div className="flex-1 space-y-2">
                            <div className="h-5 bg-[#111] rounded-md w-32"></div>
                            <div className="h-4 bg-[#111] rounded-md w-48"></div>
                        </div>
                    </div>
                    {/* Sağ: İstatistikler ve İkonlar */}
                    <div className="flex items-center gap-3">
                        {/* Tıklanma Statüsü Kutusu */}
                        <div className="w-16 h-10 bg-[#111] rounded-lg"></div>
                        {/* Yönlendirme Statüsü Kutusu */}
                        <div className="w-16 h-10 bg-[#111] rounded-lg"></div>
                        {/* Yuvarlak ikonlar */}
                        <div className="w-10 h-10 bg-[#111] rounded-full"></div>
                        <div className="w-10 h-10 bg-[#111] rounded-full"></div>
                        {/* Toggle switch (aktif/pasif) */}
                        <div className="w-12 h-6 bg-[#111] rounded-full"></div>
                        {/* Silme ikonu */}
                        <div className="w-10 h-10 bg-[#111] rounded-full"></div>
                    </div>
                </div>

                {/* 2. LİNK KARTI İSKELETİ (Kopyaladık) */}
                <div className="h-24 bg-black border border-[#1A1A1A] rounded-[2.5rem] p-6 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-4 w-full">
                        <div className="w-4 h-6 bg-[#111] rounded"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-5 bg-[#111] rounded-md w-48"></div>
                            <div className="h-4 bg-[#111] rounded-md w-24"></div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-16 h-10 bg-[#111] rounded-lg"></div>
                        <div className="w-16 h-10 bg-[#111] rounded-lg"></div>
                        <div className="w-10 h-10 bg-[#111] rounded-full"></div>
                        <div className="w-10 h-10 bg-[#111] rounded-full"></div>
                        <div className="w-12 h-6 bg-[#111] rounded-full"></div>
                        <div className="w-10 h-10 bg-[#111] rounded-full"></div>
                    </div>
                </div>

                {/* 3. LİNK KARTI İSKELETİ */}
                <div className="h-24 bg-black border border-[#1A1A1A] rounded-[2.5rem] p-6 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-4 w-full">
                        <div className="w-4 h-6 bg-[#111] rounded"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-5 bg-[#111] rounded-md w-24"></div>
                            <div className="h-4 bg-[#111] rounded-md w-40"></div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-16 h-10 bg-[#111] rounded-lg"></div>
                        <div className="w-16 h-10 bg-[#111] rounded-lg"></div>
                        <div className="w-10 h-10 bg-[#111] rounded-full"></div>
                        <div className="w-10 h-10 bg-[#111] rounded-full"></div>
                        <div className="w-12 h-6 bg-[#111] rounded-full"></div>
                        <div className="w-10 h-10 bg-[#111] rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}