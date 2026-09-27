import { dnsRecord } from "@/lib/custom-domains";
import type { DomainStatus, VerificationRecord } from "@/lib/vercel-domains";

/** What Settings shows about the owner's domain: its name, whether it serves the profile, and the DNS to add. */
export type DomainView = {
  hostname: string;
  verified: boolean;
  record: ReturnType<typeof dnsRecord>;
  /** Only when Vercel asks for proof of ownership (the name is in another Vercel account). */
  verification: VerificationRecord[];
  /** After a check: the name is ours but DNS does not point at us yet. */
  misconfigured: boolean;
};

export function toDomainView(row: { hostname: string; verifiedAt: Date | null }, status: DomainStatus | null): DomainView {
  return {
    hostname: row.hostname,
    verified: row.verifiedAt !== null,
    record: dnsRecord(row.hostname),
    verification: status?.verification ?? [],
    misconfigured: status ? status.verified && status.misconfigured : false,
  };
}
