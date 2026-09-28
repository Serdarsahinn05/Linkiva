import { getTranslations } from "next-intl/server";
import { site } from "@/lib/site";

/** The sample profile on the landing phone, from messages (landing.sample* and landing.your*). */
export type LandingSample = {
  host: string;
  handle: string;
  initials: string;
  name: string;
  bio: string;
  links: string[];
  capture: string;
  /** Shown once the visitor types a username: their name with generic links. */
  yours: { bio: string; links: string[]; capture: string };
};

/** The landing's sample profile (the maker's own), labelled as a sample on the page. */
export async function landingSample(): Promise<LandingSample> {
  const tl = await getTranslations("landing");
  const name = tl("sampleName");
  return {
    host: site.host,
    handle: "serdar",
    initials: name
      .split(/\s+/)
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2),
    name,
    bio: tl("sampleBio"),
    // Arrays in messages come back untyped from raw(); these two are string lists by construction.
    links: tl.raw("sampleLinks") as string[],
    capture: tl("sampleCapture"),
    yours: { bio: tl("yourBio"), links: tl.raw("yourLinks") as string[], capture: tl("yourCapture") },
  };
}
