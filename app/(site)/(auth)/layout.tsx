import Link from "next/link";
import { Wordmark } from "@/components/ui/surface";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-6 sm:px-8">
      <header className="py-2">
        <Link href="/" className="inline-block">
          <Wordmark />
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center pt-8 pb-16 sm:items-center sm:pt-0">
        <div className="glass w-full max-w-[26rem] rounded-[28px] p-6 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
