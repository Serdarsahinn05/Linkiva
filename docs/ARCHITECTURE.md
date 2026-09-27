# Linkiva: Hedef Mimari (v2)

> Durum: **Onaylandı (2026-09-24).** Auth: Better Auth. Yeni paketler onaylı: zod, next-intl, Vitest, Playwright, @prisma/adapter-pg.
> Eski sistemin analizi: [AUDIT.md](AUDIT.md) · Uygulama sırası: [ROADMAP.md](ROADMAP.md)

---

## 1. İlkeler

1. **Sahiplik veride çözülür.** Her mutasyon kaydı `where: { id, profile: { userId: session.user.id } }` ile bulur. Oturumun olması tek başına yetki sayılmaz.
2. **Sınırda doğrulama.** Form, route handler ve server action girişleri zod şemasından geçer. Client tarafındaki doğrulama sadece UX içindir.
3. **Tek URL kaynağı.** Domain, profil URL'i ve QR içeriği `lib/site.ts` üzerinden gelir. Kodda sabit domain yazılmaz.
4. **Profil sayfası hızlıdır.** Önbelleğe alınır ve düzenlemede etiketle (tag) geçersiz kılınır. Render sırasında veritabanına yazılmaz.
5. **Doğru veri ya da hiç veri.** Botlar, önizleyiciler, prefetch istekleri ve sahibin kendi ziyaretleri analitiğe girmez. Arayüzde sahte "canlı" ya da "sağlık" göstergesi olmaz.
6. **Az bağımlılık.** Standart kütüphane ve platform özelliği yetiyorsa paket eklenmez (UUID için `crypto.randomUUID`, görsel küçültme için canvas).

---

## 2. Stack

| Katman | Seçim | Not |
|---|---|---|
| Framework | **Next.js 16.3** (App Router, React 19.3; Cache Components kapalı, §6) | `ignoreBuildErrors` kaldırılır, tip hatası build'i kırar |
| Dil | TypeScript strict | `any` yasak (ESLint kuralı) |
| Stil | Tailwind CSS v4 + CSS custom property token'ları | Token'lar [DESIGN.md](../DESIGN.md) belgesinde |
| DB | PostgreSQL (Supabase) + **Prisma 7.10** (kararlı sürüm; 8.x RC) | `prisma.config.ts`, `prisma-client` generator, `@prisma/adapter-pg` |
| Auth | **Better Auth** (onaylandı) | Bkz. §4 |
| Doğrulama | **zod 4** (onaylandı) | |
| i18n | **next-intl 4** (onaylandı) | TR varsayılan, EN; URL öneki yok (bkz. §8) |
| E-posta | Resend | Şablonlar `lib/mail/` altında, TR/EN |
| Rate limit | Upstash Redis + @upstash/ratelimit | Env yoksa lokal ortamda no-op (çökmez) |
| Dosya | Vercel Blob (client upload + token) | |
| Sürükle-bırak | @dnd-kit (mevcut) | |
| Grafik | **recharts** (zaten kurulu) | chart.js kaldırılır |
| İkon | lucide-react (arayüz) + react-icons (yalnızca marka ikonları) | tabler kaldırılır |
| QR | qrcode.react (mevcut) | |
| Test | Vitest (birim) + Playwright (kritik akışlar) (onaylandı) | |

**Kaldırılacaklar:** `chart.js`, `react-chartjs-2`, `react-simple-maps`, `react-calendar-heatmap`, `d3-scale`, `uploadthing`, `@uploadthing/react`, `@tabler/icons-react`, `@vercel/og`, `@next-auth/prisma-adapter` ve `@auth/prisma-adapter` (auth kararına göre), `uuid`, `@types/uuid`, `@types/bcrypt`, `next-themes` (tema, token + `prefers-color-scheme` + tek bir çerezle yönetilir).

---

## 3. Klasör Yapısı

```
/                                 ← proje kökü (iç içe klasör kaldırılır)
├─ app/
│  ├─ (marketing)/                ← landing, yasal sayfalar
│  │  ├─ page.tsx
│  │  └─ privacy/ terms/
│  ├─ (auth)/                     ← login, register, forgot-password, reset-password, verify-email
│  ├─ (app)/dashboard/
│  │  ├─ layout.tsx               ← gerçek oturum kontrolü + uygulama kabuğu
│  │  ├─ page.tsx                 ← EDİTÖR: bloklar + canlı önizleme
│  │  ├─ appearance/              ← tema, font, renk, buton, arka plan
│  │  ├─ analytics/
│  │  ├─ audience/                ← e-posta toplama aboneleri (Faz 3)
│  │  └─ settings/                ← hesap, güvenlik, dil, veri dışa aktarma, hesap silme
│  ├─ [username]/
│  │  ├─ page.tsx                 ← public profil (önbellekli)
│  │  ├─ opengraph-image.tsx      ← OG görseli (dosya konvansiyonu)
│  │  └─ not-found.tsx
│  ├─ l/[blockId]/route.ts        ← tıklama kaydı + 302 yönlendirme
│  ├─ api/
│  │  ├─ auth/[...all]/route.ts   ← auth handler
│  │  ├─ e/route.ts               ← görüntülenme beacon'ı
│  │  └─ upload/route.ts          ← Blob client-upload token'ı (oturum zorunlu)
│  ├─ sitemap.ts  robots.ts  manifest.ts
│  └─ layout.tsx  globals.css
├─ components/
│  ├─ ui/                         ← Button, Input, Field, Tape, Dialog, Menu, Switch, Tabs, Toast, Sheet…
│  └─ blocks/                     ← blok render'cıları (önizleme ve public profil AYNI bileşeni kullanır)
├─ features/
│  ├─ editor/     (actions.ts, queries.ts, components/)
│  ├─ appearance/
│  ├─ analytics/
│  ├─ auth/
│  └─ account/
├─ lib/
│  ├─ db.ts  env.ts  site.ts  auth.ts  auth-client.ts  session.ts
│  ├─ ratelimit.ts  blob.ts  tracking.ts  bots.ts  ua.ts
│  ├─ mail/                       ← şablonlar + gönderici
│  └─ validation/                 ← zod şemaları (blok tipleri, profil, auth)
├─ themes/                        ← profil tema tanımları (token setleri)
├─ messages/  tr.json  en.json
├─ prisma/  schema.prisma  migrations/
├─ proxy.ts                       ← (Next 16 middleware) iyimser auth yönlendirmesi
├─ tests/  unit/  e2e/
└─ AGENTS.md  CLAUDE.md  PRODUCT.md  DESIGN.md  docs/
```

---

## 4. Kimlik Doğrulama

**Gereksinimler:** e-posta + şifre (doğrulama zorunlu), Google OAuth, şifre sıfırlama, e-posta değiştirme (yeni adres doğrulanana kadar eski adres geçerli kalır), oturum listesi ve kapatma, hesap silme, rate limit.

### Seçilen: Better Auth
- Yukarıdaki gereksinimlerin hepsi hazır geliyor: `emailAndPassword.requireEmailVerification`, `sendResetPassword`, `changeEmail` (doğrulamalı), `socialProviders.google`, DB tabanlı oturumlar, dahili rate limit (Redis secondary storage).
- Eski koddaki `register`, `verify`, `forgot-password` ve `new-password` route'ları ile `tokens.ts` dosyası **tamamen ortadan kalkar**. Bu yaklaşık 250 satır daha az güvenlik yüzeyi demek.
- Hesap bağlama (account linking) sadece `trustedProviders: ["google"]` ile açılır. Bir hesaba Google bağlanınca **doğrulanmamış şifreli hesabın şifresi geçersiz kılınır**, böylece S2 açığı kapanır.
- Auth.js ekibi 2025'te Better Auth'a katıldı ve NextAuth v5 hâlâ beta. Uzun vadede de doğru yön.

### Reddedilen alternatif: NextAuth v4
- Kararlı ama bakım modunda. Doğrulama, sıfırlama ve e-posta değiştirme akışlarının hepsi elle yazılmaya devam eder. S2'yi kapatmak için `allowDangerousEmailAccountLinking` kapatılır ve bağlama akışı elle kurulur.

### Ortak kurallar
- Kullanıcı adı **kayıtta alınmaz**. Kayıt sadece e-posta + şifre (veya Google) ister. İlk girişte onboarding adımında kullanıcı adı seçilir: tek alan, anlık müsaitlik kontrolü, rezerve liste. Landing'deki "kullanıcı adını yaz" alanı bu değeri onboarding'e taşır.
- Giriş hatası tek bir mesajdır: "E-posta veya şifre hatalı". Şifre sıfırlama her durumda "Hesap varsa mail gönderdik" der.
- Şifre en az 8 karakter olmalı. Kontrol zod'la sunucuda yapılır.

---

## 5. Veri Modeli (Prisma taslağı)

> Auth tabloları (`user`, `session`, `account`, `verification`) seçilen auth kütüphanesinin CLI'ı ile üretilir. Aşağıdakiler uygulama tablolarıdır.

```prisma
model Profile {
  id             String   @id @default(cuid())
  userId         String   @unique
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  username       String   @unique            // küçük harf, ^[a-z0-9](?:[a-z0-9._]{1,28}[a-z0-9])?$
  displayName    String?
  bio            String?                     // ≤ 160
  avatarUrl      String?
  theme          String   @default("cam")    // themes/ içindeki anahtar
  appearance     Json     @default("{}")     // { accent, font, buttonStyle, background: {type,value} } zod ile doğrulanır
  seoTitle       String?
  seoDescription String?
  showBranding   Boolean  @default(true)     // kaldırmak ücretsiz
  isPublished    Boolean  @default(true)
  locale         String   @default("tr")
  timezone       String   @default("Europe/Istanbul")
  blocks         Block[]
  socials        SocialLink[]
  events         Event[]
  subscribers    Subscriber[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

enum BlockType { LINK HEADER TEXT EMBED EMAIL_CAPTURE DIVIDER IMAGE SUPPORT WHATSAPP CONTACT PRODUCT COUNTDOWN }   // IMAGE: block_image · son beşi: block_types_contact_support (Faz 8)

model Block {
  id          String    @id @default(cuid())
  profileId   String
  profile     Profile   @relation(fields: [profileId], references: [id], onDelete: Cascade)
  type        BlockType
  position    Int
  isVisible   Boolean   @default(true)
  isHighlighted Boolean @default(false)      // öne çıkan link (rakiplerde ücretli)
  data        Json                           // tip başına zod şeması: LINK {title,url,thumbnail?}, EMBED {provider,url} …
  startsAt    DateTime?                      // planlı yayın (rakiplerde ücretli)
  endsAt      DateTime?
  events      Event[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  @@index([profileId, position])
}

enum SocialPlatform { INSTAGRAM X TIKTOK YOUTUBE GITHUB LINKEDIN TWITCH SPOTIFY DISCORD BEHANCE DRIBBBLE EMAIL WEBSITE }

model SocialLink {
  id        String         @id @default(cuid())
  profileId String
  profile   Profile        @relation(fields: [profileId], references: [id], onDelete: Cascade)
  platform  SocialPlatform
  handle    String                           // kullanıcı adı/handle, URL değil; URL platform şablonundan üretilir
  position  Int
  @@unique([profileId, platform])
}

enum EventType { VIEW CLICK }
enum Device { MOBILE DESKTOP TABLET }

model Event {
  id           BigInt    @id @default(autoincrement())
  profileId    String
  profile      Profile   @relation(fields: [profileId], references: [id], onDelete: Cascade)
  blockId      String?
  block        Block?    @relation(fields: [blockId], references: [id], onDelete: SetNull)
  type         EventType
  visitorHash  String                        // sha256(günlükTuz + ip + ua + profileId), çerezsiz tekil ziyaretçi
  country      String?   @db.Char(2)
  city         String?
  device       Device?
  os           String?
  browser      String?
  referrerHost String?                       // sadece host: instagram.com, t.co …
  utmSource    String?
  createdAt    DateTime  @default(now())
  @@index([profileId, createdAt])
  @@index([blockId, createdAt])
}

model Subscriber {                           // EMAIL_CAPTURE bloğu (Faz 3)
  id        String   @id @default(cuid())
  profileId String
  profile   Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  email     String
  createdAt DateTime @default(now())
  @@unique([profileId, email])
}
```

**Neden `Block` + `Json data`?** Yeni blok tipi eklemek (ve ileride portfolyo modunda `PROJECT`, `EXPERIENCE`) migration gerektirmez, sadece yeni bir zod şeması ve render'cı ister. Tip güvenliği, `data` alanının zod ile ayrıştırılmasından gelir. **`clickCount` kolonu yok.** Sayılar `Event` tablosundan hesaplanır, böylece tek doğruluk kaynağı kalır.

**Rezerve kullanıcı adları** (`lib/validation/username.ts`): `dashboard, login, register, api, l, e, admin, linkiva, settings, help, about, privacy, terms, blog, app, www, mail, support, static, _next` ve route listesiyle senkron bir test.

### 5.1 Planlı model değişiklikleri (Faz 6–13, [ROADMAP](ROADMAP.md))

✅ işaretliler uygulandı, diğerleri planlı. Her biri kendi fazında, elle yazılmış migration + `migrate deploy` ile gelir (AGENTS.md → Veri).

| Faz | Migration | Değişiklik |
|---|---|---|
| 6 ✅ | `username_history` | `UsernameHistory { username @id, profileId → Profile (cascade), createdAt, expiresAt }`. Müsaitlik kontrolü süresi dolmamış kayıtları dolu sayar. |
| 8 ✅ | `block_types_contact_support` | `BlockType` += `SUPPORT, WHATSAPP, CONTACT, PRODUCT, COUNTDOWN`. HEADER'a `collapsible` (yalnızca `data`, migration yok). |
| 9 ✅ | `weekly_digest` | `Profile.weeklyDigest Boolean @default(true)`, `Profile.digestSentAt DateTime?` |
| 10 | `block_size` | `enum BlockSize { SMALL WIDE LARGE }`, `Block.size @default(WIDE)`. `appearance.layout: "list" \| "grid"` (yalnızca JSON). EMBED `data`'ya `latest`, `channelId`. |
| 11 | `custom_domain` | `CustomDomain { id, profileId @unique, hostname @unique, verifiedAt?, createdAt }` |
| 12 | `block_types_portfolio` | `BlockType` += `PROJECT, EXPERIENCE, SKILLS` |
| 13 | `link_check`, `two_factor` | `LinkCheck { blockId @unique → Block (cascade), status, failCount, checkedAt }`; Better Auth `twoFactor` tabloları (CLI ile üretilir). LINK `data`'ya `gate`. |

**Taslak link (Faz 7):** LINK'te boş `url` yalnızca `isVisible = false` iken geçerlidir. Kural `parseBlock`'ta değil, yazma eylemlerinde (`updateBlock`, `setVisibility`) uygulanır. Böylece public okuma yolu hiçbir zaman URL'siz link görmez.

**Tür başına sunucuda kurulan hedefler:** WHATSAPP hedefi (`wa.me`) ve CONTACT çıktısı (`.vcf`) kullanıcıdan URL olarak alınmaz, doğrulanmış alanlardan sunucuda üretilir (`lib/vcard.ts`, `lib/validation/iban.ts`, telefon E.164 normalizasyonu).

---

## 6. Profil Sayfası ve Önbellek

- **Cache Components kapalı** (Faz 0 kararı). Kök layout'ta dil çerezi okumak tüm ağacı dinamiğe zorladığı için etiket tabanlı klasik önbellek kullanılır.
- **İki kök layout:** `app/(site)/layout.tsx` (landing, auth, panel) dili çerezden ve `Accept-Language` başlığından okur ve dinamiktir. `app/(profile)/[username]/layout.tsx` ise dili profil sahibinin `locale` ayarından alır. Çerez okumaz, önbelleğe alınabilir. İki grup arası geçiş tam sayfa yüklemesiyle olur, bu kabul edilebilir.
- Profil verisi `unstable_cache(fn, keys, { tags: ["profile:" + username] })` ile önbelleğe alınır. Editördeki her mutasyon `updateTag` ile bu etiketi geçersiz kılar, değişiklik anında yayına çıkar.
- Planlı bloklar (`startsAt`/`endsAt`) için `revalidate` en yakın zaman sınırına göre ayarlanır.
- Render sırasında **hiçbir yazma işlemi yapılmaz** (eski `visit.create` kaldırılır).
- `generateMetadata` ve sayfa aynı önbellekli sorguyu paylaşır (`React.cache`).
- Kullanıcı bulunamazsa `notFound()` çağrılır ve HTTP 404 döner. *(Faz 6'dan sonra:* önce `UsernameHistory`'ye bakılır; süresi dolmamış eski ad `permanentRedirect` (308) ile yeni ada gider.)*
- *(Faz 10)* Profil render'ı dış kaynak okuyabilir (YouTube RSS) ama yalnızca `fetch(..., { next: { revalidate: 3600, tags: [profileTag] } })` ile; okunamazsa blok gizlenir. DB'ye yazma kuralı değişmez.
- *(Faz 11)* Özel alan adında `proxy.ts` host'u doğrulanmış `CustomDomain` kaydına göre `/<username>` yoluna rewrite eder. Kanonik URL `lib/site.ts` → `profileUrl(profile)` üzerinden gelir.
- OG görseli `opengraph-image.tsx` ile üretilir. Aynı etiketi kullanır, `?v=Date.now()` kullanılmaz.

---

## 7. Takip (Analitik) Hattı

### Görüntülenme
1. Profil sayfası ~300 baytlık satır içi bir script içerir: sayfa görünür olunca `navigator.sendBeacon("/api/e", { p: profileId, r: document.referrer, u: utm })` çağrılır.
2. `/api/e` şu isteklerde **kayıt yazmadan** 204 döner:
   - bot/önizleyici User-Agent'ı (`lib/bots.ts`: WhatsApp, TelegramBot, Twitterbot, facebookexternalhit, Slackbot, Discordbot, Googlebot, headless…)
   - profil sahibinin oturum çerezi varsa
   - IP başına rate limit aşıldıysa
   - aynı `visitorHash` son 30 dakikada aynı profili zaten görüntülediyse (Redis `SET NX EX`)
3. Ülke ve şehir `x-vercel-ip-country` / `x-vercel-ip-city` başlıklarından alınır (URL-decode edilir). Başlık yoksa `null` yazılır, **uydurma değer yazılmaz**.

### Tıklama
- Link butonları `href="/l/<blockId>"` adresine gider. JS olmadan da çalışır ve sağ tık ile "linki kopyala" sonucu anlamlı olur.
- `/l/[blockId]` blok görünür ve yayındaysa bir `CLICK` olayı yazar, ardından `302` ile hedefe gönderir. `Purpose: prefetch`, `Sec-Purpose` ve `Next-Router-Prefetch` başlıklı istekleri ve botları yazmadan yönlendirir.
- Yazma işlemi `after()` (Next) ile yanıt gönderildikten sonra yapılır, yönlendirme beklemez.
- Hedef URL kayıt sırasında zod ile doğrulanır (`http:`/`https:`/`mailto:`/`tel:` dışındaki şemalar reddedilir).
- *(Faz 8)* `/l/[blockId]` tür başına davranır: LINK, IMAGE, PRODUCT, WHATSAPP → 302; CONTACT → `text/vcard` ek dosyası. *(Faz 13)* `gate` alanlı LINK önce sunucuda çizilen bir onay sayfası gösterir, tıklama yalnızca `?ok=1` ile gelen istekte yazılır.
- *(Faz 8)* Kopyalama (IBAN, ad): `/api/e` `{ p, b, k: "copy" }` kabul eder ve `record.ts` üzerinden CLICK yazar. Filtreler ve tekrar kilidi tıklamayla aynıdır. Tek yazma noktası kuralı korunur.

### Gizlilik
- Çerez yok, IP saklanmaz. `visitorHash` her gün değişen bir tuzla üretilir, bu yüzden günler arası kullanıcı izlenemez. Gizlilik politikası sayfası bunu açıkça yazar (KVKK).

### Analitik sorguları
- Tarih aralığı (7g / 30g / 90g / tümü) **gerçekten** filtreler. Sorgular SQL tarafında `GROUP BY` ile toplanır ve kullanıcının saat dilimine göre gün kovalarına ayrılır (`AT TIME ZONE profile.timezone`).
- Metrikler: görüntülenme, tekil ziyaretçi, tıklama, CTR, link başına tıklama ve CTR, kaynak (referrerHost + utm), ülke, cihaz/OS/tarayıcı.
- Veri büyürse `DailyStat` özet tablosu ve cron eklenir (Faz 4). v2'de indeksli ham sorgular yeterli.
- CSV dışa aktarma sunucuda, seçili aralık için yapılır.

---

## 8. i18n

- `next-intl` URL öneki olmadan kullanılır. Dil sırası: kullanıcı ayarı, `NEXT_LOCALE` çerezi, `Accept-Language`, `tr`. Bu yaklaşım `/[username]` route'uyla çakışmaz.
- Mesajlar `messages/tr.json` ve `messages/en.json` dosyalarında, özellik bazlı namespace'lerle tutulur. Arayüzde sabit metin olmaz (ESLint veya review kuralı).
- Public profil sayfasının arayüz metinleri (ör. "Abone ol") **profil sahibinin** `locale` ayarını kullanır.
- Tarih ve sayı biçimlendirme `Intl` API'siyle yapılır.

---

## 9. Dosya Yükleme

- `@vercel/blob/client` `upload()` kullanılır, token `/api/upload` üzerinden alınır. `onBeforeGenerateToken` oturumu doğrular. `allowedContentTypes: image/jpeg, image/png, image/webp, image/avif`, `maximumSizeInBytes: 5MB`. Yol: `u/<userId>/<avatar|bg>-<rand>`.
- Client tarafında canvas ile küçültme yapılır (avatar 512px, arka plan 2048px, WebP). Paket gerekmez.
- Görsel değiştirildiğinde eski blob silinir. Hesap silindiğinde `u/<userId>/` önekindeki her şey silinir.

---

## 10. Ortam Değişkenleri (`lib/env.ts`, zod ile doğrulanır)

```
DATABASE_URL, DIRECT_URL
BETTER_AUTH_SECRET             # auth adresi NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_APP_URL            # https://linkiva.space, lokal: http://localhost:3000
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
RESEND_API_KEY, MAIL_FROM      # "Linkiva <hello@linkiva.space>"
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN   # opsiyonel lokal
BLOB_READ_WRITE_TOKEN
TRACKING_SALT_SECRET
CRON_SECRET                    # Faz 9: /api/cron/daily için Bearer (yoksa uç 404); ayrıca özet maili çıkış token'ının HMAC anahtarı
# Planlı (faz geldiğinde lib/env.ts + .env.example'a eklenir; yoksa özellik lib/features.ts ile gizlenir)
VERCEL_API_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_ID   # Faz 11: özel alan adı
GITHUB_TOKEN                   # Faz 12, opsiyonel: pinned repolar için GraphQL
```
`.env.example` depoya eklenir, `.env` asla eklenmez.

---

## 10.1 Zamanlanmış işler ve dış getirme

- **Tek cron:** `vercel.json` → `/api/cron/daily`, günde bir (Vercel Hobby sınırı). `Authorization: Bearer CRON_SECRET` yoksa 401. İçinde: her gün kırık link kontrolü (Faz 13, çalıştırma başına sınırlı parti), pazartesi haftalık özet maili (Faz 9, `digestSentAt` ile idempotent). İleride `DailyStat` toplaması da buraya gelir.
- **Dış getirmenin tek kapısı `lib/link-preview.ts`:** link kartı, içe aktarma (Faz 7, host beyaz listesi `linktr.ee`), YouTube kanal kimliği (Faz 10, `youtube.com`), kırık link kontrolü (Faz 13). Hepsi aynı SSRF korumasından geçer; yeni bir `fetch` yolu açılmaz.
- **Vercel Domains API** (Faz 11) düz `fetch` ile `lib/vercel-domains.ts`'ten çağrılır. Kullanıcı girdisi yalnızca doğrulanmış hostname olarak gider.

---

## 11. Güvenlik Kontrol Listesi (her PR için)

- [ ] Mutasyon oturumu `requireSession()` ile alıyor, kaydı sahiplik filtresiyle buluyor
- [ ] Girdi zod'dan geçiyor, dönen hata kullanıcı dostu ve iç detay sızdırmıyor
- [ ] Kullanıcı kaynaklı URL şema beyaz listesinden geçiyor
- [ ] Hassas uç rate limit'li (auth, beacon, abone ol, upload)
- [ ] Kullanıcı varlığı hata mesajıyla sızdırılmıyor
- [ ] Yeni route rezerve kullanıcı adı listesine eklendi
- [ ] Cron ve oturumsuz linkler (özet çıkışı) imzalı ya da `CRON_SECRET` korumalı; imza sabit zamanlı karşılaştırılıyor
- [ ] Kullanıcı verisi hiçbir LLM sağlayıcısına, reklam ağına ya da üçüncü tarafa gitmiyor (PRODUCT ilke 6)
- [ ] Sunucu kullanıcının verdiği bir URL'e istek atıyorsa `lib/link-preview.ts` korumasından geçiyor (SSRF: bağlantı anında IP kontrolü, özel ağ yasak, elle yönlendirme, süre/boyut sınırı)
