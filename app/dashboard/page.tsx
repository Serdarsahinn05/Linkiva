import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardClient from "@/app/components/DashboardClient";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    // 1. Session yoksa kullanıcıyı giriş sayfasına yönlendir
    if (!session?.user?.email) {
        redirect("/login");
    }

    // 2. Veritabanından kullanıcıyı ve linklerini çek
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            links: {
                orderBy: {
                    order: 'asc' // Linkleri sıralı getir
                }
            }
        }
    });

    // 3. EĞER KULLANICI ADI YOKSA (Google ile ilk kez girmişse):
    if (!user?.username) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-md mx-auto text-center space-y-6 px-4">
                <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-8 rounded-[2rem] shadow-2xl w-full">
                    <h2 className="text-3xl font-black text-white italic mb-2 tracking-tight">Son bir adım!</h2>
                    <p className="text-gray-500 mb-8 font-medium">Profilini oluşturmak ve linklerini paylaşmak için kendine harika bir kullanıcı adı seçmelisin.</p>

                    <Link
                        href="/dashboard/appearance"
                        className="block w-full bg-white text-black font-black p-4 rounded-2xl hover:bg-gray-200 active:scale-[0.98] transition-all uppercase tracking-tighter"
                    >
                        KULLANICI ADI SEÇ
                    </Link>
                </div>
            </div>
        );
    }

    // 4. Her şey tamamsa (username varsa) normal link ekleme panelini göster
    return <DashboardClient initialLinks={user?.links || []} />;
}