"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Sparkles, UserCircle2 } from "lucide-react";

function NewPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState("");
    const [status, setStatus] = useState<'success' | 'error' | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/new-password", {
            method: "POST",
            body: JSON.stringify({ password, token }),
            headers: { "Content-Type": "application/json" }
        });

        if (res.ok) {
            setStatus('success');
            setMsg("Şifre güncellendi! Giriş sayfasına uçuyorsun... 🚀");

            // 2 saniye bekle ve login sayfasına at
            setTimeout(() => {
                router.push("/login");
            }, 2000);

        } else {
            setStatus('error');
            setMsg("Hata oluştu. Linkin süresi dolmuş olabilir.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-black p-6">
            <div className="w-full max-w-md p-8 bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2.5rem] text-center shadow-2xl">
                <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center mb-4 rotate-3 mx-auto shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    <Sparkles size={24} />
                </div>
                <h1 className="text-2xl font-black text-white italic mb-4">Yeni Şifre Belirle.</h1>

                {email && (
                    <div className="bg-[#111] p-3 rounded-xl mb-6 flex items-center justify-center gap-2 border border-[#1A1A1A]">
                        <UserCircle2 size={14} className="text-gray-500" />
                        <span className="text-[10px] font-bold text-gray-400">{email}</span>
                    </div>
                )}

                {msg && (
                    <p className={`mb-6 text-xs font-bold p-3 rounded-xl animate-in fade-in zoom-in duration-300 ${
                        status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                        {msg}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <input
                            type="password"
                            placeholder="Yeni Şifre"
                            required
                            className="w-full bg-[#080808] border border-[#1A1A1A] rounded-2xl p-4 text-white outline-none focus:border-white transition-all font-bold placeholder:text-gray-700"
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button className="w-full bg-white text-black p-4 rounded-2xl font-black uppercase text-xs hover:bg-gray-200 transition-all active:scale-[0.98] shadow-lg">
                        Şifreyi Güncelle
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function NewPasswordPage() {
    return <Suspense><NewPasswordForm /></Suspense>;
}