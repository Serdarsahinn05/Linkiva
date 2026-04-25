import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const usernameParam = searchParams.get('username');

        if (!usernameParam) {
            return new Response("Username is required", { status: 400 });
        }

        const decodedUsername = decodeURIComponent(usernameParam);

        const user = await prisma.user.findUnique({
            where: { username: decodedUsername },
            select: {
                fullName: true,
                bio: true,
                avatarUrl: true,
                themeColor: true,
                backgroundImage: true
            }
        });

        if (!user) {
            return new ImageResponse(
                (
                    <div style={{
                        height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000'
                    }}>
                        <div style={{
                            display: 'flex', color: 'white', fontSize: 80, fontWeight: 900,
                            fontStyle: 'italic', letterSpacing: '-0.05em'
                        }}>
                            LINKIVA.
                        </div>
                        <div style={{
                            display: 'flex', color: 'rgba(255,255,255,0.4)', fontSize: 30,
                            marginTop: 20, fontWeight: 500
                        }}>
                            Kendi bağlantılarını tek tıkla oluştur.
                        </div>
                    </div>
                ),
                { width: 1200, height: 630 }
            );
        }

        const fullName = user.fullName || decodedUsername;
        const bio = user.bio || '';
        const theme = searchParams.get('theme') || user.themeColor || 'dark';

        const bgImage = (user.backgroundImage && user.backgroundImage.length > 10) ? user.backgroundImage : null;

        const avatar = (user.avatarUrl && user.avatarUrl.startsWith('http')) ? user.avatarUrl : null;


        // Gradyanlar için backgroundImage, solid renkler için backgroundColor kullanmalıyız.
        const themeStyles: Record<string, any> = {
            dark: { backgroundColor: '#000000' },
            midnight: { backgroundImage: 'linear-gradient(135deg, #111827, #000000)' },
            sunset: { backgroundImage: 'linear-gradient(135deg, #ea580c, #e11d48)' },
            emerald: { backgroundImage: 'linear-gradient(135deg, #059669, #134e4a)' },
            glass: { backgroundColor: '#0a0a0a' },
        };

        const currentStyle = themeStyles[theme] || themeStyles.dark;

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#000000',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* KATMAN 1: Arkaplan */}
                    {bgImage ? (
                        <img
                            src={bgImage}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', ...currentStyle }}
                        />
                    )}

                    {/* KATMAN 2: Karartma Katmanı (background yerine backgroundColor yapıldı) */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', backgroundColor: 'rgba(0, 0, 0, 0.4)' }} />

                    {/* KATMAN 3: İçerik */}
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

                        {/* LINKIVA LOGO */}
                        <div style={{ position: 'absolute', top: -160, left: -440, color: 'white', opacity: 0.4, fontSize: 26, fontWeight: 900, fontStyle: 'italic', display: 'flex' }}>
                            LINKIVA.
                        </div>

                        {/* AVATAR */}
                        <div style={{ display: 'flex', marginBottom: 30 }}>
                            {avatar ? (
                                <img
                                    src={avatar}
                                    style={{ width: 190, height: 190, borderRadius: 100, border: '6px solid rgba(255,255,255,0.2)', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{ width: 190, height: 190, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '6px solid rgba(255,255,255,0.1)' }}>
                                    <span style={{ fontSize: 90 }}>👤</span>
                                </div>
                            )}
                        </div>

                        {/* METİN ALANI */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ fontSize: 80, fontWeight: 900, color: 'white', textAlign: 'center', display: 'flex', letterSpacing: '-0.03em', textShadow: '0 4px 15px rgba(0,0,0,0.6)' }}>
                                {fullName}
                            </div>
                            <div style={{ fontSize: 34, color: 'rgba(255,255,255,0.8)', marginTop: 10, fontWeight: 700, display: 'flex', textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
                                @{decodedUsername}
                            </div>
                        </div>

                        {/* BIO */}
                        {bio && (
                            <div style={{ display: 'flex', fontSize: 30, color: 'rgba(255,255,255,0.6)', marginTop: 35, textAlign: 'center', maxWidth: '85%', justifyContent: 'center', lineHeight: 1.3 }}>
                                {bio}
                            </div>
                        )}
                    </div>
                </div>
            ),
            { width: 1200, height: 630 }
        );
    } catch (e: any) {
        return new Response(`OG API Hatası: ${e.message}`, { status: 500 });
    }
}