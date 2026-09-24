# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Şimdi:** Bireysel kullanıcılar: öğrenciler, içerik üreticileri, freelancer'lar. Instagram, X, TikTok veya LinkedIn biyografisine tek bir link koymak isteyen, çoğunlukla Türkiye'de yaşayan ve telefonundan düzenleme yapan kişiler.
- **Sonra (ikinci aşama):** Geliştiriciler ve tasarımcılar. Proje, iş deneyimi ve GitHub/Dribbble çıktılarını gösteren portfolyo tarzı bir sayfa isteyenler. Veri modeli ve blok sistemi bu genişlemeyi taşıyabilecek şekilde kurulur, ama ilk sürümde portfolyo özellikleri yoktur.
- **Profil ziyaretçileri:** Bir sosyal medya biyografisinden gelen, neredeyse her zaman mobilde olan, birkaç saniye içinde bir linke dokunup ayrılan kişiler.

## Product Purpose

Linkiva, kullanıcının bütün önemli linklerini, sosyal hesaplarını ve içeriklerini `linkiva.space/<kullanıcıadı>` adresindeki tek bir sayfada toplar. Kullanıcı sayfayı düzenler, görünümünü kişiselleştirir ve hangi linkin ne kadar tıklandığını görür.

Başarı ölçütü şudur: yeni bir kullanıcı kayıttan sonra 60 saniye içinde yayında bir sayfaya ve paylaşılabilir bir linke sahip olur. Ziyaretçi sayfa açıldığı anda aradığı linke ulaşır.

## Positioning

- **Rakiplerin ücretli sunduğu her şey ücretsiz.** Linktree ve Bio.link'in premium katmanda tuttuğu özellikler (detaylı analitik, özel temalar, planlanmış linkler, e-posta toplama, "Linkiva ile yapıldı" yazısını kaldırma, QR kod, öne çıkan link) Linkiva'da ilk günden ücretsizdir. Bu, ürünün temel iddiasıdır.
- **Blok çeşitliliği.** Sayfa sadece link listesi değildir. Başlık, metin, video/müzik embed'i, e-posta toplama gibi tipli bloklardan oluşur.
- **Sadelik ve hız.** Az adım, hafif profil sayfası, sıfır karmaşa. Güçlü özelleştirme, sadeliği bozmadan sunulur.
- **Güçlü özelleştirme.** Birbirinden gerçekten farklı temalar ve kullanıcının kendi renk, font ve buton stilini seçmesi.

## Operating Context

- Kullanıcı panelini hem masaüstünde hem telefonda kullanır. Mobil panel birinci sınıf olmalıdır.
- Profil sayfası neredeyse her zaman Instagram, TikTok ve X'in uygulama içi tarayıcılarında açılır. Yavaş bağlantı ve küçük ekran varsayılır.
- Profil linki bir biyografi alanına yapıştırılır ve sosyal medyada paylaşılır. OG önizleme görseli ürünün vitrinidir.
- Yayındaki alan adı `linkiva.space`. Önceki alan adı `linkiva.vercel.app` artık kullanılmaz.

## Capabilities and Constraints

- Stack: Next.js (App Router) + TypeScript + Tailwind CSS v4 + Prisma + PostgreSQL (Supabase), Vercel'de yayında. E-posta: Resend. Rate limit: Upstash Redis. Dosya: Vercel Blob. Mevcut kod tabanı bunu belirler.
- Kimlik doğrulama: e-posta + şifre (e-posta doğrulamalı) ve Google OAuth.
- Arayüz dili: Türkçe (varsayılan) ve İngilizce (i18n).
- Yeniden kurulum temiz bir veritabanıyla başlar. Mevcut kullanıcı verisi taşınmaz.
- Para kazanma modeli **karara bağlanmadı**. Ücretli plan yok, fiyatlandırma iddiası yazılmaz.
- Portfolyo modu **ikinci aşamadır**. İlk sürümde vaat edilmez.

## Brand Commitments

- İsim: **Linkiva**. Alan adı: **linkiva.space**.
- Ses: samimi ve sen diye hitap eden Türkçe. Bunu abartılı jargon ya da emoji yağmuru olmadan korur.
- Önceki görsel kimlik (siyah zemin, glassmorphism, neon parıltı, italik uppercase başlıklar) kullanıcı tarafından **reddedildi**. Referans olarak kullanılmaz.

## Evidence on Hand

- Gerçek kullanıcı sayısı, referans, basın veya müşteri logosu **yok**. Hiçbiri uydurulmaz.
- `public/linkiva_default_og.png`: eski OG görseli (yeni kimlikle değiştirilecek).

## Product Principles

1. **Ücretsiz cömertlik bir özelliktir.** Başka yerde paralı olan bir şey burada kilitlenmez.
2. **İlk 60 saniye kutsaldır.** Kayıttan yayına giden yolu uzatan her adım gerekçe ister.
3. **Profil ziyaretçisi misafirdir.** Profil sayfası hızlı, erişilebilir ve kullanıcının kimliğini öne çıkaran bir sayfadır. Linkiva'nın kendi markası geri planda kalır.
4. **Doğru veri ya da hiç veri.** Analitik bot filtreli ve gerçektir. Sahte "canlı", sahte "sağlık kontrolü" yoktur.
5. **Genişlemeye hazır, bugüne sade.** Blok modeli portfolyoyu taşıyabilir, ama bugün sadece gerekeni gösterir.

## Accessibility & Inclusion

- WCAG 2.2 AA hedeflenir. Kullanıcının seçtiği temalarda bile link butonlarının kontrastı korunur.
- `prefers-reduced-motion` ayarına uyulur. Tüm etkileşimler klavyeyle kullanılabilir.
