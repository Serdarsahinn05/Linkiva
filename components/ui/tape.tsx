import type { ComponentPropsWithoutRef, CSSProperties, ElementType } from "react";
import { cn } from "@/lib/cn";

export type TapeTone = "black" | "red" | "blue" | "green" | "yellow" | "grey";

/** Deterministic tilt in [-0.6°, 0.6°] from a seed, so server and client render the same angle. */
export function tiltFor(seed: string | undefined): string {
  if (!seed) return "0deg";
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return `${(((Math.abs(h) % 121) - 60) / 100).toFixed(2)}deg`;
}

type TapeProps<T extends ElementType> = {
  as?: T;
  tone?: TapeTone;
  /** Seed for a stable tilt; omit for a straight strip. */
  tiltSeed?: string;
  size?: "sm" | "md" | "lg";
} & Omit<ComponentPropsWithoutRef<T>, "as">;

const sizes = { sm: "min-h-7 text-xs", md: "min-h-9 text-sm", lg: "min-h-11 text-base" } as const;

/** A printed Dymo tape strip: the core material of the Etiket world (DESIGN.md §4). */
export function Tape<T extends ElementType = "span">({ as, tone = "black", tiltSeed, size = "md", className, style, ...rest }: TapeProps<T>) {
  const Component: ElementType = as ?? "span";
  return (
    <Component
      data-tone={tone === "black" ? undefined : tone}
      className={cn("tape tape-type", sizes[size], className)}
      style={{ "--tilt": tiltFor(tiltSeed), ...style } as CSSProperties}
      {...rest}
    />
  );
}

/** The product wordmark. Always Latin uppercase ("LINKIVA", never "LİNKİVA"). */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Tape lang="en" translate="no" size="sm" className={className}>
      Linkiva
    </Tape>
  );
}
