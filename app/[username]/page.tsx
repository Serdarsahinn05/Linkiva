import { Metadata } from 'next';
import { prisma } from "@/lib/prisma";
import { User as UserIcon } from "lucide-react";
import { FaInstagram, FaGithub, FaLinkedin, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import LinkItem from "@/app/components/LinkItem";
import { headers } from "next/headers";



type Props = {
    params: Promise<{ username: string }>
};

// --- 1. SEO VE DİNAMİK OG MOTORU ---
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { username } = await params;

    const decodedUsername = decodeURIComponent(username);

    const user = await prisma.user.findUnique({
        where: { username: decodedUsername },
        select: { fullName: true, bio: true, avatarUrl: true, themeColor: true, backgroundImage: true }
    });

    // Kullanıcı yoksa (Random sallanmış linkse) Default OG ve Başlık bas
    if (!user) {
        return {
            title: "Profil Bulunamadı | Linkiva",
            description: "Böyle bir profil henüz oluşturulmamış.",
            openGraph: {
                title: "Profil Bulunamadı | Linkiva",
                description: "Böyle bir profil henüz oluşturulmamış.",
                images: [{ url: 'https://linkiva.space/linkiva_default_og.png', width: 1200, height: 630 }]
            },
            twitter: {
                card: "summary_large_image",
                images: ['https://linkiva.space/linkiva_default_og.png']
            }
        };
    }

    const ogUrl = new URL('https://linkiva.space/api/og');

    ogUrl.searchParams.set('username', decodedUsername);
    if (user.fullName) ogUrl.searchParams.set('fullName', user.fullName);
    if (user.bio) ogUrl.searchParams.set('bio', user.bio);

    ogUrl.searchParams.set('theme', user.themeColor || 'dark');

    if (user.avatarUrl) ogUrl.searchParams.set('avatar', user.avatarUrl);

    if (user.backgroundImage && user.backgroundImage.length > 10) {
        ogUrl.searchParams.set('backgroundImage', user.backgroundImage);
    }

    ogUrl.searchParams.set('v', Date.now().toString());

    return {
        title: `${user.fullName || decodedUsername} (@${decodedUsername}) | Linkiva`,
        description: user.bio || `${decodedUsername} bağlantıları.`,
        openGraph: {
            title: `${user.fullName || decodedUsername} | Linkiva`,
            images: [{ url: ogUrl.toString(), width: 1200, height: 630 }],
        },
        twitter: {
            card: "summary_large_image",
            images: [ogUrl.toString()],
        }
    };
}

const formatSocialUrl = (input: string | null | undefined, base: string) => {
    if (!input) return null;
    if (input.startsWith("http")) return input;
    return `${base}${input.startsWith("@") ? input.slice(1) : input}`;
};

// --- 2. PROFİL SAYFASI ---
export default async function ProfilePage({ params }: Props) {
    const { username } = await params;
    const decodedUsername = decodeURIComponent(username);

    const user = await prisma.user.findUnique({
        where: { username: decodedUsername },
        select: {
            id: true, username: true, fullName: true, bio: true,
            avatarUrl: true, themeColor: true, backgroundImage: true,
            instagram: true, x: true, github: true, linkedin: true, youtube: true,
            links: { where: { isActive: true }, orderBy: { order: 'asc' } }
        }
    });



    if (!user) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white p-6">
                <h1 className="text-6xl font-black mb-4 drop-shadow-lg">404</h1>
                <p className="text-gray-400 mb-8 text-center font-medium">
                    @{decodedUsername} adında bir profil henüz oluşturulmamış.
                </p>
                <a
                    href="/"
                    className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                    Linkiva'ya Dön
                </a>
            </div>
        );
    }

    // Ziyaretçi takibi
    const headersList = await headers();
    prisma.visit.create({
        data: {
            userId: user.id,
            country: headersList.get("x-vercel-ip-country") || "Unknown",
            city: headersList.get("x-vercel-ip-city") || "Unknown",
            userAgent: headersList.get("user-agent") || "Unknown",
            referer: headersList.get("referer") || "Direct"
        }
    }).catch(() => {});

    const themeConfigs: Record<string, string> = {
        dark: "bg-black",
        midnight: "bg-[#05070a]",
        sunset: "bg-gradient-to-br from-orange-600 to-rose-600",
        emerald: "bg-gradient-to-br from-emerald-600 to-teal-900",
        glass: "bg-[#050505]"
    };

    const hasBg = (user.backgroundImage && user.backgroundImage.length > 10);

    const socialPlatforms = [
        { id: 'instagram', icon: FaInstagram, url: user.instagram, baseUrl: "https://instagram.com/" },
        { id: 'x', icon: FaXTwitter, url: user.x, baseUrl: "https://x.com/" },
        { id: 'github', icon: FaGithub, url: user.github, baseUrl: "https://github.com/" },
        { id: 'linkedin', icon: FaLinkedin, url: user.linkedin, baseUrl: "https://linkedin.com/in/" },
        { id: 'youtube', icon: FaYoutube, url: user.youtube, baseUrl: "https://youtube.com/@" },
    ];

    return (
        <div className="min-h-screen w-full relative flex flex-col items-center p-6 sm:p-12 overflow-x-hidden">

            {/* --- ARKAPLAN --- */}
            {hasBg ? (
                <div className="fixed inset-0 w-full h-full z-0">
                    <img
                        src={user.backgroundImage!}
                        className="w-full h-full object-cover"
                        alt=""
                        key={user.backgroundImage}
                    />
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-[1]" />
                </div>
            ) : (
                <div className={`fixed inset-0 z-0 ${themeConfigs[user.themeColor || "dark"]}`} />
            )}

            {/* --- İÇERİK --- */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-[600px] text-white">
                <div className="flex flex-col items-center text-center mb-8">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full border-4 border-white/10 p-1 mb-6 shadow-2xl overflow-hidden bg-white/5 backdrop-blur-sm">
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/10">
                                <UserIcon size={40} className="opacity-20 text-white" />
                            </div>
                        )}
                    </div>

                    <h1 className="text-2xl font-black tracking-tight drop-shadow-lg">{user.fullName || user.username}</h1>
                    <p className="text-sm font-bold opacity-70 mt-1">@{user.username}</p>
                    {user.bio && <p className="mt-4 text-sm font-medium opacity-80 leading-relaxed max-w-sm">{user.bio}</p>}

                    {/* Sosyal Medya */}
                    <div className="flex items-center justify-center gap-5 mt-8">
                        {socialPlatforms.map((social) => {
                            const finalUrl = formatSocialUrl(social.url, social.baseUrl);
                            if (!finalUrl) return null;
                            return (
                                <a key={social.id} href={finalUrl} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-all duration-300 hover:scale-125">
                                    <social.icon size={22} />
                                </a>
                            );
                        })}
                    </div>
                </div>

                {/* Linkler */}
                <div className="w-full space-y-4">
                    {user.links.map((link) => (
                        <LinkItem key={link.id} link={link} theme={hasBg ? "dark" : (user.themeColor || "dark")} />
                    ))}
                </div>

                <footer className="mt-20 opacity-20"><span className="text-[10px] font-black italic tracking-tighter uppercase">Linkiva.</span></footer>
            </div>
        </div>
    );
}
