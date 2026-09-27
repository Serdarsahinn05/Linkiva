/**
 * A Google font as TTF for Satori (next/og), which cannot read woff2; Google serves TTF to UA-less requests.
 * Returns null when the font cannot be fetched: images then fall back to Satori's built-in font.
 */
export async function loadGeist(family: "Geist" | "Geist Mono", weight: 400 | 500 | 600): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(" ", "+")}:wght@${weight}`)).text();
    const src = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    return src ? await (await fetch(src)).arrayBuffer() : null;
  } catch {
    return null;
  }
}
