import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppearanceForm from "./AppearanceForm";

export default async function AppearancePage() {
    const session = await getServerSession(authOptions);
    const user = await prisma.user.findUnique({
        where: { email: session?.user?.email || "" }
    });

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div>
                <h1 className="text-4xl font-black text-white tracking-tight">Görünüm.</h1>
                <p className="text-gray-500 mt-2 font-medium">Profilinin kimliğini ve tarzını buradan belirle.</p>
            </div>

            {/* Formu buraya çağırdık */}
            <AppearanceForm user={user} />

            <div className="bg-[#111] border border-[#1A1A1A] rounded-[2rem] p-6 text-center">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest italic">
                    Linkiva <span className="text-white/20">|</span> Profiliniz <span className="text-white italic">/{user?.username || '...'}</span> adresinde güncellenecek.
                </p>
            </div>
        </div>
    );
}