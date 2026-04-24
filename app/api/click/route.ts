import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get("linkId");

    // Parametre yoksa ana sayfaya postala
    if (!linkId) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    try {
        // 1. Veritabanından hedeflenen linki bul
        const link = await prisma.link.findUnique({
            where: { id: linkId },
        });

        if (!link || !link.url) {
            return NextResponse.redirect(new URL("/", request.url));
        }

        // 2. KULLANICIYI SOYMA OPERASYONU (Vercel Header'ları)
        const country = request.headers.get("x-vercel-ip-country") || "Unknown";
        const city = request.headers.get("x-vercel-ip-city") || "Unknown";
        const userAgent = request.headers.get("user-agent") || "Unknown";
        const referer = request.headers.get("referer") || "Direct";

        // 3. Veritabanına Yazma (Asenkron - Yönlendirmeyi Geciktirmesin Diye)
        // DİKKAT: prisma.click DEĞİL, prisma.clickEvent KULLANIYORUZ!
        Promise.all([
            prisma.clickEvent.create({
                data: {
                    linkId,
                    country,
                    city,
                    userAgent,
                    referer,
                }
            }),
            prisma.link.update({
                where: { id: linkId },
                data: { clickCount: { increment: 1 } }
            })
        ]).catch(err => console.error("Tıklama kaydedilemedi:", err));

        // 4. Sessizce asıl hedefe şutla
        // Hedef URL'nin başında http/https yoksa ekleyelim ki yönlendirme patlamasın
        const targetUrl = link.url.startsWith("http") ? link.url : `https://${link.url}`;
        return NextResponse.redirect(new URL(targetUrl));

    } catch (error) {
        console.error("API Redirect Error:", error);
        return NextResponse.redirect(new URL("/", request.url));
    }
}