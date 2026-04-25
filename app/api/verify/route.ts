import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
        return new Response("Token bulunamadı.", { status: 400 });
    }

    // Token'a sahip kullanıcıyı bul
    const user = await prisma.user.findUnique({
        where: { verificationToken: token }
    });

    // Kullanıcı yoksa veya token süresi dolmuşsa (24 saat demiştik)
    if (!user || !user.tokenExpires || new Date() > user.tokenExpires) {
        return new Response("Geçersiz veya süresi dolmuş doğrulama linki.", { status: 400 });
    }

    // Kullanıcıyı doğrula, tokenları temizle
    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: new Date(),
            verificationToken: null,
            tokenExpires: null
        }
    });

    // İşlem bitince giriş sayfasına yönlendir, sonuna da verified=true ekle ki uyarı gösterelim
    redirect("/login?verified=true");
}