"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Link2, Palette, BarChart3, Settings, ExternalLink, LogOut, Home } from "lucide-react";
import { signOut } from "next-auth/react";
import QRCodeModal from "./QRCodeModal";

export default function Sidebar({ user }: { user: any }) {
    const pathname = usePathname();

    const menuItems = [
        { name: "Linklerim", icon: Link2, href: "/dashboard" },
        { name: "Görünüm", icon: Palette, href: "/dashboard/appearance" },
        { name: "İstatistikler", icon: BarChart3, href: "/dashboard/analytics" },
        { name: "Ayarlar", icon: Settings, href: "/dashboard/settings" },
    ];

    return (
        <aside className="w-72 h-screen bg-black border-r border-[#1A1A1A] flex flex-col fixed left-0 top-0 z-50">

            {/* LOGO & ANA SAYFA */}
            <div className="p-8 flex items-center justify-between">
                <Link href="/dashboard" className="text-2xl font-black text-white tracking-tighter">
                    Linkiva<span className="text-white/40">.</span>
                </Link>
                <Link href="/" title="Ana Sayfaya Git" className="text-gray-500 hover:text-white transition-colors">
                    <Home size={20} />
                </Link>
            </div>

            {/* MENÜ LİSTESİ */}
            <nav className="flex-1 px-4 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            prefetch={true}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                                isActive
                                    ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                    : "text-gray-500 hover:text-white hover:bg-[#111]"
                            }`}
                        >
                            <item.icon size={20} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* ALT ALAN: PROFİL, CANLI LİNK VE ÇIKIŞ */}
            <div className="p-4 border-t border-[#1A1A1A] space-y-4">

                {/*Link ve QR Modal artık yanyana kardeş elementler */}
                <div className="flex gap-2 w-full items-stretch">
                    <Link
                        href={`/${user?.username}`}
                        target="_blank"
                        className="flex-1 flex items-center justify-between bg-[#111] hover:bg-white text-gray-400 hover:text-black p-4 rounded-2xl transition-all border border-[#1A1A1A] shadow-lg"
                    >
                        <div className="flex flex-col text-left overflow-hidden">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Profilin Canlıda</span>
                            <span className="text-sm font-bold tracking-tight truncate">/{user?.username || "profil"}</span>
                        </div>
                        <ExternalLink size={16} className="opacity-50 flex-shrink-0 ml-2" />
                    </Link>

                    {/* QR Kod Butonumuz artık Link'in dışında, bağımsız */}
                    <QRCodeModal username={user?.username || ""} />
                </div>

                <div className="flex items-center justify-between px-2 py-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#111] border border-[#1A1A1A] flex items-center justify-center overflow-hidden shrink-0">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="bg-gray-800 w-full h-full flex items-center justify-center text-xs font-black">
                                    {user?.username?.[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col min-w-0 text-left">
                            <span className="text-sm font-bold text-white truncate">{user?.fullName || user?.username}</span>
                            <span className="text-[10px] text-gray-500 truncate">{user?.email}</span>
                        </div>
                    </div>

                    {/* ÇIKIŞ YAP BUTONU */}
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
                        title="Çıkış Yap"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </aside>
    );
}