"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
// Eye ve EyeOff ikonlarını ekledik
import { User, Mail, Lock, Sparkles, ArrowRight, Eye, EyeOff } from "lucide-react";

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialUsername = searchParams.get("username") || "";

    const [formData, setFormData] = useState({
        username: initialUsername,
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Şifre görünürlüğü için state
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const textContent = await res.text();

            let data;
            try {
                data = JSON.parse(textContent);
            } catch (err) {
                throw new Error(textContent || "Sunucudan anlamsız bir yanıt geldi.");
            }

            if (!res.ok) {
                throw new Error(data.message || "Bir şeyler ters gitti");
            }

            router.push("/login?registered=true");
        } catch (err: any) {
            setError(err.message.replace("Error: ", ""));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 bg-[#0A0A0A] border border-[#1A1A1A] shadow-2xl rounded-[2.5rem]">
            <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center mb-4 rotate-3">
                    <Sparkles size={24} />
                </div>
                <h1 className="text-3xl font-black text-center text-white tracking-tight italic">Linkiva.</h1>
                <p className="text-gray-500 text-center text-sm font-medium mt-2">Kendi dünyanı kurmaya başla.</p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-4 rounded-2xl mb-6 text-center animate-shake">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* USERNAME INPUT */}
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-white transition-colors">
                        <User size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Kullanıcı Adı"
                        required
                        className="w-full bg-[#080808] border border-[#1A1A1A] rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:border-white transition-all font-bold placeholder:text-gray-700"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, "") })}
                    />
                </div>

                {/* EMAIL INPUT */}
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-white transition-colors">
                        <Mail size={18} />
                    </div>
                    <input
                        type="email"
                        placeholder="E-posta Adresi"
                        required
                        className="w-full bg-[#080808] border border-[#1A1A1A] rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:border-white transition-all font-bold placeholder:text-gray-700"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                {/* PASSWORD INPUT */}
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-white transition-colors">
                        <Lock size={18} />
                    </div>
                    <input
                        type={showPassword ? "text" : "password"} // Dinamik tip
                        placeholder="Şifre"
                        required
                        className="w-full bg-[#080808] border border-[#1A1A1A] rounded-2xl pl-12 pr-12 py-4 text-white outline-none focus:border-white transition-all font-bold placeholder:text-gray-700"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    {/* Göz İkonu Butonu */}
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <button
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-white text-black p-4 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50 mt-4 uppercase tracking-tighter"
                >
                    {loading ? "Hesap Oluşturuluyor..." : "Ücretsiz Katıl"}
                    <ArrowRight size={18} />
                </button>
            </form>

            <p className="mt-8 text-center text-xs text-gray-500 font-medium">
                Zaten bir hesabın var mı? <Link href="/login" className="text-white font-black hover:underline ml-1 uppercase tracking-tighter">Giriş Yap</Link>
            </p>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black px-6 py-12">
            <Suspense fallback={<div className="text-white font-black animate-pulse uppercase tracking-widest text-[10px]">Yükleniyor...</div>}>
                <RegisterForm />
            </Suspense>
        </div>
    );
}