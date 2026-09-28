import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";

/** Landing "free" rows (landing.free.*): one glass panel, a green check per row (DESIGN.md §7 Landing). */
export async function FeatureRows({ keys }: { keys: readonly string[] }) {
  const tl = await getTranslations("landing");
  return (
    <ul className="glass w-full max-w-md divide-y divide-glass-edge rounded-[28px] px-2">
      {keys.map((key) => {
        const [title, body] = tl.raw(`free.${key}`) as [string, string]; // each free.* entry is [title, body]
        return (
          <li key={key} className="flex items-start gap-4 px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{title}</p>
              <p className="text-[0.9375rem] text-ink-2">{body}</p>
            </div>
            <span className="neon mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-positive">
              <Check size={15} strokeWidth={2.5} aria-hidden />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
