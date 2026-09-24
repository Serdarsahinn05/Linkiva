# Linkiva v2: Yeniden Kurulum Yol Haritası

> Durum: **Onaylandı 2026-09-24, uygulanıyor.** Fazlar sırayla uygulanır. Her faz kendi içinde çalışır durumda (yeşil build + testler) biter.
> Dayanak belgeler: [AUDIT.md](AUDIT.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [../DESIGN.md](../DESIGN.md) · [../PRODUCT.md](../PRODUCT.md)

---

## Strateji

- **Sıfırdan kurulum, temiz DB.** Eski kod git geçmişinde kalır (`HEAD 53b1dcc`, ayrıca `legacy-v1` etiketi atılır). Yeni kod depo **kökünde** kurulur ve iç içe `linktree-clone/` klasörü kaldırılır.
- **Dal:** `origin/master` çekilir (3 README commit'i), `rebuild/v2` dalı açılır. Her faz ayrı commit serisi olarak ilerler ve `master`'a birleştirme kullanıcı onayıyla yapılır.
- **Canlı site:** `linkiva.space` yeniden kurulum bitene kadar eski sürümde kalır. v2 önce Vercel preview'da doğrulanır, ardından yeni (boş) Supabase projesine veya mevcut projede temizlenmiş şemaya geçilir.
- **Eskiden taşınan:** yalnızca ürün gerçeği (isim, domain, özellik kapsamı, Türkçe ses) ve çalışan fikirler (dnd sıralama, QR, OG). Eski UI kodu **taşınmaz**.

---

## Faz 0: Zemin (altyapı ve temizlik)

- [x] `git pull`, `legacy-v1` etiketi, `rebuild/v2` dalı. İç içe klasör ve eski `app/`, `lib/` ve `prisma/` silinir.
- [x] `create-next-app` eşdeğeri temiz iskelet: Next 16.x, TS strict, Tailwind v4, ESLint flat config (`no-explicit-any` hata).
- [x] `next.config.ts` sade tutulur: `ignoreBuildErrors` yok, `typedRoutes`, `images.remotePatterns` (Blob host).
- [x] `lib/env.ts` (zod ile env doğrulama), `.env.example`, `lib/site.ts` (tek URL kaynağı).
- [x] Prisma 7.10 + `prisma.config.ts` + pg adapter. Şema [ARCHITECTURE §5](ARCHITECTURE.md#5-veri-modeli-prisma-taslağı), ilk migration `init_v2` (çevrimdışı üretildi, **henüz hiçbir DB'ye uygulanmadı**).
- [x] next-intl kurulumu (URL öneksiz), `messages/tr.json` + `en.json` iskeleti, `<html lang>` dinamik.
- [x] Design token'ları (`globals.css` `@theme`), Archivo (`next/font/google`, `axes: ["wdth"]`), açık/koyu tema.
- [x] Vitest + Playwright iskeleti, `npm run check` (= lint + typecheck + test).
- [x] `AGENTS.md` / `CLAUDE.md` komut bölümleri gerçek script'lerle eşleşecek şekilde güncellenir.

**Kabul:** `npm run dev` kökte açılıyor. `npm run check` yeşil. Boş sayfa doğru font ve token'larla render ediliyor.

**Faz 0 notları (2026-09-24):**
- `cacheComponents` kapalı. Sebep: kök layout'ta dil çerezi okumak tüm ağacı bloklar. Çözüm: iki kök layout (bkz. ARCHITECTURE §6).
- Playwright'ın kendi Chromium indirmesi CDN zaman aşımına uğradı. `PW_CHANNEL=chrome` ile kurulu Chrome kullanılıyor.
- `npm audit`: 4 yüksek bulgu, hepsi kullanılmayan yollardan (better-auth → mysql2, prisma CLI → deepmerge-ts). Runtime etkisi yok, sürüm güncellemelerinde tekrar bakılacak.
- `eslint@9` deprecated uyarısı veriyor. eslint-config-next eklentileri 10 ile doğrulanınca yükseltilecek.

## Faz 1: Kimlik ve onboarding

- [ ] Auth kurulumu (onaylanan kütüphane): e-posta+şifre (doğrulama zorunlu), Google, şifre sıfırlama, e-posta değiştirme (yeni adres doğrulanınca geçer), oturum listesi. Güvenli hesap bağlama (S2 kapanır).
- [ ] Resend şablonları (TR/EN), Etiket dünyasında sade HTML mail.
- [ ] Upstash rate limit: auth uçları, ilk IP (`x-forwarded-for` ilk değer / `request.ip`). Env yoksa no-op.
- [ ] `proxy.ts` iyimser yönlendirme + `(app)/dashboard/layout.tsx` içinde gerçek `requireSession()`.
- [ ] Onboarding: kullanıcı adı seç (anlık müsaitlik, rezerve liste, öneriler), görünen isim, avatar (opsiyonel). "İlk 60 saniye" hedefi.
- [ ] Auth ve onboarding ekranları Etiket dünyasında (formlar sade, tek kırmızı bant eylem).

**Kabul:** Kayıt → mail → doğrulama → onboarding → panel akışı Playwright ile geçiyor. Kullanıcı keşfi mümkün değil. S1–S9 maddelerinden auth ile ilgili olanlar kapalı.

## Faz 2: Editör ve public profil (çekirdek)

- [ ] `components/ui`: Tape, Button, Input, Field, Switch, Menu, Dialog, Sheet, Toast, Tabs (erişilebilir: odak, Esc, aria).
- [ ] `components/blocks`: LINK, HEADER, TEXT, DIVIDER render'cıları. Önizleme ile profil aynı bileşeni kullanır.
- [ ] Editör: blok ekle (tip seçici), satır içi düzenleme, görünürlük, öne çıkar, sil + "Geri al" toast'ı, dnd sıralama + klavye alternatifi, sosyal linkler (handle tabanlı, URL platform şablonundan).
- [ ] Server action deseni: `requireSession` → zod → sahiplik filtresi → yazma → `updateTag("profile:"+username)`. Sonuç tipi `{ ok } | { ok:false, error }`.
- [ ] Canlı önizleme (masaüstünde yapışkan telefon, mobilde sheet), optimistic güncelleme (`useOptimistic`).
- [ ] Public profil: önbellekli, `notFound()` 404, Etiket teması, `opengraph-image.tsx`, `sitemap.ts` (yayındaki profiller), `robots.ts`.
- [ ] Görsel yükleme: Blob client upload, oturum kontrollü token, tür/boyut sınırı, canvas ile küçültme, eski blob'u silme.
- [ ] QR (SVG + PNG indirme, `lib/site.ts` URL'i), "adresi kopyala".

**Kabul:** Yeni kullanıcı 60 saniyede 3 linkli yayında bir sayfa kuruyor (Playwright senaryosu). Başka kullanıcının bloğuna yazma denemesi başarısız oluyor (test). Profil Lighthouse mobil performansı ≥ 95, erişilebilirlik 100.

## Faz 3: Görünüm ve ek bloklar

- [ ] 6 tema (`etiket, sade, gece, risograf, terminal, afis`) + özelleştirme (vurgu, font, buton stili, arka plan görseli, markayı gizle). Kontrast koruması.
- [ ] Görünüm sayfasında canlı önizleme ile anında geri bildirim.
- [ ] EMBED bloğu (YouTube, Spotify, SoundCloud; `lite` gömme: tıklanana kadar iframe yüklenmez, önce önizleme görseli gösterilir).
- [ ] EMAIL_CAPTURE bloğu + "Kitle" sayfası (abone listesi, CSV dışa aktarma), rate limit, çift abone engeli.
- [ ] Planlı bloklar (`startsAt`/`endsAt`), editörde "planlı" bant durumu.
- [ ] SEO ayarları (başlık, açıklama), profil yayında/gizli anahtarı.

**Kabul:** Her tema kontrast testinden geçiyor. Embed profili yavaşlatmıyor (iframe tembel yükleniyor). Abone formu JS kapalıyken de çalışıyor (progressive enhancement).

## Faz 4: Analitik

- [ ] `/api/e` beacon'ı + `/l/[blockId]` yönlendirme. Bot, prefetch ve sahip filtresi, 30 dakikalık tekil ziyaret kilidi, günlük tuzlu `visitorHash`, geo başlıkları (uydurma yok), UA'dan cihaz/OS/tarayıcı (`lib/ua.ts`, paketsiz regex), `referrerHost` + UTM.
- [ ] Analitik sayfası: aralık sekmeleri, veri şeridi, zaman grafiği (recharts), link tablosu + CTR, kaynaklar, ülkeler, cihazlar. Sorgular SQL `GROUP BY` ile ve saat dilimi doğru.
- [ ] Sunucu tarafında CSV dışa aktarma.
- [ ] Gizlilik politikası sayfası (çerezsiz takip açıklaması, KVKK).

**Kabul:** Bot UA'sı, prefetch ve sahip ziyareti sayılmıyor (birim + e2e test). 7g ve 30g seçimi sayıları gerçekten değiştiriyor. 100k olaylı seed'de analitik sayfası < 500ms.

## Faz 5: Hesap, sağlamlaştırma, yayın

- [ ] Ayarlar: e-posta değiştir, şifre değiştir, Google bağla/ayır, oturumlar, dil, tema (açık/koyu/sistem), **veri dışa aktarma (JSON)**, hesap silme (blob'lar dahil).
- [ ] Landing (Persuade): basım etkileşimli hero, örnek profil, "Ücretsiz" bölümü, kapanış eylemi. Gerçek olmayan iddia yok.
- [ ] 404, hata sınırları (`error.tsx`), yükleniyor durumları, boş durumlar. Tüm metinler i18n.
- [ ] Tasarım denetimi: `impeccable audit` → `critique`, ardından `ponytail-review` (bu sırayla). Detector taraması.
- [ ] Güvenlik incelemesi (`/security-review`), bağımlılık denetimi.
- [ ] Vercel env'leri, yeni DB migration, Google OAuth redirect URI'leri, Resend domain. Önce preview, sonra production.
- [ ] `DESIGN.md` gerçek build'den yeniden kaydedilir.

**Kabul:** Tüm Playwright senaryoları production URL'inde geçiyor. Lighthouse (landing, profil, panel) ≥ 90/100/100. Açık kritik bulgu yok.

---

## Sonraki aşama (v2 sonrası backlog)

**Portfolyo modu (PRODUCT.md ikinci aşama)**
- `PROJECT` (görsel, başlık, açıklama, teknoloji etiketleri, link), `EXPERIENCE` ve `SKILLS` blokları. GitHub bağlantısı ile pinned repoların otomatik çekilmesi. `terminal` ve yeni `portfolyo` temaları.

**Diğer fikirler (öncelik sırasıyla)**
1. Kullanıcı adı değişince eski adresten yeni adrese 90 günlük yönlendirme (`UsernameHistory`).
2. Linktree/Bio.link içe aktarma (public sayfa URL'inden linkleri çekme).
3. Link başına QR ve UTM oluşturucu.
4. Gerçek link sağlık kontrolü: Vercel Cron ile günlük HEAD isteği, kırık link bildirimi (e-posta).
5. Hassas içerik uyarısı (link başına "18+ / spoiler" kapısı).
6. Kısa link (`linkiva.space/l/abc`), paylaşım kartı (Instagram story için 1080×1920 görsel).
7. Özel domain (Vercel Domains API).
8. İletişim formu bloğu (mail yönlendirme), Calendly/Cal.com bloğu, harita (konum) bloğu.
9. Doğrulanmış rozet, admin paneli (`role: ADMIN`, kötüye kullanım raporları, kullanıcı askıya alma).
10. PWA (panel için ana ekrana ekle), 2FA (TOTP).
11. Herkese açık API + webhooks (yeni abone, günlük özet).
12. `DailyStat` özet tablosu + gece cron'u (analitik ölçeği büyüyünce).
