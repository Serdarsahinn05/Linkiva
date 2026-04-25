"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "@/lib/actions";
import { Type, AlignLeft, Sparkles, Globe } from "lucide-react";
import { FaInstagram, FaGithub, FaLinkedin, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import AvatarUploader from "./AvatarUploader";
import BackgroundUploader from "./BackgroundUploader";
import UsernameInput from "./UsernameInput";

export default function AppearanceForm({ user }: { user: any }) {
    const [state, formAction, isPending] = useActionState(updateProfile, null);

    // --- STATE YÖNETİMİ ---
    const [selectedTheme, setSelectedTheme] = useState(user?.backgroundImage ? "" : (user?.themeColor || "dark"));
    const [currentBg, setCurrentBg] = useState(user?.backgroundImage || "");

    const themes = [

        { id: "dark", name: "Zifiri", class: "bg-black" },
        { id: "midnight", name: "Gece Mavisi", class: "bg-gradient-to-br from-gray-900 to-black" },
        { id: "sunset", name: "Gün Batımı", class: "bg-gradient-to-br from-orange-600 to-rose-600" },
        { id: "emerald", name: "Zümrüt", class: "bg-gradient-to-br from-emerald-600 to-teal-900" },
        { id: "glass", name: "Cam Efekti", class: "bg-gray-800/40 backdrop-blur-md" },
    ];

    const socialInputs = [
        { id: "instagram", icon: FaInstagram, placeholder: "instagram.com/kullanici" },
        { id: "x", icon: FaXTwitter, placeholder: "x.com/kullanici" },
        { id: "github", icon: FaGithub, placeholder: "github.com/kullanici" },
        { id: "linkedin", icon: FaLinkedin, placeholder: "linkedin.com/in/kullanici" },
        { id: "youtube", icon: FaYoutube, placeholder: "youtube.com/@kanal" },
    ];

    return (
        <form action={formAction} className="space-y-8">
            {/* HIDDEN INPUTS: Prisma'ya gidecek asıl veriler */}
            <input type="hidden" name="themeColor" value={selectedTheme || ""} />
            <input type="hidden" name="backgroundImage" value={currentBg || ""} />

            {/* MESAJLAR */}
            {state?.error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-shake">
                    ⚠️ {state.error}
                </div>
            )}
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

            {/* BÖLÜM 1: PROFİL BİLGİLERİ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AvatarUploader defaultUrl={user?.avatarUrl || ""} />
                <div className="md:col-span-2 bg-black border border-[#1A1A1A] rounded-[2.5rem] p-8 space-y-6 shadow-xl text-left">
                    <div>
                        <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1 block">Görünen isim</label>
                        <input name="fullName" defaultValue={user?.fullName || ""} placeholder="Adın Soyadın" className="w-full bg-[#080808] border border-[#1A1A1A] rounded-xl px-4 py-3 text-white outline-none focus:border-white transition-all font-bold" />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1 block">Bio (Hakkında)</label>
                        <textarea name="bio" defaultValue={user?.bio || ""} placeholder="Kısaca kendinden bahset..." rows={4} className="w-full bg-[#080808] border border-[#1A1A1A] rounded-xl px-4 py-3 text-white outline-none focus:border-white transition-all resize-none font-medium" />
                    </div>
                </div>
            </div>

            {/* BÖLÜM 2: SOSYAL MEDYA */}
            <div className="bg-black border border-[#1A1A1A] rounded-[2.5rem] p-8 space-y-6 shadow-xl text-left">
                <div className="flex items-center gap-2">
                    <Globe size={16} className="text-white/40" />
                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Sosyal Medya Bağlantıları</label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {socialInputs.map((social) => (
                        <div key={social.id} className="relative group">
                            <social.icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-white transition-colors" size={16} />
                            <input
                                name={social.id}
                                defaultValue={user?.[social.id] || ""}
                                placeholder={social.placeholder}
                                className="w-full bg-[#080808] border border-[#1A1A1A] rounded-xl pl-10 pr-4 py-3 text-white text-xs outline-none focus:border-white transition-all font-medium placeholder:text-gray-800"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* BÖLÜM 3: TEMA VE CUSTOM BG */}
            <div className="bg-black border border-[#1A1A1A] rounded-[2.5rem] p-8 space-y-6 shadow-xl text-left">
                <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-white/40" />
                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Tema / Vibe Seçimi</label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {themes.map((t) => (
                        <div
                            key={t.id}
                            onClick={() => {
                                setSelectedTheme(t.id);
                                setCurrentBg("");
                            }}
                            className={`h-28 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer 
                                ${selectedTheme === t.id && !currentBg
                                ? 'border-white scale-95 shadow-xl'
                                : 'border-transparent border-white/5 hover:border-white/20'} 
                                ${t.class}`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-tighter text-white drop-shadow-md">{t.name}</span>
                        </div>
                    ))}

                    <div className="relative">
                        <BackgroundUploader
                            defaultValue={currentBg || ""}
                            username={user?.username || "user"}
                            onUpload={(url) => {
                                if (url) {
                                    setCurrentBg(url);
                                    setSelectedTheme("");
                                } else {
                                    setCurrentBg("");
                                    setSelectedTheme("dark");
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* KAYDET BUTONU */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isPending}
                    className="bg-white text-black font-black px-12 py-4 rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50 shadow-[0_0_30px_rgba(255,255,255,0.1)] uppercase tracking-widest text-xs"
                >
                    {isPending ? "YAYINLANIYOR..." : "DEĞİŞİKLİKLERİ YAYINLA"}
                </button>
            </div>
        </form>
    );
}