# AGENTS.md: Linkiva

Bu dosya, bu depoda çalışan her kodlama ajanı (Claude Code, Codex, Cursor, Copilot…) ve geliştirici için ortak talimatları içerir.

## Proje

**Linkiva**, Türkçe öncelikli (TR + EN) ücretsiz bir bio-link platformudur. Kullanıcı `linkiva.space/<kullanıcıadı>` adresinde tipli bloklardan (link, başlık, metin, embed, e-posta toplama…) oluşan bir sayfa kurar, görünümünü özelleştirir ve çerezsiz, bot filtreli analitiği izler. Temel iddiası şudur: **rakiplerin premium'da sattığı her şey burada ücretsiz.**

| Belge | Ne için |
|---|---|
| [PRODUCT.md](PRODUCT.md) | Kullanıcılar, amaç, konumlandırma, ilkeler (ürün gerçeği) |
| [DESIGN.md](DESIGN.md) | Görsel sistem: token'lar, tipografi, bileşen dili, temalar (**tasarım otoritesi**) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stack, klasör yapısı, veri modeli, auth, takip hattı, i18n |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Fazlar, kabul kriterleri, backlog |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Yayın adımları: Supabase, Vercel env, Blob, Resend, Google OAuth, posta kutusu |
| [docs/AUDIT.md](docs/AUDIT.md) | Eski (v1) sistemin denetimi, yeniden yapılmaması gereken hatalar |

> **Durum (2026-09-24):** v2 yeniden kurulumu onaylandı ve `rebuild/v2` dalında sürüyor. v1 kodu `HEAD 53b1dcc` / `legacy-v1` etiketinde duruyor. Kod tarafı bitti (Faz 0–5, işlem mailleri dahil). Sırada kullanıcının preview denemesi ve `docs/DEPLOY.md` adımları var; `master`'a birleştirme kullanıcı onayıyla. Bir işe başlamadan önce ROADMAP'te hangi fazda olunduğuna bak.

## Stack

Next.js 16.3 (App Router, React 19.3) · TypeScript strict · Tailwind CSS v4 · Prisma 7 + PostgreSQL (Supabase) · Better Auth · zod · next-intl · Resend · Upstash Redis · Vercel Blob · @dnd-kit · recharts · lucide-react (+ react-icons yalnızca marka ikonları) · Vitest + Playwright · Vercel.

## Komutlar

```bash
docker compose up -d   # yerel Postgres (localhost:54329)
npm install
npm run dev            # http://localhost:3000
npm run check          # lint + typecheck + unit + integration: commit öncesi zorunlu (docker DB açık olmalı)
npm run test:integration   # gerçek yerel DB ile (sahiplik vb.)
PW_CHANNEL=chrome npm run test:e2e   # Playwright (kurulu Chrome ile)
PW_PROD=1 PW_CHANNEL=chrome npm run test:e2e   # production build üzerinde (önce npm run build)
npm run db:migrate -- --name <ad>   # şema değişikliği (asla `db push` değil)
npm run db:studio
npm run build
```

## Kod kuralları

**Güvenlik (pazarlık yok)**
- Her server action ve route handler: `requireSession()` → zod `parse` → kaydı **sahiplik filtresiyle** bul (`where: { id, profile: { userId } }`). Sadece "giriş yapmış mı" kontrolü yetki sayılmaz (bkz. AUDIT S1).
- Kullanıcıdan gelen URL'ler şema beyaz listesinden geçer: `https:`, `http:`, `mailto:`, `tel:`.
- Hata mesajları hesabın var olup olmadığını sızdırmaz. İç hata mesajı istemciye dönmez.
- Yeni üst seviye route eklersen `lib/validation/username.ts` içindeki rezerve listeye ekle. Senkron testi bunu yakalar.
- `.env` asla commit edilmez. Lokal URL için `.env.local` kullanılır. **Dikkat:** v1'den kalan `.env` canlı Supabase DB'sini gösteriyor, v2 için yeni DB bağlanmadan `db:migrate` çalıştırma. Yeni env değişkeni hem `lib/env.ts`'e hem `.env.example`'a eklenir.

**Veri**
- Şema değişikliği her zaman migration ile yapılır (`migrate dev`). `db push` kullanma, v1'de şema ile migration bu yüzden ayrıştı (AUDIT B2).
- **Ajanlar için:** `migrate dev` etkileşimli onay bekleyip takılabilir. SQL'i elle (`prisma/migrations/<zaman>_<ad>/migration.sql`) ya da `prisma migrate diff` ile yaz, ardından `prisma migrate deploy` + `prisma generate` çalıştır.
- Tıklama ve görüntülenme sayıları `Event` tablosundan hesaplanır. Sayaç kolonu ekleme.
- Public profil render'ında DB'ye yazma. Takip sadece `/api/e` ve `/l/[blockId]` üzerinden yapılır.

**Yapı**
- Özellik kodu `features/<alan>/` altında durur (`actions.ts`, `queries.ts`, `components/`). Paylaşılan UI primitive'leri `components/ui/`, blok render'cıları `components/blocks/` altındadır. Editör önizlemesi ve public profil **aynı** blok bileşenini kullanır.
- Domain ve URL'ler yalnızca `lib/site.ts`'ten okunur. Kodda `linkiva.space` gibi sabit domain yazma.
- Server Component varsayılandır. `"use client"` sadece etkileşim gereken en küçük bileşene konur.
- TypeScript: `any` yok, `as` ile tip zorlaması istisnadır ve gerekçesi yorumla yazılır. `ignoreBuildErrors` açılmaz.
- Metinler `messages/{tr,en}.json` dosyalarında tutulur. JSX'e sabit Türkçe veya İngilizce metin yazılmaz. Türkçe büyük harf için `toLocaleUpperCase("tr")` ya da CSS `uppercase` + doğru `lang` kullanılır.

**Bağımlılıklar**
- Yeni paket eklemeden önce sor. Önce platformu dene (`crypto.randomUUID`, `Intl`, canvas, CSS). Animasyon, 3D, UI veya grafik kütüphanesi seçimi projenindir: mevcut olanı kullan (`@dnd-kit`, `recharts`, `lucide-react`), yoksa sor.

**Tasarım**
- DESIGN.md'deki token'lar dışında renk, radius veya gölge değeri yazma. Tailwind'de keyfi değer (`bg-[#0A0A0A]`, `rounded-[2.5rem]`) yasak, token sınıfı kullan.
- Reddedilen diller geri getirilmez: v1 (bağıran italik uppercase, şişkin kartlar, dağınık neon) ve Etiket (renkli Dymo bantları). Renk yalnızca anlam taşıdığında (analitik, durum) kullanılır; marka vurgusu monokromdur.
- Her etkileşimli bileşende hover, focus-visible, disabled, loading, error ve empty durumları bulunur.

## Git

- Ana dal `master`. v2 işi `rebuild/v2` dalında yapılır. Commit ve push yalnızca kullanıcı isteyince yapılır.
- Commit mesajı: kısa emir kipi, İngilizce veya Türkçe ama tutarlı. Örnek: `editor: add inline block editing`.

## Bitti tanımı

1. `npm run check` yeşil, ilgili e2e senaryosu geçiyor.
2. Mutasyonsa sahiplik testi var.
3. TR ve EN metinler eklendi.
4. Mobil (390px) ve masaüstü (1440px) görüntü kontrol edildi.
5. İlgili belge (ARCHITECTURE/ROADMAP kutucuğu) güncellendi.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
