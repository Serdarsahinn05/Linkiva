# Linkiva: Mevcut Durum Denetimi

> Tarih: 2026-09-24 · Denetlenen kod: `HEAD 53b1dcc` (çalışma ağacında `linktree-clone/` alt klasörüne taşınmış hâli, içerik birebir aynı)
> Bu belge **eski** sistemi anlatır. Yeni sistemin hedefi için [ARCHITECTURE.md](ARCHITECTURE.md) ve [ROADMAP.md](ROADMAP.md) belgelerine bak.

---

## 1. Amaç

Linkiva bir Linktree klonudur ve Türkçe bir bio-link platformudur. Kullanıcı kayıt olur ve `linkiva.space/<kullanıcıadı>` adresinde linklerini, sosyal hesaplarını, avatarını ve arka planını gösteren bir profil sayfası oluşturur. Tıklama ve ziyaret istatistiklerini de bir analitik panelinden izler. Canlı adresi: https://linkiva.space

---

## 2. Özellik Listesi (eski sistem)

| Alan | Özellik | Durum |
|---|---|---|
| **Landing** | Hero, kullanıcı adı yazıp kayda yönlendiren input, 3 özellik kartı | Çalışıyor (metinler yanlış: "Linkiva.com/", "cam efekti") |
| **Kayıt** | E-posta + kullanıcı adı + şifre, doğrulama maili (Resend), IP rate limit (Upstash) | Kısmen çalışıyor (bkz. §4) |
| **Giriş** | E-posta **veya** kullanıcı adı + şifre; Google OAuth | Çalışıyor, güvenlik açığı var |
| **E-posta doğrulama** | `/api/verify?token=`, 24 saat geçerli | Çalışıyor |
| **Şifre sıfırlama** | `/forgot-password` → mail → `/new-password?token=` (1 saat) | Çalışıyor, zayıf |
| **Link yönetimi** | Ekle, düzenle, sil, aktif/pasif yap, sürükle-bırak sıralama (dnd-kit), Google favicon ile otomatik ikon | Çalışıyor, yetki açığı var |
| **Görünüm** | Kullanıcı adı, görünen isim, bio, avatar yükleme, 5 hazır tema, özel arka plan görseli, 5 sosyal hesap (IG, X, GitHub, LinkedIn, YouTube) | Kısmen (tema ve sosyal link hataları) |
| **Profil sayfası** | `/[username]`: avatar, isim, bio, sosyal ikonlar, aktif linkler, tema/arka plan | Çalışıyor |
| **Dinamik OG görseli** | `/api/og`: profil için 1200×630 paylaşım görseli | Çalışıyor, önbelleği bozuk |
| **QR kod** | Sidebar'da profil QR'ı, PNG indirme | **Yanlış domain** (`linkiva.vercel.app`) |
| **Tıklama takibi** | `/api/click?linkId=`: ClickEvent (ülke/şehir/UA/referer) + sayaç, ardından yönlendirme | Çalışıyor, veri kalitesi düşük |
| **Ziyaret takibi** | Profil render'ında `Visit` kaydı | Çalışıyor, botları da sayıyor |
| **Analitik paneli** | 4 KPI + 7 günlük trend, saatlik/günlük grafik, link dağılımı, top links, cihaz/OS, "canlı" akış, dönüşüm hunisi, referrer, yıllık heatmap, dünya haritası, CSV export | Görsel olarak var, **büyük kısmı yanlış veya sahte** |
| **Ayarlar** | E-posta değiştirme, çıkış, hesap silme (onaylı modal) | Kısmen (e-posta değişimi hesabı kilitliyor) |
| **404** | Global not-found + profil bulunamadı ekranı | Çalışıyor (profil 404'ü HTTP 200 dönüyor) |

---

## 3. Mimari (eski sistem)

```
Next.js 16.2 (App Router) · React 19.2 · TypeScript (strict ama build'de tip hataları yok sayılıyor)
Tailwind CSS v4 · Prisma 6 + PostgreSQL (Supabase, pooler + direct URL)
NextAuth v4 (JWT session, Prisma adapter, Google + Credentials)
Resend (mail) · Upstash Redis (rate limit) · Vercel Blob (görsel) · Vercel (hosting, geo header'ları)
```

### Klasör yapısı
```
app/
  (auth)/login|register|forgot-password|new-password/page.tsx   ← client component formlar
  [username]/page.tsx          ← public profil + generateMetadata + Visit kaydı
  api/
    auth/[...nextauth]         ← NextAuth handler
    register | verify | forgot-password | new-password          ← REST uçları
    click/route.ts             ← AKTİF tıklama takibi (?linkId=)
    click/[id]/route.ts        ← KULLANILMAYAN ikinci tıklama takibi (ip-api.com)
    upload/route.ts            ← Vercel Blob upload (kimlik doğrulama YOK)
    og/route.tsx               ← dinamik OG görseli
  dashboard/
    layout.tsx                 ← Sidebar + main (auth guard YOK)
    page.tsx                   ← link listesi (DashboardClient)
    appearance/                ← profil formu (useActionState → updateProfile)
    analytics/page.tsx         ← tüm event'leri belleğe çekip JS'de hesaplıyor
    settings/page.tsx          ← client component
  components/                  ← modal'lar, sidebar, link kartları, 9 grafik bileşeni, harita
lib/
  actions.ts                   ← Server Actions (link CRUD, profil, e-posta, sıralama, hesap silme)
  auth.ts  mail.ts  prisma.ts  ratelimit.ts  tokens.ts  utils.ts
prisma/schema.prisma           ← User, Account, Link, ClickEvent, Visit, PasswordResetToken
```

### Veri akışı
- **Yazma:** Dashboard formları → Server Actions (`lib/actions.ts`) → Prisma → `revalidatePath`.
- **Okuma:** Server Component'ler Prisma'yı doğrudan çağırıyor. Kullanıcı her seferinde **session e-postasıyla** aranıyor (`findUnique({ where: { email } })`), `session.user.id` kullanılmıyor.
- **Takip:** Profil sayfası render edilirken fire-and-forget `visit.create`. Link butonları `/api/click?linkId=` adresine gidiyor. Orada `clickEvent.create` ve `link.clickCount++` çalışıyor, ardından 307 yönlendirme yapılıyor.
- **Analitik:** Kullanıcının **bütün** `ClickEvent` ve `Visit` satırları tek sorguda çekiliyor ve metrikler sayfa render'ında JS ile hesaplanıyor.

### Bağımlılık durumu
- **Hiç kullanılmayanlar:** `d3-scale`, `uploadthing`, `@uploadthing/react`, `@tabler/icons-react`, `recharts`, `@auth/prisma-adapter`, `@vercel/og` (Next'in kendi `next/og`'u kullanılıyor), `@types/bcrypt`.
- **Tekrarlananlar:** 3 ikon kütüphanesi (lucide, react-icons, tabler), 2 grafik kütüphanesi (chart.js, recharts), 2 Prisma adapter'ı.
- **Yanlış yerde olanlar:** `@prisma/client` devDependencies içinde duruyor.
- **Riskli olanlar:** `react-simple-maps` bakımsız ve React 19 peer uyarısı veriyor, bu yüzden `declarations.d.ts` ile tipsiz kullanılıyor.

---

## 4. Çalışmayan / Hatalı Sistemler

Önem sırası: 🔴 Kritik (güvenlik/veri kaybı) · 🟠 Yüksek (özellik bozuk) · 🟡 Orta (yanlış veri/UX) · ⚪ Düşük (temizlik)

### 🔴 Kritik: Güvenlik

| # | Sorun | Yer | Etki |
|---|---|---|---|
| S1 | **Yetki kontrolü eksik (IDOR).** `toggleLinkStatus`, `updateLink` ve `updateLinksOrder` sadece "giriş yapmış mı" diye bakıyor, linkin sahibini kontrol etmiyor. Link ID'leri herkese açık profilde görünüyor (`/api/click?linkId=…`). | `lib/actions.ts` | Giriş yapmış **herhangi bir** kullanıcı başkasının linkini değiştirebilir, URL'ini kendi sitesine yönlendirebilir, kapatabilir. |
| S2 | **Hesap ele geçirme.** Google provider'da `allowDangerousEmailAccountLinking: true` açık. Saldırgan `kurban@gmail.com` ile şifreli bir hesap açıyor (doğrulanmamış). Kurban daha sonra Google ile giriş yapınca aynı hesaba bağlanıyor ve `signIn` callback'i e-postayı doğrulanmış işaretliyor. Saldırganın şifresi hâlâ geçerli olduğu için hesaba girebiliyor. | `lib/auth.ts` | Tam hesap ele geçirme. |
| S3 | **Kimliksiz dosya yükleme.** `/api/upload` herkese açık. Tür, boyut ve isim kontrolü yok. | `app/api/upload/route.ts` | Blob depolama kötüye kullanılabilir, fatura patlar, zararlı içerik `linkiva` blob domain'inden servis edilir. |
| S4 | **E-posta değişikliği hesabı kilitliyor.** Yeni e-posta doğrulanmadan hesaba yazılıyor ve `emailVerified = null` yapılıyor. Mail ulaşmazsa ya da adres yanlış yazıldıysa kullanıcı giriş yapamıyor. | `lib/actions.ts#updateAccountEmail` | Hesap kaybı. |
| S5 | **Kullanıcı keşfi.** Kayıt ve şifre sıfırlama hesabın var olup olmadığını söylüyor (404 / "bu e-posta kullanılıyor"). Giriş hataları da "hesap yok" ile "şifre hatalı" durumlarını ayırıyor. `forgot-password` için rate limit yok. | `api/forgot-password`, `lib/auth.ts` | E-posta listesi taranabilir, mail spam'lenebilir. |
| S6 | **Sunucuda doğrulama yok.** `/api/register` kullanıcı adı biçimini kontrol etmiyor (regex sadece client'ta). E-postayı küçük harfe çevirmiyor (`A@x.com` ve `a@x.com` iki ayrı hesap olabiliyor). Şifre uzunluğu için bir sınır yok. `new-password` da şifre kuralı uygulamıyor. | `api/register`, `api/new-password` | Bozuk kullanıcı adları, zayıf şifreler, çift hesap. |
| S7 | **Rezerve kullanıcı adı yok.** `dashboard`, `login`, `api`, `register` gibi adlar alınabiliyor. Statik route'lar önce eşleştiği için bu profiller açılamıyor. | kayıt + `updateProfile` | Erişilemeyen profil, sahte "resmi" hesaplar (`admin`, `linkiva`). |
| S8 | **Rate limit IP'si taklit edilebilir.** `x-forwarded-for` başlığının tamamı anahtar olarak kullanılıyor. Upstash env'i yoksa `Ratelimit` hata fırlatıyor ve kayıt tamamen çöküyor. | `api/register`, `lib/ratelimit.ts` | Limit atlatılabilir, lokalde kayıt yapılamıyor. |
| S9 | **Hata sızıntısı.** `register` hata durumunda `error.message` metnini ham olarak dönüyor (Prisma iç hataları dahil). | `api/register` | Bilgi sızıntısı. |

### 🟠 Yüksek: Bozuk özellikler

| # | Sorun | Yer |
|---|---|---|
| B1 | **Proje çalışmıyor.** Kaynak kodu `linktree-clone/` alt klasörüne taşınmış, ama `package.json`, `tsconfig.json` ve `next.config.ts` kökte kalmış. Kökte `app/` yok, alt klasörde de `package.json` yok. `npm run dev` iki yerde de çalışmıyor. Ayrıca yerel `master`, `origin/master`'ın 3 commit gerisinde. | depo yapısı |
| B2 | **Migration ile şema uyumsuz.** `instagram`, `x`, `github`, `linkedin` ve `youtube` kolonları `schema.prisma`'da var, migration SQL'inde yok (muhtemelen `db push` ile eklendi). Temiz bir DB'ye `migrate deploy` çalıştırılırsa profil sayfası ve `updateProfile` çöküyor. | `prisma/migrations` |
| B3 | **Dashboard korumasız.** Middleware yok. `dashboard/layout.tsx` session yoksa yönlendirme yapmıyor (üstelik `getServerSession()` çağrısı `authOptions` olmadan yapılıyor). `/dashboard/appearance` ve `/dashboard/settings` çıkış yapmış kullanıcıya da açılıyor ve boş form gösteriyor. | `app/dashboard/*` |
| B4 | **Dashboard mobilde kullanılamıyor.** Sidebar 288px `fixed`, içerik `ml-72 p-12`. Responsive kırılım yok. Kullanıcıların çoğu telefondan geliyor. | `Sidebar.tsx`, `dashboard/layout.tsx` |
| B5 | **Sosyal link URL'leri bozuk.** Placeholder "instagram.com/kullanici" diyor. Kullanıcı bunu yazınca `formatSocialUrl` sonucu `https://instagram.com/instagram.com/kullanici` oluyor. | `[username]/page.tsx`, `AppearanceForm.tsx` |
| B6 | **Varsayılan tema bozuk.** Şemada varsayılan `themeColor = "#ffffff"`, ama bu bir tema anahtarı değil. `themeConfigs["#ffffff"]` `undefined` döndüğü için yeni kullanıcının profilinde arka plan sınıfı olmuyor. "glass" teması da "dark" ile birebir aynı. | `schema.prisma`, `[username]/page.tsx` |
| B7 | **QR kod yanlış adrese gidiyor.** Kodda `https://linkiva.vercel.app/<username>` sabit yazılı. Hero'da "Linkiva.com/", OG'de ise `https://linkiva.space` sabit. Önizleme ve lokal ortamda OG kırılıyor. | `QRCodeModal.tsx`, `HeroInput.tsx`, `[username]/page.tsx` |
| B8 | **Yeni linkler en üste eklenmiyor, sıralama belirsiz.** Her yeni link `order: 0` ile oluşturuluyor. Aynı order'a sahip linklerin sırası DB'ye kalmış. | `createLink` |
| B9 | **Yükleme hataları yutuluyor.** `res.ok` kontrol edilmiyor. Başarısız yüklemede `avatarUrl = undefined` kalıyor. Eski blob'lar hiç silinmiyor, boyut/tür kontrolü ve yeniden boyutlandırma da yok. | `AvatarUploader.tsx`, `BackgroundUploader.tsx` |
| B10 | **Tailwind animasyon sınıfları ölü.** `animate-in`, `fade-in`, `zoom-in`, `slide-in-from-*` ve `animate-shake` kullanılıyor ama `tw-animate-css` kurulu değil, `shake` tanımlı değil. `font-geistSans` diye bir sınıf yok. `next-themes` kurulu ama hiçbir yerde tema değiştirilmiyor. `globals.css` `background: black !important` ile her şeyi eziyor. | genel |
| B11 | **`layout.tsx` içinde çift `import type { Metadata }` var.** `<html lang="en">` olmasına rağmen içerik Türkçe. `next.config.ts` Next 16'da desteklenmeyen `eslint` anahtarını ve `ignoreBuildErrors: true` kullanıyor, bu yüzden tip hataları görünmüyor. | `app/layout.tsx`, `next.config.ts` |

### 🟡 Orta: Yanlış veya sahte veri (analitik)

| # | Sorun |
|---|---|
| A1 | **Referrer grafiği anlamsız.** Tıklamanın `referer` değeri her zaman profil sayfasının kendisi (`linkiva.space/<user>`). Bu yüzden grafik neredeyse her şeyi "Other" gösteriyor. Asıl anlamlı kaynak `Visit.referer`, ama o hiç kullanılmıyor. |
| A2 | **Botlar ve önizleyiciler sayılıyor.** WhatsApp, Telegram, X ve Facebook'un OG tarayıcıları, Next prefetch istekleri ve kullanıcının kendi ziyaretleri `Visit` olarak yazılıyor. Tekil ziyaretçi kavramı yok. `generateMetadata` ve sayfa aynı kullanıcıyı iki kez sorguluyor. |
| A3 | **Tarih filtresi sahte.** `DatePickerWithExport` sadece etiketi değiştiriyor, veri filtrelenmiyor. |
| A4 | **"Link Health Check" sahte.** Durum yalnızca `isActive` alanından okunuyor. Yenile butonu 2 saniyelik bir `setTimeout`. "Auto-check every 24h" yazısı doğru değil. |
| A5 | **"Live Feed" canlı değil.** Sadece sayfa yüklendiği andaki son 10 olayı gösteriyor. |
| A6 | **Harita kısmen çalışıyor.** ISO eşlemesi sadece 8 ülkeyi kapsıyor. Şehir modu `city.name` bekliyor ama veride `city.id` var, bu yüzden şehir işaretleri **hiç görünmüyor**. Geo JSON rastgele bir GitHub raw URL'inden çekiliyor. |
| A7 | **Saat ve gün hesabı sunucu saatine (UTC) göre yapılıyor.** Kullanıcının saat dilimi hesaba katılmıyor. |
| A8 | **CSV'de link adı yok.** `clickEvents` sorgusu `link` ilişkisini içermediği için "Detail" kolonu her zaman "Unknown Link". |
| A9 | **Ölçeklenmiyor.** Analitik sayfası kullanıcının bütün olaylarını belleğe alıyor. Aggregation, index ve tarih sınırı yok. |
| A10 | **Sayaç ile olay tablosu ayrışabilir.** `link.clickCount` ve `ClickEvent` ayrı yazılıyor. İkinci tıklama route'u (`click/[id]`) ip-api.com'a şifresiz HTTP isteği atıyor ve sonuç gelmezse varsayılan olarak **"TR/Istanbul" uyduruyor**. |

### ⚪ Düşük: UX ve temizlik

- Modal'lar erişilebilir değil: odak hapsi, Esc ile kapatma ve `aria` rolleri yok. Link menüsü dışarı tıklayınca kapanmıyor (`menuRef` kullanılmıyor).
- Link silme onayı işlemi beklemiyor (`onConfirm` await edilmiyor) ve hata göstermiyor. Ayarlar sayfası `alert()` kullanıyor.
- Hesap silindiğinde blob'lar ve `PasswordResetToken` kayıtları siliniyor olmuyor.
- Profil 404'ü `notFound()` yerine HTTP 200 dönüyor.
- `DashboardClient` "mounted" kontrolüyle ilk render'ı boş bırakıyor (gereksiz yükleniyor ekranı).
- Ölü kod: `LinkCard.tsx`, `incrementClick`, `lib/utils.ts` (hiç import edilmiyor), `api/click/[id]`.
- Arayüz dili karışık: panel Türkçe, analitik İngilizce ("Profile Views", "Awaiting Location Data…").
- Türkçe karakter sorunu: kullanıcı adı `toLowerCase()` ile küçültülüyor. `I` harfi Türkçe yerelde `ı` değil `i` oluyor, bu tutarlı. Ancak `İ` girişi regex'e takılıp siliniyor ve kullanıcı bunun nedenini görmüyor.

---

## 5. Arayüz Değerlendirmesi ("AI slop" teşhisi)

Eski arayüz, üretken modellerin varsayılan "karanlık premium" kalıbının neredeyse ders kitabı örneği:

- Her yerde siyah zemin + `#0A0A0A`/`#1A1A1A` kartlar, arka planda bulanık mavi/mor blob'lar, `shadow-[0_0_30px_rgba(255,255,255,0.1)]` neon parıltılar.
- `font-black italic uppercase tracking-tighter` başlıklar ve `text-[9px] font-black uppercase tracking-widest` mikro etiketler. Her şey bağırıyor, hiyerarşi yok.
- `rounded-[2.5rem]` ve `rounded-[3.5rem]` şişkin kartlar, ikon kutucukları, "Rank #01" ve "Live Now" gibi süs etiketleri.
- Pazarlama metni ürünün yapmadığı şeyleri vaat ediyor ("Glassmorphism teknolojisi", "Vercel elitliğinde", "Işık hızında").
- Kullanıcının asıl ihtiyacı olan **canlı önizleme**, yani düzenlerken profilin nasıl göründüğünü görmek, hiç yok.

Yeni tasarım yönü: [../DESIGN.md](../DESIGN.md)
