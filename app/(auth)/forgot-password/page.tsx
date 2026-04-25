"use client";
import { useState } from "react";
import { Mail, ArrowRight, Sparkles } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await fetch("/api/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email }),
            headers: { "Content-Type": "application/json" }
        });
        if (res.ok) setMsg("Sıfırlama maili gönderildi! 🚀");
        else setMsg("Bir hata oluştu veya kullanıcı bulunamadı.");
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-black p-6">
            <div className="w-full max-w-md p-8 bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2.5rem] text-center">
                <Sparkles className="mx-auto mb-4 text-white" />
                <h1 className="text-2xl font-black text-white italic">Şifremi Unuttum.</h1>
                <p className="text-gray-500 text-xs mt-2 mb-6 uppercase tracking-widest font-bold">Mailini gir, linki gönderelim.</p>
                {msg && <p className="mb-4 text-xs font-bold text-emerald-500">{msg}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="email" placeholder="E-posta" required className="w-full bg-[#080808] border border-[#1A1A1A] rounded-xl p-4 text-white outline-none" onChange={e => setEmail(e.target.value)} />
                    <button disabled={loading} className="w-full bg-white text-black p-4 rounded-xl font-black uppercase text-xs hover:bg-gray-200">
                        {loading ? "Gönderiliyor..." : "Link Gönder"}
                    </button>
                </form>
            </div>
        </div>
    );
}