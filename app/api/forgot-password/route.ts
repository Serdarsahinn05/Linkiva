import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
    const { email } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ msg: "Yok" }, { status: 404 });
    const token = await generatePasswordResetToken(email);
    await sendPasswordResetEmail(token.email, token.token);
    return NextResponse.json({ msg: "OK" });
}