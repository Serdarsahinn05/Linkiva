// Removes reported content from the live site (docs/private/DEPLOY.md → İçerik kaldırma). Calls /api/takedown.
//
//   node scripts/takedown.mjs unpublish <username>       page off the air (the owner can publish again)
//   node scripts/takedown.mjs remove-images <username>   profile photo + background image, files deleted
//   node scripts/takedown.mjs remove-block <blockId>     one block, with its uploaded image
//
// Needs TAKEDOWN_SECRET (the value set in Vercel) and TAKEDOWN_URL (the site's address, e.g. the production URL).

const [action, target] = process.argv.slice(2);
const actions = { unpublish: "username", "remove-images": "username", "remove-block": "blockId" };
const { TAKEDOWN_SECRET: secret, TAKEDOWN_URL: base } = process.env;

if (!actions[action] || !target) {
  console.error("Usage: node scripts/takedown.mjs <unpublish|remove-images> <username>\n       node scripts/takedown.mjs remove-block <blockId>");
  process.exit(1);
}
if (!secret || !base) {
  console.error("Set TAKEDOWN_SECRET and TAKEDOWN_URL first (see docs/private/DEPLOY.md → İçerik kaldırma).");
  process.exit(1);
}

const response = await fetch(new URL("/api/takedown", base), {
  method: "POST",
  headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
  body: JSON.stringify({ action, [actions[action]]: target }),
});
const body = await response.text();
console.log(response.status, body);
process.exit(response.ok ? 0 : 1);
