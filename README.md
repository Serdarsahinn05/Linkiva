# Linkiva

Türkçe öncelikli, ücretsiz bir bio-link platformu. Bütün linklerini, sosyal hesaplarını ve içeriklerini tek bir sayfada topla: **[linkiva.space](https://linkiva.space)/kullanıcıadın**.

Rakiplerin premium katmanda sattığı özellikler (detaylı analitik, özel temalar, planlı linkler, e-posta toplama, QR kod, rozeti gizleme) Linkiva'da ilk günden ücretsiz.

![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=next.js&logoColor=fff)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=fff)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=fff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=fff)

## Özellikler

**Sayfa ve editör**
- Tipli bloklar: link, başlık, metin, ayırıcı, YouTube / Spotify / SoundCloud embed'i, e-posta toplama.
- Satır içi düzenleme, otomatik kayıt, sürükle-bırak sıralama (klavyeyle de çalışır), geri alma.
- Planlı bloklar: belirli bir tarihte yayına girer, süresi dolunca kalkar.
- Öne çıkan link, sosyal hesaplar (yapıştırılan URL kullanıcı adına çevrilir), profil fotoğrafı.
- Canlı önizleme: masaüstünde yanda telefon, mobilde alt çubuktan.
- QR kod (SVG ve PNG), sayfa başına SEO başlığı/açıklaması ve OG görseli.

**Görünüm**
- Altı tema (Cam, Gece, Sade, Kum, Terminal, Afiş), açık/koyu mod, 5 font, buton stili, vurgu rengi, arka plan görseli.
- Kontrast koruması: düşük kontrastlı seçimde uyarı verir, link butonları okunur kalır.

**Analitik**
- Çerezsiz ve bot filtreli. IP saklanmaz, ziyaretçi günlük tuzlu bir hash ile sayılır.
- Görüntülenme, tıklama, CTR, kaynaklar ve UTM, ülke haritası, cihaz / işletim sistemi / tarayıcı (uygulama içi tarayıcılar dahil).
- CSV dışa aktarma. E-posta toplama bloğu için kitle listesi ve CSV.

**Hesap**
- E-posta + şifre (doğrulamalı) ya da Google ile giriş.
- E-posta değiştirme (önce eski adrese onay), şifre değiştirme, oturum yönetimi, veriyi JSON olarak dışa aktarma, hesap silme.
- Türkçe ve İngilizce arayüz ve işlem mailleri.

## Teknolojiler

| Alan | Kullanılan |
|---|---|
| Uygulama | Next.js 16 (App Router), React 19, TypeScript (strict) |
| Stil | Tailwind CSS v4, Geist |
| Veri | PostgreSQL (Supabase), Prisma 7 |
| Kimlik | Better Auth |
| Doğrulama | zod |
| Dil | next-intl (TR, EN) |
| Servisler | Resend (mail), Vercel Blob (görseller), Upstash Redis (hız sınırı, isteğe bağlı) |
| Arayüz | @dnd-kit, recharts, lucide-react |
| Test | Vitest (unit + integration), Playwright (e2e) |
| Yayın | Vercel |

## Yerelde çalıştırma

Gerekenler: Node.js 22+, Docker.

```bash
git clone https://github.com/Serdarsahinn05/Linkiva.git
cd Linkiva
npm install

docker compose up -d          # yerel Postgres, localhost:54329
```

Kök dizine `.env.local` oluştur (tam liste ve açıklamalar `.env.example` dosyasında):

```bash
DATABASE_URL="postgresql://linkiva:linkiva@localhost:54329/linkiva"
DIRECT_URL="postgresql://linkiva:linkiva@localhost:54329/linkiva"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
BETTER_AUTH_SECRET="<openssl rand -base64 32>"
TRACKING_SALT_SECRET="<openssl rand -base64 32>"
```

Sonra:

```bash
npx prisma migrate deploy     # tabloları kur
npm run dev                   # http://localhost:3000
```

Google, Resend, Blob ve Upstash anahtarları geliştirmede zorunlu değil. Resend anahtarı yoksa mailler gönderilmez, `http://localhost:3000/api/dev/mail` adresinde önizlenir.

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm start` | Production build ve çalıştırma |
| `npm run check` | Lint + typecheck + unit + integration testleri (Docker DB açık olmalı) |
| `npm run test:e2e` | Playwright testleri (`PW_CHANNEL=chrome` ile kurulu Chrome kullanılır) |
| `npm run db:migrate -- --name <ad>` | Yeni migration üret ve uygula |
| `npm run db:deploy` | Bekleyen migration'ları uygula (yayın ortamı) |
| `npm run db:studio` | Prisma Studio |

## Proje yapısı

```
app/            Route'lar: (site) landing, auth, panel · (profile)/[username] public sayfa
                api/e analitik beacon'ı · l/[blockId] tıklama yönlendirmesi
features/       Özellik kodu: actions.ts, queries.ts, components/ (editor, analytics, appearance…)
components/ui/      Paylaşılan arayüz parçaları
components/blocks/  Blok render'cıları (editör önizlemesi ve public sayfa aynısını kullanır)
lib/            env, auth, mail, takip, doğrulama, site URL'i
themes/         Tema tanımları
messages/       tr.json, en.json
prisma/         Şema ve migration'lar
tests/          unit, integration, e2e
```

## Belgeler

| Belge | İçerik |
|---|---|
| [PRODUCT.md](PRODUCT.md) | Kullanıcılar, konumlandırma, ürün ilkeleri |
| [DESIGN.md](DESIGN.md) | Görsel sistem: token'lar, tipografi, bileşenler, temalar |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Veri modeli, auth, takip hattı, i18n, güvenlik kontrol listesi |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Fazlar ve backlog |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Supabase, Vercel, Resend, Google OAuth kurulumu |
| [AGENTS.md](AGENTS.md) | Kod kuralları (insanlar ve kodlama ajanları için) |

## Katkı

Hata ya da öneri için [issue](https://github.com/Serdarsahinn05/Linkiva/issues) açabilirsin. Kod göndermeden önce [AGENTS.md](AGENTS.md)'deki kurallara göz at ve `npm run check` komutunun yeşil geçtiğinden emin ol.

---

[Serdarsahinn05](https://github.com/Serdarsahinn05) tarafından geliştiriliyor.
