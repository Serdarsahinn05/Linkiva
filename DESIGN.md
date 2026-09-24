# Linkiva: Tasarım Sistemi — "Cam"

> **Durum:** Yön kullanıcı tarafından belirlendi (2026-09-24) ve "Etiket" yönünün yerine geçti. **Build'den yeniden kaydedildi (Faz 5):** değerler `app/globals.css` ve `themes/index.ts` ile eşleşir; çelişki olursa kod esastır ve bu belge düzeltilir.
> Tasarım otoritesi bu belgedir. `ui-ux-pro-max` ve benzeri skill önerileri bu belgeye uyar, onu ezmez.
> Ürün gerçeği ve bağlayıcı görsel taahhütler: [PRODUCT.md](PRODUCT.md) → Brand Commitments.

---

## 0. Reddedilenler

- **v1:** bağıran `italic uppercase font-black` başlıklar, `text-[9px] tracking-widest` mikro etiketler, `rounded-[2.5rem]` şişkin kartlar, zemine rastgele serpiştirilmiş neon blob'lar, gradient yazı, emoji ikonlar, "Live Now / Rank #01" süsleri.
- **Etiket (v2 ilk yön):** çok renkli bantlar, dar büyük harf, eğik şeritler. "Oyuncak gibi."

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

- Özelleştirme: mod (ziyaretçiye göre/açık/koyu), font (5), buton stili (cam/dolu/çizgi), vurgu rengi (hazır + özel), arka plan görseli (kendi zemin rengiyle karartılır), "Linkiva" rozetini gizleme.
- **Kontrast koruması:** Dolu butonda yazı rengi vurgu renginden otomatik seçilir (`inkOn`, ≥ 4.5:1 testli). Çizgi butonda vurgu, seçili modun zemininde 3:1'in altındaysa Görünüm sayfası uyarır.
- Profil kendi sahnesini taşır (`.profile-scene` + `data-theme/scene/font/button`), bu yüzden önizlemeler ve tema kartları gerçek CSS ile çizilir.

### Landing (Persuade)
- İlk ekran: ortam ışığı, display başlık "Her şeyin, tek bir adreste.", alt metin ve **cam bir adres çubuğu**: `linkiva.space/` + kullanıcı adı girişi + birincil hap buton. Yanında (mobilde altında) örnek bir profil (sentetik, "Örnek" etiketli) cam telefon içinde durur.
- "Ücretsiz" bölümü: rakiplerde ücretli olan özellikler **tek bir cam panelde satır listesi** olarak durur. Her satırda özellik adı, açıklama ve sağda yeşil (semantik: "var") onay.

### Analitik (Operate + semantik neon)
- Dört ana sayı cam bir şeritte yan yana durur (kart şablonu değil). Her birinin altında trend rozeti: artış `--positive`, düşüş `--negative`, değişim yoksa `--ink-3`. Koyu temada hafif neon parlamayla.
- Grafik: görüntülenme `--info` alan grafiği (degrade dolgu → şeffaf), tıklama `--positive` çizgi. Izgara `--glass-edge`.

---

## 8. Hareket

- Sheet eğrisi `--ease-sheet: cubic-bezier(0.32, 0.72, 0, 1)` 280–500ms (iOS sheet eğrisi; hızlı üstel yavaşlama, hedefi aşmaz). Mikro etkileşimler `--ease-out` 160ms.
- İmza hareketler: sıvı sekme göstergesi, specular highlight, sheet açılışı. Scroll'da "fade-up" girişleri yok.
- `prefers-reduced-motion`: ortam ışığı sabit, gösterge anında yer değiştirir, specular kapalı.
- Kütüphane eklenmez (CSS + WAAPI).

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
- **Açık kalan:** Lighthouse ölçümü (yerelde Lighthouse yok; ilk preview dağıtımında ölçülecek). `ponytail-review` (fazlalık denetimi) henüz çalıştırılmadı.
