import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    const { password, token } = await req.json();
    const existingToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!existingToken || new Date(existingToken.expires) < new Date()) return NextResponse.json({ msg: "Hata" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.$transaction([
        prisma.user.update({ where: { email: existingToken.email }, data: { password: hashedPassword } }),
        prisma.passwordResetToken.delete({ where: { id: existingToken.id } })
    ]);
    return NextResponse.json({ msg: "OK" });
}