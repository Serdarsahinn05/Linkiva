import { site } from "@/lib/site";
import type { LegalDoc } from "./types";

// Every statement here describes code, not intent. When behaviour changes, change this text and its date:
// visitor analytics (features/analytics/record.ts, lib/tracking.ts), rate limits (lib/ratelimit.ts, lib/auth.ts),
// clean-up (features/maintenance/cleanup.ts), outgoing requests (lib/link-preview.ts, features/link-check,
// features/import, lib/github.ts), embeds (lib/embeds.ts), cookies (lib/theme-preference.ts, i18n/config.ts).

const OWNER = "Serdar Şahin";

export const privacy: Record<"tr" | "en", LegalDoc> = {
  tr: {
    title: "Gizlilik ve Aydınlatma Metni",
    updated: "Son güncelleme: 29 Eylül 2026",
    intro: [
      `Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun (KVKK) 10. maddesi kapsamındaki aydınlatma metnidir ve Avrupa Birliği Genel Veri Koruma Tüzüğü'nün (GDPR) şeffaflık ilkesi gözetilerek hazırlanmıştır. ${site.name}'nın bugün gerçekten ne yaptığını anlatır.`,
      "Kısaca: profil ziyaretçilerini izlemeyiz, onlara çerez koymayız, istatistik için IP adresi saklamayız. Verini satmayız, reklam için kullanmayız ve hiçbir yapay zekâ sağlayıcısına göndermeyiz.",
    ],
    sections: [
      {
        id: "sorumlu",
        title: "Veri sorumlusu",
        body: [
          `${site.name} bireysel bir projedir. Veri sorumlusu ${OWNER}'dir. Kişisel verilerinle ilgili başvurular, hukuka aykırı içerik bildirimleri ve diğer bütün sorular için ${site.email} adresine yazabilirsin.`,
        ],
      },
      {
        id: "ziyaretciler",
        title: "Profil ziyaretçileri hakkında ne kaydediyoruz?",
        body: [
          "Bir profil görüntülendiğinde ya da bir linke tıklandığında şunları kaydederiz: olay türü (görüntülenme ya da tıklama), zaman, barındırma sağlayıcımızın bağlantıdan tahmin ettiği ülke ve şehir, cihaz sınıfı, işletim sistemi ve tarayıcı ailesi, geldiğin sitenin yalnızca alan adı (örneğin instagram.com) ve adreste varsa utm_source değeri.",
          "IP adresini istatistik için saklamayız. Tekil ziyaretçileri sayabilmek için IP adresi, tarayıcı bilgisi ve profil kimliği her gün değişen gizli bir anahtarla tek yönlü olarak özetlenir. Bu özet ertesi gün değişir; aynı kişiyi günler ya da profiller arasında eşleştirmek mümkün değildir.",
          "Ziyaretçilere çerez ya da benzeri bir tanımlayıcı koymayız. Botlar, bağlantı önizlemeleri (WhatsApp, Telegram, X vb.), tarayıcı ön yüklemeleri ve profil sahibinin kendi ziyaretleri sayılmaz.",
          "Profil sahibi yalnızca toplu sayıları görür (kaç görüntülenme, hangi ülkelerden, hangi cihazlardan). Tek bir ziyaretçinin hareketleri gösterilmez ve kimseyi tanımlamak için kullanılmaz.",
          "Kötüye kullanımı önlemek için IP adresinin tek yönlü özeti birkaç dakikalık bir hız sınırı sayacında anahtar olarak kullanılır; sayaç süresi dolunca silinir. IP adresinin kendisi bu sayaçta saklanmaz.",
        ],
      },
      {
        id: "gomulu",
        title: "Gömülü içerik ve dış linkler",
        body: [
          "Bir profilde YouTube videosu varsa videonun küçük resmi, sayfa açılırken doğrudan YouTube'un sunucusundan yüklenir. Bu sırada tarayıcın YouTube'a IP adresini ve tarayıcı bilgisini iletir. Oynatıcının kendisi (YouTube, Spotify, SoundCloud) sen oynata basana kadar yüklenmez. Oynatıcı açıldığında o hizmetin kendi gizlilik politikası geçerlidir. YouTube, çerezsiz kipte (youtube-nocookie.com) açılır.",
          "Bir linke tıkladığında tıklamayı sayar ve seni hedef siteye yönlendiririz. Gittiğin sitenin verilerini nasıl işlediğinden o site sorumludur.",
        ],
      },
      {
        id: "aboneler",
        title: "E-posta toplama",
        body: [
          "Bir profildeki abone formuna e-posta adresini yazarsan, adres yalnızca o profilin sahibinin abone listesine eklenir. Bu listenin veri sorumlusu profil sahibidir; biz listeyi onun adına saklarız. Profil sahibi listeyi görebilir, dışa aktarabilir ve kayıtları silebilir. Listeden çıkmak için profil sahibine ya da bize yazabilirsin.",
        ],
      },
      {
        id: "hesap",
        title: "Hesap sahipleri hakkında işlediğimiz veriler",
        body: [
          {
            list: [
              "Kimlik ve iletişim: e-posta adresin ve görünen adın. Google ile girersen Google'dan adını, e-posta adresini, profil fotoğrafının adresini ve Google'ın verdiği oturum anahtarlarını alırız.",
              "Güvenlik: şifrenin tek yönlü özeti (şifrenin kendisi değil); oturum kayıtlarında giriş yaptığın cihazın IP adresi ve tarayıcı bilgisi (Ayarlar'daki oturum listesinde görürsün); iki adımlı doğrulama açıksa şifreli anahtarın ve yedek kodların; giriş ve kayıt denemeleri için hız sınırı sayaçları.",
              "Sayfan: kullanıcı adın ve eski kullanıcı adların, adın, biyografin, sosyal hesapların, blokların, yüklediğin görseller, tema ve görünüm ayarların, dilin ve saat dilimin.",
              "Hizmet kayıtları: bildirim tercihlerin, linklerinin günlük kontrol sonuçları ve bağladıysan özel alan adın.",
            ],
          },
          "Destek, WhatsApp ve kartvizit bloklarına yazdığın IBAN, telefon numarası ve iletişim bilgileri sayfanda herkese açık yayınlanır. Bunları yalnızca sen eklersin ve istediğin zaman kaldırabilirsin.",
        ],
      },
      {
        id: "amaclar",
        title: "Amaçlar ve hukuki sebepler",
        body: [
          {
            list: [
              "Hesabını açmak, sayfanı yayınlamak ve istatistiklerini göstermek: sözleşmenin kurulması ve ifası (KVKK m.5/2-c).",
              "Hesap güvenliği ve kötüye kullanımın önlenmesi (hız sınırları, iki adımlı doğrulama, güvenlik e-postaları): meşru menfaat (m.5/2-f) ve veri güvenliği yükümlülüğü (m.12).",
              "İşlem e-postaları (doğrulama, şifre sıfırlama, güvenlik bildirimleri), linklerinin günlük kontrolü ve kapatabileceğin haftalık özet: sözleşmenin ifası (m.5/2-c).",
              "Profil ziyaretlerinin toplu istatistiği: meşru menfaat (m.5/2-f), kişiyi tanımlamayan bir yöntemle.",
              "Hukuka aykırı içerik bildirimlerini incelemek ve yetkili makamların taleplerini karşılamak: hukuki yükümlülük (m.5/2-ç) ve bir hakkın tesisi, kullanılması veya korunması (m.5/2-e).",
            ],
          },
          "Pazarlama e-postası göndermeyiz.",
        ],
      },
      {
        id: "toplama",
        title: "Verileri nasıl topluyoruz?",
        body: [
          "Veriler; kayıt ve düzenleme formlarına yazdıklarından, Google ile girişten, profil ziyaretlerinde tarayıcının gönderdiği teknik bilgilerden ve barındırma sağlayıcımızın bağlantıdan tahmin ettiği konumdan, otomatik ya da kısmen otomatik yollarla toplanır.",
          "Sunucumuz senin adına şu durumlarda dış adreslere istek atar:",
          {
            list: [
              "Link önizleme kartı ya da içe aktarma istediğinde: linkin sayfası, linktr.ee sayfan ya da GitHub'daki herkese açık depoların, yalnızca o anda bir kez okunur.",
              "Günlük link kontrolü: yayındaki linklerinin adreslerine günde en fazla bir kez istek atılır. Sayfanın içeriği okunmaz, yalnızca açılıp açılmadığına bakılır. Bir link art arda iki gün açılmazsa sana bir e-posta göndeririz.",
              "Son video: bir YouTube kanalının son videosunu göstermek için kanalın herkese açık beslemesi saatte bir okunur.",
            ],
          },
        ],
      },
      {
        id: "aktarim",
        title: "Verileri kimlere aktarıyoruz?",
        body: [
          "Hizmeti çalıştırmak için şu sağlayıcıları kullanırız. Bu sağlayıcılar verini yalnızca bizim adımıza saklar ve iletir; satmaz, reklam için kullanmaz.",
          {
            list: [
              "Vercel: uygulamanın çalıştığı altyapı ve yüklediğin dosyalar (Vercel Blob). Uygulama sunucuları Frankfurt'ta (Almanya) çalışır. Özel alan adı bağlarsan alan adın Vercel'e iletilir.",
              "Supabase: veritabanı, Frankfurt (Almanya) veri merkezinde.",
              "Resend: e-postaların gönderimi.",
              `Google: yalnızca Google ile giriş yaparsan kimlik doğrulama. Ayrıca ${site.email} adresine yazdığın e-postalar ImprovMX üzerinden yönlendirilir ve Google'ın e-posta hizmetinde (Gmail) saklanır.`,
              "GitHub: yalnızca GitHub'dan içe aktarma yaparsan, verdiğin kullanıcı adı GitHub'a sorulur.",
              "Yetkili kamu kurum ve kuruluşları: yalnızca kanunen zorunlu olduğunda.",
            ],
          },
          "Bu sağlayıcıların merkezleri yurt dışındadır (çoğunlukla ABD). Bu yüzden kişisel verilerin yurt dışına aktarılır. Aktarım yalnızca hizmeti sunmak için gereken ölçüde yapılır.",
        ],
      },
      {
        id: "saklama",
        title: "Ne kadar saklıyoruz?",
        body: [
          {
            list: [
              "Hesap ve sayfa verileri, istatistikler ve abone listen: hesabın silinene kadar. Hesabını silmek istediğinde sayfan hemen yayından kalkar; 15 gün içinde giriş yapıp geri yüklemezsen hepsi, yüklediğin dosyalarla birlikte kalıcı olarak silinir.",
              "Oturum kayıtları (IP adresi ve tarayıcı bilgisiyle): güvenlik için hesabın silinene kadar. Açık oturumlarını Ayarlar'dan istediğin zaman kapatabilirsin; kapattığın oturumun kaydı silinir.",
              "Eski kullanıcı adların: 30 gün boyunca yeni adresine yönlenir, sonra silinir ve ad serbest kalır.",
              "Hız sınırı sayaçları: birkaç dakikadan en geç bir güne kadar, sonra kendiliğinden silinir.",
              "E-posta doğrulama ve şifre sıfırlama bağlantıları: süresi dolunca geçersiz olur, en geç bir gün içinde silinir.",
            ],
          },
          "Silinen veriler, altyapı sağlayıcılarının otomatik yedeklerinden de o yedeklerin saklama süresi dolunca kendiliğinden kalkar.",
        ],
      },
      {
        id: "cerezler",
        title: "Çerezler",
        body: [
          "Profil sayfalarında ziyaretçilere çerez koymayız. Site ve panelde yalnızca çalışması için gereken ya da senin seçtiğin ayarı hatırlayan çerezler var:",
          {
            list: [
              "Oturum çerezleri: giriş yapmış kalman için, en fazla 30 gün.",
              "\"Bu cihazda sorma\" (iki adımlı doğrulama): yalnızca işaretlersen, 30 gün.",
              "Tema ve dil tercihi: seçimini hatırlamak için, 1 yıl.",
            ],
          },
          "Reklam, analitik ya da takip çerezi kullanmayız.",
        ],
      },
      {
        id: "satmayiz",
        title: "Verini satmayız",
        body: [
          "Profil sahiplerinin ve ziyaretçilerin verisini yalnızca hizmeti çalıştırmak için işleriz. Hiçbir veriyi satmayız, reklam ağlarıyla paylaşmayız ve sayfalarda reklam ya da üçüncü taraf takip betiği bulunmaz.",
          "Verilerini yapay zekâ modellerini eğitmek için kullanmayız ve hiçbir yapay zekâ sağlayıcısına göndermeyiz. İstatistiklerdeki içgörü cümleleri de yapay zekâyla değil, basit hesaplamalarla üretilir.",
        ],
      },
      {
        id: "guvenlik",
        title: "Güvenlik",
        body: [
          "Bütün bağlantılar şifrelidir (HTTPS). Şifreler yalnızca tek yönlü özet olarak, iki adımlı doğrulama anahtarları şifreli olarak saklanır. Her değişiklikte kaydın sana ait olup olmadığı sunucuda kontrol edilir. Veritabanını yalnızca veri sorumlusu yönetir.",
        ],
      },
      {
        id: "cocuklar",
        title: "Çocuklar",
        body: [
          `${site.name} 13 yaşından küçükler için değildir. 13 yaşından küçük birinin hesap açtığını fark edersen ${site.email} adresine yaz; hesabı sileriz.`,
        ],
      },
      {
        id: "haklar",
        title: "Haklarını kullanmak",
        body: [
          "KVKK'nın 11. maddesi uyarınca şu haklara sahipsin:",
          {
            list: [
              "Kişisel verilerinin işlenip işlenmediğini öğrenmek ve işlendiyse bilgi istemek,",
              "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenmek,",
              "Yurt içinde ve yurt dışında aktarıldığı üçüncü kişileri bilmek,",
              "Eksik ya da yanlış işlendiyse düzeltilmesini, KVKK'daki şartlar oluşunca silinmesini istemek ve bu işlemlerin aktarılan üçüncü kişilere bildirilmesini istemek,",
              "Yalnızca otomatik sistemlerle analiz edilmesi sonucu aleyhine bir sonuç çıkmasına itiraz etmek,",
              "Kanuna aykırı işleme nedeniyle zarara uğradıysan zararın giderilmesini istemek.",
            ],
          },
          `Verini Ayarlar'dan görebilir, düzeltebilir, JSON olarak indirebilir ve hesabını silebilirsin. Diğer talepler için hesabına kayıtlı e-posta adresinden ${site.email} adresine yaz. Başvurunu en geç 30 gün içinde ücretsiz yanıtlarız. Avrupa Birliği'nde yaşıyorsan kendi ülkenin veri koruma otoritesine de başvurabilirsin.`,
        ],
      },
      {
        id: "degisiklikler",
        title: "Değişiklikler",
        body: [
          "Bu metni hizmet değiştikçe güncelleriz. Önemli değişiklikleri e-postayla ya da panelde duyururuz. Güncel tarih en üstte yazar.",
          "Bu metnin Türkçe ve İngilizce sürümleri arasında bir fark olursa Türkçe sürüm esas alınır.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy Notice",
    updated: "Last updated: 29 September 2026",
    intro: [
      `This is the privacy notice required by Article 10 of Turkey's Personal Data Protection Law No. 6698 (KVKK), written with the transparency principle of the EU General Data Protection Regulation (GDPR) in mind. It describes what ${site.name} actually does today.`,
      "In short: we don't track the people who visit profiles, we put no cookies on them and we don't store IP addresses for statistics. We don't sell your data, use it for ads or send it to any AI provider.",
    ],
    sections: [
      {
        id: "controller",
        title: "Data controller",
        body: [
          `${site.name} is an individual project. The data controller is ${OWNER}. For requests about your personal data, reports of unlawful content and any other question, write to ${site.email}.`,
        ],
      },
      {
        id: "visitors",
        title: "What we record about profile visitors",
        body: [
          "When a profile is viewed or a link is clicked we record: the event type (view or click), the time, country and city as estimated by our hosting provider from the connection, device class, operating system and browser family, only the domain of the site you came from (for example instagram.com), and a utm_source value if the address has one.",
          "We don't store IP addresses for statistics. To count unique visitors, the IP address, browser details and profile id are hashed one-way with a secret key that changes every day. The hash changes the next day; the same person cannot be linked across days or across profiles.",
          "We put no cookies or similar identifiers on visitors. Bots, link previews (WhatsApp, Telegram, X…), browser prefetches and the profile owner's own visits are not counted.",
          "The profile owner only sees totals (how many views, from which countries, on which devices). A single visitor's activity is never shown and is not used to identify anyone.",
          "To prevent abuse, a one-way hash of your IP address is used as the key of a rate-limit counter that lasts a few minutes; the counter is deleted when it expires. The IP address itself is not stored in it.",
        ],
      },
      {
        id: "embeds",
        title: "Embedded content and outside links",
        body: [
          "If a profile has a YouTube video, its thumbnail loads straight from YouTube's servers when the page opens, so your browser sends YouTube your IP address and browser details. The player itself (YouTube, Spotify, SoundCloud) doesn't load until you press play. Once it does, that service's own privacy policy applies. YouTube opens in its no-cookie mode (youtube-nocookie.com).",
          "When you tap a link we count the tap and send you on to the destination. That site is responsible for how it handles your data.",
        ],
      },
      {
        id: "subscribers",
        title: "Email collection",
        body: [
          "If you enter your email in a profile's subscribe form, the address is added only to that profile owner's list. The owner is the controller of that list; we store it on their behalf. The owner can see, export and delete entries. To leave a list, write to the owner or to us.",
        ],
      },
      {
        id: "account",
        title: "What we process about account holders",
        body: [
          {
            list: [
              "Identity and contact: your email address and display name. If you sign in with Google we receive your name, email address, the address of your profile photo and the sign-in tokens Google issues.",
              "Security: a one-way hash of your password (never the password itself); in session records, the IP address and browser details of the device you signed in on (listed under Settings → sessions); your encrypted key and backup codes if two-step verification is on; rate-limit counters for sign-in and sign-up attempts.",
              "Your page: your username and past usernames, name, bio, social accounts, blocks, uploaded images, theme and appearance settings, language and time zone.",
              "Service records: your notification preferences, the daily check results of your links and your custom domain if you connected one.",
            ],
          },
          "The IBAN, phone number and contact details you put in Support, WhatsApp and Contact blocks are published on your page for everyone. Only you add them, and you can remove them at any time.",
        ],
      },
      {
        id: "purposes",
        title: "Purposes and legal bases",
        body: [
          {
            list: [
              "Opening your account, publishing your page and showing your statistics: entering into and performing the contract (KVKK Art. 5/2-c; GDPR Art. 6(1)(b)).",
              "Account security and abuse prevention (rate limits, two-step verification, security emails): legitimate interest (Art. 5/2-f; GDPR Art. 6(1)(f)) and the data security duty (KVKK Art. 12).",
              "Transactional email (verification, password reset, security notices), the daily check of your links and the weekly summary you can turn off: performing the contract.",
              "Aggregate statistics of profile visits: legitimate interest, by a method that doesn't identify anyone.",
              "Reviewing reports of unlawful content and answering authorities: legal obligation (Art. 5/2-ç; GDPR Art. 6(1)(c)) and establishing, exercising or defending a right (Art. 5/2-e).",
            ],
          },
          "We don't send marketing email.",
        ],
      },
      {
        id: "collection",
        title: "How we collect data",
        body: [
          "Data comes from what you type into sign-up and editing forms, Google sign-in, the technical details a browser sends when it visits a profile and the location our hosting provider estimates from the connection, by automated or partly automated means.",
          "Our server makes requests to outside addresses on your behalf only in these cases:",
          {
            list: [
              "When you ask for a link preview card or an import: the link's page, your linktr.ee page or your public GitHub repositories are read once, at that moment.",
              "Daily link check: each published link's address is requested at most once a day. The page's content isn't read, only whether it opens. If a link fails two days in a row we send you one email.",
              "Latest video: a YouTube channel's public feed is read once an hour to show its newest video.",
            ],
          },
        ],
      },
      {
        id: "recipients",
        title: "Who we share data with",
        body: [
          "We use these providers to run the service. They store and transmit your data only on our behalf; they don't sell it or use it for ads.",
          {
            list: [
              "Vercel: the infrastructure the app runs on and the files you upload (Vercel Blob). App servers run in Frankfurt, Germany. If you connect a custom domain, the domain name is passed to Vercel.",
              "Supabase: the database, in its Frankfurt (Germany) data centre.",
              "Resend: sending email.",
              `Google: sign-in, only if you use Google to sign in. Email you send to ${site.email} is forwarded through ImprovMX and stored in Google's email service (Gmail).`,
              "GitHub: only if you import from GitHub, the username you give is looked up on GitHub.",
              "Public authorities: only when the law requires it.",
            ],
          },
          "These providers are based outside Turkey (mostly in the United States), so your personal data is transferred abroad. Transfers are limited to what running the service needs.",
        ],
      },
      {
        id: "retention",
        title: "How long we keep it",
        body: [
          {
            list: [
              "Account and page data, statistics and your subscriber list: until you delete your account. When you ask for that, your page goes offline at once; unless you sign in and restore it within 15 days, all of it is then permanently removed, together with the files you uploaded.",
              "Session records (with IP address and browser details): for security, until you delete your account. You can end your open sessions under Settings at any time; the record of a session you end is deleted.",
              "Past usernames: they redirect to your new address for 30 days, then they are deleted and the name becomes free.",
              "Rate-limit counters: from a few minutes up to one day, then they are deleted automatically.",
              "Email verification and password reset links: invalid once expired, deleted within a day.",
            ],
          },
          "Deleted data also drops out of our infrastructure providers' automatic backups once those backups reach the end of their retention period.",
        ],
      },
      {
        id: "cookies",
        title: "Cookies",
        body: [
          "Profile pages put no cookies on visitors. The site and dashboard only use cookies they need to work or that remember a setting you chose:",
          {
            list: [
              "Session cookies: to keep you signed in, up to 30 days.",
              "\"Don't ask on this device\" (two-step verification): only if you tick it, 30 days.",
              "Theme and language preference: to remember your choice, 1 year.",
            ],
          },
          "We use no advertising, analytics or tracking cookies.",
        ],
      },
      {
        id: "no-sale",
        title: "We don't sell your data",
        body: [
          "We process the data of profile owners and visitors only to run the service. We never sell it or share it with ad networks, and pages carry no ads or third-party tracking scripts.",
          "We don't use your data to train AI models and don't send it to any AI provider. The insight sentences in your statistics come from simple calculations, not AI.",
        ],
      },
      {
        id: "security",
        title: "Security",
        body: [
          "All connections are encrypted (HTTPS). Passwords are stored only as one-way hashes and two-step verification keys are stored encrypted. Every change is checked on the server against who owns the record. Only the data controller administers the database.",
        ],
      },
      {
        id: "children",
        title: "Children",
        body: [
          `${site.name} is not meant for children under 13. If you notice that someone under 13 has an account, write to ${site.email} and we'll delete it.`,
        ],
      },
      {
        id: "rights",
        title: "Your rights",
        body: [
          "Under Article 11 of the KVKK (and the GDPR, if it applies to you) you have the right to:",
          {
            list: [
              "learn whether your personal data is processed and request information about it,",
              "learn the purpose of the processing and whether the data is used accordingly,",
              "know the third parties it is transferred to, in Turkey or abroad,",
              "have incomplete or inaccurate data corrected, have it erased when the legal conditions are met, and have those changes passed on to the third parties it was shared with,",
              "object to a result against you that comes solely from automated analysis,",
              "claim compensation if unlawful processing caused you damage.",
            ],
          },
          `You can view, correct and download your data as JSON, and delete your account, under Settings. For anything else, write to ${site.email} from the address registered to your account. We answer free of charge within 30 days. If you live in the EU, you can also complain to your own country's data protection authority.`,
        ],
      },
      {
        id: "changes",
        title: "Changes",
        body: [
          "We update this notice as the service changes and announce important changes by email or in the dashboard. The current date is at the top.",
          "If the Turkish and English versions of this notice differ, the Turkish version prevails.",
        ],
      },
    ],
  },
};
