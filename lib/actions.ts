"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "@/lib/mail";

/**
 * Yeni Link Ekleme
 */
export async function createLink(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Giriş yapmalısın!");

    const title = formData.get("title") as string;
    let url = formData.get("url") as string;

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
    }

    let iconUrl = null;
    try {
        const domain = new URL(url).hostname;
        iconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
    } catch (e) {
        console.error("İkon oluşturulamadı.");
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) throw new Error("Kullanıcı bulunamadı");

    await prisma.link.create({
        data: {
            title,
            url,
            userId: user.id,
            thumbnail: iconUrl,
            order: 0
        },
    });

    revalidatePath("/dashboard");
}

/**
 * Link Silme
 */
export async function deleteLink(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Yetkin yok!");

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) throw new Error("Kullanıcı bulunamadı");

    await prisma.link.deleteMany({
        where: { id, userId: user.id }
    });

    revalidatePath("/dashboard");
}

/**
 * Link Durumu Değiştirme (Aç/Kapat)
 */
export async function toggleLinkStatus(id: string, currentState: boolean) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Yetkin yok!");

    await prisma.link.update({
        where: { id },
        data: { isActive: !currentState }
    });

    revalidatePath("/dashboard");
}

/**
 * Link Güncelleme
 */
export async function updateLink(id: string, formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Yetkin yok!");

    const title = formData.get("title") as string;
    let url = formData.get("url") as string;

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
    }

    let iconUrl = null;
    try {
        const domain = new URL(url).hostname;
        iconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
    } catch (e) {
        console.error("İkon güncellenemedi");
    }

    await prisma.link.update({
        where: { id },
        data: { title, url, thumbnail: iconUrl },
    });

    revalidatePath("/dashboard");
}

/**
 * Tıklama Sayacı
 */
export async function incrementClick(linkId: string) {
    try {
        await prisma.link.update({
            where: { id: linkId },
            data: { clickCount: { increment: 1 } }
        });
    } catch (error) {
        console.error("Tıklama hatası:", error);
    }
}

/**
 * Genel Profil ve Görünüm Güncelleme
 * (YENİ: useActionState uyumluluğu için prevState eklendi)
 */
export async function updateProfile(prevState: any, formData: FormData) {
    try {
        const session = await getServerSession(authOptions);

        // 1. YETKİ KONTROLÜ
        if (!session?.user?.email) {
            return { error: "Yetkin yok, lütfen tekrar giriş yap!" };
        }

        const usernameRaw = formData.get("username") as string;
        const fullName = formData.get("fullName") as string;
        const bio = formData.get("bio") as string;
        const avatarUrl = formData.get("avatarUrl") as string;
        const themeColor = formData.get("themeColor") as string;

        // 2. TEMİZLİK
        const cleanUsername = usernameRaw ? usernameRaw.toLowerCase().trim().replace(/\s+/g, '') : null;

        if (cleanUsername) {
            // 3. KARAKTER KONTROLÜ (REGEX)
            // Sadece a-z, 0-9, nokta ve alt çizgi.
            const usernameRegex = /^[a-z0-9._]+$/;
            if (!usernameRegex.test(cleanUsername)) {
                return { error: "Kullanıcı adı sadece harf, rakam, nokta ve alt çizgi içerebilir!" };
            }

            // 4. BENZERSİZLİK KONTROLÜ
            const existingUser = await prisma.user.findUnique({
                where: { username: cleanUsername }
            });

            if (existingUser && existingUser.email !== session.user.email) {
                return { error: "Bu kullanıcı adı başkası tarafından alınmış!" };
            }
        }

        // 5. VERİTABANI GÜNCELLEME
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                username: cleanUsername,
                fullName,
                bio,
                avatarUrl,
                themeColor
            }
        });

        // 6. CACHE TEMİZLEME
        revalidatePath("/dashboard/appearance");
        if (updatedUser.username) {
            revalidatePath(`/${updatedUser.username}`);
        }

        return { success: true, message: "Profilin başarıyla güncellendi! 🚀" };

    } catch (error: any) {
        console.error("Profil güncelleme hatası:", error);
        return { error: "Sunucu tarafında bir hata oluştu. Lütfen tekrar dene." };
    }
}

/**
 * E-posta Adresi Güncelleme (GÜVENLİ VERSİYON)
 */
export async function updateAccountEmail(newEmail: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Yetkin yok!");

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) throw new Error("Kullanıcı bulunamadı");

    // Google ile giriş yapanların ana maili Google'a bağlıdır, değiştirilemez.
    if (!user.password) {
        throw new Error("Google ile bağlı hesapların e-postası değiştirilemez.");
    }

    const cleanEmail = newEmail.toLowerCase().trim();
    if (user.email === cleanEmail) return;

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) throw new Error("Bu e-posta zaten başka bir hesaba ait!");

    // Yeni doğrulama süreci başlasın
    const token = uuidv4();
    const expires = new Date(Date.now() + 3600 * 1000 * 24); // 24 Saat

    await prisma.user.update({
        where: { email: session.user.email },
        data: {
            email: cleanEmail,
            emailVerified: null,
            verificationToken: token,
            tokenExpires: expires
        }
    });

    // Yeni maile doğrulama bağlantısını gönder
    await sendVerificationEmail(cleanEmail, token);
}

/**
 * Link Sıralamasını Güncelleme (Dnd-kit için)
 */
export async function updateLinksOrder(linkIds: string[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Yetkin yok!");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { username: true }
    });

    const updates = linkIds.map((id, index) =>
        prisma.link.update({
            where: { id },
            data: { order: index }
        })
    );

    await Promise.all(updates);

    revalidatePath("/dashboard");
    if (user?.username) {
        revalidatePath(`/${user.username}`);
    }
}

/**
 * Hesabı Komple Silme
 */
export async function deleteAccount() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Yetkin yok!");

    await prisma.user.delete({
        where: { email: session.user.email }
    });

    revalidatePath("/");
}