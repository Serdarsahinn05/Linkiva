# Linkiva: Tasarım Sistemi — "Cam"

> **Durum:** Yön kullanıcı tarafından belirlendi (2026-09-24) ve "Etiket" yönünün yerine geçti. **Build'den yeniden kaydedildi (Faz 5):** değerler `app/globals.css` ve `themes/index.ts` ile eşleşir; çelişki olursa kod esastır ve bu belge düzeltilir.
> Tasarım otoritesi bu belgedir. `ui-ux-pro-max` ve benzeri skill önerileri bu belgeye uyar, onu ezmez.
> Ürün gerçeği ve bağlayıcı görsel taahhütler: [PRODUCT.md](PRODUCT.md) → Brand Commitments.

---

## 0. Reddedilenler

- **v1:** bağıran `italic uppercase font-black` başlıklar, `text-[9px] tracking-widest` mikro etiketler, `rounded-[2.5rem]` şişkin kartlar, zemine rastgele serpiştirilmiş neon blob'lar, gradient yazı, emoji ikonlar, "Live Now / Rank #01" süsleri.
- **Etiket (v2 ilk yön):** çok renkli bantlar, dar büyük harf, eğik şeritler. "Oyuncak gibi."
- **Sticker panoları ve süs katmanları** (2026-09-27, rakiplerde yeni): aynı "oyuncak" hissi; cam tezine aykırı.

v1 de cam kullanıyordu. Fark **disiplinde**: tek bir ışık kaynağı, tek bir cam malzemesi, monokrom vurgu. Renk yalnızca anlam taşıdığında kullanılır.

---

## 1. Yön

**Tez.** Linkiva, kişinin dünyasına açılan **tek bir cam pencere**dir. İçerik (linkler, avatar, profil) yumuşak bir ışığın önünde duran buzlu cam katmanlarda yüzer. Arayüz sessizdir: renk kullanmaz, ışık ve derinlik kullanır. Renk yalnızca bir şey **anlam** taşıdığında görünür: artış yeşil, düşüş kırmızı, bilgi mavi.

**His:** premium, yumuşak, modern. Apple iOS 26 liquid glass, Linear ve Arc'ın ölçülülüğü.

**İmza etkileşim: sıvı gösterge.** Mobildeki alt sekme çubuğu bir cam haptır. Aktif sekmenin arkasındaki parlak cam damla, sekme değişince yay (spring) hareketiyle akar. Profilde link butonları dokununca hafifçe basılır ve kenar ışığı parmağın olduğu noktaya kayar (pointer'ı izleyen specular highlight). `prefers-reduced-motion` açıksa hareketler yerine anlık geçiş kullanılır.

---

## 2. Işık ve Zemin

Cam, arkasında bir şey olduğunda cam gibi görünür. Her yüzeyin arkasında **tek bir ortam ışığı katmanı** (`.ambient`) vardır:
- Sabit konumlu, sayfanın üst kısmından yayılan 2–3 çok büyük (60–80vw) ve çok bulanık (120px+) radyal ışık.
- **Monokrom ve serin:** koyu temada soğuk gri-mavi (`oklch(45% 0.03 250)`), açık temada inci beyazı ile çok açık gri-lila (`oklch(92% 0.02 280)`). Doygun mor, turkuaz ya da pembe blob **yok**.
- 40 saniyelik, neredeyse fark edilmeyen bir sürüklenme. Reduced motion açıksa sabit.
- Işık katmanı yalnızca **bir kez** bulunur (layout seviyesinde). Kart başına ayrı blob konmaz.

---

## 3. Renk

**Strateji:** Restrained + monokrom marka. Nötrler + beyaz/mürekkep vurgu. Semantik renkler yalnızca durum ve veri için.

### Token'lar (`app/globals.css`)

```css
/* KOYU (varsayılan: sistem koyuysa) */
--bg:          oklch(14% 0.01 260);        /* #0B0D12 */
--ink:         oklch(97% 0.003 260);       /* ana metin */
--ink-2:       oklch(76% 0.01 260);        /* ikincil metin, bg üzerinde ≥ 7:1 */
--ink-3:       oklch(60% 0.012 260);       /* ipucu, pasif ikon */
--glass:       oklch(100% 0 0 / 0.06);     /* cam dolgusu */
--glass-strong:oklch(100% 0 0 / 0.10);     /* hover / seçili */
--glass-edge:  oklch(100% 0 0 / 0.14);     /* 1px kenar */
--glass-shine: oklch(100% 0 0 / 0.22);     /* üst kenar highlight */
--accent:      oklch(97% 0.003 260);       /* monokrom: birincil buton beyaz */
--accent-ink:  oklch(16% 0.01 260);        /* birincil buton üzerindeki yazı */

/* AÇIK */
--bg:          oklch(97% 0.006 270);       /* #F4F4F8 inci */
--ink:         oklch(20% 0.012 265);
--ink-2:       oklch(44% 0.012 265);
--ink-3:       oklch(52% 0.01 265);        /* denetimde 56%→52%: 4.27→5.05:1 */
--glass:       oklch(100% 0 0 / 0.55);
--glass-strong:oklch(100% 0 0 / 0.78);
--glass-edge:  oklch(100% 0 0 / 0.75);     /* açık temada kenar beyaz + dış gölge ile ayrışır */
--glass-shine: oklch(100% 0 0 / 0.95);
--accent:      oklch(20% 0.012 265);       /* monokrom: birincil buton mürekkep */
--accent-ink:  oklch(98% 0 0);

/* SEMANTİK NEON, KOYU: parlak tonlar + hafif parlama */
--positive: oklch(80% 0.17 155);  /* yeşil: artış, başarı, açık */
--negative: oklch(70% 0.19 22);   /* kırmızı: düşüş, hata, yıkıcı */
--info:     oklch(74% 0.14 245);  /* mavi: bilgi, nötr veri serisi */
--warning:  oklch(84% 0.15 80);   /* sarı: uyarı */

/* SEMANTİK, AÇIK: metin olarak okunacak kadar koyu, parlama yok */
--positive: oklch(50% 0.14 155);  --negative: oklch(55% 0.20 22);
--info:     oklch(52% 0.15 250);  --warning:  oklch(62% 0.14 70);
```
Her iki temada her metin token'ı zemine karşı ≥ 4.5:1 sağlar; `tests/unit/contrast.test.ts` değerleri CSS'ten okuyup doğrular.

**Neon kuralı:** Parlama (`box-shadow: 0 0 0 1px color, 0 0 16px -4px color`) **yalnızca** semantik renklerde ve yalnızca koyu temada kullanılır: analitik trend rozetleri, grafik çizgileri, canlı/başarılı durum noktası, hata kenarı. Marka öğelerinde neon yok.

---

## 4. Cam Malzemesi

Tek bir malzeme, üç yoğunluk:

| Seviye | Kullanım | Tarif |
|---|---|---|
| `glass` | kartlar, paneller, link butonları | `background: var(--glass); backdrop-filter: blur(20px) saturate(160%); border: 1px solid var(--glass-edge); box-shadow: inset 0 1px 0 var(--glass-shine), 0 8px 32px -12px rgb(0 0 0 / .35)` |
| `glass-strong` | hover, seçili satır, açık menü | dolgu `--glass-strong` |
| `glass-float` | alt sekme çubuğu, toast, diyalog, menü | `blur(28px) saturate(180%)`, daha güçlü dış gölge, **liquid** kenar (aşağıda) |

**Liquid kenar (yalnızca `glass-float`):** SVG `feTurbulence` + `feDisplacementMap` ile arka planı kenarlarda hafifçe büken bir `backdrop-filter: url(#liquid)`. Chromium dışındaki tarayıcılarda sessizce düz `blur`'a düşer. Kenar boyunca ince bir kırılma ışığı (maske ile 1px halka).

**Specular highlight:** Etkileşimli camlarda (`.glass-interactive`) pointer konumu CSS değişkenine (`--mx`, `--my`) yazılır. Radyal bir beyaz ışık (%8 opaklık) parmağı izler. JS yalnızca `pointermove` → CSS var olarak çalışır, re-render yapmaz.

**Köşe:** kart/panel 20px · input/küçük buton 12px · birincil buton, sekme çubuğu, rozet, avatar tam hap (999px) · tek başına duran büyük yüzey (auth paneli, 404/hata, landing listesi, gizlilik) 28px · cihaz çerçevesi (önizleme telefonu) dış 44px / iç 36px. Başka değer yok.

**Çizgi:** 1px `--glass-edge`.

**Performans:** `backdrop-filter` pahalıdır. Kaydırılan uzun listelerde (editör blokları) satırlar bulanıklıksız yarı saydam dolgu kullanır. Bulanıklık yalnızca üst seviye yüzeylerde kullanılır.

---

## 5. Tipografi

**Geist** (arayüz ve metin) + **Geist Mono** (yalnızca sayı/veri: analitik, sayaçlar). Türkçe (latin-ext) destekli.

| Rol | Ayar |
|---|---|
| Display | Geist 600, `letter-spacing: -0.035em`, `clamp(2.5rem, 6vw, 4.5rem)`, satır 1.02 |
| Başlık | Geist 600, -0.02em, 1.5–2rem |
| Gövde | Geist 400, 16px / 1.55, ikincil metin `--ink-2` |
| Etiket/buton | Geist 500, 15px, normal harf. **Uppercase ve geniş harf aralığı yok.** |
| Veri | Geist Mono 500, `tabular-nums` |

Başlık üstüne eyebrow/kicker konmaz. Vurgu, ağırlık ve boyutla yapılır. Gradient yazı kullanılmaz.

---

## 6. Bileşen Dili

| Bileşen | Kural |
|---|---|
| **Birincil buton** | Hap şekli, `--accent` dolgu, `--accent-ink` yazı (koyuda beyaz buton + siyah yazı; açıkta tersi). 48px yükseklik. Hover'da hafif parlaklık, basınca %98 ölçek. Ekranda tek bir tane. |
| **İkincil buton** | Hap şekli, `glass` dolgu + kenar. |
| **Hayalet** | Metin + ikon, hover'da `glass`. |
| **Input** | 48px, 12px köşe, cam dolgu (bulanıklıksız), odakta kenar `--ink` ve yumuşak dış halka. Hata: kenar `--negative`, altında fiil içeren mesaj. |
| **Switch** | iOS tarzı hap anahtar. Açıkken `--positive` (anlamlı durum: yayında), kapalıyken `--glass-strong`. |
| **Blok satırı (editör)** | 20px köşeli satır. Solda tutamaç, blok tipi küçük ikonla (lucide) belirtilir, renk yok. Sağ üstte anahtar + menü. Alanlar tam genişlik. |
| **Menü / Diyalog / Toast** | `glass-float`. Diyalog mobilde alttan açılan sheet. Toast alt sekme çubuğunun hemen üstünde, cam hap. |
| **Boş durum** | Ortada tek cümle + tek birincil eylem. İllüstrasyon yok. |
| **Komut paleti** *(Faz 9, yalnızca masaüstü)* | ⌘K / Ctrl+K. Ortada `glass-float` diyalog, en üstte 48px arama input'u, altta gruplu komut satırları (lucide ikon + etiket + sağda kısayol `--ink-3`, Geist Mono). Seçili satır `glass-strong`. Mevcut Dialog + Menu primitive'leri. |
| **Mini grafik** *(Faz 9)* | Editör satırında sağda 56×16px satır içi SVG çizgisi, `--positive`, 1.5px, dolgu yok, eksen yok. Veri yoksa `--ink-3` "—". |
| **Durum rozeti** | Hap, 12px metin. Anlam taşıdığı için renkli: "Ulaşılamıyor" `--negative` (Faz 13), "Taslak" `--ink-3` (Faz 7), "İşbirliği" `--ink-2` çizgi (Faz 8, renk yok: bilgi, uyarı değil). |

---

## 7. Yüzeyler

### Mobil alt sekme çubuğu (tüm panel ekranlarında, <1024px)
- Ekranın altında, kenarlardan 12px içeride **yüzen cam hap** (`glass-float` + liquid kenar), `env(safe-area-inset-bottom)` hesabına katılır.
- 5 sekme, Instagram düzeninde: **Linkler · Görünüm · [Önizle] · İstatistik · Ayarlar**. Ortadaki "Önizle" biraz daha büyük, dolu `--accent` bir daire. Diğerleri 24px ikon ve 11px etiket.
- Aktif sekmenin arkasında **sıvı gösterge**: yay hareketiyle kayan parlak cam damla (§1).
- Dokunma hedefi ≥ 48px. `nav` + `aria-current`.

### Masaüstü panel (≥1024px)
- Solda 248px cam kenar çubuğu (ortam ışığının üzerinde). Wordmark, 4 bölüm, altta profil adresi kartı (kopyala / aç / QR) ve hesap.
- Ortada içerik (max 680px), sağda yapışkan **canlı önizleme**: telefon oranında (390×780) ince çerçeveli cam cihaz.

### Public profil (varsayılan tema "Cam")
- Ortam ışığı + ortalanmış içerik (max 560px). Avatar 104px, çevresinde 1px cam halka.
- İsim display 600, bio `--ink-2`, sosyal ikonlar 44px cam daireler.
- **Link butonları:** tam genişlik, 60px, 20px köşe, `glass-interactive` (specular). Başlık ortada 500 ağırlık, sağda küçük ok. Öne çıkan link: `glass-strong` + yumuşak beyaz dış parlama (monokrom). Başlık bloğu: küçük, `--ink-2`, 600. Metin bloğu: `--ink-2`. Ayraç: kısa 1px çizgi.
- Sistem temasına uyar (profil sahibi sabitleyebilir, aşağıda).

### İletişim ve destek blokları (Faz 8, uygulandı)
Hepsi link butonuyla aynı malzemeyi (`glass-interactive`, 20px köşe, tam genişlik) ve temanın buton stilini kullanır. Marka renkleri (WhatsApp yeşili vb.) **kullanılmaz**; marka ikonu monokrom, `currentColor`.
- **Destek (IBAN):** Cam kart. Üstte ad (500), altında IBAN Geist Mono `tabular-nums`, 4'lü gruplar. Sağda ikincil hap "Kopyala"; kopyalanınca ikon onaya döner ve toast "IBAN kopyalandı" (`--positive` nokta). Altında isteğe bağlı destek linkleri normal link butonu olarak.
- **WhatsApp:** Normal link butonu, solda monokrom marka ikonu. Başlık varsayılanı "WhatsApp'tan yaz".
- **Kartvizit:** Link butonu, solda `contact` ikonu, başlık "Rehbere ekle". Ad ve unvan butonun altında değil, butonun içinde ikinci satır `--ink-2`.
- **Ürün kartı:** Link önizleme kartıyla aynı yapı (görsel solda ya da üstte), başlık, fiyat Geist Mono 500, mağaza adı `--ink-3`. `sponsored` ise sağ üstte "İşbirliği" çizgi rozeti. Fiyat vurgusu renkle değil ağırlıkla.
- **Geri sayım:** Cam kart, başlık üstte, sayılar Geist Mono 600 büyük (`tabular-nums`, gün · saat · dakika · saniye), birimler `--ink-3` küçük. Saniye değişiminde animasyon yok (sayı zıplamaz). Reduced motion'da dakikada bir güncellenir.
- **Link grubu:** `<details>`. Özet satırı başlık bloğu tipografisinde, sağda 16px chevron 160ms `--ease-out` ile döner. İçerik açılışta hareket yok (reduced motion'da da aynı), yalnızca yer açılır.

### Izgara düzeni (Faz 10, uygulandı)
- Profil genişliği aynı (max 560px). 2 sütun; profil sütunu 560px'e ulaşınca 4 sütun (kapsayıcı sorgusu, editör önizlemesi telefonun sütunlarını gösterir), aralık 12px. Karo köşesi 20px, cam malzeme ve temanın buton stili aynı (`.p-btn.p-tile`).
- **SMALL (1×1):** kare karo. Ortada 28px tür ikonu (favicon çekilmez), altında tek satır başlık (kesilir, tam başlık DOM'da ve `title`'da). Görsel bloğunda fotoğrafın kendisi, adı alt metninden. **WIDE:** tam satır, normal link butonu görünümü. **LARGE (2×2):** görsel karo; görsel tam doldurur, başlık alt kenarda cam şerit üzerinde (görselin üstünde okunurluk için `glass-strong` şerit, gradient yazı yok). Ürün fiyatı şeritte Geist Mono. Görseli olmayan blok 40px ikonlu büyük karo. "İşbirliği" rozeti her boyutta sağ üstte kalır.
- İzinli boyutlar: LINK, IMAGE, PRODUCT S/W/L; WHATSAPP, CONTACT S/W; diğerleri (EMBED ve SUPPORT dahil) her zaman tam satır.
- Görsel sıra DOM sırasıdır (`dense` yok). Boşluk kalırsa kalır; boşluğu kapatmak sahibin işidir (editör önizlemesi gösterir).
- Liste ↔ ızgara geçişi Görünüm sayfasında, tema kartlarının üstünde, iki kartla seçilir; kartlar geçerli temanın gerçek CSS'iyle çizilir. Tema değiştirmek düzeni korur. Editörde boyut, satır menüsünde seçili işaretli radyo öğeleri olarak yalnızca ızgarada görünür; satır başlığı "· Küçük karo" gibi boyutu da yazar.

### Hikâye kartı (Faz 10, uygulandı)
- 1080×1920 PNG (`/<ad>/story`). Profil temasının zemini ve ortam ışığı (sistem modundaki profil koyu çizilir: hikâye koyu arayüzde görülür; arka plan görseli karartmasıyla), ortada avatar (240px, cam halka; yoksa adın baş harfi), ad (display 600), altında `linkiva.space/<ad>` Geist Mono, altta cam kart içinde QR (beyaz zemin, siyah modül; tarama güvenliği için temadan bağımsız). Üst ve alt 250px Instagram arayüzü için boş bırakılır (güvenli alan).
- Panelde QR diyaloğunun altında tam genişlik segmentli seçim **Profilim / Koyu / Açık** (Profilim: tema + arka plan fotoğrafı; Koyu/Açık: temanın zemini, fotoğrafsız), altında gerçek görselin 9:16 küçük önizlemesi, yanında ikincil hap "Hikâye görseli" ve tek satır açıklama; dokunmatik cihazda paylaşım sayfası, diğerlerinde indirme.
- Işıklar kendi renginin saydamına söner (Satori `transparent`'ı saydam siyah sayar, açık zeminde gri şerit bırakıyordu).
- **Son video:** EMBED bir YouTube kanal adresiyse satırda "Kanalın son videosu" anahtarı. Önizlemede video yerine "YouTube · son video" düz butonu (hangi videonun geleceği yayında belli olur).

### Özel alan adı (Faz 11, Ayarlar)
- Ayrı bir cam bölüm "Alan adı". Boşken tek cümle açıklama + alan ve ikincil hap "Bağla".
- Eklenince: alan adı (500) ve sağda durum rozeti: "Bağlı" `--positive` nokta (anlamlı durum), "DNS bekleniyor" `--ink-3` nokta.
- Beklerken her DNS kaydı ayrı bir `glass-flat` kartta etiket/değer satırları (Tür · Ad · Değer), değerler Geist Mono ve kelime ortasından bölünmez; değerin yanında kopyala ikonu. Altında yayılma süresi notu, sağda "Kaldır" (hayalet) ve "Doğrula" (ikincil). Kaldırmak iki adımlı: sonucu anlatan cümle + "Evet, kaldır" (tehlike).
- Bağlıyken tek cümle ve alan adına açılan link; panelin "Adresin" kartı, QR ve paylaşım görselleri de alan adını gösterir.

### Portfolyo (Faz 12, uygulandı)
Linkiva'nın aynı tek parça, aşağı kayan profili; yalnızca `portfolyo` temasında şu kurallar geçerli (diğer temalar değişmez):
- **Genişlik:** profil sütunu 60rem (960px). Geniş düzen, profil kapsayıcısında 56rem yer olunca açılır (kapsayıcı sorgusu), yani telefon ve editör önizlemesi tek sütun kalır.
- **Başlık:** sola hizalı; avatar (72 → 88 → 104px) ve yanında ad (display 600), altında bio ve sosyal ikonlar. Geniş ekranda başlık bandı iki sütun: sağda, ilk bölümden önceki düz link butonları (ör. Özgeçmiş, Birlikte çalışalım).
- **Bölümler:** her (katlanmayan) başlık bloğu bir bölüm açar; başlık Geist Mono 13px `--ink-2` etiket + kenara uzanan 1px çizgi. Yalnızca deneyim/yetenek/metin içeren iki komşu bölüm geniş ekranda yan yana durur. Blok sırası sahibinin sırasıdır.
- **Proje kartı (PROJECT):** cam kart; solda görsel (4:3) ya da ikon kutusu, başlık 600, 2 satır açıklama, Geist Mono çizgi hap etiketler, altta host · yıldız (Geist Mono) · "Kod" linki (kart canlı sayfaya, "Kod" repoya gider; ikisi de `/l` üzerinden sayılır). Izgarada S: ikon + başlık; L: görsel varsa cam şeritli fotoğraf, yoksa içerikle dolu karo (üstte ikon, altta büyük başlık, açıklama, etiketler, yıldız); W: kart.
- **Deneyim (EXPERIENCE):** art arda gelenler tek zaman çizelgesi: 1px `--glass-edge` dikey çizgi, noktalar (bitişi olmayan = şimdi = dolu `--ink`, diğerleri çizgi halka). Rol 600, kurum `--ink-2`, tarih Geist Mono `--ink-3` ("Haz 2025 — şimdi").
- **Yetenekler (SKILLS):** isteğe bağlı grup adı `--ink-3` + Geist Mono çizgi haplar. Seviye, yüzde, yıldız yok (sahte ölçüm).
- Renk yok: GitHub dil renkleri de kullanılmaz; dil ve konu etiketleri düz metin.

### Profil temaları (kullanıcıya açık, `themes/index.ts`)
Tema = hazır ayar. Sahip her değeri ezebilir, hepsi ücretsiz.

| Tema | Mod | Font | Buton | Sahne ışığı | Vurgu |
|---|---|---|---|---|---|
| `cam` (varsayılan) | sistem | Geist | cam | monokrom | yok |
| `gece` | koyu | Geist | cam | derin mor-mavi | yok |
| `sade` | açık | Geist | çizgi | yok | yok |
| `kum` | açık | Newsreader (serif) | dolu | sıcak kum | #3A2E26 |
| `terminal` | koyu | Geist Mono | çizgi | yok | #7CF5A8 |
| `afis` | açık | Bricolage Grotesque | dolu | vurgu renginden | #FF5A36 |
| `portfolyo` | sistem | Geist (+ Geist Mono etiketler) | çizgi | soluk monokrom (`soft`) | yok |

- Özelleştirme: mod (ziyaretçiye göre/açık/koyu), font (5), buton stili (cam/dolu/çizgi), vurgu rengi (hazır + özel), arka plan görseli (kendi zemin rengiyle karartılır), "Linkiva" rozetini gizleme.
- **Kontrast koruması:** Dolu butonda yazı rengi vurgu renginden otomatik seçilir (`inkOn`, ≥ 4.5:1 testli). Çizgi butonda vurgu her zemin için ayrı hesaplanan okunur bir tonla kullanılır (`readableAccent`: gerekirse siyaha/beyaza karıştırılır, hem zeminde hem dolgu olarak ≥ 4.5:1). Arka plan görseli yüklenince ortalama parlaklığı ölçülür, mod ve **karartma** (`backgroundDim`, %0–90) okunur olacak şekilde önerilir (en az %30). Karartma, ikincil yazının 4.5:1 için gerektirdiği değerin altına çekilirse Görünüm sayfası uyarır ve "Okunur yap" sunar.
- Renk sınıfları `@theme inline` ile tanımlıdır: iç içe tema (koyu panelde açık profil önizlemesi) kendi token'larını kullanır.
- Profil kendi sahnesini taşır (`.profile-scene` + `data-theme/scene/font/button`), bu yüzden önizlemeler ve tema kartları gerçek CSS ile çizilir.

### Landing (Persuade)
- İlk ekran: ortam ışığı, display başlık "Her şeyin, tek bir adreste.", alt metin ve **cam bir adres çubuğu**: `linkiva.space/` + kullanıcı adı girişi + birincil hap buton; altında `--ink-3` tek satır söz ("Kilitli özellik yok · Deneme süresi yok · Verin satılmaz"). Yanında (mobilde altında) örnek profil ("Örnek profil" hapıyla) cam telefon içinde durur.
- *(Faz 17)* **Gezen cam telefon:** örnek profil HTML cam katmanlardan kurulur (CSS 3D, `features/landing/components/landing-stage.tsx`): ekran, avatar, ad, sosyal ikonlar, üç link, abone kartı derinlikte ayrı yüzer; etrafında adres hapı (yeşil "yayında" noktası), görüntülenme kartı (`--info` çizgi, `--positive` trend) ve QR kartı. Telefon ve bloklar gerçek profil tema CSS'ini giyer (`.profile-scene` + `data-*`), yani önizleme ürünün birebir aynısıdır. İmleçle hafifçe döner. Adres çubuğuna yazılan ad telefondaki adresi, baş harfi, adı ve linkleri anında değiştirir (iki adres çubuğu eşit kalır).
- *(Faz 17)* **Tema paleti:** yedi renk dairesi + "Tema · <ad>" etiketi olan cam kart. İlk ekranda telefonun sağ altında durur ve telefonla hareket eder; tıklanan renk telefonu o temaya geçirir, bloklar yukarıdan aşağı sırayla bir tur döner. Aşağı kaydırınca palet telefondan ayrılıp tema bölümündeki yerine süzülür. Renk daireleri temanın kendi rengidir (token değil, önizleme).
- *(Faz 17)* **Sayfa kurgusu (duraklar):** ilk ekran → "Yedi tema" (birkaç ekran boyu sabit kalır: her temada telefon bir tur döner, tema arkası dönükken değişir, solda temanın adı ve tek cümle açıklaması) → ücretsiz özellikler (iki bölüm, telefon önce sola geçip bloklarını kaldırır, sonra sağda bloklar etrafında yörüngeye girer) → sık sorulanlar (tek cam panelde yerel `<details>`, ilki açık) → "Adresin boşta mı?" (telefon küçülüp ortada, ziyaretçinin adıyla) → alt bilgi. Mobilde telefon ilk ekranda ve tema bölümünde ayrılmış yerde durur, aradaki geçişte söner; diğer bölümlerde görünmez.
- "Ücretsiz" bölümü: rakiplerde ücretli olan özellikler **tek bir cam panelde satır listesi** olarak durur. Her satırda özellik adı, açıklama ve sağda yeşil (semantik: "var") onay.
- *(Faz 6)* Aynı listeye "Verin satılmaz" satırı: yapay zekâ eğitimi yok, üçüncü tarafla paylaşım yok, reklam yok. Ayrı bir bölüm ya da rozet değil, listenin bir satırı. Rakip adı geçmez.
- *(Faz 14–15)* Alt bilgi (landing ve yasal sayfalar): `©` solda; sağda iletişim adresi (mail ikonu), Gizlilik, Koşullar ve diğer dilin adı (`languages` ikonu), hepsi `--ink-3` metin, hover'da `--ink`. Dil önerisi: yalnızca tercihi diğer dil olan ziyaretçiye, en üstte ortalı `glass` hap içinde tek cümle + ikincil hap düğme, önerilen dilde yazılır.
- *(Faz 14)* Yasal sayfalar: tek büyük cam yüzey (28px), başlık + tarih, giriş paragrafı, `glass-flat` içindekiler kutusu (numaralar Geist Mono `--ink-3`), bölüm başlıkları 600. E-posta adresi metin içinde altı çizili link.

### Durum sayfaları (404, hata)
- Hata (500): ortalanmış tek cam kart (28px): Geist Mono kod, başlık, tek cümle, eylemler.
- *(Faz 17 sonrası)* **404: kart yok, açık sayfa.** Solda Geist Mono `404`, display boyutunda başlık "Bu link kopmuş.", tek cümle ve eylemler; sağda büyük kabartma kil maskot (beyaz, monokrom). Mobilde maskot üstte, yazı ortalı altta. Maskot: iri parlak gözler, ortası kalkık kaşlar, hafif yan bir gülümseme ("hay aksi"); gözleri imleci izler, arada göz kırpar. Kolunu yana uzatıp ucu kopuk altı küçük halkalı zinciri tutar; zincir fizikle sarkar, kolla hafif salınır, imleç geçince hafifçe itilip sallanır (hız sınırlı, halkalar hep izleyiciye dönük: savrulup dönmez). Maskotun arkasında yumuşak bir ışık (`--c-glass-strong` + `--c-ambient-1`) sayfayı biraz aydınlatır; tuval sağa doğru geniştir ki zincir kesilmeden sallanabilsin. Profil 404'ünde başlık ve talep çubuğu aynı kalır, maskot yine gelir.

### Analitik (Operate + semantik neon)
- Dört ana sayı cam bir şeritte yan yana durur (kart şablonu değil). Her birinin altında trend rozeti: artış `--positive`, düşüş `--negative`, değişim yoksa `--ink-3`. Koyu temada hafif neon parlamayla.
- Grafik: görüntülenme `--info` alan grafiği (degrade dolgu → şeffaf), tıklama `--positive` çizgi. Izgara `--glass-edge`.
- *(Faz 9)* **İçgörüler:** veri şeridinin altında en fazla 3 cümle, düz gövde metni, cam panel içinde satır listesi. Sayılar Geist Mono. Yön rengi yalnızca sayıda (artış `--positive`, düşüş `--negative`), cümlenin tamamı renklenmez. Eşik altı veride bölüm hiç görünmez (boş durum yazısı da yok).
- *(Faz 9)* **Saat × gün ısı haritası:** 7 satır × 24 sütun, köşesiz kare hücreler (radius skalası dışında değer yazılmaz), 2px aralık, `--info` opaklık ölçeği (%6 → %100, karekök), sıfır hücre `--glass`. Üzerine gelince dünya haritasındaki cam kart. Mobilde yatay kaydırma yerine 24 saat 6'lı kovalara (4 saatlik) iner.

---

## 8. Hareket

- Sheet eğrisi `--ease-sheet: cubic-bezier(0.32, 0.72, 0, 1)` 280–500ms (iOS sheet eğrisi; hızlı üstel yavaşlama, hedefi aşmaz). Mikro etkileşimler `--ease-out` 160ms.
- İmza hareketler: sıvı sekme göstergesi, specular highlight, sheet açılışı.
- Panel geçişi (2026-09-27, kullanıcı geri bildirimiyle sadeleşti; Faz 16'da yavaş geçiş ipucu eklendi): sayfa başına iskelet yok. Eski sayfa yenisi hazır olana kadar yerinde kalır, sonra 100 ms söner ve yeni sayfa 160 ms bulanıksız belirir. **Geçiş 300 ms'yi aşarsa** (soğuk sunucu) eski sayfa %55 opaklığa iner (200 ms) ve ekranın en üstünde 2px `--ink` çizgi soldan sağa akar; hızlı geçişte hiçbir ipucu görünmez. Ziyaret edilen sekmeler 30 sn önbellekten anında açılır. Kabuk yerinden oynamaz. Scroll'da "fade-up" girişleri yok. *(Eski "cam iskelet + buğusu çözülen cam" hızlı gidip gelirken göz yorduğu için kaldırıldı; sekme altındaki 6px nokta Faz 16'da çizgiye dönüştü.)*
- **Bölüm iskeleti (Faz 16):** yalnızca verisi akışla gelen bölümlerde (İstatistik rakamları, Kitle listesi): sayfanın başlığı hemen gelir, bölüm kendi yerinde aynı cam panelin veri olmayan hali olarak bekler. Şekiller `--glass-strong`, 12px köşe; 200 ms gecikmeyle belirir, 1,6 sn'lik yavaş nefes (opaklık 1 → 0,5), parlayan süpürme yok. Aralık değişince (7g/30g) yalnızca bu bölüm iskelete döner.
- `prefers-reduced-motion`: ortam ışığı sabit, gösterge anında yer değiştirir, specular kapalı, yavaş geçiş çizgisi akmaz (tam genişlikte sabit durur), iskelet nefes almaz.
- *(Faz 17)* **Landing'de kaydırmaya bağlı hareket:** tek istisna gezen telefon. Hareket kaydırma konumundan türetilir (zamanla oynayan giriş animasyonu değil); duraklar arasında `smoothstep`, telefon kaydırmayı yumuşakça izler. Blok yörüngesi yavaş sabit hızdadır. `prefers-reduced-motion`: dönüş, tema turu dönüşü, yörünge, sırayla dönme ve süzülme yok; telefon yalnızca yer değiştirir, tema yine değişir.
- Kütüphane eklenmez (CSS + WAAPI). Faz 17'de three.js denendi (cam telefon, kil karakter) ve landing için bırakıldı: aynı etki CSS 3D ile paketsiz ve keskin yazıyla alındı. **Tek istisna 404 maskotu** (kullanıcı kararı, 2026-09-28): three.js yalnızca 404 sayfalarında, sayfa çizildikten sonra tembel yüklenir (`features/errors/components/lost-mascot.tsx`); WebGL yoksa kutu boş kalır. `prefers-reduced-motion`: maskot durur, zincir sarkar.

---

## 9. Erişilebilirlik

- Cam üzerindeki metin kontrastı her iki temada ≥ 4.5:1.
- `prefers-reduced-transparency` açıksa cam dolgusu opak yüzeye döner.
- Dokunma hedefi ≥ 44px (sekme çubuğu 48px). Odak halkası her yüzeyde görünür.

---

## 10. Build Sözleşmesi (kök layout'a HTML yorumu olarak girer)

```
THESIS: Linkiva is a single pane of glass onto a person's world; the UI speaks in light and depth, never in colour. Refuses v1's shouting neon-glass and the category's pastel pill list.
OWN-WORLD: One slow monochrome ambient light behind frosted glass (one material, three densities, liquid edge on floating glass); pill primary in ink/white; Geist + Geist Mono for data; 20/12/999 radii; semantic neon (green/red/blue) only where colour means something.
STORY: The visitor claims an address in a glass bar, lands in a calm editor with a live glass-phone preview, and manages everything from an Instagram-style glass tab bar on mobile.
FIRST VIEWPORT: Display headline over ambient light, glass address bar with live availability and a single white/ink pill; a sample profile in a glass phone beside it.
FORM: user-pinned direction "Cam" (glass), replacing seed 2967658e.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
```

---

## 11. Denetim kaydı (Faz 5, 2026-09-24)

- **impeccable detector (kod):** 3 bulgu → 2'si yanlış alarm (`--ease-spring` adı; eğri hedefi aşmıyor, `--ease-sheet` olarak yeniden adlandırıldı). Kalan 1: **"Geist aşırı kullanılan bir yazı tipi"**. *Bilinçli istisna:* ürün ağırlıklı olarak Operate yüzeyi (panel, editör, analitik) ve kullanıcı premium, sessiz, Apple benzeri bir his istedi; kişilik yazı tipinden değil ışık/cam malzemesinden geliyor. Profil sahipleri 4 farklı karakterde yazı tipi seçebiliyor (§7).
- **impeccable detector (URL taraması):** çalıştırılamadı, `puppeteer` gerektiriyor ve onaylı bağımlılık değil.
- **Kontrast:** açık temada `ink-3`, `positive`, `info` 4.5:1 altındaydı, koyulaştırıldı. Artık testle korunuyor.
- **Mobil taşma:** landing hero'su 390px'te yatay taşıyordu, düzeltildi. `tests/e2e/layout.spec.ts` beş sayfayı koruyor.
- **Lighthouse (Faz 6, canlı, mobil):** landing 95 · giriş 97 · profil 89 performans; erişilebilirlik, en iyi uygulamalar ve SEO hepsinde 100. Profil düzeltmesi (ilk ekran görselleri hemen yüklenir) ROADMAP Faz 6'da.
- **Fazlalık denetimi (`ponytail-audit`, Faz 6):** yalın. Silinecekler: `ComingSoon` + `soon` metinleri, 10 kullanılmayan çeviri anahtarı. `DESIGN_CONTRACT` HTML yorumu §10 gereği kalır. `lib/link-preview.ts`'in düşük seviye `http` kullanımı SSRF için bilinçli (IP sabitleme `fetch` ile yapılamaz).
- **Kapandı (2026-09-27):** "İçeriğe geç" linki site kök layout'unda ilk odak durağı (odaklanınca `glass-float` hap, sol üstte); site tarafındaki her sayfanın içeriği `<main id="main">`, panelde de artık `main` landmark'ı var. Profil sayfasında içerikten önce gezinme olmadığı için eklenmedi. `tests/e2e/phase9.spec.ts` koruyor.
