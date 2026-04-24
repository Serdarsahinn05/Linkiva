import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// params'ı Promise olarak tanımlıyoruz
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {

    // 1. ADIM: params'ı await ile açıyoruz (Hatanın çözümü burada)
    const { id: linkId } = await params;

    try {
        // 2. Veritabanından tıklanan linki bul
        const link = await prisma.link.findUnique({ where: { id: linkId } });

        if (!link) {
            return NextResponse.json({ error: "Link bulunamadı" }, { status: 404 });
        }

        // --- Geri kalan kodlar tamamen aynı kalacak ---
        const forwardedFor = request.headers.get("x-forwarded-for");
        const ip = forwardedFor ? forwardedFor.split(',')[0] : "127.0.0.1";

        let country = "TR";
        let city = "Istanbul";

        if (ip !== "127.0.0.1" && ip !== "::1") {
            try {
                const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
                const geoData = await geoRes.json();

                if (geoData.status === "success") {
                    country = geoData.countryCode;
                    city = geoData.city;
                }
            } catch (e) {
                console.error("IP Yakalama Hatası:", e);
            }
        }

        await prisma.$transaction([
            prisma.link.update({
                where: { id: linkId },
                data: { clickCount: { increment: 1 } }
            }),
            prisma.clickEvent.create({
                data: {
                    linkId: linkId,
                    country: country,
                    city: city
                }
            })
        ]);

        const targetUrl = link.url.startsWith('http') ? link.url : `https://${link.url}`;
        return NextResponse.redirect(targetUrl);

    } catch (error) {
        console.error("Tıklama Avcısı Hatası:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}