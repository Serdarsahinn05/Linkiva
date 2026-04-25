import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 Gün
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,

            allowDangerousEmailAccountLinking: true,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email veya Username", type: "text" },
                password: { label: "Şifre", type: "password" }
            },
            async authorize(credentials) {
                // Bu fonksiyon SADECE e-posta/şifre girişinde çalışır
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Giriş bilgileri eksik!");
                }

                const identifier = credentials.email.toLowerCase().trim();

                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: identifier },
                            { username: identifier }
                        ]
                    }
                });

                if (!user || !user.password) {
                    throw new Error("Böyle bir hesap bulunamadı veya Google ile kayıt olunmuş.");
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                if (!isPasswordValid) {
                    throw new Error("Şifre hatalı!");
                }

                // E-posta doğrulanmamışsa şifreyle girişi engelle
                if (!user.emailVerified) {
                    throw new Error("Lütfen giriş yapmadan önce e-posta adresinizi doğrulayın! Mail kutunuzu kontrol edin.");
                }

                return user;
            }
        })
    ],
    callbacks: {
        // --- YENİ EKLENEN KISIM: OTOMATİK ONAY ---
        async signIn({ user, account }) {
            // Eğer Google ile giriliyorsa ve mail onaylı değilse, otomatik onayla
            if (account?.provider === "google" && user.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email }
                });

                if (dbUser && !dbUser.emailVerified) {
                    await prisma.user.update({
                        where: { id: dbUser.id },
                        data: { emailVerified: new Date() }
                    });
                }
            }
            return true;
        },

        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token) {
                (session.user as any).id = token.id;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};