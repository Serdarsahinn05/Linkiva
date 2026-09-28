# Güvenlik denetimi: 2026-09-28

**Kapsam:** `faz-13-bakim` dalı (commit `677cec2`, Faz 13: kırık link kontrolü, hassas içerik kapısı, 2FA, PWA) ve uygulamanın dışa açık yüzeyi.
**Yöntem:** (1) `/security-review` ile diff incelemesi, (2) yerel sunucuya karşı hedefli canlı testler.
**Strix:** Çalıştırılmadı. Makinede kurulu değil ve LLM API anahtarı yok. Kullanıcı kararıyla onun yerine aynı saldırı sınıflarını elle yazılmış testlerle denedim (aşağıda).

## Özet

| Önem | Adet | Konu |
|---|---|---|
| Kritik / Yüksek | 0 | — |
| Orta | 0 | — |
| Düşük | 2 (ikisi de düzeltildi) | Güvenlik başlıkları eksik (clickjacking), 2FA deneme bildirimi yok |
| Bilgi | 4 | Tasarım gereği davranışlar ve kapsam dışı kalanlar |

Faz 13 diff'inde istismar edilebilir bir açık bulunmadı. 2FA atlatma, SSRF, erişim kontrolü, hesap sızdırma ve açık yönlendirme denemelerinin hepsi başarısız oldu. Açık kalan iki madde sıkılaştırma niteliğinde.

---

## Bulgular

> **Durum (aynı gün):** D-1 ve D-2 `faz-13-bakim` dalında düzeltildi. `npm run check` yeşil, desktop e2e 32/32 geçti. Yeni e2e testleri: `phase13.spec.ts` içinde "ten wrong codes lock the sign-in and tell the owner" ve "site pages cannot be framed".

### D-1: Güvenlik başlıkları yok, panel iframe içine alınabiliyor (Düşük) ✅ düzeltildi

**Düzeltme:** `next.config.ts` → `headers()` + `poweredByHeader: false`.
- Tüm yanıtlar: `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Site sayfaları (`/dashboard`, `/login`, `/register`, `/onboarding`, `/forgot-password`, `/reset-password`, `/check-email`, `/unsubscribe`, `/l/<id>/gate`): `X-Frame-Options: DENY` ve `frame-ancestors 'none'`.
- Profiller gömülebilir kalıyor: panel önizlemesi profili iframe'de gösteriyor. `/` listede yok çünkü özel alan adı profili `/` adresinde sunuyor.
- Tam CSP (`script-src` + nonce) hâlâ açık iş.

- **Nerede:** `next.config.ts` (`headers()` yok), `proxy.ts`, `vercel.json`
- **Kanıt:** `GET /` ve `GET /login` yanıtlarında `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` ve `Permissions-Policy` başlıkları yok. `X-Powered-By: Next.js` var. HSTS yerelde yok; Vercel bunu kendi alan adlarında varsayılan olarak ekler.
- **Risk:** Clickjacking. Saldırgan sitesi `linkiva.space/dashboard` sayfasını görünmez bir iframe'e koyup giriş yapmış kullanıcıya tek tıkla çalışan eylemleri yaptırabilir: blok gizle/göster, öne çıkar, uyarı işareti, yayın ayarı. Şifre isteyen eylemler (2FA kapatma, hesap silme) bu yolla yapılamaz. CSP olmaması, ileride bir XSS çıkarsa etkisini büyütür.
- **Öneri:** `next.config.ts` → `headers()`:
  - Site sayfaları (`/dashboard/:path*`, `/login`, `/signup`, `/onboarding`, `/forgot-password`, `/reset-password`): `X-Frame-Options: DENY` ve `Content-Security-Policy: frame-ancestors 'none'`.
  - Tüm yanıtlar: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
  - `poweredByHeader: false`.
  - Profil sayfaları başka sitelere gömülebilsin isteniyorsa `frame-ancestors` yalnızca site sayfalarına uygulanmalı. Tam CSP (script-src) ayrı bir iş: Next'in inline script'leri nonce gerektirir.

### D-2: Hatalı 2FA denemeleri ve hesap kilidi sahibine bildirilmiyor (Düşük) ✅ düzeltildi

**Düzeltme:**
- `lib/auth.ts` → `noticeTwoFactorLock`: `/two-factor/verify-totp` ve `/two-factor/verify-backup-code` hata döndüğünde kullanıcıyı bekleyen girişin imzalı çerezinden buluyor. Hesap kilitliyse sahibine `twoFactorLocked` maili gidiyor.
- Mail kilit başına bir kez gidiyor (`allow`, 15 dk) ve saldırganın tarayıcı dilinde değil, sahibinin profil dilinde yazılıyor.
- Giriş formu kilidi artık "bir dakika sonra dene" yerine "15 dakika kilitlendi" diye gösteriyor.

- **Nerede:** `lib/auth.ts` (`twoFactor({ issuer })`, varsayılan kilit ayarları)
- **Kanıt (canlı):** Şifresi bilinen 2FA'lı hesapta:
  - Her giriş denemesinde en fazla 5 yanlış kod kabul ediliyor (6. denemede `TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE`, ardından çerez geçersiz).
  - Toplam 10 yanlış koddan sonra hesap 15 dakika kilitleniyor (`ACCOUNT_TEMPORARILY_LOCKED`, doğru kod da reddedildi).
  - Giriş hız sınırı dakikada 5.
- **Risk:** Saldırganın şifreyi bildiği anlamına gelen bu durum, hesap sahibine hiçbir şekilde iletilmiyor. Kilit tahmin hızını 15 dakikada 10 denemeyle sınırlıyor, bu da günde yaklaşık 960 deneme demek. 6 haneli kodda tek denemenin başarı şansı çok düşük, ama sessiz ve süresiz tekrar mümkün.
- **Öneri:** Kilit tetiklenince (`ACCOUNT_TEMPORARILY_LOCKED`) sahibine bir güvenlik maili gönder: "Şifren doğru girildi ama kod hatalıydı, şifreni değiştir". `lib/auth.ts` → `hooks.after` içinde `/two-factor/verify-totp` ve `/two-factor/verify-backup-code` yollarında hata kodunu kontrol etmek yeterli. İsteğe bağlı: art arda kilitlerde süreyi uzat.

### B-1: Hassas içerik kapısı `?ok=1` ile atlanabiliyor (Bilgi, tasarım gereği)

`/l/<id>?ok=1` uyarı sayfasını göstermeden yönlendiriyor. Kapı bir erişim kontrolü değil, bir uyarı; ROADMAP'teki tanımı da bu. Yasal bir yaş doğrulaması gibi sunulmamalı (arayüz metinleri böyle sunmuyor).

### B-2: Google ile girişte 2FA sorulmuyor (Bilgi, tasarım gereği)

Better Auth `twoFactor` eklentisi yalnızca `/sign-in/email` yolunu yakalıyor (`node_modules/better-auth/dist/plugins/two-factor/index.mjs:246`). Google girişinde Google'ın kendi doğrulaması geçerli. Bu durum arayüzde yazıyor ve belgelenmiş. İstismar için kurbanın Google hesabı gerekir.

### B-3: Oturum token'ları ayarlar sayfasında istemciye gidiyor (Bilgi, mevcut durum)

`app/(site)/dashboard/settings/page.tsx`, oturum iptali için kullanıcının tüm oturum token'larını istemci bileşenine veriyor (`s.token`). Bu Better Auth `listSessions`/`revokeSession` tasarımının sonucu ve yalnızca sahibine gidiyor. Tek başına açık değil, ama bir XSS olursa tüm cihazların oturumu çalınabilir. D-1'deki CSP bu riski azaltır.

### B-4: Test edilemeyenler (kapsam sınırı)

- **`/api/upload`:** Yerelde Blob token'ı kapalıydı (503). Kod incelemesine göre önce oturum kontrol ediliyor ve dosya yolu kullanıcının klasörüne sabitleniyor.
- **Server action'lar:** Doğrudan HTTP ile denenmedi (action kimlikleri derlemeye özgü). Onun yerine sahiplik entegrasyon testleri çalıştırıldı: `ownership.test.ts` + `link-check.test.ts`, 21/21 geçti.
- **Özel alan adı:** Gerçek bir DNS kaydıyla denenmedi. Kayıtsız `Host` ile yönlendirme curl üzerinden denendi.
- **Canlı site** (`linkiva.space`) hedeflenmedi. Tüm testler yereldeydi.

---

## Yapılan testler

### 1. Security review (diff, commit 677cec2)

Güven eşiği 8/10 olan bir bulgu çıkmadı. İncelenenler:

- **2FA entegrasyonu** (Better Auth 1.7.5 kaynağı üzerinden):
  - Eklenti yalnızca `/sign-in/email` yolunu yakalıyor.
  - Kod girilmeden önce `session_token` ve `session_data` çerezleri siliniyor.
  - `autoSignInAfterVerification` yalnızca doğrulanmamış kullanıcıda oturum açıyor. 2FA'lı kullanıcı zaten doğrulanmış olduğundan bu yol 2FA'yı atlamaya yaramıyor.
  - Şifre sıfırlama oturum açmıyor. `disable` hem şifre hem taze oturum istiyor.
- **`probeUrl` SSRF koruması:** Her yönlendirmede şema, port, kimlik bilgisi ve IP kontrolü yapılıyor. IP bağlantı anında kontrol edildiği için DNS rebinding işe yaramıyor.
- **`check.ts` SQL:** `Prisma.sql` + `Prisma.join` ile parametreli.
- **Kırık link maili:** Tüm alanlar `escapeHtml`'den geçiyor.
- **Cron:** `timingSafeEqual` kullanılıyor.
- **Kapı ve alan adı:** `PASS` regex'i sabitlenmiş (anchored), `gate` alanı enum ile sınırlı.

### 2. Canlı testler (yerel `next dev`, E2E modu, dev posta kutusu)

| # | Test | Sonuç |
|---|---|---|
| L1–L5 | `/l/<id>`: gizli, zamanı gelmemiş ve yayında olmayan blok 404 dönüyor, adresi sızmıyor. Traversal ve SQL benzeri id'ler 404. | ✅ |
| G1–G4 | Kapı: önce uyarıya 302, uyarı sayfası 200, `?ok=1` yönlendiriyor, kapısız blokta uyarı sayfası 404. | ✅ |
| D1 | Kayıtsız `Host` ile `/dashboard`, `/login`, `/api/auth/*`, `/api/dev/mail` 404 (curl). | ✅ |
| C1–C4 | Cron: başlıksız, yanlış ve bir karakter eksik secret 401; doğru secret 200. | ✅ |
| E1–E3 | Hesap sızdırma: kayıt, giriş ve şifre sıfırlama yanıtları var olan ve olmayan e-posta için aynı. | ✅ |
| R1–R3 | Açık yönlendirme: `callbackURL`/`redirectTo` ile `https://evil…` ve `//evil…` 403. | ✅ |
| T1–T6 | 2FA açma: yanlış şifre ve oturumsuz istek reddediliyor; ilk kod onaylanmadan 2FA etkin değil; TOTP sırrı DB'de şifreli. | ✅ |
| T7–T11 | Yalnızca şifreyle giriş: oturum çerezi yok, `get-session` boş, `/dashboard` ve dışa aktarma erişilemez. | ✅ |
| T12–T15 | Atlatma: doğrulama maili ile otomatik giriş yok; çerezsiz veya yanlış kod reddediliyor; yarım girişten 2FA kapatılamıyor. | ✅ |
| T16–T20 | Doğru kod oturum açıyor; bozulmuş güvenilen cihaz çerezi 2FA'yı atlatmıyor; yedek kod tek kullanımlık. | ✅ |
| T21 | Kaba kuvvet: 5 deneme/çerez, 10 denemede 15 dk kilit. | ✅ (D-2) |
| M1–M5 | Oturumsuz dışa aktarma 307 → login; B kullanıcısının dışa aktarmasında A'nın verisi yok; beacon her zaman 204. | ✅ |
| H1–H2 | Güvenlik başlıkları | ❌ (D-1) |

### 3. SSRF: kırık link kontrolü (`probeUrl`, gerçek ağ)

Aşağıdaki 21 hedefin **hepsi** bağlantı kurulmadan "değerlendirilemedi" (`skipped`) olarak sonuçlandı:

- `127.0.0.1`, `localhost`, `localtest.me`, `169.254.169.254`
- `2130706433`, `0x7f000001`, `0177.0.0.1`, `127.1`
- `[::1]`, `[::ffff:127.0.0.1]`, `[::ffff:7f00:1]`, `[::ffff:a9fe:a9fe]`
- `:3000` portu, `10.0.0.1.nip.io`, `169.254.169.254.nip.io`, `user:pass@`
- httpbin üzerinden `127.0.0.1`, metadata, IPv6-mapped, `file://` ve `gopher://` hedeflerine yönlendirme

Kontrol grubu (herkese açık 200, 404 ve güvenli yönlendirme) doğru değerlendirildi. Gizli bloklar hiç denenmedi.

---

## Notlar

- **Yerel veriye yan etki:** Doğru secret ile cron testi (C4) yerel veritabanında tam bir günlük iş çalıştırdı. 120 blok için `link_check` satırı yazıldı, 100 profilde `digestSentAt` güncellendi, `tmp/mailbox/` klasörüne dev mailleri düştü. Resend kapalıydı, gerçek mail gitmedi. Test kullanıcıları (`pentest-*@example.com`) ve geçici test dosyası silindi.
- **Güvenlikle ilgisiz gözlem:** Kırık link kontrolü, zamanı henüz gelmemiş (`startsAt` gelecekte) blokları da deniyor. Sonuç yalnızca editörde görünür, sızıntı yok.
- **Önerilen sıra:** D-1 (başlıklar, küçük iş) → D-2 (kilit maili). Faz 13 birleştirilmeden önce ikisi de zorunlu değil.
