export default function AppearanceLoading() {
    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-pulse w-full">
            <div>
                <div className="w-48 h-10 bg-[#1A1A1A] rounded-xl mb-4"></div>
                <div className="w-96 h-4 bg-[#111] rounded-lg"></div>
            </div>

            <div className="space-y-8">
                {/* Username Input */}
                <div className="w-full h-14 bg-[#080808] border border-[#1A1A1A] rounded-xl"></div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Sol: Avatar Alanı */}
                    <div className="md:col-span-1 h-[250px] bg-black border border-[#1A1A1A] rounded-[2.5rem] flex flex-col items-center justify-center space-y-4">
                        <div className="w-24 h-24 rounded-full bg-[#111]"></div>
                        <div className="w-24 h-4 bg-[#111] rounded-md"></div>
                    </div>

                    {/* Sağ: İsim ve Bio Alanı */}
                    <div className="md:col-span-2 bg-black border border-[#1A1A1A] rounded-[2.5rem] p-8 space-y-6">
                        <div className="w-full h-14 bg-[#080808] rounded-xl"></div>
                        <div className="w-full h-24 bg-[#080808] rounded-xl"></div>
                    </div>
                </div>

                {/* Tema Kartları */}
                <div className="h-48 bg-black border border-[#1A1A1A] rounded-[2.5rem] p-8 flex items-end">
                    <div className="grid grid-cols-5 gap-4 w-full">
                        <div className="h-24 bg-[#111] rounded-2xl"></div>
                        <div className="h-24 bg-[#111] rounded-2xl"></div>
                        <div className="h-24 bg-[#111] rounded-2xl"></div>
                        <div className="h-24 bg-[#111] rounded-2xl"></div>
                        <div className="h-24 bg-[#111] rounded-2xl"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}