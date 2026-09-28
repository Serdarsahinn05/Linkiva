import { ArrowRight } from "lucide-react";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { site } from "@/lib/site";

/** "linkiva.space/ [username] →": a plain GET form to sign-up, works without JavaScript (landing, profile 404). */
export function ClaimForm({
  id,
  label,
  placeholder,
  cta,
  defaultValue,
  compact,
}: {
  id: string;
  label: string;
  placeholder: string;
  cta: string;
  defaultValue?: string;
  /** Arrow-only button at every width, so the address stays readable inside a narrow card. */
  compact?: boolean;
}) {
  return (
    <form action="/register" method="get" className="glass-float liquid flex w-full max-w-xl items-center gap-1 rounded-full p-1.5 pl-5">
      <label htmlFor={id} lang="en" translate="no" className="min-w-0 truncate text-[0.9375rem] text-ink-3 sm:text-base">
        {site.host}/
      </label>
      <input
        id={id}
        name="username"
        aria-label={label}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        maxLength={30}
        className="h-12 min-w-28 flex-1 bg-transparent text-[0.9375rem] font-medium text-ink placeholder:text-ink-3 focus-visible:outline-none sm:text-base"
      />
      <button type="submit" className={cn(buttonBase, buttonVariants.primary, buttonSizes.lg, "shrink-0 px-5")}>
        <span className={compact ? "sr-only" : "max-sm:sr-only"}>{cta}</span>
        <ArrowRight size={18} aria-hidden />
      </button>
    </form>
  );
}

// Also served at /en (app/(site)/en); the language comes from the address (i18n/marketing.ts).
