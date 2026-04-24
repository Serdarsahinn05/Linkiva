import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { User as UserIcon } from "lucide-react";
import LinkItem from "@/app/components/LinkItem";
import { headers } from "next/headers"; // YENİ: Ziyaretçi bilgilerini yakalamak için

export default async function ProfilePage({params}: {
    params: Promise<{ username: string }>
}) {
    const { username } = await params;

    const user = await prisma.user.findUnique({
        where: { username: username },
        include: {
            links: {
                where: { isActive: true },
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!user) notFound();

    // --- ZİYARETÇİYİ SOYMA OPERASYONU ---
    // Vercel üzerinden gelen header'ları okuyup adamın seceresini döküyoruz
    const headersList = await headers();
    const country = headersList.get("x-vercel-ip-country") || "Unknown";
    const city = headersList.get("x-vercel-ip-city") || "Unknown";
    const userAgent = headersList.get("user-agent") || "Unknown";
    const referer = headersList.get("referer") || "Direct";

    // Geliştirilmiş Ziyaret (Visit) Kaydı
    await prisma.visit.create({
        data: {
            userId: user.id,
            country,
            city,
            userAgent,
            referer
        }
    }).catch(err => console.error("Ziyaret kaydedilemedi:", err));
    // ------------------------------------

    const themeConfigs: Record<string, string> = {
        dark: "bg-black text-white",
        midnight: "bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white",
        sunset: "bg-gradient-to-br from-orange-600 to-rose-600 text-white",
        emerald: "bg-gradient-to-br from-emerald-600 to-teal-900 text-white",
        glass: "bg-[#050505] text-white"
    };

    const currentThemeClass = themeConfigs[user.themeColor || "dark"];

    return (
        <div className={`min-h-screen w-full flex flex-col items-center p-6 sm:p-12 transition-all duration-1000 ${currentThemeClass} relative overflow-hidden`}>

            {user.themeColor === 'glass' && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px]" />
                    <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]" />
                    <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-600/10 blur-[100px]" />
                </div>
            )}

            <div className="relative z-10 flex flex-col items-center w-full max-w-[600px]">
                <div className="flex flex-col items-center text-center mb-12">
                    <div className="w-24 h-24 rounded-full border-4 border-white/10 p-1 mb-6 shadow-2xl overflow-hidden bg-white/5 backdrop-blur-sm">
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <UserIcon size={40} className="opacity-20" />
                            </div>
                        )}
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">{user.fullName || `@${user.username}`}</h1>
                    {user.bio && (
                        <p className="mt-4 text-sm font-medium opacity-60 leading-relaxed max-w-sm">
                            {user.bio}
                        </p>
                    )}
                </div>

                <div className="w-full space-y-4">
                    {user.links.map((link) => (
                        <LinkItem key={link.id} link={link} theme={user.themeColor || "dark"} />
                    ))}
                </div>

                <footer className="mt-20 opacity-20 hover:opacity-50 transition-opacity cursor-default">
                    <span className="text-[10px] font-black italic tracking-tighter uppercase">Linkiva.</span>
                </footer>
            </div>
        </div>
    );
}