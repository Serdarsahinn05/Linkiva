import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sparkles, Zap, Shield, Share2 } from "lucide-react";
import HeroInput from "@/app/components/HeroInput";

export default async function LandingPage() {
    const session = await getServerSession(authOptions);
    const isLoggedIn = !!session;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="text-2xl font-black italic tracking-tighter">Linkiva.</div>
                    <div className="flex items-center gap-6">
                        {isLoggedIn ? (
                            <Link
                                href="/dashboard"
                                className="text-sm font-bold bg-white text-black px-6 py-2.5 rounded-full hover:bg-gray-200 transition-all uppercase tracking-tighter"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="text-[10px] font-black opacity-60 hover:opacity-100 transition-opacity uppercase tracking-[0.2em]">Giriş Yap</Link>
                                <Link
                                    href="/register"
                                    className="text-sm font-bold bg-white text-black px-6 py-2.5 rounded-full hover:bg-gray-200 transition-all uppercase tracking-tighter"
                                >
                                    Kaydol
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <section className="pt-48 pb-32 px-6 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] pointer-events-none" />
                <div className="absolute top-40 left-[20%] w-[300px] h-[300px] bg-purple-600/5 blur-[120px] pointer-events-none" />

                <div className="relative z-10 w-full flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <Sparkles size={14} className="text-yellow-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Geleceğin Link Platformu</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-10 italic leading-[0.85] uppercase">
                        DÜNYANI <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">TEK BİR LİNKTE</span> <br />
                        TOPLA.
                    </h1>

                    <p className="max-w-2xl mx-auto text-gray-500 text-lg md:text-xl font-medium mb-16 leading-relaxed">
                        Tüm sosyal ağlarını, projelerini ve içeriklerini tek bir şık ve cam efektli sayfada birleştir. <span className="text-white">Linkiva</span> ile tarzını dünyaya göster.
                    </p>

                    <HeroInput isLoggedIn={isLoggedIn} />
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-6 py-32">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="bg-[#080808] border border-white/5 p-12 rounded-[3.5rem] group hover:border-white/20 transition-all duration-500 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-white/10 transition-all" />
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-white group-hover:text-black transition-all duration-500">
                            <Zap size={28} />
                        </div>
                        <h3 className="text-2xl font-black mb-4 uppercase tracking-tight italic">Işık Hızında</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            Saniyeler içinde profilini oluştur, linklerini ekle ve dünyayla paylaşmaya hemen başla.
                        </p>
                    </div>

                    <div className="bg-[#080808] border border-white/5 p-12 rounded-[3.5rem] group hover:border-white/20 transition-all duration-500 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-white/10 transition-all" />
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-white group-hover:text-black transition-all duration-500">
                            <Shield size={28} />
                        </div>
                        <h3 className="text-2xl font-black mb-4 uppercase tracking-tight italic">Cam Efekti</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            En modern Glassmorphism teknolojisiyle profilin her zaman rakiplerinden daha şık görünsün.
                        </p>
                    </div>

                    <div className="bg-[#080808] border border-white/5 p-12 rounded-[3.5rem] group hover:border-white/20 transition-all duration-500 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-white/10 transition-all" />
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-white group-hover:text-black transition-all duration-500">
                            <Share2 size={28} />
                        </div>
                        <h3 className="text-2xl font-black mb-4 uppercase tracking-tight italic">Analiz Et</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            Linklerine kimin, ne zaman tıkladığını takip et. Etkileşimini mermi gibi artır.
                        </p>
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/5 py-24">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <div className="text-2xl font-black italic tracking-tighter opacity-40">Linkiva.</div>

                    </div>


                    <p className="text-gray-700 text-[9px] font-bold uppercase tracking-widest">
                        © 2026 Linkiva. Tüm hakları saklıdır.
                    </p>
                </div>
            </footer>
        </div>
    );
}