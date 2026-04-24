import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Auth options eklendi
import { updateProfile } from "@/lib/actions";
import { User, Image as ImageIcon, Type, AlignLeft, Sparkles, AtSign } from "lucide-react";

export default async function AppearancePage() {
    // Session çağrısına authOptions eklendi
    const session = await getServerSession(authOptions);
    const user = await prisma.user.findUnique({
        where: { email: session?.user?.email || "" }
    });

    const themes = [
        { id: "dark", name: "Zifiri", class: "bg-black border-white/10" },
        { id: "midnight", name: "Gece Mavisi", class: "bg-gradient-to-br from-gray-900 to-black" },
        { id: "sunset", name: "Gün Batımı", class: "bg-gradient-to-br from-orange-600 to-rose-600" },
        { id: "emerald", name: "Zümrüt", class: "bg-gradient-to-br from-emerald-600 to-teal-900" },
        { id: "glass", name: "Cam Efekti", class: "bg-gray-800/40 backdrop-blur-md" },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div>
                <h1 className="text-4xl font-black text-white tracking-tight">Görünüm.</h1>
                <p className="text-gray-500 mt-2 font-medium">Profilinin kimliğini ve tarzını buradan belirle.</p>
            </div>

            <form action={updateProfile} className="space-y-8">
                {/* KULLANICI ADI (USERNAME) ALANI */}
                <div>
                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Kullanıcı Adı (URL'in)</label>
                    <div className="relative mt-1">
                        <AtSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                        <input
                            name="username"
                            defaultValue={user?.username || ""}
                            placeholder="kullaniciadiniz"
                            className="w-full bg-[#080808] border border-[#1A1A1A] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-white transition-all font-bold text-orange-400"
                        />
                    </div>
                    <p className="text-[10px] text-gray-600 mt-2 ml-1 italic font-medium">
                        Uyarı: Profilin şu adreste görünecek: <span className="text-gray-400">Linkiva.com/{user?.username || '...'}</span>
                    </p>
                </div>

                {/* 1. BÖLÜM: PROFİL BİLGİLERİ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* SOL: AVATAR DÜZENLEME */}
                    <div className="md:col-span-1 bg-black border border-[#1A1A1A] rounded-[2.5rem] p-8 flex flex-col items-center justify-center space-y-4 shadow-xl">
                        <div className="w-24 h-24 rounded-full border-2 border-[#1A1A1A] p-1 overflow-hidden bg-[#080808]">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#111]">
                                    <User size={40} className="text-gray-700" />
                                </div>
                            )}
                        </div>
                        <div className="w-full text-left">
                            <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Avatar URL</label>
                            <div className="relative mt-1">
                                <ImageIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                                <input
                                    name="avatarUrl"
                                    defaultValue={user?.avatarUrl || ""}
                                    placeholder="https://..."
                                    className="w-full bg-[#080808] border border-[#1A1A1A] rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-white transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SAĞ: İSİM VE BİO */}
                    <div className="md:col-span-2 bg-black border border-[#1A1A1A] rounded-[2.5rem] p-8 space-y-6 shadow-xl text-left">
                        <div>
                            <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1 text-left block">Görünen İsim</label>
                            <div className="relative mt-1">
                                <Type size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                                <input
                                    name="fullName"
                                    defaultValue={user?.fullName || ""}
                                    placeholder="Adın Soyadın"
                                    className="w-full bg-[#080808] border border-[#1A1A1A] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-white transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1 text-left block">Bio (Hakkında)</label>
                            <div className="relative mt-1">
                                <AlignLeft size={14} className="absolute left-4 top-4 text-gray-600" />
                                <textarea
                                    name="bio"
                                    defaultValue={user?.bio || ""}
                                    placeholder="Kısaca kendinden bahset..."
                                    rows={4}
                                    className="w-full bg-[#080808] border border-[#1A1A1A] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-white transition-all resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. BÖLÜM: TEMA SEÇİMİ (Vibe Kartları) */}
                <div className="bg-black border border-[#1A1A1A] rounded-[2.5rem] p-8 space-y-6 shadow-xl text-left">
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-white/40" />
                        <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Tema / Vibe Seçimi</label>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {themes.map((t) => (
                            <label key={t.id} className="cursor-pointer group relative">
                                <input
                                    type="radio"
                                    name="themeColor"
                                    value={t.id}
                                    defaultChecked={user?.themeColor === t.id || (t.id === 'dark' && !user?.themeColor)}
                                    className="hidden peer"
                                />
                                <div className={`h-24 rounded-2xl border-2 border-transparent peer-checked:border-white peer-checked:scale-95 transition-all flex flex-col items-center justify-center gap-2 group-hover:border-white/20 shadow-lg ${t.class}`}>
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-white drop-shadow-md">
                                        {t.name}
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* KAYDET BUTONU */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-white text-black font-black px-12 py-4 rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.1)] uppercase tracking-widest text-xs"
                    >
                        DEĞİŞİKLİKLERİ YAYINLA
                    </button>
                </div>
            </form>

            <div className="bg-[#111] border border-[#1A1A1A] rounded-[2rem] p-6 text-center">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest italic">
                    Linkiva <span className="text-white/20">|</span> Profiliniz <span className="text-white italic">/{user?.username || '...'}</span> adresinde güncellenecek.
                </p>
            </div>
        </div>
    );
}