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

## 6. Önce dene, sonra birleştir

1. `rebuild/v2` dalını GitHub'a gönder. Vercel dal için bir **preview** adresi üretir.
2. Preview env'leri yeni Supabase'i göstersin. Preview'da dene: kayıt → doğrulama maili → onboarding → blok ekle → tema → public sayfa → istatistik → ayarlar (e-posta/şifre değiştir, Google bağla, dışa aktar, hesap sil).
3. Lighthouse (Chrome DevTools, mobil): landing, bir profil, panel. Hedef ≥ 90 performans, 100 erişilebilirlik.
4. Her şey tamamsa `rebuild/v2` → `master` birleştir. Production env'leri gir, alan adı zaten projeye bağlı.
5. Canlıda kısa bir duman testi yap, sonra eski v1 Supabase projesini ve eski Blob deposunu sil.

## Yerel notlar

- Yerel DB: `docker compose up -d`, `.env.local` → `linkiva_dev`. `npm run db:migrate` hem migration hem client üretir.
- Yerelde sahte istatistik varsa: `DELETE FROM event WHERE "visitorHash" LIKE 'demo-%';`
- E2E: `PW_CHANNEL=chrome npx playwright test`. Production modu: `npm run build && PW_PROD=1 PW_CHANNEL=chrome npx playwright test`. Port 3000 doluysa `PORT=3100 NEXT_PUBLIC_APP_URL=http://localhost:3100` ile.

## Durum (2026-09-24)

Yapıldı:
- Supabase **Frankfurt** projesi açıldı, 3 migration uygulandı (boş). Mumbai denemesi silindi.
- Vercel **Preview** env'leri v2'ye ayrıldı (`DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_APP_URL` = dal adresi,
  `BETTER_AUTH_SECRET`, `TRACKING_SALT_SECRET`). **Production env'leri hâlâ v1'in**, canlı v1 onlarla çalışıyor.
- Preview: `https://linkiva-git-rebuild-v2-serdarsahinn05s-projects.vercel.app` çalışıyor, Google girişi dahil
  (redirect URI eklendi, Branding "Linkiva").
- Resend alan adı doğrulandı. Posta kutusu yukarıdaki gibi kurulu. Blob: mevcut depo kullanılıyor.

Geçiş günü (kullanıcı preview denemesini bitirince, onayıyla):
1. Production env: `DATABASE_URL`, `DIRECT_URL` → Frankfurt; `NEXT_PUBLIC_APP_URL=https://linkiva.space`;
   `BETTER_AUTH_SECRET`, `TRACKING_SALT_SECRET` Production'a da eklenir.
2. Sil: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NPM_CONFIG_LEGACY_PEER_DEPS`, çalışmayan `UPSTASH_*` (ya da yeni Upstash).
3. Settings → Functions → Region **fra1**.
4. `rebuild/v2` → `master` birleştir, production'da duman testi.
5. Eski v1 Supabase projesini ve Blob'daki v1 dosyalarını sil.
