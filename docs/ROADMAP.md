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
- [x] **Yayın:** preview'da denendi, `master`'a birleştirildi, `linkiva.space` v2'de canlı (kullanıcı, 2026-09-27'den önce). Lighthouse ölçümü Faz 6'ya taşındı.
- [x] `DESIGN.md` build'den yeniden kaydedildi (gerçek token değerleri, köşeler, hareket, denetim kaydı).

**Kabul:** Tüm Playwright senaryoları production URL'inde geçiyor. Lighthouse (landing, profil, panel) ≥ 90/100/100. Açık kritik bulgu yok.

---

## v2.1: İçerik blokları ve okunabilirlik

- [x] `IMAGE` bloğu (migration `block_image`): tarayıcıda 1600px WebP, `u/<id>/block/` klasörü, yalnızca sahibinin Blob dosyası kabul edilir (`updateBlock`/`restoreBlock`, sahiplik testi). Alt metin, alt yazı, isteğe bağlı link (`/l` üzerinden sayılır, istatistikte görünür). Genişlik/yükseklik saklanır (kayma yok). Kullanılmayan görseller yeni görsel ayarlanınca temizlenir.
- [x] Link önizleme kartı (`fetchLinkCard`, `lib/link-preview.ts`): sunucu OG başlık/açıklama/görselini sahibin isteğiyle bir kez okur (SSRF: bağlantı anında IP kontrolü, özel/metadata ağları yasak, elle en fazla 3 yönlendirme, 6 sn, HTML 512 KB / görsel 5 MB, görsel türü baytlardan). Görsel sahibin Blob klasörüne kopyalanır, dakikada 10 deneme. Açıklama editörde düzenlenir. Görselli yol yalnızca Blob açık ortamda (preview) denenecek.
- [x] Okunabilirlik: arka plan görseli yüklenince parlaklık ölçülüp mod + karartma önerilir, karartma kaydırıcısı ve "Okunur yap". Çizgi butonda vurgu her zemin için okunur tona çekilir (uyarı yerine düzeltme). İç içe temada renk sınıfları kökten değil elemandan çözülür (`@theme inline`; önizlemedeki beyaz ikon hatası). Önizlemede abone butonu artık soluk görünmüyor.

## v2 sonrası yol haritası (Faz 6–13)

> Durum: **Onaylandı 2026-09-27. Faz 6 canlıda, Faz 7 bitti (commit bekliyor).** Dayanak: rakip araştırması (aşağıda) ve kullanıcının onayladığı öneri listesi.
> Her faz kendi dalında (`faz-6-guven`, `faz-7-hizli-baslangic` …) yürür, kendi içinde yeşil biter (`npm run check`, ilgili e2e, 390/1440 görüntü), preview'da denenir ve kullanıcı onayıyla `master`'a birleşir. Mutasyon içeren her maddede ARCHITECTURE §11 uygulanır ve sahiplik testi yazılır.

### Neden bu sıra

1. **Güven ve kırılmayan linkler önce (Faz 6).** Gerçek kullanıcı geldikten sonra kullanıcı adı değiştirme ve yönlendirme sonradan eklenirse biyografilerdeki linkler kırılır. Kapanmamış denetimler de geçişten önce biter.
2. **Kayıt engelini kaldır (Faz 7).** İçe aktarma, şablon ve akıllı yapıştırma "ilk 60 saniye" hedefine doğrudan hizmet eder.
3. **Türkiye'ye özel, ucuz ve ayırt edici bloklar (Faz 8).** Blok modeli bunları neredeyse bedava taşır.
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

## Faz 8: Türkiye blokları

**Amaç:** Türkiye'deki içerik üreticisi, freelancer ve küçük işletmenin gerçek ihtiyaçları. Ödemeye aracılık yok.

**Ortak altyapı**
- [ ] Tek migration `block_types_tr`: `BlockType` enum'una `SUPPORT, WHATSAPP, CONTACT, PRODUCT, COUNTDOWN` eklenir. Veri `Block.data` içinde; her tür için `blockDataSchemas` şeması ve `components/blocks/` altında render'cı (önizleme ve profil aynı bileşen).
- [ ] `/l/[blockId]` tür başına davranış kazanır: LINK/IMAGE/PRODUCT/WHATSAPP → 302, CONTACT → `.vcf` dosyası. Hepsi tıklama olarak sayılır.
- [ ] Kopyalama olayı: `/api/e` beacon'ı `{ p, b, k: "copy" }` kabul eder ve `record.ts` üzerinden CLICK yazar (tek yazma noktası korunur, tekrar kilidi aynı). İstatistikte kopyalama link tıklaması gibi görünür.
- [ ] Editör "Blok ekle" menüsü gruplanır: İçerik · Bağlantı · İletişim ve destek · Kitle.

**Bloklar**
- [ ] **SUPPORT (IBAN / destek):** `{ name, iban?, note?, links?: [{ label, url }] }`. IBAN `TR` + 24 hane, mod-97 sağlaması sunucuda (`lib/validation/iban.ts`, birim testli), 4'lü gruplarla gösterilir. "IBAN'ı kopyala" ve "Adı kopyala" butonları (Clipboard API; JS yoksa metin seçilebilir). Papara / Buy Me a Coffee gibi linkler şema beyaz listesinden geçer. Editörde uyarı: "IBAN sayfanda herkese açık görünür."
- [ ] **WHATSAPP:** `{ phone, message? }`. Telefon E.164'e normalize edilir (`+90` varsayılan), URL her zaman `https://wa.me/<phone>?text=` olarak **sunucuda kurulur** (kullanıcıdan URL alınmaz). İkon react-icons marka ikonu, monokrom.
- [ ] **CONTACT (kartvizit):** `{ name, title?, org?, phone?, email?, website? }`. `/l/<id>` `text/vcard; charset=utf-8` + `Content-Disposition: attachment` döner. vCard 3.0 alanları kaçışlı (`,;\` ve satır sonu), `lib/vcard.ts` birim testli. Buton: "Rehbere ekle".
- [ ] **PRODUCT (ürün / affiliate kartı):** `{ title, url, price?, img?, store?, sponsored? }`. Görsel ve başlık v2.1'deki link önizleme hattıyla alınır (`fetchLinkCard`). Fiyat serbest metin (≤ 20 karakter, ör. "₺249"); kur/stok iddiası yok. `sponsored: "1"` ise kartta "İşbirliği" etiketi görünür (Reklam Kurulu'nun sosyal medya etkileyicisi kılavuzu açık reklam beyanı ister). Mağaza adı URL host'undan türetilir.
- [ ] **COUNTDOWN:** `{ title, target, after: "hide" | "text", afterText? }`. Sunucu hedef tarihi profil saat diliminde `Intl` ile yazar (JS'siz çalışır), küçük bir istemci bileşeni geri sayar. `after: "hide"` ise bloğun `endsAt`'i hedefe eşitlenir; planlı blok kuralı ve ISR `revalidate` mevcut hattı kullanır.
- [ ] **Link grubu (açılır başlık):** Yeni tür değil. HEADER'a `collapsible: "1"` alanı eklenir. Sonraki HEADER ya da DIVIDER'a kadarki bloklar `<details>/<summary>` içinde render edilir (JS'siz, erişilebilir). Editörde grup içeriği girintili gösterilir.

**Test:** Her tür için şema birim testi, sahiplik entegrasyon testi (başkasının SUPPORT/CONTACT bloğunu güncelleyememe), e2e (vCard indirilip ayrıştırılıyor, WhatsApp 302 hedefi, kopyalama sayılıyor, geri sayım JS kapalıyken tarih gösteriyor, grup açılıp kapanıyor).

**Kabul:** Her yeni blok altı temada kontrast testinden geçiyor ve 390px'te taşmıyor. Hiçbir blok kullanıcıdan ham URL alıp doğrulamadan yönlendirmiyor.

---

## Faz 9: Editör hızı ve anlaşılır analitik

**Amaç:** Kullanıcının panele geri dönmesi için sebep, döndüğünde işini hızlı bitirmesi.

**Editör**
- [ ] **Komut paleti (⌘K / Ctrl+K):** `features/dashboard/components/command-palette.tsx`, mevcut `Dialog` + `Menu` primitive'leriyle (ek paket yok). Komutlar: blok ekle (tür başına), sayfaya git, temayı değiştir, QR indir, adresi kopyala, içe aktar. Klavyeyle tam kullanılır. Yalnızca masaüstü (mobilde alt çubuk var).
- [ ] **Satır içi mini grafik:** Editördeki her tıklanabilir blokta son 7 günün tıklaması. Tek SQL sorgusu (`features/analytics/queries.ts` → `getBlockSparklines(profileId)`, blok × gün `GROUP BY`), satır başına satır içi SVG `polyline` (recharts değil). Renk `--positive`. Veri yoksa çizgi yok, "—" yazar.

**Analitik**
- [ ] **Cümleyle içgörüler:** `features/analytics/insights.ts`, mevcut toplamlardan saf fonksiyonlar: en iyi kaynak → en çok tıklanan link, yoğun saat aralığı, düşen link ("*Portfolyo* tıklamaları geçen haftaya göre %40 az"). **Eşik:** örneklem yetersizse (ör. < 30 görüntülenme) içgörü gösterilmez (PRODUCT ilke 4). Birim testli, metinler i18n.
- [ ] **Saat × gün ısı haritası:** 7×24 ızgara, `EXTRACT(dow/hour FROM "createdAt" AT TIME ZONE timezone)`. Renk `--info` opaklık ölçeği, bağımlılıksız SVG. Hücrede cam kart (dünya haritası kartıyla aynı bileşen).

**Haftalık özet maili**
- [ ] Veri: `Profile.weeklyDigest Boolean @default(true)`, `Profile.digestSentAt DateTime?`, migration `weekly_digest`.
- [ ] Zamanlama: tek günlük cron `app/api/cron/daily/route.ts` (`vercel.json` crons; Vercel Hobby planı günde bir çalışmaya izin verir). `Authorization: Bearer ${CRON_SECRET}` zorunlu. Pazartesi özet, her gün Faz 13'teki link kontrolü.
- [ ] İçerik: geçen hafta görüntülenme/tıklama + trend, en iyi 3 link, bir içgörü. **Hiç ziyaret yoksa mail gönderilmez.** Cam mail şablonu, düz metin ikizi, TR/EN.
- [ ] Çıkış: Ayarlar'da anahtar + mailde tek tıkla çıkış linki (HMAC imzalı token, oturumsuz çalışır) ve `List-Unsubscribe` başlığı.
- [ ] Toplu gönderim: Resend batch API, çalıştırma başına sınır, `digestSentAt` ile idempotent (cron iki kez çalışsa da tek mail).

**Kabul:** Komut paletiyle blok ekleme klavyeden 3 saniyenin altında. İçgörüler yalnızca eşik üstü veride görünüyor (test). Özet maili aynı hafta ikinci kez gitmiyor, çıkış linki oturumsuz çalışıyor (entegrasyon testi).

---

## Faz 10: Izgara düzeni, hikâye kartı, canlı içerik

**Amaç:** Görsel olarak en belirgin fark. Bento'dan açıkta kalan "tasarlanmış sayfa" kitlesine cevap.

**Izgara (bento) düzeni**
- [ ] Veri: `appearanceSchema`'ya `layout: "list" | "grid"` (varsayılan `list`, migration gerekmez). `Block.size` kolonu: `enum BlockSize { SMALL WIDE LARGE }`, varsayılan `WIDE`, migration `block_size`. Liste düzeninde yok sayılır.
- [ ] Render: `profile-view.tsx` düzen moduna göre liste ya da CSS grid (mobil 2 sütun, ≥ 560px 4 sütun). SMALL 1×1, WIDE tam satır, LARGE 2×2. **`grid-auto-flow: dense` kullanılmaz:** görsel sıra DOM sırasıyla aynı kalır (klavye ve ekran okuyucu).
- [ ] Tür başına izinli boyutlar `lib/validation/blocks.ts`'te: LINK (S: ikon + başlık, W, L: önizleme kartıyla), IMAGE (S/W/L), EMBED (W/L), PRODUCT (S/L), SUPPORT/CONTACT/WHATSAPP (S/W). HEADER/TEXT/DIVIDER/EMAIL_CAPTURE/COUNTDOWN her zaman tam satır.
- [ ] Editör: satır menüsünde "Boyut" seçimi (yalnızca ızgara modunda), önizleme gerçek ızgarayı gösterir. Sıralama listede dnd-kit ile aynen devam eder.
- [ ] Görünüm sayfasında "Düzen: Liste / Izgara" seçimi, tema kartlarının üstünde.

**Hikâye paylaşım kartı** (eski backlog #6'nın yarısı)
- [ ] `app/(profile)/[username]/story/route.ts`: 1080×1920 `ImageResponse` (OG hattıyla aynı), avatar, ad, adres ve QR. İlk iş: QR SVG'sinin `ImageResponse` içinde doğru çizildiğini doğrula; çizilmezse QR matrisini `<rect>`lere çeviren küçük bir yardımcı yazılır (yeni paket yok).
- [ ] Panelde QR diyaloğuna "Hikâye görseli" butonu. Mobilde `navigator.share({ files })`, destek yoksa indirme.

**Son videoyu otomatik gösterme**
- [ ] EMBED'e `latest: "1"` + `channelId`. Kanal kimliği **kayıt anında** kanal sayfasından güvenli getirmeyle bulunur (`youtube.com` host beyaz listesi).
- [ ] Render: `https://www.youtube.com/feeds/videos.xml?channel_id=` `fetch(..., { next: { revalidate: 3600, tags: [profileTag] } })` ile okunur. DB'ye yazılmaz. Besleme okunamazsa blok gizlenir, eski bir video uydurulmaz. Hafif gömme davranışı aynı kalır.

**Kabul:** Izgara profilde Lighthouse erişilebilirlik 100, 390px'te taşma yok (layout testi ızgara profiliyle genişler). Hikâye görseli 1080×1920 keskin. Son video en geç bir saat içinde güncelleniyor.

---

## Faz 11: Özel alan adı

**Amaç:** Rakiplerde her zaman ücretli olan özelliği ücretsiz vermek (PRODUCT ilke 1'in en güçlü kanıtı).

- [ ] Veri: `CustomDomain { id, profileId @unique, hostname @unique, verifiedAt?, createdAt }`, migration `custom_domain`.
- [ ] Vercel Domains API (`lib/vercel-domains.ts`, düz `fetch`, paket yok): ekle, doğrulama durumunu sorgula, kaldır. Env: `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` (`lib/env.ts` + `.env.example`; yoksa özellik gizlenir, `lib/features.ts`).
- [ ] Yönlendirme: `proxy.ts` gelen host ana host değilse ve doğrulanmış bir `CustomDomain` ise isteği `/<username>` yoluna rewrite eder. Host → kullanıcı adı eşlemesi önbellekli (etiketli). Özel alan adında panel ve auth yolları 404 döner.
- [ ] `lib/site.ts` → `profileUrl(profile)` özel alan adı varsa onu döndürür. QR, OG, kanonik URL ve paylaşım kartı bunu kullanır. `/l/` ve `/api/e` göreli adreslerle özel alan adında da çalışır.
- [ ] Arayüz: Ayarlar → Alan adı. Hostname zod ile doğrulanır (yalnızca alan adı; ana alan adının alt alanları ve IP yasak). Eklenince gereken DNS kaydı (CNAME/A) gösterilir, "Doğrula" düğmesi durumu yeniler. Kaldırma ve hesap silmede Vercel'den de silinir.
- [ ] Güvenlik: profil başına bir alan adı, ekleme rate limit'i, başka profilde kayıtlı host reddedilir (aynı cevap, sızıntı yok). Sahiplik testi.
- [ ] `docs/DEPLOY.md`'ye Vercel token'ı oluşturma adımları (adım adım, tıklanacak yerle).

**Kabul:** Test alan adı preview'da profili açıyor, tıklama ve görüntülenme doğru profile sayılıyor, alan adı kaldırılınca 404.

---

## Faz 12: Portfolyo modu (PRODUCT ikinci aşama)

**Amaç:** Geliştirici ve tasarımcılar için proje odaklı sayfa. Izgara düzeni (Faz 10) üzerine kurulur.

- [ ] Bloklar (migration `block_types_portfolio`): `PROJECT { title, desc?, img?, tags[], url? }`, `EXPERIENCE { role, org, start, end?, desc? }`, `SKILLS { items[] }`.
- [ ] GitHub: kullanıcı adından pinned repolar (token varsa GraphQL, yoksa REST'te son güncellenen repolar). Kayıt anında çekilir, `PROJECT` bloklarına dönüştürülür, istenirse yenilenir. Render'da dış istek yok.
- [ ] Tema: `portfolyo` (DESIGN §7 tablosuna eklenir, monokrom, Geist Mono vurgulu). `terminal` teması portfolyo bloklarıyla uyumlu hale getirilir.
- [ ] Onboarding şablonlarına "Geliştirici / Tasarımcı" eklenir (Faz 7 altyapısı).

**Kabul:** GitHub kullanıcı adından 60 saniyede portfolyo sayfası. PROJECT kartları ızgarada S/W/L boyutlarında düzgün.

---

## Faz 13: Bakım ve güvenlik

- [ ] **Kırık link kontrolü** (eski backlog #4): `LinkCheck { blockId @unique, status, failCount, checkedAt }`, migration `link_check`. Faz 9'daki günlük cron her çalıştırmada en eski kontrol edilen N bloğu (ör. 200) `HEAD` (desteklenmezse `GET` ilk baytlar) ile dener, `lib/link-preview.ts` SSRF korumasıyla. **Art arda 2 başarısızlıktan sonra** editör satırında `--negative` "Ulaşılamıyor" rozeti ve sahibine tek mail. Yalnızca gerçekten denenmiş sonuç gösterilir.
- [ ] **Hassas içerik kapısı** (eski backlog #5): LINK'e `gate: "adult" | "spoiler"`. `/l/<id>` kapılı blokta önce sunucuda çizilen bir ara sayfa gösterir ("Devam et" → `/l/<id>?ok=1`). JS gerektirmez; tıklama yalnızca onaydan sonra sayılır.
- [ ] **2FA (TOTP):** Better Auth `twoFactor` eklentisi (ayrı paket değil), migration `two_factor`, yedek kodlar, Ayarlar → Güvenlik. QR `qrcode.react` ile.
- [ ] **PWA:** `app/manifest.ts`, ikonlar, `display: standalone`, `start_url: /dashboard`. Çevrimdışı önbellek yok (service worker gerekmiyor).

**Kabul:** Kırık link kontrolü özel ağ adreslerine hiç istek atmıyor (test). 2FA açık hesaba kod olmadan girilemiyor (e2e).

---

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
4. Doğrulanmış rozet, admin paneli (`role: ADMIN`, kötüye kullanım raporları, kullanıcı askıya alma). Kullanıcı sayısı büyüyünce kötüye kullanım yönetimi öne çekilir.
5. Herkese açık API + webhooks (yeni abone, günlük özet).
6. `DailyStat` özet tablosu (analitik ölçeği büyüyünce; Faz 9'un cron'u kullanılır).
7. bio.link / Beacons içe aktarıcıları (Faz 7'deki `importers.ts` haritasına).
