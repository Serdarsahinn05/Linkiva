"use server";

import { updateTag } from "next/cache";
import { db } from "@/lib/db";
import { fetchPage } from "@/lib/link-preview";
import { allow } from "@/lib/ratelimit";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { normalizeSocial } from "@/lib/socials";
import { blockDataSchemas } from "@/lib/validation/blocks";
import { profileTag } from "@/features/profile/public";
import { toEditorBlock, type EditorBlock, type EditorSocials } from "@/features/editor/types";
import { readGithub, type GithubProfile } from "@/lib/github";
import { findImporter } from "./importers";
import { importedPageSchema, type ImportedPage } from "./types";

type ImportError = "unauthorized" | "unsupported" | "unreachable" | "unreadable" | "empty" | "tooMany" | "invalid" | "notFound" | "unknown";
export type ImportResult<T> = { ok: true; data: T } | { ok: false; error: ImportError };

export type AppliedImport = {
  blocks: EditorBlock[];
  /** Platforms that were empty and got filled. */
  socials: EditorSocials;
  /** Set only when the profile's own field was empty. */
  displayName?: string;
  bio?: string;
  /** Items that did not pass validation and were left out. */
  skipped: number;
};

/** Repositories as project cards, plus the GitHub account as a social link. Texts are trimmed to the block limits. */
function githubToImport(github: GithubProfile, login: string): ImportedPage {
  return {
    displayName: github.name ?? undefined,
    bio: github.bio ?? undefined,
    socials: [{ platform: "GITHUB", value: login }],
    items: github.repos.map((r) => ({
      kind: "PROJECT" as const,
      title: r.name.slice(0, 80),
      desc: r.description?.slice(0, 200) || undefined,
      repo: r.url,
      url: r.homepage ?? undefined,
      tags: (r.topics.length ? r.topics : r.language ? [r.language.toLowerCase()] : []).slice(0, 5).join(", ") || undefined,
      stars: r.stars > 0 ? String(r.stars) : undefined,
    })),
  };
}

const fail = (error: ImportError): { ok: false; error: ImportError } => ({ ok: false, error });

async function run<T>(body: (user: { id: string }) => Promise<ImportResult<T>>): Promise<ImportResult<T>> {
  try {
    return await body(await requireUser());
  } catch (error) {
    if (error instanceof UnauthorizedError) return fail("unauthorized");
    console.error("import failed", error);
    return fail("unknown");
  }
}

/** Reads another bio-link page for the owner to review. Writes nothing. Only allow-listed hosts are fetched. */
export async function readImport(input: string): Promise<ImportResult<ImportedPage>> {
  return run(async (user) => {
    if (typeof input !== "string" || input.length > 2048) return fail("invalid");
    const importer = findImporter(input);
    if (!importer) return fail("unsupported");
    if (!(await allow("import", user.id, 3, 600))) return fail("tooMany");

    if (importer.source === "github") {
      const github = await readGithub(importer.login);
      if (!github) return fail("unreachable");
      if (github.repos.length === 0) return fail("empty");
      return { ok: true, data: githubToImport(github, importer.login) };
    }

    // Linktree pages run to a few hundred KB of markup; the profile data sits at the end.
    const page = await fetchPage(importer.url, { maxBytes: 1024 * 1024, hosts: importer.hosts });
    if (!page) return fail("unreachable");
    if (page.truncated) return fail("unreadable");
    const imported = importer.parse(page.html);
    if (!imported) return fail("unreadable");
    if (imported.items.length === 0 && imported.socials.length === 0) return fail("empty");
    return { ok: true, data: imported };
  });
}

/**
 * Writes what the owner kept from readImport: blocks go after the existing ones, socials only fill empty platforms,
 * name and bio only fill empty fields. Every item passes the same schemas as the editor.
 */
export async function applyImport(input: unknown): Promise<ImportResult<AppliedImport>> {
  return run(async (user) => {
    const parsed = importedPageSchema.safeParse(input);
    if (!parsed.success) return fail("invalid");
    if (!(await allow("import-apply", user.id, 5, 600))) return fail("tooMany");
    const page = parsed.data;

    const profile = await db.profile.findUnique({
      where: { userId: user.id },
      select: { id: true, username: true, displayName: true, bio: true, socials: { select: { platform: true } } },
    });
    if (!profile) return fail("notFound");

    let skipped = 0;
    const data: { type: "LINK" | "HEADER" | "EMBED" | "PROJECT"; data: object }[] = [];
    for (const item of page.items) {
      const result =
        item.kind === "LINK"
          ? blockDataSchemas.LINK.safeParse({ title: item.title, url: item.url })
          : item.kind === "HEADER"
            ? blockDataSchemas.HEADER.safeParse({ text: item.text })
            : item.kind === "PROJECT"
              ? blockDataSchemas.PROJECT.safeParse({ title: item.title, desc: item.desc, repo: item.repo, url: item.url, tags: item.tags, stars: item.stars })
              : blockDataSchemas.EMBED.safeParse({ url: item.url });
      if (result.success) data.push({ type: item.kind, data: result.data });
      else skipped++;
    }

    const taken = new Set(profile.socials.map((s) => s.platform));
    const newSocials = page.socials.flatMap(({ platform, value }) => {
      const handle = taken.has(platform) ? null : normalizeSocial(platform, value);
      return handle ? [{ profileId: profile.id, platform, handle, position: 0 }] : [];
    });

    const displayName = !profile.displayName && page.displayName?.trim() ? page.displayName.trim().slice(0, 60) : undefined;
    const bio = !profile.bio && page.bio?.trim() ? page.bio.trim().slice(0, 160) : undefined;

    const last = await db.block.findFirst({ where: { profileId: profile.id }, orderBy: { position: "desc" }, select: { position: true } });
    const start = (last?.position ?? -1) + 1;
    const [blocks] = await db.$transaction([
      db.block.createManyAndReturn({ data: data.map((b, i) => ({ profileId: profile.id, type: b.type, data: b.data, position: start + i })) }),
      db.socialLink.createMany({ data: newSocials, skipDuplicates: true }),
      db.profile.update({ where: { id: profile.id }, data: { ...(displayName && { displayName }), ...(bio && { bio }) } }),
    ]);

    updateTag(profileTag(profile.username));
    return {
      ok: true,
      data: {
        blocks: blocks.sort((a, b) => a.position - b.position).map(toEditorBlock),
        socials: Object.fromEntries(newSocials.map((s) => [s.platform, s.handle])),
        displayName,
        bio,
        skipped,
      },
    };
  });
}
