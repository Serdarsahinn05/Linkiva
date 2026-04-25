import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "@/lib/mail";
import { registerRateLimit } from "@/lib/ratelimit"; // Yeni ekledik
import { headers } from "next/headers"; // IP almak için

export async function POST(req: Request) {
    try {
        // --- RATE LIMIT KONTROLÜ (EN BAŞTA) ---
        const headerList = await headers();
        // Vercel'de gerçek IP "x-forwarded-for" header'ındadır
        const ip = headerList.get("x-forwarded-for") || "127.0.0.1";

        const { success, limit, reset, remaining } = await registerRateLimit.limit(ip);

        if (!success) {
            return NextResponse.json(
                { message: "Çok fazla deneme yaptın kral. 10 dakika sonra tekrar dene." },
                {
                    status: 429,
                    headers: {
                        "X-RateLimit-Limit": limit.toString(),
                        "X-RateLimit-Remaining": remaining.toString(),
                        "X-RateLimit-Reset": reset.toString(),
                    }
                }
            );
        }

        // --- MEVCUT KAYIT MANTIĞI ---
        const body = await req.json();
        const { username, email, password } = body;

        if (!username || !email || !password) {
            return NextResponse.json({ message: "Tüm alanları doldur!" }, { status: 400 });
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [ { email: email }, { username: username } ]
            }
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return NextResponse.json({ message: "Bu e-posta zaten kullanılıyor." }, { status: 400 });
            }
            if (existingUser.username === username) {
                return NextResponse.json({ message: "Bu kullanıcı adı başkası tarafından alınmış." }, { status: 400 });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const token = uuidv4();
        const expires = new Date(Date.now() + 3600 * 1000 * 24);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                verificationToken: token,
                tokenExpires: expires
            }
        });

        try {
            await sendVerificationEmail(email, token);
        } catch (mailError) {
            console.error("Mail gönderim hatası:", mailError);
        }

        return NextResponse.json({
            message: "Kayıt başarılı! Lütfen e-posta adresini doğrula.",
            user: { email: user.email }
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ message: error.message || "Sunucu hatası" }, { status: 500 });
    }
}