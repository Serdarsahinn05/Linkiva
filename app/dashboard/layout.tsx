import Sidebar from "@/app/components/Sidebar"; // Dosya yoluna dikkat
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession();

    // Veritabanından kullanıcıyı çekiyoruz (Username ve Avatar için)
    const user = await prisma.user.findUnique({
        where: { email: session?.user?.email || "" }
    });

    return (
        <div className="flex bg-black min-h-screen text-white">
            {/* Sidebar'ı buraya çaktık */}
            <Sidebar user={user} />

            {/* Sayfaların içeriği Sidebar'ın yanından başlasın diye ml-72 verdik */}
            <main className="flex-1 ml-72 p-12">
                {children}
            </main>
        </div>
    );
}