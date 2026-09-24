import { ImageResponse } from "next/og";
import { getPublicProfile, liveBlocks } from "@/features/profile/public";
import { profileDisplayUrl } from "@/lib/site";
import { parseBlock } from "@/lib/validation/blocks";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Linkiva";

const BG = "#0B0D12";
const INK = "#F6F7FA";
const INK_2 = "#B4B8C4";
const GLASS = "rgba(255,255,255,0.07)";
const EDGE = "rgba(255,255,255,0.14)";

/** Geist as TTF: Satori cannot read woff2, and Google serves TTF to UA-less requests. */
async function loadGeist(weight: 400 | 600): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Geist:wght@${weight}`)).text();
    const src = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    return src ? await (await fetch(src)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

/** The share card mirrors the "Cam" profile: dark ground, soft light, one glass card. */
export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getPublicProfile(decodeURIComponent(username).toLowerCase());
  const [regular, semibold] = await Promise.all([loadGeist(400), loadGeist(600)]);
  const fonts = [
    ...(regular ? [{ name: "Geist", data: regular, weight: 400 as const, style: "normal" as const }] : []),
    ...(semibold ? [{ name: "Geist", data: semibold, weight: 600 as const, style: "normal" as const }] : []),
  ];

  const name = profile?.displayName || profile?.username || "Linkiva";
  const links = (profile ? liveBlocks(profile.blocks) : [])
    .map((b) => parseBlock(b.type, b.data))
    .flatMap((b) => (b?.type === "LINK" ? [b.data.title] : []))
    .slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BG,
          backgroundImage: "radial-gradient(circle at 20% 0%, rgba(120,120,190,0.35), transparent 55%), radial-gradient(circle at 90% 10%, rgba(90,130,170,0.28), transparent 50%)",
          fontFamily: fonts.length ? "Geist" : undefined,
          color: INK,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 1040,
            height: 470,
            padding: 56,
            gap: 56,
            borderRadius: 40,
            background: GLASS,
            border: `1px solid ${EDGE}`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 40px 80px -30px rgba(0,0,0,0.7)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img
                <img src={profile.avatarUrl} width={120} height={120} style={{ borderRadius: 999, border: `2px solid ${EDGE}`, objectFit: "cover" }} alt="" />
              ) : null}
              <div style={{ display: "flex", fontSize: name.length > 18 ? 58 : 72, fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.02 }}>{name}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: INK_2 }}>
              <div style={{ display: "flex", width: 12, height: 12, borderRadius: 999, background: INK, boxShadow: `0 0 16px ${INK}` }} />
              {profileDisplayUrl(profile?.username ?? username)}
            </div>
          </div>
          {links.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 16, width: 380 }}>
              {links.map((title, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "22px 28px",
                    borderRadius: 22,
                    background: GLASS,
                    border: `1px solid ${EDGE}`,
                    fontSize: 26,
                    fontWeight: 400,
                  }}
                >
                  {title.length > 26 ? `${title.slice(0, 25)}…` : title}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
