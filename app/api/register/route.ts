import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
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
            // BURASI ÇOK KRİTİK: throw new Error YOK! Sadece NextResponse.json döneceğiz.
            if (existingUser.email === email) {
                return NextResponse.json({ message: "Bu e-posta zaten kullanılıyor." }, { status: 400 });
            }
            if (existingUser.username === username) {
                return NextResponse.json({ message: "Bu kullanıcı adı başkası tarafından alınmış." }, { status: 400 });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { username, email, password: hashedPassword }
        });

        return NextResponse.json({ message: "Başarılı!" }, { status: 201 });

    } catch (error: any) {
        // Hata durumunda bile JSON dönüyoruz
        return NextResponse.json({ message: error.message || "Sunucu hatası" }, { status: 500 });
    }
}