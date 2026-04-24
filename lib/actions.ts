"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Auth ayarlarımızı import ediyoruz

/**
 * Yeni Link Ekleme Operasyonu
 * Otomatik protokol ekler ve favicon ikonu oluşturur.
 */
export async function createLink(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Giriş yapmalısın!");

    const title = formData.get("title") as string;
    let url = formData.get("url") as string;

    // 1. Protokol Kontrolü: Başında http yoksa https ekle
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
    }

    // 2. Otomatik İkon (Favicon) Oluşturma
    let iconUrl = null;
    try {
        const domain = new URL(url).hostname;
        iconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
    } catch (e) {
        console.error("İkon oluşturulamadı, URL formatı bozuk olabilir.");
    }

    // 3. Kullanıcıyı Bul
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) throw new Error("Kullanıcı bulunamadı");

    // 4. Veritabanına Kayıt
    await prisma.link.create({
        data: {
            title,
            url,
            userId: user.id,
            thumbnail: iconUrl,
            clickCount: 0,
            isActive: true,
            order: 0
        },
    });

    revalidatePath("/dashboard");
}

/**
 * Link Silme Operasyonu
 */
export async function deleteLink(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Yetkin yok!");

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) throw new Error("Kullanıcı bulunamadı");

    await prisma.link.deleteMany({
        where: {
            id: id,
            userId: user.id
        }
    });

    revalidatePath("/dashboard");
}

export async function toggleLinkStatus(id: string, currentState: boolean) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Yetkin yok!");

    await prisma.link.update({
        where: { id: id },
        data: { isActive: !currentState }
    });

    revalidatePath("/dashboard");
}

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
        where: { id: id },
        data: {
            title,
            url,
            thumbnail: iconUrl
        },
    });

    revalidatePath("/dashboard");
}

export async function incrementClick(linkId: string) {
    try {
        await prisma.link.update({
            where: { id: linkId },
            data: { clickCount: { increment: 1 } }
        });
    } catch (error) {
        console.error("Tıklama sayılırken hata oluştu:", error);
    }
}

/**
 * PROFİL VE GÖRÜNÜM GÜNCELLEME
 * Username dahil tüm verileri kaydeder
 */
export async function updateProfile(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Yetkin yok!");

    const usernameRaw = formData.get("username") as string;
    const fullName = formData.get("fullName") as string;
    const bio = formData.get("bio") as string;
    const avatarUrl = formData.get("avatarUrl") as string;
    const themeColor = formData.get("themeColor") as string;

    // Kullanıcı adını temizle: Küçük harf yap ve boşlukları sil
    const cleanUsername = usernameRaw ? usernameRaw.toLowerCase().trim().replace(/\s+/g, '') : null;

    // Eğer bir username girilmişse, başkası tarafından alınıp alınmadığını kontrol et
    if (cleanUsername) {
        const existingUser = await prisma.user.findUnique({
            where: { username: cleanUsername }
        });

        if (existingUser && existingUser.email !== session.user.email) {
            throw new Error("Bu kullanıcı adı başkası tarafından alınmış!");
        }
    }

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

    revalidatePath("/dashboard/appearance");
    if (updatedUser.username) {
        revalidatePath(`/${updatedUser.username}`);
    }
}

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

export async function deleteAccount() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Yetkin yok!");

    // Cascade ayarı olduğu için User silinince ona bağlı Link ve Account verileri de otomatik silinir.
    await prisma.user.delete({
        where: { email: session.user.email }
    });

    // Kullanıcı silindiği için anasayfayı temizle
    revalidatePath("/");
}

// lib/actions.ts
export async function updateAccountEmail(newEmail: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Yetkin yok!");

    // 1. Kullanıcıyı bul
    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) throw new Error("Kullanıcı bulunamadı");

    // 2. Google hesabıysa engelle (Google hesaplarının şifresi olmaz)
    if (!user.password) {
        throw new Error("Google ile giriş yapan hesapların e-postası değiştirilemez.");
    }

    if (user.email === newEmail) return; // Aynıysa işlem yapma

    // 3. E-posta başkası tarafından alınmış mı?
    const existing = await prisma.user.findUnique({ where: { email: newEmail }});
    if (existing) throw new Error("Bu e-posta zaten başka bir hesaba ait!");

    // 4. Güncelle
    await prisma.user.update({
        where: { email: session.user.email },
        data: { email: newEmail }
    });
}