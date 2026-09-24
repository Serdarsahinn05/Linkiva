# Linkiva: Tasarım Sistemi

> **Durum: Yön onaylandı (2026-09-24), build öncesi sözleşme.** Bu belge build'den *önce* yazılmış bir yön sözleşmesidir. Build bittikten sonra, kodda gerçekten ne varsa ona göre yeniden kaydedilir (build sonrası gerçek kod esas alınır).
> Tasarım otoritesi bu belgedir. `ui-ux-pro-max` ve benzeri skill önerileri bu belgeye uyar, onu ezmez.
> Ürün gerçeği: [PRODUCT.md](PRODUCT.md)

---

## 0. Reddedilen dünya

Eski arayüzün hiçbir öğesi referans alınmaz: siyah zemin + `#0A0A0A` kartlar, glassmorphism, bulanık renk blob'ları, neon/beyaz parıltı gölgeleri, `italic uppercase font-black` başlıklar, `text-[9px] tracking-widest` mikro etiketler, `rounded-[2.5rem]` şişkin kartlar, gradient yazı, emoji ikonlar, "Rank #01" / "Live Now" gibi süs rozetleri.

Kategorinin kendi kalıbı da reddedilir: Linktree'nin pastel gradient üstünde ortalanmış hap butonları. Bu kalıbın tahmin edilebilir zıttı olan "siyah premium neon" (eski Linkiva) da aynı şekilde reddedilir.

---

## 1. Yön: **Etiket** (Dymo etiket makinesi)

**Tez.** Linkiva, sahip olduğun şeyleri etiketlemenin dijital hâlidir. Etiket makinesiyle kutuna, rafına, defterine adını basarsın. Linkiva'da da her link, başlık ve blok gerçekten basılmış, kabartmalı bir plastik bant şeridi olur. Sayfa bir **pano** (pegboard), bloklar da panoya yapıştırılmış etiketlerdir.

**Neden bu kitleye uyuyor.** Etiket makinesi bandı; okul dolabı, stüdyo rafı, laptop sticker'ı ve "benim eşyam" kültürüyle özdeş. Kişisel, kısa ve net: bir etiket bir şeyin ne olduğunu tek satırda söyler. Bu, bio-link'in de işidir. Bant renkleri **işlevseldir**: her blok tipinin kendi bant rengi vardır. "Blok çeşitliliği" iddiası böylece görsel bir dile dönüşür.

**Kategori kalıbını nasıl reddediyor.** Pastel gradient üstünde ortalanmış hap butonlar yerine, çelik gri bir pano üzerinde hafif eğik yapıştırılmış kabartmalı bantlar kullanılır.

**Dürüst risk.** Tamamen büyük harfli, dar bant yazısı uzun metinlerde yorar. Bu yüzden bant dili **başlıklar, link başlıkları, butonlar ve durum** için kullanılır. Gövde metni ve form alanları normal genişlikte, normal harfli kalır. Operasyonel ekranlarda (panel, analitik) dünya sadece hassas detaylarda yaşar: aktif menü işareti, blok tipi sekmeleri, birincil buton ve toast.

**İmza etkileşim: "basım".** Kullanıcı bir etiket metni yazdığında (landing'deki kullanıcı adı, editörde link başlığı) bant harf harf basılır. Her harf ~35ms'de, kabartma baskı hissiyle belirir. Metin bitince bandın sağ ucu makasla kesilmiş gibi açılı biter ve bant yerine hafifçe oturur. `prefers-reduced-motion` açıksa bant anında tam hâliyle görünür.

---

## 2. Renk

**Strateji:** Operasyonel ekranlar (panel, analitik, ayarlar) **Restrained**: nötr zemin ve mürekkep, tek vurgu olarak etiket kırmızısı. Landing **Committed**: kırmızı bant ilk ekranda büyük bir alan kaplar. Açık/koyu seçimi kullanım sahnesinden yapıldı: kullanıcı gün ışığında, okulda, kafede ya da otobüste telefonunu kullanıyor. Bu yüzden varsayılan **açık** tema, koyu tema da tam destekli.

### Token'lar (`app/globals.css`, Tailwind v4 `@theme`)

```css
@theme {
  /* Zemin: galvaniz pano (krem değil, soğuk çelik gri) */
  --color-ground:      oklch(93.5% 0.003 160);   /* #E9EBEA */
  --color-panel:       oklch(97.3% 0.002 160);   /* #F6F7F6 */
  --color-ink:         oklch(19% 0.005 160);     /* #141615 */
  --color-ink-2:       oklch(42% 0.008 160);     /* #4A4F4D: ikincil metin, ground üstünde ≥ 7:1 */
  --color-ink-3:       oklch(55% 0.008 160);     /* yalnızca büyük/ikonik metin, placeholder değil */
  --color-hairline:    oklch(83% 0.005 160);     /* #C9CDCB */
  --color-peg:         oklch(19% 0.005 160 / 0.07); /* pano delikleri */

  /* Bant renkleri: Dymo klasik plastik bantları */
  --color-tape-red:    oklch(52% 0.19 25);       /* #C4262E  birincil eylem + marka */
  --color-tape-black:  oklch(22% 0.004 260);     /* #1B1C1E  LINK bloğu */
  --color-tape-blue:   oklch(44% 0.14 260);      /* #1F4FA3  TEXT bloğu, bilgi */
  --color-tape-green:  oklch(50% 0.11 155);      /* #1E7A4C  EMAIL_CAPTURE, başarı */
  --color-tape-yellow: oklch(83% 0.15 88);       /* #F2C230  EMBED, uyarı (yazısı ink) */
  --color-tape-grey:   oklch(62% 0.01 160);      /* DIVIDER, pasif */
  --color-emboss:      oklch(98% 0 0);           /* kabartma harf rengi */

  --color-danger:      var(--color-tape-red);    /* yıkıcı eylem: kırmızı KONTÜR + açık metin, dolu değil */
  --color-focus:       var(--color-ink);
}

:root[data-theme="dark"], (prefers-color-scheme: dark → aynı değerler) {
  --color-ground:   oklch(17% 0.004 160);  /* #111312 eloksal siyah */
  --color-panel:    oklch(21% 0.005 160);  /* #1A1D1C */
  --color-ink:      oklch(93% 0.003 160);
  --color-ink-2:    oklch(74% 0.006 160);
  --color-hairline: oklch(31% 0.006 160);
  --color-peg:      oklch(93% 0.003 160 / 0.06);
  --color-focus:    oklch(93% 0.003 160);
  /* bant renkleri aynı kalır: fiziksel malzeme temayla değişmez */
}
```

**Blok tipi ↔ bant rengi:** LINK siyah · HEADER kırmızı · TEXT mavi · EMBED sarı · EMAIL_CAPTURE yeşil · DIVIDER gri. Bu eşleme editör, önizleme etiketleri ve analitik lejantlarında aynıdır.

**Kurallar**
- Kırmızı bant ekranda **tek birincil eylem** içindir. Bir ekranda iki kırmızı bant buton olmaz.
- Yıkıcı eylemler dolu kırmızı değil, kırmızı kontür + açık fiil kullanır ("Hesabı sil"). Onay adımı zorunludur.
- İkincil metin gri değil, zeminin tonunda koyultulmuş mürekkeptir (`ink-2`).
- Gradient **sadece** bant malzemesinde kullanılır (plastik parlaklığı: dikeyde %4 açıklık farkı). Yazıda, arka planda ya da butonda süs amaçlı gradient kullanılmaz.

---

## 3. Tipografi

Tek bir değişken aile: **Archivo** (Google Fonts). Genişlik ekseni `wdth` 62–125, ağırlık `wght` 100–900 ve Latin Extended desteği var (ğ ş ı İ ç ö ü). Tek dosya olduğu için performans iyi, genişlik ekseni sayesinde de hem bant yazısını hem gövdeyi taşıyor.

| Rol | Ayar | Kullanım |
|---|---|---|
| **Bant** | Archivo `wdth 72`, `wght 700`, `uppercase`, `letter-spacing: 0.06em`, `font-feature-settings: "tnum"` | Bant şeritleri: link başlıkları (Etiket temasında), butonlar, blok tipi sekmeleri, landing başlığı |
| **Display** | Archivo `wdth 88`, `wght 800`, `letter-spacing: -0.02em`, normal harf | Sayfa başlıkları (panelde), landing ara başlıkları |
| **Gövde** | Archivo `wdth 100`, `wght 400/500`, 16px / 1.55 | Metin, form, açıklama |
| **Veri** | Archivo `wdth 100`, `wght 600`, `tnum` | Analitik sayıları. **Monospace kostümü yok.** |
| **Kod/URL** | Gövde + `wdth 92` | `linkiva.space/kullanici` gibi adresler |

**Ölçek** (1.25, rem): 0.8125 · 0.875 · 1 · 1.25 · 1.5625 · 1.953 · 2.441 · 3.815 · display üst sınırı 6rem.
- Türkçe büyük harf için `text-transform: uppercase` + `<html lang="tr">` kullanılır. Böylece "i" doğru şekilde "İ" olur. Yazıda `toUpperCase()` değil, `toLocaleUpperCase("tr")` kullanılır.
- **İstisna:** Marka adı, URL, kullanıcı adı gibi tanımlayıcılar bant içinde `lang="en" translate="no"` ile yazılır. Aksi hâlde "linkiva" yazısı "LİNKİVA" olur (Faz 0 ekran görüntüsünde yakalandı).
- Gövde satır uzunluğu 65–75ch. Başlıkların üstündeki boşluk altındakinden fazla.
- Başlık üstüne "eyebrow/kicker" etiketi konmaz. Başlık kendi ağırlığını taşır.

---

## 4. Malzeme ve Biçim

### Bant (`<Tape>`, çekirdek primitive)
- Yükseklikler: `sm 28px` · `md 36px` · `lg 44px` · `display clamp(56px, 9vw, 112px)`.
- Uçlar: sol düz, sağ `clip-path` ile 6° açılı kesik (makas kesimi).
- Eğim: `--tilt` değeri blok id'sinin hash'inden deterministik olarak üretilir, aralığı −0.6° ile +0.6°. Böylece bant her render'da aynı eğimde durur ve hydration kararlı kalır.
- Yüzey: `background: linear-gradient(to bottom, color-mix(in oklch, var(--tape) 92%, white), var(--tape))`. İnce bir yatay emboss çizgisi (`inset 0 1px 0 rgb(255 255 255 / .18)`).
- Harf kabartması: `color: var(--color-emboss); text-shadow: 0 1px 0 rgb(0 0 0 / .35), 0 -1px 0 rgb(255 255 255 / .22);`
- Gölge (yapıştırılmış plastik): `0 1px 0 rgb(0 0 0 / .22), 0 2px 4px -1px rgb(0 0 0 / .22)`. Sıfır offset'li parıltı ya da blur'suz blok gölge kullanılmaz.
- Hover (tıklanabilir bant): bant 1px kalkar, gölge `0 3px 8px -2px` olur, eğim 0'a yaklaşır. Basılınca 0px'e iner. Süre 140ms, `cubic-bezier(.2,.8,.2,1)`.

### Pano (zemin)
- `ground` rengi üzerinde 24px ızgarada 2px çaplı delik deseni (`radial-gradient`, `--color-peg`). Delikler **layout ızgarasıdır**: editör satırları ve boşluklar 8px'in katları, ana hizalar 24px'e oturur.
- Panel (form alanları, editör listesi): `panel` zemin, 1px `hairline` kenar, **radius 4px**. İç içe panel yok.

### Köşe ve çizgi dili
- Radius: bant 2px · input/panel 4px · avatar tam daire. Başka radius değeri yok.
- Çizgi kalınlığı: 1px (hairline) ve odak halkası 2px. Kalın renkli sol kenarlık kullanılmaz.

### İkonlar
- `lucide-react`, stroke 1.75, 16/20px. Marka ikonları `react-icons/si` (Simple Icons) ile tek renk verilir. Emoji ikon olarak kullanılmaz.

---

## 5. Bileşen Dili

| Bileşen | Kural |
|---|---|
| **Birincil buton** | Kırmızı `Tape md`, bant yazısı. Yükleniyorsa harfler soldan sağa "basılıyor" animasyonu gösterir, metin korunur ("KAYDEDİLİYOR"). |
| **İkincil buton** | Şeffaf, 1px `ink` kontür, radius 4, gövde fontu 500. |
| **Hayalet buton** | Sadece metin + ikon. Hover'da `panel` zemin. |
| **Input** | `panel` zemin, 1px `hairline`, radius 4, 44px yükseklik (dokunma hedefi). Odak: 2px `focus` halka, 2px offset. Hata: kenar `tape-red`, altında fiil içeren mesaj ("Bu kullanıcı adı alınmış, `serdar.dev` deneyebilirsin"). |
| **Switch** | Bant görünümlü küçük sürgü. Açıkken yeşil bant, kapalıyken gri bant, üstünde "AÇIK/KAPALI" yazısı yok (erişilebilir etiket `aria` ile). |
| **Blok satırı (editör)** | Panel satırı. Solda tutamaç (grip) ve blok tipinin renkli **küçük bant sekmesi** ("LİNK"). Ortada başlık (düzenlenebilir) ve URL. Sağda görünürlük switch'i ve menü. Satır tıklanınca yerinde genişler (**modal değil**). |
| **Menü/Popover** | Panel, radius 4, gölge `0 8px 24px -8px rgb(20 22 21 / .25)`. Esc, dış tıklama ve ok tuşlarıyla gezinme desteklenir. |
| **Dialog** | Yalnızca geri alınamaz eylemler (hesap silme) ve odak gerektiren görevler (QR indir) için. Link ekleme ve düzenleme satır içinde yapılır. |
| **Toast** | Ekranın altından, etiket makinesinden çıkan bir bant gibi kayarak gelir. Başarı yeşil, hata kırmızı. `aria-live="polite"`. Link silme için "Geri al" aksiyonu 6 saniye kalır, onay dialog'u yerine bu kullanılır. |
| **Boş durum** | Pano üzerinde tek bir gri, yarı saydam "BURAYA İLK LİNKİNİ YAPIŞTIR" bandı ve altında tek bir birincil eylem. İllüstrasyon kullanılmaz. |
| **Sekme** | Metin sekmeleri, aktif olanın altında 2px kırmızı bant çizgisi. |

---

## 6. Yüzeyler

### Landing (Persuade, Committed)
- **İlk ekran:** Sol üstte küçük "linkiva" wordmark'ı (bant yazısı, siyah bant), sağda "Giriş" (hayalet) ve "Ücretsiz başla" (kırmızı bant). Ekranın merkezinde **ekran genişliğinde, display boyutunda bir kırmızı bant**: `LINKIVA.SPACE/` ve yanında yanıp sönen imleç. Kullanıcı yazdıkça bant harf harf basılır (imza etkileşim). Enter'a basınca ya da "Sayfamı oluştur" bandına tıklayınca kayıt akışına geçilir, kullanıcı adı taşınır. Anlık müsaitlik bandın altında lucide ikonu + düz metinle verilir: "`senin-adin` boşta" / "`senin-adin` alınmış, `senin-adin.tr` deneyebilirsin".
- Başlık (bandın üstünde, display): "Her şeyin, tek bir adreste." Alt metin tek cümle.
- **İkinci bölüm:** Pano üzerinde bir telefon içinde örnek bir profil. "Örnek profil" etiketi taşır, **sentetiktir**. Yanında blok tipleri, kendi bant renkleriyle listelenir.
- **Üçüncü bölüm, "Ücretsiz" sayfası:** Rakiplerde genelde ücretli olan özellikler (detaylı analitik, özel tema, planlı link, öne çıkan link, e-posta toplama, marka yazısını kaldırma, QR) fiyat etiketi dizisi gibi dizilir. Her birinin üstünde yeşil "ÜCRETSİZ" bandı durur. Rakip adı ya da fiyatı **yazılmaz**.
- Kapanış: tek birincil eylem.

### Panel (Operate, Restrained)
- **Masaüstü (≥1024px):** Solda 232px ray (wordmark, 4 bölüm, altta profil adresi + kopyala + QR). Ortada editör (max 640px). Sağda **yapışkan canlı önizleme**: 390×844 telefon, sade çerçeve, cihaz parlaması yok. Önizleme, public profille **aynı** blok bileşenlerini render eder.
- **Mobil (<1024px):** Altta 5 öğeli sekme çubuğu (Linkler, Görünüm, İstatistik, Ayarlar, Önizle). "Önizle" tam ekran bir sheet açar.
- Aktif menü öğesinin solunda küçük kırmızı bant işareti bulunur, zemin değişmez.

### Public profil (Experience)
- Kullanıcının seçtiği tema yönetir, Linkiva geri planda kalır. Varsayılan tema **Etiket**'tir: pano zemin, ortada avatar + isim (display), bio (gövde), sosyal ikon satırı ve bant bloklar. Bantlar tam genişlik, eğimli, 44px+ yükseklikte olur.
- En altta küçük "linkiva" bandı durur. Kullanıcı bunu kaldırabilir ve bu ücretsizdir.
- İlk içerik boyası 1s altında hedeflenir. Profil sayfasında client JS yalnızca beacon ve e-posta formu içindir.

### Analitik (Operate)
- Üstte tarih aralığı sekmeleri (7g · 30g · 90g · Tümü). Dört ana sayı **tek satırlık bir veri şeridi** olarak durur: görüntülenme, tekil ziyaretçi, tıklama, CTR. Büyük sayı + küçük etiket kart şablonu kullanılmaz, sayılar yan yana tablo hizasında durur.
- Zaman grafiği: tek bir alan grafiği (görüntülenme) ve üzerine çizgi (tıklama). Mürekkep renkleri, ızgara çizgileri `hairline`.
- Link tablosu: blok, tıklama, CTR, küçük yatay bar. Kaynaklar, ülkeler ve cihazlar için üç sade tablo. Harita yok, ülke listesi bayraksız (ISO kodu + ad).
- Veri yoksa ne olacağını söyleyen boş durum gösterilir ("Profilini paylaştığında burada görünecek"). Sahte veri gösterilmez.

---

## 7. Profil Temaları (kullanıcıya açık)

Her tema bir token setidir (`themes/<key>.ts`). Profil sayfası bu değişkenleri `style` ile köke uygular:

```
--p-bg  --p-bg-image  --p-ink  --p-ink-2  --p-block-bg  --p-block-ink  --p-block-border
--p-radius  --p-shadow  --p-font-display  --p-font-body  --p-button: tape | solid | outline | soft
```

| Anahtar | Karakter |
|---|---|
| `etiket` *(varsayılan)* | Çelik pano, Dymo bantları, eğim |
| `sade` | Beyaz zemin, mürekkep metin, 1px kontürlü tam genişlik satırlar, eğim yok |
| `gece` | Koyu eloksal zemin, açık satırlar, düşük kontrastlı kontür |
| `risograf` | Kâğıt zemin, floresan pembe + mavi, hafif baskı kayması (misregister) |
| `terminal` | Siyah zemin, fosfor yeşili, monospace (**burada mono içerikle uyumlu**, portfolyo öncülü) |
| `afis` | Kullanıcının vurgu rengi tüm sayfayı kaplar, dev dar başlık, siyah bloklar |

**Özelleştirme (hepsi ücretsiz):** vurgu rengi, font (5 seçenek, seçilen font yalnızca o profilde yüklenir), buton stili, arka plan (düz, görsel, degrade **değil**), "linkiva" yazısını gizleme.

**Kontrast koruması:** Kullanıcı rengi, blok zemini üzerinde 4.5:1 sağlamıyorsa yazı rengi otomatik olarak mürekkebe ya da beyaza döner (OKLCH L eşiğiyle). Arka plan görseli varsa blokların altına %60 opak bir zemin eklenir.

---

## 8. Hareket

- Tek bir imza hareket var: **basım** (§1). Başka giriş animasyonu yok, bölümler scroll'da "fade-up" yapmaz.
- Mikro etkileşimler 120–180ms, `cubic-bezier(.2,.8,.2,1)`: bant kalkması, satır genişlemesi, toast'ın çıkışı.
- Sürükle-bırak: tutulan bant 2° eğilir ve gölgesi derinleşir. Bırakıldığında yerine oturur (dnd-kit `dropAnimation` 180ms).
- `prefers-reduced-motion: reduce`: basım anlık, eğim korunur, kalkma yok, yalnızca renk ve opaklık geçişleri kalır.
- Animasyon kütüphanesi **eklenmez**. CSS + Web Animations API yeterli.

---

## 9. Erişilebilirlik Tabanı

- Metin kontrastı ≥ 4.5:1, büyük metin ≥ 3:1. Bant renklerinin kabartma harf üstündeki kontrastı build'de test edilir.
- Dokunma hedefi ≥ 44×44px. Tüm etkileşimler klavyeyle yapılabilir, odak görünür (2px halka).
- Sürükle-bırak için klavye alternatifi (dnd-kit keyboard sensor) ve ek olarak "Yukarı taşı / Aşağı taşı" menü öğeleri bulunur.
- Bantların eğimi dekoratiftir, okuma sırasını ve seçimi bozmaz.
- `lang` her zaman içerikle eşleşir (`tr`/`en`).

---

## 10. Build Sözleşmesi (kök layout'a HTML yorumu olarak girecek)

```
THESIS: Linkiva sahip olduklarını etiketlemektir; her blok basılmış, kabartmalı bir Dymo bandıdır. Pastel hap-buton listesini ve siyah-neon "premium" kalıbını reddeder.
OWN-WORLD: Soğuk çelik gri pano (24px delik ızgarası), Dymo bant renkleri (kırmızı birincil; siyah/mavi/yeşil/sarı/gri blok tipleri), beyaz kabartma harfler, Archivo tek aile (dar büyük harf bant + normal gövde), 2/4px köşeler, 1px çizgiler.
STORY: Ziyaretçi kullanıcı adını yazar, bandı basılırken görür, 60 saniyede yayındadır; panelde blok ekler, canlı önizlemede görür, gerçek veriyi izler.
FIRST VIEWPORT: Ekran genişliğinde kırmızı display bant "LINKIVA.SPACE/_", yazdıkça basılır; üstünde başlık, sağ üstte kırmızı "Ücretsiz başla".
FORM: Kendi listemden 7. aday (Dymo etiket makinesi bandı), seed 2967658e.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
```
