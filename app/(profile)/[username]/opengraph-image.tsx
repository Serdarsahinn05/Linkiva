import { ImageResponse } from "next/og";
import { getPublicProfile, liveBlocks } from "@/features/profile/public";
import { profileDisplayUrl } from "@/lib/site";
import { parseBlock } from "@/lib/validation/blocks";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Linkiva";

const INK = "#141615";
const GROUND = "#E9EBEA";
const RED = "#C4262E";
const BLACK_TAPE = "#1B1C1E";

/** Archivo (condensed, heavy) as TTF: Satori cannot read woff2, and Google serves TTF to UA-less requests. */
async function loadArchivo(): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch("https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75,800")).text();
    const src = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    return src ? await (await fetch(src)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

function Tape({ text, color, rotate, fontSize }: { text: string; color: string; rotate: number; fontSize: number }) {
  return (
    <div
      style={{
        display: "flex",
        background: color,
        color: "#FAFAFA",
        padding: `${fontSize * 0.35}px ${fontSize * 0.7}px`,
        fontSize,
        letterSpacing: "0.05em",
        transform: `rotate(${rotate}deg)`,
        boxShadow: "0 3px 6px rgba(0,0,0,0.25)",
        borderRadius: 3,
        maxWidth: 1056,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getPublicProfile(decodeURIComponent(username).toLowerCase());
  const font = await loadArchivo();
  const fonts = font ? [{ name: "Archivo", data: font, weight: 800 as const, style: "normal" as const }] : [];

  const name = profile?.displayName || profile?.username || "Linkiva";
  const locale = profile?.locale === "en" ? "en" : "tr";
  const links = (profile ? liveBlocks(profile.blocks) : [])
    .map((b) => parseBlock(b.type, b.data))
    .flatMap((b) => (b?.type === "LINK" ? [b.data.title.toLocaleUpperCase(locale)] : []))
    .slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 72,
          background: GROUND,
          backgroundImage: "radial-gradient(circle at 12px 12px, rgba(20,22,21,0.09) 2px, transparent 2.5px)",
          backgroundSize: "24px 24px",
          fontFamily: font ? "Archivo" : undefined,
          color: INK,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img
              <img src={profile.avatarUrl} width={148} height={148} style={{ borderRadius: 999, border: "2px solid #C9CDCB", objectFit: "cover" }} alt="" />
            ) : null}
            <div style={{ display: "flex", fontSize: name.length > 18 ? 64 : 84, lineHeight: 1, letterSpacing: "-0.02em", maxWidth: 820 }}>{name}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "flex-start" }}>
            {links.map((title, i) => (
              <Tape key={i} text={title} color={BLACK_TAPE} rotate={[-0.8, 0.6, -0.4][i] ?? 0} fontSize={30} />
            ))}
          </div>

          <Tape text={profileDisplayUrl(profile?.username ?? username).toUpperCase()} color={RED} rotate={-1} fontSize={40} />
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
