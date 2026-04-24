"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function HeroInput({ isLoggedIn }: { isLoggedIn: boolean }) {
    const [username, setUsername] = useState("");
    const router = useRouter();

    const handleAction = () => {
        if (isLoggedIn) {
            router.push("/dashboard");
        } else {
            // Yazılan kullanıcı adını alıp kayıt sayfasına fırlatıyoruz
            const query = username ? `?username=${username.toLowerCase().trim()}` : "";
            router.push(`/register${query}`);
        }
    };

    return (
        <div className="w-full flex justify-center mt-4">
            {isLoggedIn ? (
                <button
                    onClick={handleAction}
                    className="flex items-center justify-center gap-3 bg-white text-black px-12 py-5 rounded-full font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] uppercase tracking-tighter"
                >
                    Kabine Dön
                    <ArrowRight size={20} />
                </button>
            ) : (
                /* İNTERAKTİF KAPSÜL (INPUT + BUTON) */
                <div className="flex flex-col sm:flex-row items-center bg-[#111] border border-[#333] p-2 rounded-full shadow-2xl focus-within:border-white/50 focus-within:bg-[#1a1a1a] transition-all duration-300 w-full sm:w-auto hover:border-white/30">

                    {/* Sol Taraf: Yazı Yazılan Yer */}
                    <div className="flex items-center pl-6 pr-4 py-3 text-lg sm:text-xl font-bold cursor-text" onClick={() => document.getElementById("hero-input")?.focus()}>
                        <span className="text-gray-500 select-none">Linkiva.com/</span>
                        <input
                            id="hero-input"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
                            onKeyDown={(e) => e.key === "Enter" && handleAction()}
                            placeholder="senin-adin"
                            autoComplete="off"
                            className="bg-transparent text-white outline-none w-[130px] sm:w-[180px] placeholder:text-gray-700 font-black caret-white"
                        />
                    </div>

                    {/* Sağ Taraf: Aksiyon Butonu */}
                    <button
                        onClick={handleAction}
                        className="flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-full font-black text-sm sm:text-base hover:bg-gray-200 active:scale-95 transition-all whitespace-nowrap uppercase tracking-tighter mt-2 sm:mt-0 w-full sm:w-auto"
                    >
                        Hemen Başla
                        <ArrowRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}