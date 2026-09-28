# Yayın rehberi (v2)

v1 canlıda çalışırken v2 yan yana kurulur, preview'da denenir, sonra tek seferde geçilir.
Sıra önemli: **eski veritabanı en son silinir**, yoksa canlı v1 sitesi geçişten önce bozulur.

## 1. Veritabanı (Supabase)

1. Supabase'de **yeni bir proje** aç (ör. `linkiva-v2`). Temiz başlangıç budur. Eski veri taşınmıyor.
   Bölge kullanıcılara ve Vercel fonksiyonlarına yakın olmalı: Türkiye için **Frankfurt (eu-central-1)** ve Vercel → Settings → Functions → Region **fra1**. DB ile fonksiyon farklı kıtadaysa panelde her sorgu ~150–250 ms gecikir.
   Şifre olarak Supabase'in ürettiği güçlü şifreyi kullan.
2. Project Settings → Database → Connection string:
   - `DATABASE_URL`: **Transaction pooler** (port 6543), sonuna `?pgbouncer=true` ekle.
   - `DIRECT_URL`: **Session pooler / direct** (port 5432). Migration'lar bunu kullanır.
3. Tabloları kur (yerelden, bir kez):
   ```bash
   DATABASE_URL="<pooler>" DIRECT_URL="<direct>" npm run db:deploy
   ```
   `migrate deploy` yalnızca eksik migration'ları uygular, veri silmez.
4. Geçiş bittikten ve v2 canlıda doğrulandıktan sonra eski v1 Supabase projesini sil (Settings → General → Delete project).

## 2. Vercel projesi ve ortam değişkenleri

Vercel → proje → Settings → Environment Variables. **Preview** ve **Production** için ayrı ayrı gir:

| Değişken | Değer |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | 1. adımdan |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` (v1'deki `NEXTAUTH_SECRET` değil, yeni üret) |
| `NEXT_PUBLIC_APP_URL` | Production: `https://linkiva.space` · Preview: preview adresi |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | 4. adımdan |
| `RESEND_API_KEY` | 3. adımdan |
| `MAIL_FROM` | `Linkiva <hello@linkiva.space>` |
| `TRACKING_SALT_SECRET` | `openssl rand -base64 32` |
| `UPSTASH_REDIS_REST_URL`, `..._TOKEN` | İsteğe bağlı. Boşsa hız sınırı bellekte tutulur (sunucusuz ortamda zayıf). Upstash'te yeni bir Redis veritabanı açıp değerleri al. |
| `BLOB_READ_WRITE_TOKEN` | Otomatik gelir (aşağıda) |
| `CRON_SECRET` | `openssl rand -base64 32` (en az 16 karakter). Yalnızca **Production**. Vercel Cron bunu `Authorization: Bearer` olarak gönderir; boşsa haftalık özet maili kapalıdır (`/api/cron/daily` 404). |

v1'den kalan `NEXTAUTH_*`, `EMAIL_*` gibi değişkenleri sil. v2 bunları okumuyor.

**Blob:** Vercel → proje → Storage → Create → Blob → projeye bağla. `BLOB_READ_WRITE_TOKEN` tüm ortamlara kendiliğinden eklenir. Eski v1 deposu geçişten sonra silinebilir.

## 3. E-posta gönderimi (Resend)

1. Resend → Domains → Add Domain → `linkiva.space`.
2. Resend'in gösterdiği kayıtları alan adının DNS paneline ekle (alan adını nereden aldıysan orası, ya da Cloudflare):
   - `send` alt alanına MX + SPF (TXT),
   - `resend._domainkey` DKIM (TXT),
   - önerilir: `_dmarc` TXT `v=DMARC1; p=none;`.
3. "Verify" yeşile dönünce API Keys → Create (Sending access) → `RESEND_API_KEY`.

Uygulamanın gönderdiği mailler (TR/EN, `lib/mail/templates.ts`, metinler `messages/*.json` → `mail`):
doğrulama, şifre sıfırlama, e-posta değişikliği (önce **eski** adrese onay, sonra yeni adrese doğrulama),
hoş geldin (sayfa açılınca), şifre değişti, hesap silindi.
Geliştirmede hepsi `http://localhost:3000/api/dev/mail` adresinde önizlenir (production'da 404).
Resend panelinde ayrı şablon kurmaya gerek yok. Şablonlar koddan gönderiliyor.

## 4. Google ile giriş (adı "warplink" görünüyorsa)

console.cloud.google.com → üstten doğru projeyi seç → **Google Auth Platform** (eski adı "OAuth consent screen"):

1. **Branding**: App name → `Linkiva`, logo, destek e-postası, App domain → `https://linkiva.space`,
   gizlilik → `https://linkiva.space/privacy`, Authorized domains → `linkiva.space`. Kaydet.
   Uygulama "In production" durumundaysa ad/logo değişikliği Google doğrulamasına gidebilir (birkaç gün sürebilir; giriş bu sırada çalışmaya devam eder).
2. **Clients** → mevcut Web client (ya da yeni bir tane) → Authorized redirect URIs:
   - `https://linkiva.space/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google`
   - (preview'da denemek için) `https://<preview-adresi>/api/auth/callback/google`

   v1'in `/api/auth/callback/google` adresi aynı yolda. Farklıysa eskisini geçişten sonra kaldır.
3. Client ID/Secret → Vercel env.

## 5. `hello@linkiva.space` posta kutusu (kurulu)

Resend yalnızca **gönderir**. Gelen mail ImprovMX ile yönlendiriliyor (Zoho'nun ücretsiz planı yeni kayda kapalı çıktı).

- **ImprovMX** (ücretsiz): kök alan (`@`) için MX `mx1.improvmx.com` (10), `mx2.improvmx.com` (20),
  TXT `v=spf1 include:spf.improvmx.com ~all`. Resend'in kayıtları `send.` ve `resend._domainkey`'de, çakışmaz.
- Alias'lar `hello`, `abuse`, `postmaster` → **Linkiva'ya ayrılmış ayrı bir Gmail hesabı** (kişisel mail değil).
- O Gmail'de "Postayı farklı gönder": `hello@linkiva.space`, SMTP `smtp.resend.com`, port 465 SSL,
  kullanıcı `resend`, şifre = ayrı bir Resend API anahtarı (`gmail`, Sending access). Varsayılan adres ve
  "iletinin gönderildiği adresten yanıtla" açık. Elle gönderilen mailler Resend kotasından düşer.
- Ücretli gerçek kutu gerekirse: Purelymail, Zoho Mail Lite, Google Workspace (DNS'te yalnız MX/SPF değişir).

## 5b. Özel alan adı (Faz 11)

Kullanıcıların kendi alan adlarını bağlayabilmesi için uygulamanın Vercel projene alan adı ekleyip çıkarabilmesi gerekir.
Üç değer girilir; biri eksikse Ayarlar'daki "Alan adı" bölümü hiç görünmez.

1. **Token:** vercel.com → sağ üstte profil resmin → **Account Settings** → soldan **Tokens** → **Create Token**.
   - Token Name: `linkiva-domains`
   - Scope: projenin bulunduğu hesap/ekip (ör. "serdarsahinn05's projects")
   - Expiration: **No Expiration** (ya da 1 yıl; dolunca yenilemek gerekir)
   - **Create** → çıkan değeri hemen kopyala, bir daha gösterilmez. Bu `VERCEL_API_TOKEN`.
2. **Proje kimliği:** Vercel → Linkiva projesi → **Settings** → **General** → **Project ID** satırındaki kopyala ikonu. Bu `VERCEL_PROJECT_ID` (`prj_…`).
3. **Ekip kimliği:** Vercel'de sol üstteki ekip adına tıkla → **Settings** → **General** → **Team ID** (`team_…`). Bu `VERCEL_TEAM_ID`.
   Proje kişisel hesaptaysa ve ekip yoksa boş bırakılır; Vercel'in yeni hesaplarında her proje bir ekipte durur, o yüzden çoğunlukla gerekir.
4. Vercel → proje → **Settings** → **Environment Variables** → üçünü de yalnızca **Production** için ekle → **Deployments** → son yayında `···` → **Redeploy**.

Kullanıcı Ayarlar → Alan adı'ndan alan adını ekler, ekranda gösterilen DNS kaydını (kök alan adı için `A 76.76.21.21`, alt alan adı
için `CNAME cname.vercel-dns.com`) kendi alan adı sağlayıcısında girer ve "Doğrula"ya basar. Vercel SSL sertifikasını kendisi verir.
Alan adları Vercel panelinde Settings → Domains altında da görünür; oradan elle silme yapılmaz, uygulama kendi kaydıyla birlikte siler.

## 5c. GitHub içe aktarma anahtarı (Faz 12, isteğe bağlı)

Anahtar olmadan da çalışır: GitHub'dan içe aktarma son güncellenen repoları getirir, ama bütün sunucu için saatte 60 istek sınırı vardır.
Anahtarla sabitlenmiş (pinned) repolar gelir ve sınır saatte 5000 olur.

1. github.com → sağ üstte profil resmin → **Settings** → en altta **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Token name: `linkiva-import`, Expiration: 1 yıl (dolunca yenilenir), Repository access: **Public repositories (read-only)**. Başka izin verme.
3. **Generate token** → değeri kopyala → Vercel → proje → Settings → Environment Variables → `GITHUB_TOKEN`, yalnızca **Production** → Redeploy.

## 6. Önce dene, sonra birleştir

1. `rebuild/v2` dalını GitHub'a gönder. Vercel dal için bir **preview** adresi üretir.
2. Preview env'leri yeni Supabase'i göstersin. Preview'da dene: kayıt → doğrulama maili → onboarding → blok ekle → tema → public sayfa → istatistik → ayarlar (e-posta/şifre değiştir, Google bağla, dışa aktar, hesap sil).
3. Lighthouse (Chrome DevTools, mobil): landing, bir profil, panel. Hedef ≥ 90 performans, 100 erişilebilirlik.
4. Her şey tamamsa `rebuild/v2` → `master` birleştir. Production env'leri gir, alan adı zaten projeye bağlı.
5. Canlıda kısa bir duman testi yap, sonra eski v1 Supabase projesini ve eski Blob deposunu sil.

## Veritabanı değişikliği olan bir fazı canlıya almak

Migration, `master`'a birleştirmeden **önce** production veritabanına uygulanır (yalnızca eksikleri ekler, veri silmez).
Yereldeki `.env` dosyası canlı adresi uygulamanın okumadığı bir adla tutar (`PROD_DIRECT_URL`), böylece yanlışlıkla kullanılmaz:

```powershell
$env:DIRECT_URL = (Select-String -Path .env -Pattern '^PROD_DIRECT_URL="(.+)"').Matches.Groups[1].Value; npm run db:deploy
```
Kontrol (yalnızca okur): aynı satırda `npm run db:deploy` yerine `npx prisma migrate status` → "Database schema is up to date!".
`.env` yoksa adres: Vercel → Settings → Environment Variables → Production `DIRECT_URL`.

## Yerel notlar

- Yerel DB: `docker compose up -d`, `.env.local` → `linkiva_dev`. `npm run db:migrate` hem migration hem client üretir.
- Yerelde sahte istatistik varsa: `DELETE FROM event WHERE "visitorHash" LIKE 'demo-%';`
- E2E: `PW_CHANNEL=chrome npx playwright test`. Production modu: `npm run build && PW_PROD=1 PW_CHANNEL=chrome npx playwright test`. Port 3000 doluysa `PORT=3100 NEXT_PUBLIC_APP_URL=http://localhost:3100` ile.

## Durum (2026-09-27)

**Geçiş tamamlandı.** v2 `https://linkiva.space` adresinde canlı (Production env'leri Frankfurt Supabase'i gösteriyor, `master` = v2).
v1 Supabase projesinin ve eski Blob dosyalarının silinmesi kullanıcıda; yapılınca bu satır güncellenir.

Bundan sonra (kullanıcı kararı, 2026-09-27): her faz kendi dalında geliştirilir, yerelde `npm run check` + production
e2e yeşil olunca kullanıcı onayıyla doğrudan `master`'a birleştirilip push edilir; preview adımı yok, kullanıcı canlıda bakar. Şema değişikliği olan fazlarda birleştirmeden **önce** production DB'ye
`npm run db:deploy` (yalnızca eksik migration'lar, veri silmez) uygulanır; migration'lar geriye uyumlu yazılır
(yeni kolon varsayılanlı ya da boş olabilir), böylece eski kod yeni şemayla da çalışır.

**Faz 13 (2026-09-28, `faz-13-bakim`):** iki yeni migration: `20261002090000_link_check`, `20261003090000_two_factor`
(yalnızca yeni tablo ve varsayılanlı kolon, eski kod etkilenmez). Birleştirmeden önce production DB'ye `db:deploy`.
Yeni ortam değişkeni yok: kırık link kontrolü mevcut günlük cron'u (`CRON_SECRET`) kullanır, 2FA sırları
`BETTER_AUTH_SECRET` ile şifrelenir (**bu değer değiştirilirse açık 2FA'lar çözülemez**, kullanıcılar yedek kodla da
giremez; değiştirmek gerekirse önce 2FA'yı kapattırın).

### Sonra eklenebilecekler (isteğe bağlı ortam değişkenleri)

Site bunlar olmadan da çalışır; eklenince ilgili özellik kendiliğinden güçlenir ya da açılır. Değerler **yalnızca Vercel →
Settings → Environment Variables**'a (Production) girilir, bu dosyaya ya da depoya asla yazılmaz.

- [ ] `GITHUB_TOKEN`: GitHub'dan yalnızca okuma izinli (Public repositories, read-only) fine-grained token. Eklenince
  GitHub içe aktarma sabitlenmiş (pinned) repoları getirir ve sınır saatte 60'tan 5000 isteğe çıkar. Adımlar: §5c.
- [x] `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`: özel alan adı. Eklenmeden Ayarlar'daki "Alan adı"
  bölümü görünmez. Adımlar: §5b. *Production'a eklendi (kullanıcı, 2026-09-27).*
