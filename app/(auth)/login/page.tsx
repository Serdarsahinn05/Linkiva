"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // URL parametrelerini yakalıyoruz
    const registered = searchParams.get("registered");
    const verified = searchParams.get("verified");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await signIn("credentials", {
            redirect: false,
            email,
            password,
        });

        if (res?.error) {
            // lib/auth.ts içinde fırlattığımız "Maili onayla" hatası buraya düşer
            setError(res.error);
            setLoading(false);
        } else {
            // Giriş başarılıysa dashboard'a uçur
            window.location.href = "/dashboard";
        }
    };

    const handleGoogleLogin = () => {
        signIn("google", { callbackUrl: "/dashboard" });
    };

    return (
        <div className="w-full max-w-md p-8 bg-[#0A0A0A] border border-[#1A1A1A] shadow-2xl rounded-[2.5rem]">
            <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center mb-4 rotate-3 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    <Sparkles size={24} />
                </div>
                <h1 className="text-3xl font-black text-center text-white tracking-tight italic">Linkiva.</h1>
                <p className="text-gray-500 text-center text-sm font-medium mt-2">Tekrar hoş geldin.</p>
            </div>

            {/* DURUM 1: Kayıt oldu ama henüz onaylamadıysa */}
            {registered && !verified && !error && (
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold p-4 rounded-2xl mb-6 text-center animate-in fade-in slide-in-from-top-4 duration-300">
                    Hesabın oluşturuldu! 🚀 <br />
                    <span className="text-white/60 font-medium">Lütfen mail kutunu kontrol et ve hesabını onayla.</span>
                </div>
            )}

            {/* DURUM 2: Mailini başarıyla doğrulayıp geldiyse */}
            {verified && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold p-4 rounded-2xl mb-6 flex flex-col items-center gap-2 text-center animate-in zoom-in duration-300">
                    <CheckCircle2 size={20} />
                    <span>🎉 Harika! Mailin doğrulandı. Şimdi giriş yapabilirsin.</span>
                </div>
            )}

            {/* DURUM 3: Hata varsa (Yanlış şifre VEYA Doğrulanmamış mail) */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-4 rounded-2xl mb-6 text-center animate-shake">
                    {error}
                </div>
            )}

            {/* GOOGLE İLE GİRİŞ */}
            <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-[#111] text-white border border-[#333] p-4 rounded-2xl font-black text-sm hover:bg-white hover:text-black transition-all active:scale-[0.98] mb-6 uppercase tracking-tighter"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google ile Devam Et
            </button>

            <div className="flex items-center my-6">
                <div className="flex-1 border-t border-white/5"></div>
                <span className="px-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">VEYA</span>
                <div className="flex-1 border-t border-white/5"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-white transition-colors">
                        <Mail size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="E-posta veya Kullanıcı Adı"
                        required
                        className="w-full bg-[#080808] border border-[#1A1A1A] rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:border-white transition-all font-bold placeholder:text-gray-700"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-white transition-colors">
                        <Lock size={18} />
                    </div>
                    <input
                        type="password"
                        placeholder="Şifre"
                        required
                        className="w-full bg-[#080808] border border-[#1A1A1A] rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:border-white transition-all font-bold placeholder:text-gray-700"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-white text-black p-4 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50 mt-4 uppercase tracking-tighter shadow-lg"
                >
                    {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
                    <ArrowRight size={18} />
                </button>
            </form>

            <p className="mt-8 text-center text-xs text-gray-500 font-medium">
                Hesabın yok mu? <Link href="/register" className="text-white font-black hover:underline ml-1 uppercase tracking-tighter">Ücretsiz Katıl</Link>
            </p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black px-6 py-12">
            <Suspense fallback={<div className="text-white font-black animate-pulse uppercase tracking-widest text-[10px]">Yükleniyor...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}