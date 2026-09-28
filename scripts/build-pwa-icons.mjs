// Builds the installable-app icons (ROADMAP Faz 13, PWA) from the same art as app/icon.svg. Run once after the mark
// changes: node scripts/build-pwa-icons.mjs. Output is committed: public/pwa/*.png and app/apple-icon.png.
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

// app/icon.svg is a rounded tile with a transparent corner. "any" icons keep that shape; maskable and Apple icons are
// full-bleed (the platform cuts its own shape), with the mark inside the 80% safe zone.
const tile = (rounded) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <radialGradient id="bg" cx="30%" cy="15%" r="95%"><stop offset="0" stop-color="#3A3F55"/><stop offset="1" stop-color="#0B0D12"/></radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="64" height="64" rx="${rounded ? 16 : 0}" fill="url(#bg)"/>
  ${rounded ? `<rect x=".75" y=".75" width="62.5" height="62.5" rx="15.25" fill="none" stroke="#FFFFFF" stroke-opacity=".18" stroke-width="1.5"/>` : ""}
  <circle cx="32" cy="32" r="16" fill="url(#glow)"/>
  <circle cx="32" cy="32" r="7" fill="#F6F7FA"/>
</svg>`;

const render = (svg, size, file) => sharp(Buffer.from(svg), { density: 72 * (size / 64) }).resize(size, size).png({ compressionLevel: 9 }).toFile(file);

await mkdir("public/pwa", { recursive: true });
await render(tile(true), 192, "public/pwa/icon-192.png");
await render(tile(true), 512, "public/pwa/icon-512.png");
await render(tile(false), 512, "public/pwa/icon-maskable-512.png");
await render(tile(false), 180, "app/apple-icon.png");
console.log("PWA icons written");
