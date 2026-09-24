import Link from "next/link";
import { Wordmark } from "@/components/ui/tape";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pegboard flex min-h-dvh flex-col px-4 py-6 sm:px-8">
      <header>
        <Link href="/" className="inline-block">
          <Wordmark />
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center pt-10 pb-16 sm:items-center sm:pt-0">
        <div className="w-full max-w-[26rem] rounded-[var(--radius-panel)] border border-hairline bg-panel p-6 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
