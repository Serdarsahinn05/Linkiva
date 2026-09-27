import { ImageResponse } from "next/og";
import { renderSVG } from "uqr";
import { getPublicProfile } from "@/features/profile/public";
import { forImageResponse } from "@/lib/card-image";
import { loadGeist } from "@/lib/og-fonts";
import { profileDisplayUrl, profileUrl } from "@/lib/site";
import { isStoryLook } from "@/lib/story";
import { GROUND, resolveAppearance, type SceneKey } from "@/themes";

const W = 1080;
const H = 1920;
/** Instagram draws its own bars over the top and bottom 250px of a story (DESIGN.md §7 Hikâye kartı). */
const SAFE = 250;

/** sRGB stand-ins for the scene lights in globals.css (Satori has no oklch). */
const LIGHTS: Record<SceneKey, { light: [string, string]; dark: [string, string] }> = {
  cam: { light: ["rgba(214,212,240,0.9)", "rgba(206,228,240,0.8)"], dark: ["rgba(112,122,176,0.6)", "rgba(76,122,152,0.5)"] },
  gece: { light: ["rgba(150,130,220,0.55)", "rgba(110,150,200,0.45)"], dark: ["rgba(104,84,170,0.6)", "rgba(56,96,130,0.55)"] },
  kum: { light: ["rgba(236,208,168,0.85)", "rgba(240,210,196,0.8)"], dark: ["rgba(110,84,52,0.6)", "rgba(88,64,50,0.55)"] },
  accent: { light: ["rgba(0,0,0,0)", "rgba(0,0,0,0)"], dark: ["rgba(0,0,0,0)", "rgba(0,0,0,0)"] },
  none: { light: ["rgba(0,0,0,0)", "rgba(0,0,0,0)"], dark: ["rgba(0,0,0,0)", "rgba(0,0,0,0)"] },
};

/**
 * A 1080×1920 story image of the profile: its ground and light, avatar, name, address and a QR code
 * (ROADMAP Faz 10). The QR is always black on white, whatever the theme, so every camera can read it.
 * `?look=dark|light` forces the theme's dark or light ground without the background photo (lib/story.ts).
 */
export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getPublicProfile(decodeURIComponent(username).toLowerCase());
  if (!profile?.isPublished) return new Response("Not found", { status: 404 });

  const look = resolveAppearance(profile.theme, profile.appearance);
  const requested = new URL(request.url).searchParams.get("look");
  const choice = isStoryLook(requested) ? requested : "profile";
  // As the profile: a page that follows the visitor's system is drawn dark (a story is seen in the app's dark UI).
  const mode = choice === "profile" ? (look.mode === "light" ? "light" : "dark") : choice;
  const ink = mode === "light" ? "#15171C" : "#F6F7FA";
  const ink2 = mode === "light" ? "#4F5359" : "#ADB1B8";
  const glass = mode === "light" ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.07)";
  const edge = mode === "light" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.16)";
  const [l1, l2] = look.scene === "accent" && look.accent ? [`${look.accent}66`, `${look.accent}33`] : LIGHTS[look.scene][mode];
  // Each light fades to its own colour at zero alpha: Satori blends towards "transparent" as transparent black, which
  // left a grey band on light grounds.
  const fade = (color: string) => (color.startsWith("#") ? `${color.slice(0, 7)}00` : color.replace(/[\d.]+\)$/, "0)"));

  const [regular, semibold, mono] = await Promise.all([loadGeist("Geist", 400), loadGeist("Geist", 600), loadGeist("Geist Mono", 500)]);
  const fonts = [
    ...(regular ? [{ name: "Geist", data: regular, weight: 400 as const, style: "normal" as const }] : []),
    ...(semibold ? [{ name: "Geist", data: semibold, weight: 600 as const, style: "normal" as const }] : []),
    ...(mono ? [{ name: "Geist Mono", data: mono, weight: 500 as const, style: "normal" as const }] : []),
  ];

  // The panel's QR component (qrcode.react) needs React hooks, which Satori cannot run: uqr gives the SVG directly.
  const qr = renderSVG(profileUrl(profile.username), { ecc: "M", border: 0 });
  const qrSrc = `data:image/svg+xml;base64,${Buffer.from(qr).toString("base64")}`;
  const [avatar, background] = await Promise.all([
    forImageResponse(profile.avatarUrl, 480, "png"),
    choice === "profile" ? forImageResponse(look.backgroundUrl, W, "jpeg") : null,
  ]);
  const name = profile.displayName || profile.username;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: `${SAFE}px 96px`,
          background: GROUND[mode],
          backgroundImage: `radial-gradient(circle at 15% 12%, ${l1}, ${fade(l1)} 55%), radial-gradient(circle at 90% 30%, ${l2}, ${fade(l2)} 50%)`,
          fontFamily: fonts.length ? "Geist" : undefined,
          color: ink,
          position: "relative",
        }}
      >
        {background && (
          <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img */}
            <img src={background} width={W} height={H} style={{ objectFit: "cover" }} alt="" />
            {/* Satori has no `inset`: the dim layer is placed with explicit edges. */}
            <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex", background: GROUND[mode], opacity: look.backgroundDim / 100 }} />
          </div>
        )}
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img
          <img src={avatar} width={240} height={240} style={{ borderRadius: 999, border: `3px solid ${edge}`, objectFit: "cover" }} alt="" />
        ) : (
          // No photo: the name's first letter in the same glass ring.
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 240,
              height: 240,
              borderRadius: 999,
              background: glass,
              border: `3px solid ${edge}`,
              fontSize: 104,
              fontWeight: 600,
              color: ink2,
            }}
          >
            {name.slice(0, 1).toLocaleUpperCase(profile.locale)}
          </div>
        )}
        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: name.length > 16 ? 76 : 96,
            fontWeight: 600,
            letterSpacing: "-0.035em",
            lineHeight: 1.02,
            textAlign: "center",
          }}
        >
          {name}
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 38, color: ink2, fontFamily: mono ? "Geist Mono" : undefined }}>{profileDisplayUrl(profile.username)}</div>
        <div
          style={{
            display: "flex",
            marginTop: 96,
            padding: 28,
            borderRadius: 48,
            background: glass,
            border: `1px solid ${edge}`,
            boxShadow: "0 40px 80px -30px rgba(0,0,0,0.55)",
          }}
        >
          <div style={{ display: "flex", padding: 36, borderRadius: 28, background: "#FFFFFF" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img */}
            <img src={qrSrc} width={440} height={440} alt="" />
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts, headers: { "Cache-Control": "public, max-age=300" } },
  );
}
