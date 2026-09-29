# Linkiva v2: Yeniden Kurulum Yol Haritası

> Durum: **Onaylandı 2026-09-24, uygulanıyor.** Fazlar sırayla uygulanır. Her faz kendi içinde çalışır durumda (yeşil build + testler) biter.
> Dayanak belgeler: `private/AUDIT.md` (yerel) · [ARCHITECTURE.md](ARCHITECTURE.md) · [../DESIGN.md](../DESIGN.md) · [../PRODUCT.md](../PRODUCT.md)

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
- [x] `docs/private/DEPLOY.md`: Supabase, Vercel env, Blob, Resend alan adı, Google Branding/redirect, `hello@` yönlendirme, preview → birleştirme sırası.
- [x] **Yayın:** preview'da denendi, `master`'a birleştirildi, `linkiva.space` v2'de canlı (kullanıcı, 2026-09-27'den önce). Lighthouse ölçümü Faz 6'ya taşındı.
- [x] `DESIGN.md` build'den yeniden kaydedildi (gerçek token değerleri, köşeler, hareket, denetim kaydı).

**Kabul:** Tüm Playwright senaryoları production URL'inde geçiyor. Lighthouse (landing, profil, panel) ≥ 90/100/100. Açık kritik bulgu yok.

---

## v2.1: İçerik blokları ve okunabilirlik

- [x] `IMAGE` bloğu (migration `block_image`): tarayıcıda 1600px WebP, `u/<id>/block/` klasörü, yalnızca sahibinin Blob dosyası kabul edilir (`updateBlock`/`restoreBlock`, sahiplik testi). Alt metin, alt yazı, isteğe bağlı link (`/l` üzerinden sayılır, istatistikte görünür). Genişlik/yükseklik saklanır (kayma yok). Kullanılmayan görseller yeni görsel ayarlanınca temizlenir.
- [x] Link önizleme kartı (`fetchLinkCard`, `lib/link-preview.ts`): sunucu OG başlık/açıklama/görselini sahibin isteğiyle bir kez okur (SSRF: bağlantı anında IP kontrolü, özel/metadata ağları yasak, elle en fazla 3 yönlendirme, 6 sn, HTML 512 KB / görsel 5 MB, görsel türü baytlardan). Görsel sahibin Blob klasörüne kopyalanır, dakikada 10 deneme. Açıklama editörde düzenlenir. Görselli yol yalnızca Blob açık ortamda (preview) denenecek.
- [x] Okunabilirlik: arka plan görseli yüklenince parlaklık ölçülüp mod + karartma önerilir, karartma kaydırıcısı ve "Okunur yap". Çizgi butonda vurgu her zemin için okunur tona çekilir (uyarı yerine düzeltme). İç içe temada renk sınıfları kökten değil elemandan çözülür (`@theme inline`; önizlemedeki beyaz ikon hatası). Önizlemede abone butonu artık soluk görünmüyor.

## v2 sonrası yol haritası (Faz 6–13)

> Durum: **Onaylandı 2026-09-27. Faz 6–12 canlıda, Faz 13 `master`'a birleşti (2026-09-28), canlıya push production `db:deploy` sonrası.** Dayanak: rakip araştırması (aşağıda) ve kullanıcının onayladığı öneri listesi.
> Her faz kendi dalında (`faz-6-guven`, `faz-7-hizli-baslangic` …) yürür, kendi içinde yeşil biter (`npm run check`, ilgili e2e, 390/1440 görüntü), preview'da denenir ve kullanıcı onayıyla `master`'a birleşir. Mutasyon içeren her maddede ARCHITECTURE §11 uygulanır ve sahiplik testi yazılır.

### Neden bu sıra

1. **Güven ve kırılmayan linkler önce (Faz 6).** Gerçek kullanıcı geldikten sonra kullanıcı adı değiştirme ve yönlendirme sonradan eklenirse biyografilerdeki linkler kırılır. Kapanmamış denetimler de geçişten önce biter.
2. **Kayıt engelini kaldır (Faz 7).** İçe aktarma, şablon ve akıllı yapıştırma "ilk 60 saniye" hedefine doğrudan hizmet eder.
3. **İletişim ve destek blokları (Faz 8).** Rakiplerin ödeme aracına dayanan özelliklerinin yerel karşılıkları (önce Türkiye, ama her ülkede çalışır). Blok modeli bunları neredeyse bedava taşır.
4. **Geri dönüş sebebi (Faz 9).** Editör hızlandırıcıları, anlaşılır analitik ve haftalık özet.
5. **Büyük görsel fark (Faz 10).** Izgara düzeni, hikâye kartı, son videoyu otomatik gösterme.
6. **Altyapı isteyen işler (Faz 11–13).** Özel alan adı, portfolyo, bakım ve güvenlik.

### Pazar bağlamı (2026-09-27)

- **Bento.me 2026-02-13'te kapandı** (Linktree satın almıştı; veriler silindi, eski adresler Linktree'ye yönleniyor). Izgara düzenli, "tasarlanmış" sayfa isteyen kitle açıkta. Bento verisi artık yok, bu yüzden Bento'dan içe aktarma yapılamaz; o kitleye Faz 10'daki ızgara düzeniyle ulaşılır.
- **Linktree'nin 2026-07-05 kullanım şartları:** OpenAI entegrasyonu, verinin yapay zekâ sağlayıcılarıyla paylaşımı ve içerik üreticilerinin verisiyle algoritma eğitimi. Linkiva'nın çerezsiz, IP saklamayan yapısı bu noktada doğal bir cevap (Faz 6 taahhüdü).
- **Kategori para kazanmaya kaydı** (Beacons, Stan, Linktree mağaza + %9–12 komisyon). Stripe Türkiye'de bireylere açık değil. Linkiva ödemeye aracılık etmez, ihtiyacı "hafif" yollarla (IBAN, affiliate kartı) karşılar (Faz 8).

---

## Faz 6: Güven, kırılmayan linkler, geçiş öncesi temizlik

**Amaç:** Geçiş gününden önce açık denetimleri kapatmak, kullanıcı adını değiştirilebilir ama linkleri kırılmaz yapmak, gizlilik farkını yazıya dökmek.

**Kapanmamış işler (Faz 5'ten)**
- [x] Lighthouse (canlı site, mobil, 2026-09-27): landing 95/100/100/100, giriş 97/100/100/100, profil **89**/100/100/100. Profilin LCP'si ilk ekrandaki link kartı görseliydi ve `loading="lazy"` idi; ilk 3 bloğun görselleri artık hemen yükleniyor (`EAGER_BLOCKS`). Canlıda yeniden ölçüldü (5 koşu, medyan **87**, 82–94): tembel yükleme uyarısı kalktı ama puan değişmedi; darboğaz artık kart görselinin kendisi (sıkıştırılmamış PNG, LCP ~3.8 sn). Profil ≥ 90 için kart görsellerinin WebP'ye çevrilmesi gerekiyor (aşağıdaki karar). Kalan: kart görselleri kaynaktaki biçimde (PNG) saklanıyor, WebP'ye çevirmek ~50 KB kazandırır (sunucuda görüntü işleme gerektiriyor, ayrı karar).
- [x] `account.spec.ts` kararsızlığı yeniden üretilemedi: tam paket 6 kez (132/132) ve `account` tek başına 9 eşzamanlı kopya geçti. Kök neden bulunmadı; tekrar görülürse iz (`trace`) saklanıyor. Aynı koşularda bulunan gerçek sorun: abone testleri aynı IP'den geldiği için tekrarlı koşuda abone rate limit'ine takılıyordu (limit doğru çalışıyor); e2e ziyaretçilerine ayrı belgeleme IP'si verildi (`visitorIp`).
- [x] Abone formu JS kapalıyken e2e testi (`tests/e2e/phase6.spec.ts`).
- [x] `ponytail-audit` (tüm depo, 2026-09-27): bağımlılıkların hepsinin gerçek kullanımı var, büyük fazlalık yok. Bulunan küçük ölü kod: kullanılmayan `ComingSoon` bileşeni ve "yakında" metinleri, 10 kullanılmayan çeviri anahtarı (≈45 satır). Temizlik Faz 7'nin ilk commit'ine bırakıldı. Sonuç DESIGN.md §11'de.

**Kullanıcı adı değiştirme + 90 günlük yönlendirme** (eski backlog #1)
- [x] Veri: `UsernameHistory { username @id, profileId, createdAt, expiresAt }`, migration `username_history`. Profil silinince cascade.
- [x] Eylem: `features/profile/actions.ts` → `changeUsername`. `withProfile` → `usernameSchema` → müsaitlik (canlı `Profile.username` **ve** süresi dolmamış `UsernameHistory` kayıtları dolu sayılır, sahibinin kendi eski adı hariç) → tek transaction: eski adı geçmişe yaz, yenisini ata. İki etiket de geçersiz kılınır (`profileTag(eski)`, `profileTag(yeni)`).
- [x] Sınır: 30 günde en fazla 2 değişiklik (DB'deki geçmişten sayılır, ek tablo yok).
- [x] Yönlendirme: `app/(profile)/[username]/page.tsx` profil bulunamayınca geçmişe bakar, süresi dolmamışsa `permanentRedirect("/" + yeni)` (308). `/l/` ve `/api/e` blok/profil kimliğiyle çalıştığı için etkilenmez. OG ve sitemap yalnızca yeni adı kullanır.
- [x] Arayüz: Ayarlar → Profil'de kullanıcı adı alanı; onboarding ile ortak `features/profile/components/username-field.tsx`. Uyarı: "Eski adresin 90 gün yeni adrese yönlenir, sonra başkası alabilir."
- [x] Onboarding ve müsaitlik kontrolü (`isTaken`) geçmişteki adları da dolu sayar. Yeni profil açılınca adının önbellekteki "yok" kaydı da temizlenir (`updateTag`).
- [x] Test: `tests/integration/username.test.ts` 8 senaryo (başkasının adını alamama, geçmişteki adı 90 gün alamama, kendi eski adına geri dönebilme, 30 gün sınırı), e2e (eski adres 308 → yeni adres).

**"Verin satılmaz" taahhüdü**
- [x] PRODUCT.md ilke 6. Landing'deki "ücretsiz" listesine bir satır: yapay zekâ eğitimi yok, üçüncü tarafla paylaşım yok, reklam yok. Rakip adı yazılmaz (DESIGN §7 Landing).
- [x] `/privacy` sayfasına aynı taahhüt bölümü (TR/EN). Metin kodun gerçekten yaptığını anlatır: Linkiva hiçbir LLM sağlayıcısına kullanıcı verisi göndermez.

**Kabul:** Eski kullanıcı adı 308 ile yeni adrese gidiyor, 90 gün sonra 404 veriyor ve başkası alabiliyor (zaman taklitli entegrasyon testi). Lighthouse sonuçları kayıtlı. Tüm e2e 6 ardışık production koşusunda kararlı.

---

## Faz 7: Hızlı başlangıç (içe aktarma, şablonlar, akıllı yapıştırma)

**Amaç:** "Kayıttan sonra 60 saniyede yayında sayfa" hedefini, başka platformdan gelen ya da ne yazacağını bilmeyen kullanıcı için de tutturmak.

**Linktree'den içe aktarma** (eski backlog #2)
- [x] `features/import/`: `importers.ts` (host → ayrıştırıcı, yalnızca `linktr.ee/<ad>`), `linktree.ts` (`__NEXT_DATA__` → ad, bio, linkler, başlıklar, oynatıcılar, sosyal hesaplar; yapı bozuksa `null`, tahmin yok). Gerçek linktr.ee sayfalarında (TikTok, Spotify, Linktree) 2026-09-27'de doğrulandı.
- [x] Getirme: `lib/link-preview.ts` → `fetchPage` (aynı SSRF korumaları + `hosts` beyaz listesi, son adres de kontrol edilir). 1 MB, kesilen sayfa reddedilir.
- [x] `readImport` hiçbir şey yazmaz (kullanıcı başına 10 dakikada 3). `applyImport` yalnızca işaretlenenleri, editörle aynı şemalardan geçirerek yazar: bloklar sona, sosyal hesaplar yalnızca boş platformlara, ad/bio yalnızca boşsa. Geçersiz öğeler atlanır ve sayısı söylenir (10 dakikada 5).
- [x] Önizleme adımı: işaretli liste (ad/bio, sosyal hesaplar, her blok ayrı), onaysız yazma yok.
- [x] Giriş noktaları: boş editör (onboarding'den hemen sonra açılan ekran, 60 sn yolunu uzatmaz) ve `linktr.ee` adresi yapıştırılınca. *Ayarlar → Veri girişi eklenmedi; ihtiyaç olursa aynı diyalog.*
- [x] Test: `tests/unit/import.test.ts` (sentetik fikstür `tests/fixtures/linktree.html`, host kuralları), `tests/integration/import.test.ts` (sahiplik, yalnızca boş alanları doldurma, geçersiz öğe, beyaz liste dışı host hiç getirilmez).

**Başlangıç şablonları**
- [x] `features/editor/templates.ts`: Öğrenci, Müzisyen, Serbest çalışan, İçerik üreticisi. Metinler `messages/*.json` → `templates.blocks`, sahibin dilinde.
- [x] Taslak kuralı için yeni alan gerekmedi: editör zaten eksik blokları saklıyor ve "Tamamlanmadı, sayfanda görünmüyor" diye işaretliyor, public sayfa `parseBlock` ile atlıyor. Şablon linkleri başlıkla ve boş adresle eklenir. *Tema önerisi eklenmedi (kullanıcının seçtiğini ezmemek için).*
- [x] Onboarding'e ayrı adım eklenmedi: şablonlar boş editörde, içe aktarmanın yanında (60 sn yolu aynı kaldı).

**Akıllı yapıştırma**
- [x] `features/editor/detect-block.ts` → `detectBlock`: oynatıcı → EMBED, `linktr.ee` → içe aktarma, diğerleri → başlığı host olan LINK. (WhatsApp, Faz 8'de blok gelince eklenecek.)
- [x] Editörde "Link yapıştır" alanı (boş alana yapıştırmak doğrudan ekler) ve alan/diyalog dışında sayfaya yapıştırma. Oynatıcı tahmininde toast'ta "Link olarak ekle". `addBlock` yalnızca tam ve geçerli LINK/EMBED ön dolgusunu kabul eder.
- [x] Test: `tests/e2e/phase7.spec.ts` (şablon taslakları yayına çıkmıyor, yapıştırma türleri, geçersiz metin, içe aktarma diyaloğu ve `linktr.ee` yapıştırınca açılması).

**Kabul:** Linktree URL'si veren yeni kullanıcı 60 saniye içinde linkleri taşınmış, yayında bir sayfaya sahip. Şablon seçimi yayında boş/kırık link bırakmıyor (e2e). *Not: içe aktarmanın ağ ayağı e2e'de değil (host beyaz listesi yerel fikstür sunucusuna izin vermez); ayrıştırma birim, yazma entegrasyon testinde, gerçek sayfa elle doğrulandı.*

---

## Faz 8: İletişim ve destek blokları

**Amaç:** İçerik üreticisi, freelancer ve küçük işletmenin iletişim ve destek ihtiyaçları, ödemeye aracılık etmeden. Önce Türkiye'deki alışkanlıklar düşünüldü (IBAN, WhatsApp, reklam beyanı), ama hepsi her ülkede çalışır: IBAN her ülkeden, telefon uluslararası (ülke kodu yoksa Türkiye varsayılır).

**Ortak altyapı**
- [x] Migration `block_types_contact_support`: `SUPPORT, WHATSAPP, CONTACT, PRODUCT, COUNTDOWN`. Şemalar `lib/validation/blocks.ts`, render'cılar `components/blocks/` (önizleme ve profil aynı bileşen), editör alanları `features/editor/components/contact-support-fields.tsx`.
- [x] `/l/[blockId]` tür başına: LINK/IMAGE/PRODUCT/SUPPORT linki → 302, WHATSAPP → numaradan sunucuda kurulan `wa.me`, CONTACT → `.vcf`. Hepsi tıklama sayılır.
- [x] Kopyalama: `/api/e` `{ p, b, k: "copy" }` → yalnızca o profilin görünür SUPPORT bloğu için `record.ts` üzerinden CLICK.
- [ ] ~~"Blok ekle" menüsünü gruplamak~~: 12 tür oklu kaydırma satırında (`ScrollRow`) kaldı; kalabalık gelirse gruplu menüye geçilir.

**Bloklar**
- [x] **SUPPORT:** ad, IBAN (her ülke: ISO 13616 biçimi + mod-97, bilinen ülkelerde tam uzunluk; `lib/validation/iban.ts`, 4'lü gösterim), not, tek bir destek linki (başlıklı). Kopyala butonu (Clipboard API; JS yoksa metin seçilebilir), editörde "herkese açık" uyarısı. *Plandaki link listesi yerine tek link: tek ihtiyaç Papara/BMAC linkiydi.*
- [x] **WHATSAPP:** telefon E.164 rakamları (`lib/validation/phone.ts`, yerel TR biçimleri), hazır mesaj, buton yazısı. Monokrom marka ikonu.
- [x] **CONTACT:** ad, unvan, şirket, telefon/e-posta/web'den en az biri. vCard 3.0 (`lib/vcard.ts`, kaçışlı, CRLF), ASCII dosya adı.
- [x] **PRODUCT:** ad, link, fiyat (serbest metin, Geist Mono), sayfadan görsel+açıklama (`fetchLinkCard` PRODUCT'ı da kabul eder), "İşbirliği" anahtarı → kartta etiket + `rel="sponsored"`.
- [x] **COUNTDOWN:** başlık, tarih-saat, bitince gizle/yazı göster. Sunucu tarihi profil saat diliminde yazar (JS'siz çalışır), istemci geri sayar (reduced motion'da dakikada bir). *"Gizle" `endsAt` ile değil `liveBlocks` içinde süzülür: ek alan gerekmedi.*
- [x] **Link grubu:** HEADER `collapsible`, `<details>/<summary>` (JS'siz). Editörde katlanan bloklar girintili ve kılavuz çizgili.
- [x] Akıllı yapıştırma: `wa.me` / `api.whatsapp.com/send` → WHATSAPP butonu.

**Test:** `tests/unit/contact-support-blocks.test.ts` (IBAN, telefon, vCard enjeksiyonu, şemalar, biten geri sayım, WhatsApp tespiti), `tests/integration/contact-support-blocks.test.ts` (başkasının IBAN'ını değiştirememe, WhatsApp ön dolgusu), `tests/e2e/phase8.spec.ts` (JS'siz profil, grup açılıyor, `wa.me` 302 hedefi, vCard indirme).

**Kabul:** Her yeni blok altı temada kontrast testinden geçiyor ve 390px'te taşmıyor. Hiçbir blok kullanıcıdan ham URL alıp doğrulamadan yönlendirmiyor.

---

## Faz 9: Editör hızı ve anlaşılır analitik

**Amaç:** Kullanıcının panele geri dönmesi için sebep, döndüğünde işini hızlı bitirmesi.

**Editör**
- [x] **Komut paleti (⌘K / Ctrl+K):** `features/dashboard/components/command-palette.tsx`, mevcut `Dialog` + `Menu` primitive'leriyle (ek paket yok). Komutlar: blok ekle (tür başına), sayfaya git, temayı değiştir, QR indir, adresi kopyala, içe aktar. Klavyeyle tam kullanılır. Yalnızca masaüstü (mobilde alt çubuk var).
- [x] **Satır içi mini grafik:** Editördeki her tıklanabilir blokta son 7 günün tıklaması. Tek SQL sorgusu (`features/analytics/queries.ts` → `getBlockSparklines(profileId)`, blok × gün `GROUP BY`), satır başına satır içi SVG `polyline` (recharts değil). Renk `--positive`. Veri yoksa çizgi yok, "—" yazar.

**Analitik**
- [x] **Cümleyle içgörüler:** `features/analytics/insights.ts`, mevcut toplamlardan saf fonksiyonlar: en iyi kaynak → en çok tıklanan link, yoğun saat aralığı, düşen link ("*Portfolyo* tıklamaları geçen haftaya göre %40 az"). **Eşik:** örneklem yetersizse (ör. < 30 görüntülenme) içgörü gösterilmez (PRODUCT ilke 4). Birim testli, metinler i18n.
- [x] **Saat × gün ısı haritası:** 7×24 ızgara, `EXTRACT(dow/hour FROM "createdAt" AT TIME ZONE timezone)`. Renk `--info` opaklık ölçeği, bağımlılıksız SVG. Hücrede cam kart (dünya haritası kartıyla aynı bileşen).

**Haftalık özet maili**
- [x] Veri: `Profile.weeklyDigest Boolean @default(true)`, `Profile.digestSentAt DateTime?`, migration `weekly_digest`.
- [x] Zamanlama: tek günlük cron `app/api/cron/daily/route.ts` (`vercel.json` crons; Vercel Hobby planı günde bir çalışmaya izin verir). `Authorization: Bearer ${CRON_SECRET}` zorunlu. Pazartesi özet, her gün Faz 13'teki link kontrolü.
- [x] İçerik: geçen hafta görüntülenme/tıklama + trend, en iyi 3 link, bir içgörü. **Hiç ziyaret yoksa mail gönderilmez.** Cam mail şablonu, düz metin ikizi, TR/EN.
- [x] Çıkış: Ayarlar'da anahtar + mailde tek tıkla çıkış linki (HMAC imzalı token, oturumsuz çalışır) ve `List-Unsubscribe` başlığı.
- [x] Toplu gönderim: Resend batch API, çalıştırma başına sınır, `digestSentAt` ile idempotent (cron iki kez çalışsa da tek mail).

*Uygulama notları (2026-09-27):* Özet `features/digest/` altında. Cron her gün 06:00 UTC çalışır; profil başına haftada (pazartesi 00:00 UTC'den itibaren) bir özet, 100'lük batch'e sığmayanlar sonraki günlerde gider. Her profil hesaplamadan önce koşullu `updateMany` ile sahiplenilir (eşzamanlı iki çalıştırma tek mail), batch reddedilirse sahiplenme geri alınır. Yalnızca doğrulanmış e-postalara gider. Çıkış: mailde onay sayfası `/unsubscribe` (GET hiçbir şey değiştirmez, tarayıcı/tarama botları linki açabilir) ve RFC 8058 tek tık `POST /api/digest/unsubscribe`; ikisi de HMAC imzalı token, oturumsuz. Ayarlar'da bölüm adı "Bildirimler" (hemen altındaki "E-posta" adres değiştirme bölümüyle karışmasın diye). Kart görselleri artık WebP (`sharp`, Faz 6'dan kalan Lighthouse işi). Komut paleti e2e'si `tests/e2e/phase9.spec.ts`: klavyeyle blok ekleme ısınmadan sonra ~0,3 sn (test 3 sn sınırını doğruluyor). Bu test, palet açılınca odağın arama kutusuna değil "Kapat" butonuna gittiğini yakaladı (`showModal()` React `autoFocus`'unu eziyordu); `Dialog` artık `data-autofocus` alanına odaklanıyor, içe aktarma diyaloğu da düzeldi.

**Kabul:** Komut paletiyle blok ekleme klavyeden 3 saniyenin altında. İçgörüler yalnızca eşik üstü veride görünüyor (test). Özet maili aynı hafta ikinci kez gitmiyor, çıkış linki oturumsuz çalışıyor (entegrasyon testi).

---

## Faz 10: Izgara düzeni, hikâye kartı, canlı içerik

**Amaç:** Görsel olarak en belirgin fark. Bento'dan açıkta kalan "tasarlanmış sayfa" kitlesine cevap.

**Izgara (bento) düzeni**
- [x] Veri: `appearanceSchema`'ya `layout: "list" | "grid"` (varsayılan `list`, migration gerekmez). `Block.size` kolonu: `enum BlockSize { SMALL WIDE LARGE }`, varsayılan `WIDE`, migration `block_size`. Liste düzeninde yok sayılır.
- [x] Render: `profile-view.tsx` düzen moduna göre liste ya da CSS grid (mobil 2 sütun, ≥ 560px 4 sütun). SMALL 1×1, WIDE tam satır, LARGE 2×2. **`grid-auto-flow: dense` kullanılmaz:** görsel sıra DOM sırasıyla aynı kalır (klavye ve ekran okuyucu).
- [x] Tür başına izinli boyutlar `lib/validation/blocks.ts`'te: LINK (S: ikon + başlık, W, L: önizleme kartıyla), IMAGE (S/W/L), EMBED (W/L), PRODUCT (S/L), SUPPORT/CONTACT/WHATSAPP (S/W). HEADER/TEXT/DIVIDER/EMAIL_CAPTURE/COUNTDOWN her zaman tam satır.
- [x] Editör: satır menüsünde "Boyut" seçimi (yalnızca ızgara modunda), önizleme gerçek ızgarayı gösterir. Sıralama listede dnd-kit ile aynen devam eder.
- [x] Görünüm sayfasında "Düzen: Liste / Izgara" seçimi, tema kartlarının üstünde.

**Hikâye paylaşım kartı** (eski backlog #6'nın yarısı)
- [x] `app/(profile)/[username]/story/route.ts`: 1080×1920 `ImageResponse` (OG hattıyla aynı), avatar, ad, adres ve QR. İlk iş: QR SVG'sinin `ImageResponse` içinde doğru çizildiğini doğrula; çizilmezse QR matrisini `<rect>`lere çeviren küçük bir yardımcı yazılır (yeni paket yok).
- [x] Panelde QR diyaloğuna "Hikâye görseli" butonu. Mobilde `navigator.share({ files })`, destek yoksa indirme.

**Son videoyu otomatik gösterme**
- [x] EMBED'e `latest: "1"` + `channelId`. Kanal kimliği **kayıt anında** kanal sayfasından güvenli getirmeyle bulunur (`youtube.com` host beyaz listesi).
- [x] Render: `https://www.youtube.com/feeds/videos.xml?channel_id=` `fetch(..., { next: { revalidate: 3600, tags: [profileTag] } })` ile okunur. DB'ye yazılmaz. Besleme okunamazsa blok gizlenir, eski bir video uydurulmaz. Hafif gömme davranışı aynı kalır.

**Kabul:** Izgara profilde Lighthouse erişilebilirlik 100, 390px'te taşma yok (layout testi ızgara profiliyle genişler). Hikâye görseli 1080×1920 keskin. Son video en geç bir saat içinde güncelleniyor.

*Uygulama notları (2026-09-27):*
- **Planı değiştiren kararlar:** EMBED ve SUPPORT ızgarada da tam satır (16:9 oynatıcı ve kopyala butonlu IBAN kareye sığmıyor). PRODUCT S/W/L (W varsayılan ve listedeki kart). Kayıtlı boyutu türün izin vermediği blok tam satır çizilir (`effectiveSize`). Küçük karoda ikon türden gelir, favicon çekilmez (dışarıya istek yok). Sütun sayısı ekran değil kapsayıcı genişliğinden (`@container`): editördeki telefon önizlemesi telefonun sütunlarını gösterir.
- **Hikâye QR'ı:** `qrcode.react` hook kullandığı için Satori'de çizilmiyor, Next de route handler'da `react-dom/server`'a izin vermiyor. Kullanıcı onayıyla `uqr` eklendi (MIT, bağımlılıksız, ~10 KB): SVG'yi doğrudan verir. Avatar yoksa cam halkada adın baş harfi. Paylaşım sayfası yalnızca dokunmatik cihazda açılır (`pointer: coarse`); masaüstü Chrome da dosya paylaşabildiği halde orada indirme beklenir.
- **Son video:** kanal sayfası AB'de onay ekranına yönlenebildiği için yalnızca YouTube host'larına `SOCS` çerezi gider (`fetchPage` → `cookie`). Besleme adresi doğrulanmış kimlikten sabit host'a kurulduğu için `link-preview` korumasından geçmez (kullanıcı URL'i değil). Canlı iki kanalda doğrulandı; e2e ağa çıkmaz.
- **Yan bulgular:** az bloklu profilde zemin ve ortam ışığı ekranın ortasında bitiyordu (`min-h-full` yalnızca `min-height`'ı olan ebeveynde çözülmez; `main` artık flex sütun). OG görseli yayından kaldırılmış profilin adını gösteriyordu; artık markaya düşer. Veri dışa aktarma blok boyutunu da içerir.
- **Canlı geri bildirimi (2026-09-27):** hikâyede profil fotoğrafı boş, zemin düz siyah çıkıyordu. Sebep: yüklemeler WebP ve Satori WebP çözemiyor (OG görselindeki avatar da boştu). Görseller artık sunucuda `sharp` ile PNG/JPEG'e çevrilip veriliyor (`forImageResponse`, yalnızca kendi Blob depomuz). Kullanıcı isteğiyle QR diyaloğuna hikâye zemini seçimi (Profilim / Koyu / Açık, `?look=`) ve gerçek önizleme eklendi. `Dialog` içeriği artık başlık altında kayıyor (uzun içerik telefonda kesiliyordu).
- **Ölçüm:** ızgara profil (production, mobil) Lighthouse erişilebilirlik **100**, performans 95. `tests/e2e/phase10.spec.ts` 390/1440'ta sütun sayısını, kare karoları, DOM sırasını ve taşmayı; hikâye görselinin boyutunu, indirmesini ve yayından kalkınca 404'ü doğrular.

---

## Faz 11: Özel alan adı

**Amaç:** Rakiplerde her zaman ücretli olan özelliği ücretsiz vermek (PRODUCT ilke 1'in en güçlü kanıtı).

- [x] Veri: `CustomDomain { id, profileId @unique, hostname @unique, verifiedAt?, createdAt }`, migration `custom_domain`.
- [x] Vercel Domains API (`lib/vercel-domains.ts`, düz `fetch`, paket yok): ekle, doğrulama durumunu sorgula, kaldır. Env: `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` (`lib/env.ts` + `.env.example`; yoksa özellik gizlenir, `lib/features.ts`).
- [x] Yönlendirme: `proxy.ts` gelen host ana host değilse ve doğrulanmış bir `CustomDomain` ise isteği `/<username>` yoluna rewrite eder. Host → kullanıcı adı eşlemesi önbellekli (etiketli). Özel alan adında panel ve auth yolları 404 döner.
- [x] `lib/site.ts` → `profileUrl(profile)` özel alan adı varsa onu döndürür. QR, OG, kanonik URL ve paylaşım kartı bunu kullanır. `/l/` ve `/api/e` göreli adreslerle özel alan adında da çalışır.
- [x] Arayüz: Ayarlar → Alan adı. Hostname zod ile doğrulanır (yalnızca alan adı; ana alan adının alt alanları ve IP yasak). Eklenince gereken DNS kaydı (CNAME/A) gösterilir, "Doğrula" düğmesi durumu yeniler. Kaldırma ve hesap silmede Vercel'den de silinir.
- [x] Güvenlik: profil başına bir alan adı, ekleme rate limit'i, başka profilde kayıtlı host reddedilir (aynı cevap, sızıntı yok). Sahiplik testi.
- [x] `docs/private/DEPLOY.md`'ye Vercel token'ı oluşturma adımları (adım adım, tıklanacak yerle).

**Kabul:** Test alan adı preview'da profili açıyor, tıklama ve görüntülenme doğru profile sayılıyor, alan adı kaldırılınca 404.

*Uygulama notları (2026-09-27):*
- **Proxy:** Next 16'da proxy Node.js runtime'ında çalışır; host → kullanıcı adı eşlemesi veritabanından, örnek başına 60 sn bellek önbelleğiyle (ıskalar da; kaldırılan alan adı en geç bir dakikada durur). Etiketli önbellek proxy'de kullanılamadığı için plandaki "etiketli" yerine bu. Karar saf fonksiyonda (`lib/custom-domains.ts` → `domainRoute`): `/`, `/story`, OG görseli profile rewrite; `/l/…`, `/api/e`, Next dosyaları ve ikonlar olduğu gibi; geri kalan her şey sitenin 404 sayfası (boş 404 tarayıcının hata ekranını gösteriyordu). Matcher artık tüm istekler (statik Next dosyaları hariç).
- **Doğrulama:** alan adı Vercel'de doğrulanmış **ve** DNS'i bize yönleniyorsa (`/v6/domains/…/config` → `misconfigured: false`) `verifiedAt` yazılır; yalnızca o zaman profil servis edilir. Başka Vercel hesabındaki bir alan adı için Vercel'in istediği TXT kaydı da tabloda gösterilir. Kök alan adı `A 76.76.21.21`, alt alan adı `CNAME cname.vercel-dns.com` (`com.tr` gibi iki parçalı uzantılar bilinir).
- **Adresler:** `profileUrl`/`profileDisplayUrl` isteğe bağlı alan adı alır; kanonik adres, OG, hikâye görseli, QR, panelde "Adresin" kartı ve komut paleti doğrulanmış alan adını kullanır. Özel alan adlı profiller sitemap'e girmez (kanonik adresleri başka host'ta). Özel alan adından gelen tıklamada o alan adı "kaynak" sayılmaz.
- **Bilinen sınır:** sahibinin oturum çerezi linkiva.space'e ait, bu yüzden sahibin kendi alan adındaki ziyaretleri istatistikten ayıklanamaz.
- **Hesap silme:** alan adı Vercel projesinden de kaldırılır (Vercel'e ulaşılamazsa hesap yine silinir, proxy o ad için 404 verir, hata günlüğe yazılır).
- **Test:** `tests/unit/domains.test.ts` (ad ayrıştırma, yönlendirme kuralı, DNS kaydı), `tests/integration/domains.test.ts` (Vercel taklitli: sahiplik, aynı cevap, doğrulanmadan servis yok, proxy'nin kendisi), `tests/e2e/phase11.spec.ts` (Chrome `*.localhost`'u yerel makineye çözer: gerçek render, `/l` tıklaması, panel/giriş/başka profil 404).

---

## Faz 12: Portfolyo modu (PRODUCT ikinci aşama)

**Amaç:** Geliştirici ve tasarımcılar için proje odaklı sayfa. Izgara düzeni (Faz 10) üzerine kurulur.

- [x] Bloklar (migration `block_types_portfolio`): `PROJECT { title, desc?, img?, tags[], url? }`, `EXPERIENCE { role, org, start, end?, desc? }`, `SKILLS { items[] }`.
- [x] GitHub: kullanıcı adından pinned repolar (token varsa GraphQL, yoksa REST'te son güncellenen repolar). Kayıt anında çekilir, `PROJECT` bloklarına dönüştürülür, istenirse yenilenir. Render'da dış istek yok.
- [x] Tema: `portfolyo` (DESIGN §7 tablosuna eklenir, monokrom, Geist Mono vurgulu). `terminal` teması portfolyo bloklarıyla uyumlu hale getirilir.
- [x] Onboarding şablonlarına "Geliştirici / Tasarımcı" eklenir (Faz 7 altyapısı).

**Kabul:** GitHub kullanıcı adından 60 saniyede portfolyo sayfası. PROJECT kartları ızgarada S/W/L boyutlarında düzgün.

*Uygulama notları (2026-09-27):*
- **Tasarım:** kullanıcıyla tıklanabilir taslak üzerinden kararlaştırıldı (Claude Design tuvali "Linkiva Portfolyo Teması"): tek parça profil, masaüstünde 960px, başlık bandı + sağda intro linkler, yan yana deneyim/yetenekler. Kullanıcının kendi sitesinin (yapışkan kenar çubuklu) kopyası bilinçli olarak yapılmadı. Ayrıntı DESIGN.md §7 Portfolyo.
- **Veri:** `PROJECT { title, desc?, url?, repo?, img?, tags?, stars? }`, `EXPERIENCE { role, org?, start?, end?, desc? }` (ay ya da yıl; bitiş yoksa "şimdi", bitiş başlangıçtan önce olamaz), `SKILLS { title?, items }`. Listeler editörde virgüllü metin, sunucuda temizlenip tekilleştirilir (`splitList`). Plandaki `tags[]`/`items[]` dizileri yerine metin: `Block.data` editörde düz metin haritası.
- **Tıklama:** kart `url`'e (yoksa `repo`'ya), küçük "Kod" linki `/l/<id>?k=repo` ile repoya; ikisi de sayılır. Proje görseli ve açıklaması link kartlarıyla aynı güvenli getirmeyle bir kez okunur ("Sayfadan görsel al"), sahibinin yazdığı adresleri değiştirmez.
- **GitHub:** içe aktarma diyaloğunun ikinci kaynağı (`github.com/<kullanıcı>`); `lib/github.ts` sabit `api.github.com` host'una doğrulanmış kullanıcı adıyla gider. `GITHUB_TOKEN` varsa sabitlenmiş repolar (GraphQL), yoksa fork/arşiv olmayan son güncellenenler (en çok 8); `<login>/<login>` profil README deposu atlanır. Ad/bio yalnızca boşsa, GitHub sosyal hesabı boşsa eklenir. Kullanıcının hesabında canlı doğrulandı. Yapıştırılan GitHub profili içe aktarmayı **açmaz** (genelde link olarak eklenmek istenir); yalnızca Linktree gibi bio-link sayfaları açar.
- **Şablonlar:** Geliştirici ve Tasarımcı; proje/deneyim/yetenek blokları boş taslak eklenir (uydurma içerik yayına çıkmaz). Tema değiştirilmez.
- **Test:** `tests/unit/portfolio.test.ts` (şemalar, şablon taslakları, tema varsayılanı), `tests/unit/import.test.ts` (GitHub adresleri), `tests/integration/import.test.ts` (GitHub projeleri yalnızca kendi profiline, güvensiz adres atlanır, repo/başka host okunmaz), `tests/e2e/phase12.spec.ts` (1440'ta başlık bandı ve yan yana bölümler, 390'da tek sütun, tek zaman çizelgesi, `?k=repo`, editörden üç blok).

---

## Faz 13: Bakım ve güvenlik

- [x] **Kırık link kontrolü** (eski backlog #4): `LinkCheck { blockId @id, url, status?, failCount, checkedAt, notifiedAt? }`, migration `link_check`. Günlük cron her çalıştırmada en eski kontrol edilen 120 bloğu `HEAD` (reddedilirse `GET`, gövde okunmaz) ile dener, `lib/link-preview.ts` SSRF korumasıyla. **Art arda 2 başarısızlıktan sonra** editör satırında `--negative` "Ulaşılamıyor" rozeti ve sahibine tek mail. Yalnızca gerçekten denenmiş sonuç gösterilir.
- [x] **Hassas içerik kapısı** (eski backlog #5): LINK'e `gate: "adult" | "spoiler"`. `/l/<id>` kapılı blokta önce sunucuda çizilen bir ara sayfaya (`/l/<id>/gate`) gider ("Devam et" → `/l/<id>?ok=1`). JS gerektirmez; tıklama yalnızca onaydan sonra sayılır.
- [x] **2FA (TOTP):** Better Auth `twoFactor` eklentisi (ayrı paket değil), migration `two_factor`, yedek kodlar, Ayarlar → İki adımlı doğrulama. QR `qrcode.react` ile.
- [x] **PWA:** manifest, ikonlar, `display: standalone`, `start_url: /dashboard`. Çevrimdışı önbellek yok (service worker gerekmiyor).

**Kabul:** Kırık link kontrolü özel ağ adreslerine hiç istek atmıyor (test). 2FA açık hesaba kod olmadan girilemiyor (e2e).

*Uygulama notları (2026-09-28):*
- **Kırık link:** `features/link-check/` (`targets.ts` hangi türün hangi adresi, `check.ts` günlük iş). Denenen türler: LINK, PRODUCT, IMAGE ve SUPPORT linki, PROJECT (canlı adres yoksa repo); yalnızca görünür bloklar, yayındaki profiller ve `http(s)` adresler. Yoklama `lib/link-preview.ts` → `probeUrl`: aynı SSRF koruması (bağlantı anında IP kontrolü, elle en fazla 3 yönlendirme), 8 sn. **Kırık sayılanlar yalnızca** 404, 410, 500, 502, 504, Cloudflare 52x/530, DNS'te olmayan alan adı, bağlantı reddi, geçersiz sertifika ve zaman aşımı. 401/403/429 ve 503 canlı sayfa sayılır (bot engeli, bakım/challenge sayfası). Özel ağ adresi, yönlendirme döngüsü ve `mailto:` "değerlendirilemedi" (`status = null`) olarak kalır, hiçbir zaman kırık gösterilmez. Adres değişince sonuç sıfırlanır (editör ve sorgu, kayıtlı `url` ile bloğun güncel adresini karşılaştırır). Bir blok 20 saatte en fazla bir kez denenir (cron iki kez çalışsa da). Mail: sahibe blok başına bir kez, önce koşullu güncellemeyle sahiplenilir (eşzamanlı iki çalıştırma tek mail), gönderim reddedilirse geri bırakılır. Cron özet ile kontrolü yan yana çalıştırır, biri düşerse diğeri devam eder. Canlı internette denendi: çalışan sayfa ok, 404 ve olmayan alan adı kırık.
- **Kapı:** kapılı link profilde kart görseli olmadan düz buton olarak çizilir (görsel de hassas olabilir), yanında "18+" / "Spoiler" etiketi, `rel="nofollow"`. Uyarı sayfası `app/(site)/(auth)/l/[blockId]/gate`: ziyaretçinin dilinde, gideceği alan adını gösterir, "Geri dön" profilin kanonik adresine (özel alan adı dahil) gider, `noindex`. Özel alan adında `/l/<id>/gate` de geçer (`domainRoute`). Editörde satır menüsünde "18+ uyarısı" / "Spoiler uyarısı".
- **2FA:** yalnızca e-posta/şifre girişini korur; Google ile girişte Google'ın kendi doğrulaması geçerli (Ayarlar'da yazıyor). Şifresi olmayan (yalnızca Google) hesapta bölüm açıklama gösterir. Açma, kapatma ve yeni yedek kodlar şifre ister; kapatınca güvenlik maili (`twoFactorOff`). Giriş formunda ikinci adım: uygulama kodu ya da yedek kod, "bu cihazda 30 gün sorma". Kod süresi (10 dk) dolarsa şifre adımına döner. Sırlar Better Auth tarafından `BETTER_AUTH_SECRET` ile şifreli saklanır; veri dışa aktarmada yok. Deneme sınırı eklentinin kendi kuralı (10 sn'de 3) ve 10 hatalı denemede 15 dk hesap kilidi.
- **PWA:** manifest `app/manifest.webmanifest/route.ts` (statik). `app/manifest.ts` kullanılmadı çünkü Next onu profil sayfaları dahil her sayfaya bağlar; ziyaretçi bir profili ana ekrana eklerse panel açılırdı. Manifest yalnızca site sayfalarından bağlanır. İkonlar `scripts/build-pwa-icons.mjs` ile `app/icon.svg`'nin çiziminden (`public/pwa/`, maskable tam taşan, `app/apple-icon.png`). Kısayollar: Linkler, İstatistik. `pwa` rezerve ad; rezerve ad testi artık `public/` klasörlerini de tarar.
- **Test:** `tests/unit/link-preview.test.ts` (özel ağ adresleri hızlı ve bağlantısız "skipped", durum kodu sınıflandırması, `checkableUrl`), `tests/integration/link-check.test.ts` (2 gün kuralı, aynı gün ikinci çalıştırma, tek mail, adres değişince sıfırlanma, gönderim hatasında geri bırakma, gerçek yoklamayla localhost, editör sorgusu sahiplik), `tests/integration/ownership.test.ts` (başkasının linkine uyarı koyamama, bilinmeyen tür yayına çıkmaz), `tests/e2e/phase13.spec.ts` (JS'siz kapı ve onaydan sonra sayım, editör rozeti ve uyarı seçimi, 2FA uçtan uca: yanlış şifre/kod, kodsuz oturum yok, yedek kod bir kez, kapatma maili; manifest yalnızca sitede).

---

## Vitrin, yasal ve yönetim yol haritası (Faz 14–19)

> Durum: **Onaylandı 2026-09-28** (kullanıcının yapılacaklar listesi). Faz 6–13 ile aynı kural: her faz kendi dalında, kendi içinde yeşil biter, kullanıcı onayıyla `master`'a birleşir. Sıra riske göre: önce yasal boşluk (kayıt formu var olmayan bir Kullanım Koşulları'na atıf yapıyordu), en son en çok uğraş ve güvenlik isteyen admin paneli.

### Faz 14: Yasal metinler ve iletişim (`faz-14-yasal`)

**Amaç:** Kayıt formunun atıf yaptığı Koşullar'ı yazmak, gizlilik metnini kodun bugün yaptığıyla eşitlemek (Faz 7–13 hiç anlatılmıyordu), ziyaretçiye ulaşma yolu ve hukuka aykırı içerik için bildirim-kaldırma düzeni kurmak.

- [x] Ortak yasal belge düzeni (`features/legal/`): `/privacy` ve yeni `/terms` aynı bileşen, TR/EN, içindekiler, son güncelleme tarihi, site alt bilgisi. Metin kodda (`privacy.ts`, `terms.ts`), başında hangi kodu anlattığı yazılı.
- [x] **Gizlilik ve KVKK aydınlatma metni:** veri sorumlusu (Serdar Şahin, `hello@linkiva.space`), işlenen veriler, amaçlar ve hukuki sebepler (KVKK m.5), alıcılar ve yurt dışı aktarım (Vercel, Supabase, Resend, Upstash, Google, ImprovMX, GitHub), toplama yöntemi ve sunucunun sahip adına attığı istekler, saklama süreleri, çerezler, m.11 hakları ve başvuru yolu, çocuklar. Oturumdaki IP/tarayıcı bilgisi, YouTube küçük resminin ziyaretçi tarayıcısından yüklenmesi, abone listesinde sahibin veri sorumlusu olması açıkça yazıldı.
- [x] **Kullanım Koşulları:** hizmet (ödemeye aracılık yok), hesap ve yaş (13+, 18 altı veli izni), kullanıcı adı, içerik lisansı, abone listesi ve 6563, işbirliği etiketi, yasaklar (müstehcen görsel yüklenemez; 18+ uyarısı yalnızca hukuka uygun linke), bildirim ve kaldırma (5651 yer sağlayıcı), hesabın kapanması, sorumluluk (kast/ağır ihmal ve tüketici hakları saklı), değişiklik (süre taahhüdü yok, kullanıcı isteği), Türk hukuku. İki belgede de Türkçe sürüm esas.
- [x] Onay cümlesi iki belgeye link verir; kayıtta "kabul" yalnızca Koşullar için, gizlilik metni "bilgilendirme" (KVKK aydınlatması rıza değildir). Google ile gelenler kayıt formunu görmeyebildiği için onboarding'de de ("Sayfamı yayınla" altında).
- [x] İletişim: landing ve yasal sayfaların alt bilgisinde `hello@linkiva.space` (`site.email`), Gizlilik, Koşullar. Ayrı iletişim sayfası yok (`mailto:` yeter).
- [x] Saklama sürelerini doğru kılmak: günlük cron bir günden eski hız sınırı sayaçlarını, süresi dolmuş doğrulama kayıtlarını ve 90 günü dolmuş eski kullanıcı adlarını siler (`features/maintenance/cleanup.ts`). Oturumlar bilinçli olarak silinmez (güvenlik; metin "hesap silinene kadar" diyor).
- [x] +18 kapısı testi: kart görseli olan kapılı linkin görsel adresi profil HTML'inde yok, liste ve ızgarada (`tests/e2e/phase13.spec.ts`).
- [x] Kaldırma yolu (admin paneli gelene kadar): `POST /api/takedown` (`TAKEDOWN_SECRET` Bearer, yoksa 404) ve onu çağıran `scripts/takedown.mjs`: bloğu görseliyle sil, profil fotoğrafı ve arka planı sil, sayfayı yayından kaldır; önbellek hemen düşer. Adımlar `docs/private/DEPLOY.md` §5d.

**Kabul:** `/terms` ve `/privacy` iki dilde, 390px'te taşmıyor; kayıt formundan ve onboarding'den ikisine de gidiliyor; metindeki her iddia koddaki bir davranışa karşılık geliyor.

*Uygulama notları (2026-09-28):*
- **Hukukçu okuması yapılmadı.** Metinler kodun davranışına göre yazıldı, hukuki görüş değil. Açık sorular: yurt dışı aktarım için KVKK m.9 (2024) standart sözleşme ve Kurul'a bildirim; 5651 m.5 yer sağlayıcının trafik bilgisi saklama yükümlülüğünün bu projeye uygulanıp uygulanmadığı (uygulanıyorsa oturum kayıtlarının süresi buna göre belirlenir); VERBİS muafiyeti; yaş sınırı.
- `/terms` zaten rezerve addı. Kaldırma ucu oturumla değil operatör anahtarıyla çalışır; ARCHITECTURE §10.1'de.
- Test: `tests/integration/cleanup.test.ts` (yalnızca süresi dolanlar silinir), `tests/integration/takedown.test.ts` (yalnızca sahibin kendi Blob dosyaları silinir, diğer görünüm ayarları korunur, bilinmeyen ad/geçersiz girdi), `tests/e2e/phase13.spec.ts` (kapılı görsel sızmıyor).

### Faz 15: Dil ve arama motoru (`faz-15-dil`)

- [x] Vitrin sayfalarına `/en` öneki (`/en`, `/en/privacy`, `/en/terms`), `en` ve `tr` rezerve. Türkçe `/`'de sabit; panel ve profil bugünkü gibi (çerez / sahibin dili). Dil adresten gelir: proxy `x-linkiva-locale` başlığını koyar, ziyaretçinin gönderdiğini siler.
- [x] `hreflang`: metadata `alternates` (canonical + tr, en, x-default) ve sitemap'te `alternates`. Sitemap'e yasal sayfalar girdi (her sayfa iki dilde).
- [x] Dil seçici: alt bilgide her zaman ("English" / "Türkçe"), tercihi diğer dil olan ziyaretçiye sayfanın üstünde öneri hapı ("This page is also in English."). JS'siz form + sunucu eylemi: çerezi yazar (kayıt ve panel de o dilde açılır), aynı sayfanın diğer diline gider. Otomatik yönlendirme yok.
- [x] 404'ler ziyaretçinin dilinde (statik kalmak için dil tarayıcıda seçilir); profil 404'ünde adresteki ad hazır dolu adres çubuğu ("… henüz kimsenin değilse senin olabilir"; kesin "boşta" denmez, yayında olmayan ya da yönlendirmedeki ad olabilir), durum kodu 404.

*Uygulama notları (2026-09-28):*
- **Davranış değişikliği:** `/` artık İngilizce tarayıcıda da Türkçe (eskiden Accept-Language'e göre İngilizce açılıyordu); İngilizce sürüm `/en`'de, öneri hapı yönlendiriyor. Arama motoru her adreste tek dil görür.
- Profil 404'ü ve `global-not-found` çerez okumaz: iki dilin metni gönderilir, `useVisitorLocale` seçer ve `<html lang>`'ı günceller. Production build'de `/[username]` hâlâ ● (SSG/ISR).
- Durum kartı (`StatusPage`) tam genişlik: adres çubuğu 390px'te kartı taşırıyordu. 404 kartında adres çubuğu yalnızca ok düğmesiyle (`compact`).
- Test: `tests/unit/i18n.test.ts` (adres eşlemesi, hreflang), `tests/e2e/phase15.spec.ts` (İngilizce tarayıcıda `/` Türkçe + öneri + çerez kayda taşınıyor, canonical/hreflang, sitemap, sahte başlık etkisiz, profil 404 ön dolgu, global 404 İngilizce, JS'siz dil anahtarı), `layout.spec.ts` `/en` ve `/en/terms` ile genişledi.

### Faz 16: Yükleme hissi (`faz-16-yukleme`)

Geri bildirim (2026-09-28): "hızlı sayfada sorun yok, yavaş sayfada ekran donmuş gibi bekliyoruz". Faz 5 sonrası kaldırılan tam sayfa iskelet geri gelmez (her geçişte yanıp sönüyordu).
- [x] Geçiş 300 ms'yi aşarsa içerik alanı söner (%55), üstte 2px ilerleme çizgisi akar (tüm panel sayfaları). Hızlı geçişte hiçbir şey görünmez. Sekme altındaki nokta bunun yerini aldı.
- [x] Yavaş bölümler sayfa içinde `Suspense` ile akar: İstatistik (başlık ve aralık sekmeleri hemen, rakamlar/grafik/harita/listeler iskeletle; aralık değişince yalnızca bu bölüm) ve Kitle (liste). Editör, Görünüm ve Ayarlar bütün veriye ihtiyaç duyduğu için akıtılmadı; onlarda geçiş ipucu yeterli.
- [x] Yavaşlık ölçümü: bölge sorunu değil (fonksiyon `fra1`, DB Frankfurt). Canlıda ısınmış sunucu `/login` ~0,3 sn, **soğuk başlangıç ~2 sn** (ilk istek). Donma hissinin kaynağı soğuk başlangıç + tıklamadan sonra hiçbir değişiklik olmaması. Panel düzeninde profil ve alan adı sorguları paralel, Görünüm sayfası kullanmadığı tıklama geçmişi sorgusunu atlıyor.

*Uygulama notları (2026-09-28):*
- `features/dashboard/components/navigation-pending.tsx`: yakalama aşamasında belge tıklaması dinlenir (linklere tek tek dokunmadan: sekmeler, aralık, "Aboneleri gör"); adres değişince biter (yönlendirme dahil), aynı sayfaya tıklama bir şey başlatmaz, 15 sn'de vazgeçer. Komut paleti `router.push` öncesi `announceNavigation` çağırır. Görsel gecikme CSS'te (`.nav-dim`, `.nav-progress`), `main` ayrıca `aria-busy`.
- Başlık ile gövde aynı sorgu sözünü (promise) paylaşır; CSV düğmesi de kendi küçük `Suspense`'inde, veri gelince görünür.
- Server-Timing başlığı eklenmedi: App Router sayfası yanıt başlığı yazamıyor, ölçüm dışarıdan (curl) yapıldı.
- Test: `tests/e2e/phase16.spec.ts` (yanıt bekletilince `data-navigating`, `aria-busy`, çizgi ve gerçekten düşen opaklık; sayfa gelince hepsi kalkar; açık sayfaya tıklama bir şey başlatmaz; İstatistik aralık değişimi), mobil ve masaüstü.

### Faz 17: Landing yenileme ve 3D (`faz-17-vitrin`)

- [x] İçerik güncel: yedi tema, ızgara, özel alan adı, IBAN/WhatsApp, portfolyo, içe aktarma, 2FA, hikâye kartı, 90 gün ad yönlendirmesi (16 satır). Temaları gerçek CSS'le gösteren tema turu, SSS (6 soru). Rakip adı ve sahte sayı yok (görüntülenme kartı "Örnek profil"in parçası).
- [x] **3D şekil:** kullanıcı seçenekleri tuvalde (A CSS 3D, B WebGL, C three.js) ve yerelde (`/dev/*` demoları: three.js cam telefon, kil karakter, karma) gördü; karar **A'nın tasarımı + three.js demolarının hareketi**, CSS 3D ile. Paket eklenmedi, DESIGN §8 kuralı yerinde (landing'e kaydırmaya bağlı hareket istisnası yazıldı).

*Uygulama notları (2026-09-28):*
- `features/landing/`: `landing-stage.tsx` (sabit, `aria-hidden` sahne; dönüşümler her karede elemanlara yazılır, React yalnızca ad/tema değişince çizer), `theme-palette.tsx` (gezen palet + tema adı), `scroll-stops.ts` (duraklar: `data-stop` işaretli bölümler; ekrandan uzun bölüm "tutulur", `tour`, `orbitAt`), `stage-looks.ts` (temaları `resolveAppearance` + `sceneVars` ile sahne özniteliklerine çevirir; `sceneVars` profile-view'dan dışa açıldı), `landing-faq.tsx`, `feature-rows.tsx`, `sample.ts`. Telefon ile sayfa arasında pencere olayları (`theme-events.ts`), adres çubukları olduğu gibi sunucu formu.
- Tuzaklar: bölüm işareti `data-scene` olamaz (profil CSS'i kullanıyor, katmanlar bölüm sanılıyordu) → `data-stop`. Yörünge açısı zamanla büyürse bloklar giderek hızlanır → açılar sınırlı (`orbitAt`, `tests/unit/scroll-stops.test.ts`).
- Mobil: telefon ilk ekranda ve tema bölümündeki `data-stage-slot` yerine oturur, arada söner; yatay taşma yok.

### Faz 17 sonrası düzeltmeler (`duzeltme-404`, 2026-09-28)

- [x] Landing'de sol üstteki Linkiva yazısı ana sayfaya (dilin adresine) gider. Diğer sayfalarda zaten bağlantıydı.
- [x] 404 sayfaları (site, adres eşleşmeyen genel 404, profil 404) kartsız: yazı solda, sağda büyük kil maskot; elinde ucu kopuk zincir fizikle sarkar, imleç geçince sallanır; başlık "Bu link kopmuş." / "This link is broken." (profil 404 başlığı değişmedi). three.js yalnızca burada, tembel; DESIGN §8'e istisna olarak yazıldı.

### Hesap silmede bekleme, kısa ad yönlendirmesi (`faz-hesap-bekleme`, 2026-09-29)

- [x] Hesap silme 15 gün bekler (`features/account/deletion.ts`, tablo `account_deletion`): sayfa hemen yayından kalkar (önceki yayın durumu saklanır), bütün oturumlar kapanır, kullanıcıya geri alma maili gider. Bu sürede giriş yapan panel yerine "Hesabını geri yükle" ekranını görür; onboarding ve editör action'ları kapalı. Günlük cron süresi dolanı dosyaları ve özel alan adıyla birlikte siler, "hesabın silindi" maili o zaman gider. Haftalık özet bekleyen hesaba gitmez.
- [x] Eski kullanıcı adı 90 yerine 30 gün yönlenir; migration yürüyen yönlendirmeleri de 30 güne kısaltır.
- [x] Gizlilik ve Koşullar'daki saklama/silme cümleleri güncellendi.
- [x] Test: `tests/integration/account-deletion.test.ts` (yanlış onay, yayından kalkma, oturumlar, editör kilidi, başkası geri yükleyemez, eski yayın durumuna dönüş, 14. gün kalır / 15. gün silinir), `tests/e2e/account.spec.ts` (sil → 404 + mail → giriş → geri yükle → sayfa 200).

### Yasal metin sadeleştirmesi (`duzeltme-yasal`, 2026-09-29)

- [x] Gizlilik: Kurul'a şikâyet cümlesi çıkarıldı (KVKK aydınlatmasında zorunlu değil; AB'deki kullanıcıya kendi otoritesi GDPR m.13 gereği yazıyor). Kanıtlanamayan iddialar yumuşatıldı: "açık rızaya dayanan işleme yapmayız" çıktı, "veritabanına yalnızca veri sorumlusu erişir" → "yönetir", yedeklerden silinme "kısa sürede" yerine yedeklerin saklama süresine bağlandı. Tarih 29 Eylül 2026.
- [ ] Hukukçu okuması hâlâ açık; en önemli soru yurt dışı aktarımın (m.9) dayanağı (yukarıdaki Faz 14 notu).

### Faz 18: Yeni gelen rehberi (`faz-18-rehber`)

- [x] Editörün üstünde kapatılabilir "İlk adımlar" kartı (`features/editor/components/start-guide.tsx`; "Başlangıç" adı zamanlama alanıyla çakıştığı için değişti): ilk link, fotoğraf (yükleme kapalıysa adım yok), görünüm, adresi paylaş. Adımlar canlı editör durumundan işaretlenir; "paylaş" yalnızca ilk gerçek ziyaretçiyle (VIEW olayı) işaretlenir, tıklamayla değil. Her adımın düğmesi işi yapan alana götürür. Kapatma hesaba yazılır (`profile.guideDismissedAt`, migration `20261005090000_start_guide`; var olan sayfalar kapalı başlar). Modal tur yok.
- [x] Bir kez gösterilen ipuçları (`features/dashboard/components/once-tip.tsx`, tarayıcıda saklanır): mobilde alt çubuğun önizleme düğmesi, masaüstünde kenar çubuğunda Ctrl K. Kapatınca ya da o düğme/arama kullanılınca bir daha çıkmaz.
- [x] Test: `tests/e2e/phase18.spec.ts` (kart kendiliğinden işaretlenir, kopyalama "paylaş"ı işaretlemez, kapatma yeniden yüklemede kalır, iki ipucu bir kez), sahiplik testinde `dismissGuide`.

### Faz 19: Admin paneli ve kötüye kullanım yönetimi (`faz-19-admin`)

Backlog #4'ün genişletilmişi. En çok güvenlik önlemi isteyen faz; ayrı tehdit modeli ve `/security-review` ile biter.
- [x] Hazırlık: uygulamanın hız sınırları Upstash'ten Postgres'e (`rate_counter`, hash'li anahtar, tek atomik upsert). Upstash canlıda hiç kurulmamıştı; sınırlar örnek başına bellekteydi. Upstash gizlilik metninden ve bağımlılıklardan çıktı.
- [x] Rol modeli (`user.role`: USER / MODERATOR / ADMIN; Better Auth alanı değil, hiçbir auth ucu okuyup yazamaz), `lib/admin.ts` tek kapı: `/admin` sayfaları ve her admin action sunucuda rol + 2FA kontrolü; personel olmayana düz 404 (oturumsuz istek proxy'de 404). Oturum çerez önbelleği atlanır (iptal edilen oturum/rol anında düşer). Silinmeyi bekleyen hesap personel sayılmaz.
- [x] Yeniden doğrulama (`admin_step_up`): güncel TOTP kodu bu oturumda 10 dk hassas işlemleri açar. Better Auth oturumlu doğrulamada hata saymadığı için 15 dk'da 5 deneme sınırı bizde; her deneme günlükte.
- [x] Denetim günlüğü `admin_audit`: yabancı anahtar yok (silinen hesaptan sonra da kalır), e-posta değil etiket; UPDATE/DELETE/TRUNCATE veritabanı tetikleyicisiyle reddedilir.
- [x] İlk admin: `scripts/set-role.mjs <email> ADMIN` (sonrası panelden). `/admin` noindex, no-store, çerçevelenemez.
- [x] Test: `tests/integration/admin.test.ts` (oturumsuz/normal/2FA'sız/moderatör/silinmeyi bekleyen, yeniden doğrulama süresi-oturumu-deneme sınırı, günlük değiştirilemez), `admin-role.test.ts` (kayıtta rol gönderilemez), `ratelimit.test.ts`, `tests/e2e/phase19.spec.ts`.
- [ ] Kullanıcılar listesi ve rol değiştirme (yalnız admin, yeniden doğrulamalı, son admin kendini düşüremez).
- [ ] Supabase Data API: public şemadaki tablolarda RLS kapalı; Data API açıksa tablolar anon anahtarla okunabilir. Kontrol edilip kapatılacak (Data API kapatma ya da RLS açma; uygulama `postgres` rolüyle bağlanır, RLS'ten etkilenmez).
- [x] Kötüye kullanım bildirimi: her yayındaki profilin altında sessiz "Bu sayfayı bildir" bağlantısı (marka gizlense de kalır) → `/report/<kullanıcıadı>` (rezerve ad `report`). Sebep listesi, isteğe bağlı açıklama ve e-posta; bot tuzağı; IP başına saatte 5, aynı sayfaya günde 2 (hash'li sayaç); yalnızca yayındaki sayfa ve o sayfanın görünür bloğu. Tablo `report` (profil silinince gider; sonuçlananlar 180 gün sonra günlük temizlikte silinir, `REPORT_KEEP_DAYS`). Gizlilik metnine "Bir sayfayı bildirdiğinde" ve saklama satırı eklendi.
- [x] Bildirim kuyruğu `/admin/reports` (açık: en eski üstte, aynı sayfaya kaç açık bildirim olduğu; sonuçlanan), detay: bildirim, bildirilen bloğun alanları düz metin (link açılmaz), sayfanın ziyaretçi görünümü (etkisiz önizleme), aynı sayfanın diğer bildirimleri. "Yok say" (moderatör, not günlüğe; yarışta tek günlük satırı). Kenar çubuğunda açık bildirim sayısı.
- [x] 3a: bildirim detayından bloğu kaldır, görselleri kaldır, sayfayı askıya al / askıyı kaldır (`actOnReport`, `unsuspendPage`): moderatör + 2FA + yeniden doğrulama, gerekçe zorunlu, günlük, sahibine e-posta (`contentRemoved`, `pageSuspended`, `pageRestored`). Askı `profile.suspendedAt` (migration `20261009090000_suspension`) + yayından kaldırma: ziyaretçi "Bu sayfaya şu an ulaşılamıyor" görür (gerekçe yok), link/takip/abone/sitemap mevcut yayın kontrolleriyle kapanır; sahip panelde uyarı görür, yayın ayarı ve hesap geri yükleme askıyı delmez. `/api/takedown`, `scripts/takedown.mjs` ve `TAKEDOWN_SECRET` kaldırıldı.
- [x] 3b: `/admin/users` (yalnız admin; moderatöre 404): kullanıcı adında arama, e-postayla yalnızca tam adres (her e-posta araması günlükte: bulunan hesap, adres değil). Detayda e-posta yalnız admine görünür. Rol değiştirme (`setRole`: yeniden doğrulama + gerekçe, günlükte from/to; son admin düşürülemez; düşürülenin yeniden doğrulamaları biter). Anında silme (`eraseAccountNow`: yeniden doğrulama, "istek kayıtlı adresten geldi" onayı, adı yazma, gerekçe; kendini ve başka admini silemez; 15 günlük silmeyle aynı `eraseAccount`; sahibine `accountErased` maili).
- [ ] 3c: denetim günlüğü ekranı, tehdit modeli ve güvenlik kapanışı.
- [ ] Denetim günlüğü: her admin işlemi kim, ne zaman, neyi, neden; silinemez.
- [x] Faz 14'teki `scripts/takedown.mjs` panelin eylemleriyle değiştirildi (3a).

---

## Kullanıcı geri bildirimiyle yapılan düzeltmeler (2026-09-27)

- [x] Editörde blok türü satırı PC'de kaydırılamıyordu: cam oklar (yalnızca fare), odak çerçevesi kırpılmıyor, oklar ortalı.
- [x] Mobilde Görünüm seçim kutuları taşıyordu: satıra sığmayınca kart köşesi, seçenekler satırı paylaşır.
- [x] **Panel geçişlerinde iskelet kaldırıldı** ("her geçişte iskelet göz yoruyor"): `loading.tsx` dosyaları silindi, geçişte eski sayfa yenisi hazır olana kadar kalır; ziyaret edilen sekmeler 30 sn istemci önbelleğinde (`staleTimes.dynamic`, değişiklikler önbelleği temizler); 200 ms'den uzun süren geçişte tıklanan sekmenin altında küçük bir nokta (`useLinkStatus`). Sayfa geçişi 160 ms bulanıksız solma.

## Bilinçli olarak yapılmayanlar

Karar 2026-09-27. Kullanıcı açıkça istemedikçe yeniden önerilmez.

- **Ödeme alma, mağaza, komisyon.** Türkiye'de ödeme aracılığı yasal ve vergisel yük getirir, para kazanma modeli de belirlenmedi. İhtiyacın büyük kısmını SUPPORT (IBAN) ve PRODUCT (affiliate) blokları karşılar.
- **Yapay zekâ ile içerik/caption üretimi.** Gizlilik taahhüdüyle çelişir (veri bir LLM sağlayıcısına gider) ve maliyet getirir. İçgörüler (Faz 9) LLM'siz, SQL ile üretilir.
- **Sticker panoları ve süs katmanları.** "Sessiz cam" teziyle ve reddedilen "oyuncak" hissiyle çelişir (DESIGN §0).

## Backlog (fazlara alınmamış fikirler)

Faz 6–13'e taşınanlar: kullanıcı adı yönlendirmesi (6), Linktree içe aktarma (7), paylaşım kartı (10), özel domain (11), portfolyo (12), kırık link kontrolü, hassas içerik kapısı, PWA ve 2FA (13).

1. Link başına QR ve UTM oluşturucu.
2. Kısa link (`linkiva.space/l/abc`).
3. İletişim formu bloğu (mail yönlendirme), Cal.com bloğu, harita (konum) bloğu.
4. Doğrulanmış rozet. *(Admin paneli ve kötüye kullanım yönetimi Faz 19'a taşındı.)*
5. Herkese açık API + webhooks (yeni abone, günlük özet).
6. `DailyStat` özet tablosu (analitik ölçeği büyüyünce; Faz 9'un cron'u kullanılır).
7. bio.link / Beacons içe aktarıcıları (Faz 7'deki `importers.ts` haritasına).
8. **Tam CSP** (güvenlik denetimi 2026-09-28, `docs/private/SECURITY-AUDIT-2026-09-28.md` → D-1). Bugün yalnızca `frame-ancestors` var. `script-src 'nonce-…' 'strict-dynamic'` için proxy'de istek başına nonce üretilir (Next rehberi: `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`). Nonce, statik/ISR profil önbelleğini bozabilir, önce bunun etkisi ölçülür. Embed iframe'leri (YouTube, Spotify…) ve Vercel Blob görselleri `frame-src`/`img-src` listesine girer. Olası XSS'in etkisini sınırlar (oturum token'ları ayarlar sayfasında istemciye gidiyor, denetim B-3).
