"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/actions";
import { Type, AlignLeft, Sparkles } from "lucide-react";
import AvatarUploader from "./AvatarUploader";
import UsernameInput from "./UsernameInput";

export default function AppearanceForm({ user }: { user: any }) {
    // state: action'dan dönen {error} veya {success} objesi
    const [state, formAction, isPending] = useActionState(updateProfile, null);

    const themes = [
        { id: "dark", name: "Zifiri", class: "bg-black border-white/10" },
        { id: "midnight", name: "Gece Mavisi", class: "bg-gradient-to-br from-gray-900 to-black" },
        { id: "sunset", name: "Gün Batımı", class: "bg-gradient-to-br from-orange-600 to-rose-600" },
        { id: "emerald", name: "Zümrüt", class: "bg-gradient-to-br from-emerald-600 to-teal-900" },
        { id: "glass", name: "Cam Efekti", class: "bg-gray-800/40 backdrop-blur-md" },
    ];

    return (
        <form action={formAction} className="space-y-8">
            {/* HATA MESAJI (Zarfın içinden hata çıkarsa burası yanar) */}
            {state?.error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-shake">
                    ⚠️ {state.error}
                </div>
            )}

            {/* BAŞARI MESAJI */}
            {state?.success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                    ✅ {state.message}
                </div>
            )}

            {/* KULLANICI ADI */}
            <div>
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Kullanıcı Adı (URL'in)</label>
                <UsernameInput defaultValue={user?.username || ""} />
            </div>

            {/* PROFİL BİLGİLERİ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AvatarUploader defaultUrl={user?.avatarUrl || ""} />
                <div className="md:col-span-2 bg-black border border-[#1A1A1A] rounded-[2.5rem] p-8 space-y-6 shadow-xl text-left">
                    <div>
                        <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1 text-left block">Görünen isim</label>
                        <div className="relative mt-1">
                            <Type size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                            <input name="fullName" defaultValue={user?.fullName || ""} placeholder="Adın Soyadın" className="w-full bg-[#080808] border border-[#1A1A1A] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-white transition-all" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1 text-left block">Bio (Hakkında)</label>
                        <div className="relative mt-1">
                            <AlignLeft size={14} className="absolute left-4 top-4 text-gray-600" />
                            <textarea name="bio" defaultValue={user?.bio || ""} placeholder="Kısaca kendinden bahset..." rows={4} className="w-full bg-[#080808] border border-[#1A1A1A] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-white transition-all resize-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* TEMA SEÇİMİ */}
            <div className="bg-black border border-[#1A1A1A] rounded-[2.5rem] p-8 space-y-6 shadow-xl text-left">
                <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-white/40" />
                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Tema / Vibe Seçimi</label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {themes.map((t) => (
                        <label key={t.id} className="cursor-pointer group relative">
                            <input type="radio" name="themeColor" value={t.id} defaultChecked={user?.themeColor === t.id || (t.id === 'dark' && !user?.themeColor)} className="hidden peer" />
                            <div className={`h-24 rounded-2xl border-2 border-transparent peer-checked:border-white peer-checked:scale-95 transition-all flex flex-col items-center justify-center gap-2 group-hover:border-white/20 shadow-lg ${t.class}`}>
                                <span className="text-[10px] font-black uppercase tracking-tighter text-white drop-shadow-md">{t.name}</span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <button type="submit" disabled={isPending} className="bg-white text-black font-black px-12 py-4 rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50 shadow-[0_0_30px_rgba(255,255,255,0.1)] uppercase tracking-widest text-xs">
                    {isPending ? "YAYINLANIYOR..." : "DEĞİŞİKLİKLERİ YAYINLA"}
                </button>
            </div>
        </form>
    );
}