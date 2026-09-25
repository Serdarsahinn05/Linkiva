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

- [x] Auth kurulumu (Better Auth 1.7): e-posta+şifre (doğrulama zorunlu), Google (env varsa), şifre sıfırlama, e-posta değiştirme (yeni adres doğrulanınca geçer). Güvenli hesap bağlama (`requireLocalEmailVerified`, S2 kapandı). *Oturum listesi ve e-posta değiştirme arayüzü Faz 5'teki Ayarlar sayfasında.*
- [x] Mail şablonları (TR/EN, next-intl `createTranslator`), "Cam" dilinde tablo tabanlı HTML. Resend anahtarı yoksa geliştirmede `tmp/mailbox/` klasörüne yazılır.
- [x] Rate limit: **Upstash yerine Better Auth'un DB depolaması** (`rate_limit` tablosu, serverless örnekler arası paylaşılır). Kurallar: giriş 5/dk, kayıt 5/10dk, sıfırlama 3/10dk, doğrulama maili 3/10dk. Upstash, Faz 4'te beacon için kalıyor.
- [x] `proxy.ts` iyimser yönlendirme + `dashboard/layout.tsx` içinde gerçek `requireSession()` ve profil kontrolü.
- [x] Onboarding: kullanıcı adı (anlık müsaitlik, rezerve liste, öneri, Türkçe harf çevirisi, landing'den taşınan ad), görünen ad. *Avatar Faz 2'de görsel yükleme ile birlikte.*
- [x] Auth ve onboarding ekranları (tasarım dili: "Cam").

**Kabul:** Kayıt → mail → doğrulama → onboarding → panel akışı Playwright ile geçiyor. Kullanıcı keşfi mümkün değil. S1–S9 maddelerinden auth ile ilgili olanlar kapalı.

**Faz 1 notları (2026-09-24):**
- ✅ Kabul: `tests/e2e/auth.spec.ts` 3 senaryo geçiyor (tam akış, çift kayıt aynı ekran, şifre sıfırlama bilinmeyen e-postada aynı cevap). Rate limit gerçek denemede tetiklendi (`/sign-up/email` 5. istekte), e2e sunucusunda `E2E=1` bayrağıyla kapatılıyor (production'da yok sayılır).
- Kapanan v1 bulguları: S2, S4, S5, S6, S8, S9 (S1, S3, S7 editör ve yükleme ile Faz 2'de).
- Prisma 7'de `migrate dev` client'ı otomatik üretmiyor. `npm run db:migrate` artık `prisma generate` de çalıştırıyor.
- Yerel geliştirme: Docker `linkiva-db` (port 54329), DB `linkiva_dev`. Eski yerel `linkiva` DB'si (yalnızca ilk e2e verisi) silinmedi; Prisma yapay zekânın DB sıfırlamasını onaysız engelliyor.

## Faz 2: Editör ve public profil (çekirdek)

- [x] `components/ui`: Tape, Button, Field/Input, PasswordInput, Notice, Switch, Menu (ok tuşları, Esc), Dialog (native `<dialog>`, mobilde sheet, içerik yalnızca açıkken), Toast (geri al). *Tabs ihtiyaç doğunca (Faz 4).*
- [x] `components/blocks/profile-view.tsx`: LINK, HEADER, TEXT, DIVIDER. Önizleme ile public profil **aynı** bileşeni kullanır.
- [x] Editör: blok ekle, satır içi düzenleme + otomatik kayıt, görünürlük, öne çıkar, yukarı/aşağı taşı, sil + "Geri al", dnd-kit sıralama (klavye dahil), sosyal hesaplar (yapıştırılan URL handle'a çevrilir), profil adı/bio.
- [x] Server action deseni: `withProfile` → zod → sahiplik filtresi → yazma → `updateTag`. Sonuç tipi `{ ok, data } | { ok:false, error }`.
- [x] Canlı önizleme (masaüstünde yapışkan telefon, mobilde sheet). Yerel iyimser durum + hata olursa geri alma. `useOptimistic` yerine düz state kullanıldı, çünkü otomatik kayıt debounce'lu.
- [x] Public profil: ISR (`generateStaticParams` boş + etiketli veri önbelleği), `notFound()` gerçek 404, varsayılan "Cam" teması, `opengraph-image.tsx`, `sitemap.ts`, `robots.ts`, `/l/[blockId]` yönlendirmesi (tıklama sayımı Faz 4).
- [x] Görsel yükleme: Blob client upload, oturum kontrollü token, kullanıcı klasörüne sabit yol, tür/boyut sınırı, canvas ile 512px WebP, eski blob'u silme. ⚠️ *Yerelde Blob anahtarı kapalı (v1 production deposu). Uçtan uca yükleme testi yeni bir Blob deposuyla Faz 5'te yapılacak.*
- [x] QR (SVG + 1024px PNG indirme, `lib/site.ts` URL'i), adresi kopyala, sayfayı aç.

**Kabul:** Yeni kullanıcı 60 saniyede 3 linkli yayında bir sayfa kuruyor (Playwright senaryosu). Başka kullanıcının bloğuna yazma denemesi başarısız oluyor (test). Profil Lighthouse mobil performansı ≥ 95, erişilebilirlik 100.

**Faz 2 notları (2026-09-24):**
- ✅ `tests/e2e/editor.spec.ts`: kayıttan yayına tam akış, `/l/` 302, gizle/taşı/sil/geri al, 404. Hem dev hem **production build** (`PW_PROD=1`) üzerinde geçiyor. Production'da ISR önbelleği düzenlemeyle anında yenileniyor.
- ✅ `tests/integration/ownership.test.ts`: B kullanıcısı A'nın bloğunu değiştiremiyor, gizleyemiyor, silemiyor, sıralamasına yabancı ID sokamıyor (S1 kapandı). S3 (upload) ve S7 (rezerve adlar) de kapandı.
- ⏳ Lighthouse ölçümü yapılmadı. Faz 5 denetimine taşındı.
- `E2E` bayrağı artık yalnızca `NEXT_PUBLIC_APP_URL` localhost iken geçerli (`isE2E`).
- zod 4 tuzağı: `z.record(z.enum(...))` tüm anahtarları zorunlu kılar, kısmi kayıt için `z.partialRecord` kullanılmalı.

## Ara adım: Tasarım yönü değişikliği "Etiket" → "Cam" (2026-09-24) ✅

Kullanıcı Faz 2 sonunda Etiket yönünü reddetti ("oyuncak gibi") ve yönü kendisi belirledi: premium, yumuşak, glassmorphism/liquid glass, açık+koyu tema (sisteme göre), monokrom marka vurgusu, yalnızca anlamlı yerlerde neon (analitik), mobilde Instagram tarzı alt sekme çubuğu.
- [x] DESIGN.md baştan yazıldı, PRODUCT.md'ye bağlayıcı görsel taahhütler eklendi.
- [x] Token'lar (açık/koyu), cam malzemesi (3 yoğunluk, liquid kenar, specular), Geist + Geist Mono, ortam ışığı.
- [x] Tüm primitive'ler, auth/onboarding, editör, public profil, landing ilk ekranı, OG görseli, mail şablonu, favicon.
- [x] Mobil alt sekme çubuğu (Linkler · Görünüm · Önizle · İstatistik · Ayarlar) + sıvı gösterge. Masaüstü cam kenar çubuğu.
- [x] Ayarlar sayfası (tema: sistem/açık/koyu, dil). Görünüm ve İstatistik fazları gelene kadar dürüst "yakında" ekranı.
- [x] Profil teması varsayılanı `cam` (migration `profile_theme_cam`).
- 🐞 Bulunup düzeltilen: önizleme context'inde sonsuz render döngüsü (setter ayrı context'e alındı).

## Faz 3: Görünüm ve ek bloklar

- [x] Temalar `cam, gece, sade, kum, terminal, afis` (DESIGN.md §7 tablo) + özelleştirme (mod, 5 font, buton stili, vurgu rengi, arka plan görseli, rozeti gizle). Kontrast koruması (`inkOn` + düşük kontrast uyarısı).
- [x] Görünüm sayfası: gerçek CSS ile çizilen tema kartları, canlı önizleme (masaüstünde cam telefon, mobilde alt çubuktaki Önizle), otomatik kayıt.
- [x] EMBED bloğu (YouTube, Spotify, SoundCloud). Hafif gömme: tıklanana kadar iframe yok, YouTube `youtube-nocookie`, iframe adresi daima ID'den yeniden kurulur.
- [x] EMAIL_CAPTURE bloğu + Kitle sayfası (liste, silme, CSV, formül enjeksiyonu koruması). Honeypot, IP rate limit (Upstash ya da bellek yedeği), çift abonelik aynı cevap.
- [x] Planlı bloklar (`startsAt`/`endsAt`): menüde "Planla", satırda durum ("… tarihinde yayında", "Süresi doldu"). Önizleme de yayındaki kuralla filtreler.
- [x] SEO başlık/açıklama ve "Sayfa yayında" anahtarı (Ayarlar → Profil). Kapalı profil 404.

**Kabul:** Her tema kontrast testinden geçiyor. Embed profili yavaşlatmıyor (iframe tembel yükleniyor). Abone formu JS kapalıyken de çalışıyor (progressive enhancement).

**Faz 3 notları (2026-09-24):**
- ✅ `tests/e2e/phase3.spec.ts`: tema public sayfaya yansıyor, iframe yalnızca tıklamayla yükleniyor, abonelik + çift kayıt + Kitle + CSV (sahibe özel), planlı link gizli, SEO başlığı, yayından kaldırınca 404. Dev ve production'da geçiyor.
- ✅ Entegrasyon: başkasının bloğunu planlayamama, başkasının blob'unu arka plan yapamama, başkasının abonesini silememe.
- ⚠️ Abone formunun JS kapalıyken çalışması bir server action formu olduğu için tasarım gereği sağlanıyor, ama JS kapalı ayrı bir e2e testi yazılmadı.
- 🐞 Bulunan: rate limiter altyapısı erişilemezse abone olma çöküyordu (v1'in silinmiş Upstash DB'si). Artık bellek yedeğine düşüp logluyor.
- Kitle mobilde alt çubukta yok (5 slot); E-posta bloğundaki "Aboneleri gör" bağlantısı ve masaüstü kenar çubuğundan erişiliyor. Faz 4'te İstatistik sayfasına sekme olarak da eklenebilir.
- Yerel `.env.local` artık v1'in Upstash değişkenlerini de boşaltıyor.

## Faz 4: Analitik

- [x] `/api/e` beacon'ı (`ViewBeacon`, sendBeacon) + `/l/[blockId]` tıklama kaydı. Tek yazma noktası `features/analytics/record.ts`: bot/prefetch/sahip filtresi, görüntülenmede 30 dk, tıklamada 5 sn tekrar kilidi, günlük HMAC tuzlu `visitorHash` (IP saklanmaz), Vercel geo başlıkları (yoksa null), `lib/ua.ts` (uygulama içi tarayıcılar dahil), `referrerHost` + UTM. Yazmalar `after()` ile yanıttan sonra.
- [x] Analitik sayfası: aralık sekmeleri (link, paylaşılabilir), cam veri şeridi + semantik trend rozetleri, recharts grafiği (görüntülenme mavi alan, tıklama yeşil çizgi, koyu temada neon), link tablosu + CTR, kaynaklar, ülkeler (`Intl.DisplayNames`), cihaz/OS, tarayıcı. SQL toplama, profilin saat diliminde gün kovaları.
- [x] CSV dışa aktarma (günlük seri + link tıklamaları, sahibe özel).
- [x] Gizlilik sayfası (`/privacy`, TR/EN; kodun gerçekten yaptığını anlatır).

**Kabul:** Bot UA'sı, prefetch ve sahip ziyareti sayılmıyor (birim + e2e test). 7g ve 30g seçimi sayıları gerçekten değiştiriyor. 100k olaylı seed'de analitik sayfası < 500ms.

**Faz 4 notları (2026-09-24):**
- ✅ `tests/unit/tracking.test.ts` (bot, prefetch, UA, hash, referrer, geo) · `tests/integration/analytics.test.ts` (aralıklar gerçekten filtreliyor, trend, kaynak önceliği, gün ekseni) · `tests/e2e/analytics.spec.ts` (sahip, tekrar, çift tıklama, WhatsApp önizleyicisi ve bot beacon'ı sayılmıyor; kaynak, cihaz, CSV). Dev + production'da geçiyor.
- ✅ Performans: 100k olayda `getAnalytics(30d)` **48 ms** (yerel Postgres). `DailyStat` özet tablosuna henüz gerek yok.
- ⚠️ Gizlilik sayfası iki şey vaat ediyor: hesap silmenin ayarlardan yapılabilmesi (Faz 5'te geliyor) ve `hello@linkiva.space` adresinin gerçek bir posta kutusu olması (kullanıcı doğrulamalı).
- Kitle, mobilde İstatistik sayfasının başlığından erişilebilir.
- E2E: Playwright'ın headless UA'sı bot filtresine takıldığı için testler gerçek bir iPhone/Instagram UA'sı kullanıyor. Uzun senaryolar 90 sn zaman aşımıyla çalışıyor, dev modunda ilk server action derlemesi için kayıt beklemesi 30 sn.

## Faz 5: Hesap, sağlamlaştırma, yayın

- [x] Ayarlar: e-posta değiştir (yeni adres onaylanınca), şifre değiştir (diğer oturumlar kapanır), Google bağla/ayır (tek giriş yöntemi korunur), oturumlar (ilk 5 + tümü), dil, tema, **veri dışa aktarma (JSON, sır içermez)**, hesap silme (kullanıcı adıyla onay, blob'lar dahil).
- [x] Landing: cam adres çubuğu (JS'siz form), sentetik "Örnek profil" cam telefonda, "ücretsiz" satır listesi (rakip adı/fiyat yok), kapanış çağrısı, alt bilgi.
- [x] 404'ler (`(site)/not-found`, profil 404, `global-not-found` ile eşleşmeyen tüm adresler), hata sınırları (`(site)/error.tsx`, profil `error.tsx`). Tüm metinler i18n (profil hatası iki dilli).

**Faz 5 ara notları (2026-09-24):**
- 🐞 Production e2e yarış durumu yakaladı: eşzamanlı iki tıklama tekrar kilidini birlikte geçip ikisi de kaydediliyordu. `event.dedupeKey` (ziyaretçi + hedef + zaman kovası) üzerinde tekil indeks eklendi, migration `event_dedupe_key`. `tests/integration/record.test.ts` 5 eşzamanlı tıklamada tam 1 kayıt doğruluyor.
- 🐞 Landing hero'su mobilde yatay taşıyordu (grid sütunu içerik genişliğine uzuyordu). `tests/e2e/layout.spec.ts` beş sayfada taşmayı koruyor.
- Playwright: production modunda 3 çalışan, test süresi 60 sn. Dev modunda Faz 3 testi ara sıra ilk derleme yükünde düşebiliyor; production ve tekrar çalıştırmalarda geçiyor.
- [x] Tasarım denetimi: impeccable detector (kod) → `ponytail-review`, bu sırayla. Sonuçlar DESIGN.md §11'de. Kontrast düzeltmeleri testle korunuyor. URL taraması `puppeteer` gerektirdiği için yapılmadı.
- [x] Güvenlik incelemesi (`/security-review`): yüksek güvenilirlikte açık yok. İki sağlamlaştırma uygulandı (doğrulama kaydı temizliği tam eşitlik, Blob URL'si kendi depomuzla sınırlı). `npm audit`: `overrides` ile 0 açık (`mysql2`, `deepmerge-ts`).
- [x] İşlem mailleri (TR/EN, cam tasarım, düz metin ikizi): doğrulama, sıfırlama, e-posta değişikliği **önce eski adrese onay** sonra yeni adrese doğrulama, hoş geldin, şifre değişti, hesap silindi. Önizleme: `/api/dev/mail` (yalnızca geliştirmede). `tests/unit/mail.test.ts`, account e2e iki adımlı akışı doğruluyor.
- [x] Dünya haritası (kullanıcı isteği): bağımlılıksız statik SVG, Natural Earth 1:110m (kamu malı) `scripts/build-world-map.mjs` ile Equal Earth projeksiyonunda `lib/world-map.ts`'e üretildi (69 KB, gzip 24 KB). Görüntülenme = mavi (grafikle aynı anlam), karekök ölçek, üzerine gelince ülke + sayı. v1 haritasının hataları (8 ülke eşlemesi, uzak GeoJSON, bakımsız paket) yok.
- [x] Harita üzerine gelince cam kart (ülke, görüntülenme, pay; ziyaretsiz ülkede "Henüz ziyaret yok"), yumuşak belirme, `prefers-reduced-motion`'a uyar. Editörde dnd-kit hydration uyuşmazlığı giderildi (`DndContext id`).
- ⚠️ `account.spec.ts` production'da 3 çalışanla ara sıra (6 tam koşuda 2) bir `toHaveURL` adımında düşüyor, tek başına hep geçiyor. Kök nedeni bulunmadı.
- [x] Panel geçişleri: her sayfaya kendi düzeninde cam iskelet (`loading.tsx`, `components/ui/skeleton.tsx`). Tek ışık süzmesi tüm iskelette ortak akar, iskelet 150 ms gecikmeyle belirir (hızlı geçişte görünmez). Sayfa React `<ViewTransition>` ile buğusu çözülerek gelir (`PageReveal`). Destek yoksa ya da `prefers-reduced-motion` açıksa anında geçer.
- [x] `docs/DEPLOY.md`: Supabase, Vercel env, Blob, Resend alan adı, Google Branding/redirect, `hello@` yönlendirme, preview → birleştirme sırası.
- [ ] **Yayın (kullanıcı adımları, `docs/DEPLOY.md`):** kullanıcı önce preview'da deneyecek, sonra `master`'a birleştirilecek. Eski DB geçişten sonra silinecek. Lighthouse ölçümü preview'da.
- [x] `DESIGN.md` build'den yeniden kaydedildi (gerçek token değerleri, köşeler, hareket, denetim kaydı).

**Kabul:** Tüm Playwright senaryoları production URL'inde geçiyor. Lighthouse (landing, profil, panel) ≥ 90/100/100. Açık kritik bulgu yok.

---

## v2.1: İçerik blokları ve okunabilirlik

- [x] `IMAGE` bloğu (migration `block_image`): tarayıcıda 1600px WebP, `u/<id>/block/` klasörü, yalnızca sahibinin Blob dosyası kabul edilir (`updateBlock`/`restoreBlock`, sahiplik testi). Alt metin, alt yazı, isteğe bağlı link (`/l` üzerinden sayılır, istatistikte görünür). Genişlik/yükseklik saklanır (kayma yok). Kullanılmayan görseller yeni görsel ayarlanınca temizlenir.
- [x] Link önizleme kartı (`fetchLinkCard`, `lib/link-preview.ts`): sunucu OG başlık/açıklama/görselini sahibin isteğiyle bir kez okur (SSRF: bağlantı anında IP kontrolü, özel/metadata ağları yasak, elle en fazla 3 yönlendirme, 6 sn, HTML 512 KB / görsel 5 MB, görsel türü baytlardan). Görsel sahibin Blob klasörüne kopyalanır, dakikada 10 deneme. Açıklama editörde düzenlenir. Görselli yol yalnızca Blob açık ortamda (preview) denenecek.
- [x] Okunabilirlik: arka plan görseli yüklenince parlaklık ölçülüp mod + karartma önerilir, karartma kaydırıcısı ve "Okunur yap". Çizgi butonda vurgu her zemin için okunur tona çekilir (uyarı yerine düzeltme). İç içe temada renk sınıfları kökten değil elemandan çözülür (`@theme inline`; önizlemedeki beyaz ikon hatası). Önizlemede abone butonu artık soluk görünmüyor.

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
