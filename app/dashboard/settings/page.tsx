"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, Trash2, AlertTriangle, ShieldCheck, X } from "lucide-react";
import { deleteAccount, updateAccountEmail } from "@/lib/actions";
import { useState, useEffect } from "react";

export default function SettingsPage() {
    const { data: session } = useSession();

    // Email Güncelleme Stateleri
    const [emailInput, setEmailInput] = useState("");
    const [isSavingEmail, setIsSavingEmail] = useState(false);

    // Hesap Silme Stateleri
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmInput, setConfirmInput] = useState("");

    // Sayfa açıldığında mevcut e-postayı inputa doldur
    useEffect(() => {
        if (session?.user?.email) {
            setEmailInput(session.user.email);
        }
    }, [session]);

    // E-Posta Güncelleme Fonksiyonu
    const handleUpdateEmail = async () => {
        setIsSavingEmail(true);
        try {
            await updateAccountEmail(emailInput);
            alert("E-posta başarıyla güncellendi! Güvenlik için yeniden giriş yapmalısın.");
            await signOut({ callbackUrl: "/login" });
        } catch (error: any) {
            alert(error.message || "E-posta güncellenirken hata oluştu.");
        } finally {
            setIsSavingEmail(false);
        }
    };

    // Hesap Silme Fonksiyonu
    const handleDeleteAccount = async () => {
        if (confirmInput !== session?.user?.email) return;

        setIsDeleting(true);
        try {
            await deleteAccount();
            await signOut({ callbackUrl: "/login" });
        } catch (error) {
            alert("Hesap silinirken bir hata oluştu.");
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    return (
        <>
            <div className="max-w-4xl mx-auto space-y-12 relative z-10">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Ayarlar.</h1>
                    <p className="text-gray-500 mt-2 font-medium">Hesap tercihlerin ve güvenlik ayarların.</p>
                </div>

                {/* 1. BÖLÜM: HESAP BİLGİLERİ (GÜNCELLENDİ) */}
                <div className="bg-black border border-[#1A1A1A] rounded-[2.5rem] p-8 space-y-6 shadow-xl text-left">
                    <div className="flex items-center gap-2 mb-6">
                        <ShieldCheck size={20} className="text-white" />
                        <h2 className="text-lg font-black text-white uppercase tracking-widest">Hesap Bilgileri</h2>
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Kayıtlı E-Posta</label>
                        <div className="flex flex-col sm:flex-row gap-4 mt-2">
                            <input
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                className="flex-1 bg-[#080808] border border-[#1A1A1A] rounded-xl px-4 py-4 text-white font-bold focus:border-white transition-all outline-none"
                            />
                            <button
                                onClick={handleUpdateEmail}
                                disabled={isSavingEmail || emailInput === session?.user?.email}
                                className="bg-white text-black font-black px-8 py-4 rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50 whitespace-nowrap uppercase tracking-widest text-xs"
                            >
                                {isSavingEmail ? "Kaydediliyor..." : "Güncelle"}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-600 mt-3 ml-1 italic font-medium">
                            Not: Google ile giriş yaptıysan e-postanı değiştiremezsin. Değiştirirsen güvenlik amacıyla çıkış yapılacaktır.
                        </p>
                    </div>
                </div>

                {/* 2. BÖLÜM: OTURUM KAPATMA */}
                <div className="bg-black border border-[#1A1A1A] rounded-[2.5rem] p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl text-left">
                    <div>
                        <h3 className="text-white font-bold text-lg">Oturumu Kapat</h3>
                        <p className="text-gray-500 text-sm font-medium">Farklı bir cihaza geçeceksen veya işin bittiyse güvenle çıkış yap.</p>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex items-center gap-2 bg-[#111] border border-[#1A1A1A] text-white font-black px-6 py-4 rounded-2xl hover:bg-white hover:text-black transition-all active:scale-[0.98] uppercase tracking-widest text-xs whitespace-nowrap"
                    >
                        <LogOut size={16} />
                        Çıkış Yap
                    </button>
                </div>

                {/* 3. BÖLÜM: TEHLİKELİ BÖLGE */}
                <div className="bg-[#1A0505] border border-red-900/30 rounded-[2.5rem] p-8 space-y-6 shadow-xl text-left">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={20} className="text-red-500" />
                        <h2 className="text-lg font-black text-red-500 uppercase tracking-widest">Tehlikeli Bölge</h2>
                    </div>
                    <p className="text-red-400/70 text-sm font-medium">
                        Hesabını sildiğinde profil bilgilerin ve oluşturduğun tüm linkler kalıcı olarak silinir. Bu işlemi geri alamayız.
                    </p>

                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto bg-red-500/10 border border-red-500/50 text-red-500 font-black px-8 py-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
                    >
                        <Trash2 size={16} />
                        HESABIMI KALICI OLARAK SİL
                    </button>
                </div>
            </div>

            {/* GITHUB TARZI MODAL (POP-UP) */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all">
                    <div className="bg-[#0A0A0A] border border-red-900/50 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">

                        <button
                            onClick={() => {
                                setShowDeleteModal(false);
                                setConfirmInput("");
                            }}
                            className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle size={24} className="text-red-500" />
                            <h2 className="text-xl font-black text-white tracking-tight">Kesinlikle emin misin?</h2>
                        </div>

                        <p className="text-gray-400 text-sm mb-6 font-medium">
                            Bu işlem <span className="text-red-500 font-bold">geri alınamaz</span>. Tüm verilerin, linklerin ve profilin kalıcı olarak silinecek.
                        </p>

                        <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-4 mb-6">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2">Onaylamak için şunu yazın:</p>
                            <p className="text-white font-bold select-all">{session?.user?.email}</p>
                        </div>

                        <input
                            type="text"
                            value={confirmInput}
                            onChange={(e) => setConfirmInput(e.target.value)}
                            className="w-full bg-[#080808] border border-[#1A1A1A] rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition-all font-medium mb-6"
                            placeholder={session?.user?.email || "E-posta adresin..."}
                        />

                        <button
                            onClick={handleDeleteAccount}
                            disabled={confirmInput !== session?.user?.email || isDeleting}
                            className="w-full bg-red-500 text-white font-black px-6 py-4 rounded-xl hover:bg-red-600 transition-all active:scale-[0.98] uppercase tracking-widest text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            {isDeleting ? "SİLİNİYOR..." : "SONUÇLARIN FARKINDAYIM, HESABI SİL"}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}