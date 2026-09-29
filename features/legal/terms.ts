import { site } from "@/lib/site";
import type { LegalDoc } from "./types";

// The rules users agree to at sign-up (features/legal/components/terms-consent.tsx). Behaviour this text promises:
// account deletion and export (Settings), the 30-day username redirect (features/profile), the 18+ link warning
// (app/l/[blockId]), notice and takedown (the report form and the admin panel, Faz 19).

const OWNER = "Serdar Şahin";

export const terms: Record<"tr" | "en", LegalDoc> = {
  tr: {
    title: "Kullanım Koşulları",
    updated: "Son güncelleme: 29 Eylül 2026",
    intro: [
      `Bu koşullar ${site.name}'yı (linkiva.space ve kullanıcıların bağladığı alan adları) kullanman için geçerlidir. ${site.name} bireysel bir projedir ve ${OWNER} tarafından işletilir. Hesap açarak ya da sayfanı yayınlayarak bu koşulları kabul etmiş olursun.`,
      "Kişisel verilerinin nasıl işlendiği ayrı bir belgede, Gizlilik ve Aydınlatma Metni'nde anlatılır.",
    ],
    sections: [
      {
        id: "hizmet",
        title: "Hizmet",
        body: [
          `${site.name}, linklerini, sosyal hesaplarını ve içeriklerini tek bir sayfada toplamana, sayfanın görünümünü değiştirmene ve istatistiklerini görmene yarayan ücretsiz bir hizmettir.`,
          `${site.name} ödemeye aracılık etmez. Destek bloğundaki IBAN'a yapılan ödemeler ya da ürün kartlarından yapılan alışverişler doğrudan sen ve ziyaretçin (ya da mağaza) arasında gerçekleşir; ${site.name} bu işlemlerin tarafı değildir.`,
          "Hizmeti geliştirmek için özellik ekleyebilir, değiştirebilir ya da kaldırabiliriz; hizmeti sonlandırabiliriz.",
          "Hizmet olduğu gibi sunulur. Kesintisiz ya da hatasız çalışacağını garanti etmeyiz.",
        ],
      },
      {
        id: "hesap",
        title: "Hesabın",
        body: [
          {
            list: [
              "Hesap açmak için en az 13 yaşında olmalısın. 18 yaşından küçüksen velinin ya da vasinin iznini almış olmalısın.",
              "Kayıt olurken doğru ve sana ait bir e-posta adresi vermelisin.",
              "Hesabının güvenliğinden sen sorumlusun. Şifreni kimseyle paylaşma; iki adımlı doğrulamayı açmanı öneririz.",
              "Hesabın yalnızca sana aittir; başkasına devredemezsin.",
            ],
          },
        ],
      },
      {
        id: "kullanici-adi",
        title: "Kullanıcı adı ve adresin",
        body: [
          "Kullanıcı adları ilk alan kişiye verilir. Bazı adlar sistem ve güvenlik için ayrılmıştır.",
          "Kullanıcı adını değiştirdiğinde eski adresin 30 gün boyunca yeni adresine yönlenir, sonra başkası alabilir.",
          "Başka bir kişiyi, markayı ya da kurumu taklit eden, marka hakkını ihlal eden ya da ziyaretçiyi yanıltan bir kullanıcı adını geri alabiliriz.",
          "Özel alan adı bağlıyorsan o alan adını kullanma hakkına sahip olmalısın.",
        ],
      },
      {
        id: "icerik",
        title: "İçeriğin",
        body: [
          "Sayfana koyduğun her şeyin (metin, görsel, link, IBAN, telefon numarası…) sahibi ve sorumlusu sensin. Bunları yayınlama hakkına sahip olmalısın.",
          "Sayfanı gösterebilmemiz için bize içeriğini saklama, önbelleğe alma, teknik olarak dönüştürme (örneğin görselleri küçültme) ve sayfanda, paylaşım görsellerinde, hikâye görselinde ve QR kodunda gösterme hakkını ücretsiz ve münhasır olmayan şekilde verirsin. Bu hak yalnızca hizmeti sunmak içindir; içeriği sildiğinde ya da hesabını kapattığında sona erer.",
          "E-posta toplama bloğuyla topladığın adreslerin veri sorumlusu sensin. Bu adresleri yalnızca abonelerin beklediği amaçla kullanmalı, onların izni olmadan ticari ileti göndermemeli ve 6563 sayılı Kanun dahil ilgili mevzuata uymalısın.",
          "Ücretli ya da karşılıklı bir işbirliğiyle tanıttığın ürünleri \"İşbirliği\" işaretiyle belirtmelisin.",
        ],
      },
      {
        id: "yasaklar",
        title: "Yasaklı içerik ve kullanım",
        body: [
          `${site.name}'da şunları yapamazsın:`,
          {
            list: [
              "Profil fotoğrafı, arka plan, görsel bloğu, ürün ya da proje görseli dahil hiçbir yere müstehcen, cinsel içerikli ya da çıplaklık içeren görsel yüklemek.",
              "Çocukların cinsel istismarına ilişkin herhangi bir içerik (görsel, metin ya da link) paylaşmak. Bu kesinlikle yasaktır; tespit edildiğinde hesap hemen kapatılır ve yetkili makamlara bildirilir.",
              "Yasa dışı bahis ve kumar, uyuşturucu, silah ya da fuhuş gibi hukuka aykırı faaliyetleri tanıtmak veya bunlara link vermek.",
              "Nefret söylemi, taciz, tehdit ya da şiddete teşvik içeren içerik paylaşmak; başkalarının kişisel verilerini izinsiz yayınlamak.",
              "Dolandırıcılık, oltalama (phishing), zararlı yazılım, sahte çekiliş ya da kampanya gibi ziyaretçiyi aldatan içerik ve linkler.",
              "Başka bir kişiyi, markayı ya da kurumu taklit etmek; başkalarının fikri mülkiyet haklarını ihlal etmek.",
              "Hizmeti zorlamak: hız sınırlarını aşmaya çalışmak, izinsiz güvenlik testi yapmak, başkalarının hesabına erişmeye çalışmak, otomatik yollarla toplu hesap açmak ya da sistemi aşırı yüklemek.",
            ],
          },
          "Yetişkinlere yönelik ama hukuka uygun bir siteye link veriyorsan o linke \"18+ uyarısı\" koymalısın. Uyarı bir yaş doğrulaması değildir ve hukuka aykırı içeriğe link vermeyi meşru kılmaz.",
          `Bir güvenlik açığı bulduysan lütfen kötüye kullanmadan ${site.email} adresine bildir.`,
        ],
      },
      {
        id: "bildirim",
        title: "Hukuka aykırı içerik bildirimi",
        body: [
          `${site.name}, 5651 sayılı Kanun kapsamında yer sağlayıcıdır. Kullanıcıların yüklediği içerikleri önceden denetlemekle yükümlü değiliz, ancak hukuka aykırı bir içerikten haberdar olduğumuzda o içeriği kaldırırız.`,
          `Bildirmek için ${site.email} adresine içeriğin adresini (örneğin linkiva.space/kullaniciadi), neden hukuka aykırı olduğunu ve hakkın ihlal edildiyse hak sahibi olduğunu gösteren bilgiyi yaz. Bildirimleri en kısa sürede inceleriz.`,
          "Yetkili mahkemelerin ve idari makamların kararlarını kanuni süreler içinde uygularız.",
          "İçeriği kaldırılan kullanıcıya, mümkün olduğunda sebebini e-postayla bildiririz. Bir hata olduğunu düşünüyorsan aynı adrese itiraz edebilirsin.",
        ],
      },
      {
        id: "kapanis",
        title: "Hesabın kapanması",
        body: [
          "Hesabını istediğin zaman Ayarlar'dan silebilirsin. Silmeden önce verilerini dışa aktarabilirsin. Sayfan hemen yayından kalkar; 15 gün içinde giriş yaparsan hesabını geri yükleyebilirsin, sonra kalıcı olarak silinir.",
          "Bu koşulları ihlal edersen içeriğini kaldırabilir, sayfanı yayından kaldırabilir ya da hesabını kapatabiliriz. Çocuk istismarı ya da dolandırıcılık gibi ağır ihlallerde önceden haber vermeden işlem yapabiliriz.",
        ],
      },
      {
        id: "sorumluluk",
        title: "Sorumluluk",
        body: [
          "Sayfalardaki içerikten ve linklerin gittiği sitelerden, o içeriği yayınlayan kullanıcı sorumludur.",
          "Kanunun izin verdiği ölçüde, hizmetteki kesintilerden, veri kaybından ya da dolaylı zararlardan sorumlu değiliz. Kast ve ağır ihmalden doğan sorumluluğumuz ile tüketici olarak kanundan doğan hakların saklıdır.",
          "Senin için önemli olan verileri (örneğin abone listeni) düzenli olarak dışa aktarmanı öneririz.",
        ],
      },
      {
        id: "degisiklikler",
        title: "Değişiklikler",
        body: [
          "Bu koşulları güncelleyebiliriz; güncel tarih en üstte yazar. Değişiklikten sonra kullanmaya devam etmen yeni koşulları kabul ettiğin anlamına gelir; kabul etmiyorsan hesabını silebilirsin.",
        ],
      },
      {
        id: "hukuk",
        title: "Uygulanacak hukuk ve iletişim",
        body: [
          "Bu koşullara Türkiye Cumhuriyeti hukuku uygulanır. Tüketici olarak kanundan doğan hakların saklıdır.",
          `Sorular için: ${site.email}.`,
          "Bu koşulların Türkçe ve İngilizce sürümleri arasında bir fark olursa Türkçe sürüm esas alınır.",
        ],
      },
    ],
  },
  en: {
    title: "Terms of Use",
    updated: "Last updated: 29 September 2026",
    intro: [
      `These terms apply to your use of ${site.name} (linkiva.space and the domains users connect to it). ${site.name} is an individual project run by ${OWNER}. By opening an account or publishing your page you accept these terms.`,
      "How your personal data is handled is described in a separate document, the Privacy Notice.",
    ],
    sections: [
      {
        id: "service",
        title: "The service",
        body: [
          `${site.name} is a free service for gathering your links, social accounts and content on one page, changing how that page looks and seeing its statistics.`,
          `${site.name} does not handle payments. Payments to an IBAN in a Support block, or purchases made through product cards, happen directly between you and your visitor (or the shop); ${site.name} is not a party to them.`,
          "We may add, change or remove features to improve the service, or discontinue it.",
          "The service is provided as is. We don't guarantee that it will run without interruptions or errors.",
        ],
      },
      {
        id: "account",
        title: "Your account",
        body: [
          {
            list: [
              "You must be at least 13 to open an account. If you are under 18 you need your parent's or guardian's permission.",
              "You must sign up with an accurate email address that belongs to you.",
              "You are responsible for your account's security. Don't share your password; we recommend turning on two-step verification.",
              "Your account is yours alone; you can't transfer it to someone else.",
            ],
          },
        ],
      },
      {
        id: "username",
        title: "Your username and address",
        body: [
          "Usernames go to whoever claims them first. Some names are reserved for the system and for security.",
          "When you change your username, your old address redirects to the new one for 30 days; after that someone else can claim it.",
          "We may take back a username that impersonates a person, brand or organisation, infringes a trademark or misleads visitors.",
          "If you connect a custom domain, you must have the right to use it.",
        ],
      },
      {
        id: "content",
        title: "Your content",
        body: [
          "You own, and are responsible for, everything you put on your page (text, images, links, IBAN, phone numbers…). You must have the right to publish it.",
          "So that we can show your page, you give us a free, non-exclusive right to store, cache and technically transform your content (for example, resize images) and to display it on your page, in share images, in your story image and in your QR code. This right exists only to provide the service and ends when you delete the content or close your account.",
          "You are the controller of the email addresses you collect with an email capture block. Use them only for the purpose your subscribers expect, don't send them commercial messages without their permission, and follow the applicable law, including Turkey's Law No. 6563 on electronic commerce.",
          "Mark products you promote through a paid or reciprocal partnership with the \"Sponsored\" label.",
        ],
      },
      {
        id: "prohibited",
        title: "Prohibited content and use",
        body: [
          `On ${site.name} you may not:`,
          {
            list: [
              "upload obscene or sexual images, or images containing nudity, anywhere, including your profile photo, background, image blocks and product or project images;",
              "share any content (image, text or link) related to the sexual abuse of children. This is strictly forbidden; when found, the account is closed at once and reported to the authorities;",
              "promote or link to unlawful activities such as illegal betting and gambling, drugs, weapons or prostitution;",
              "share hate speech, harassment, threats or incitement to violence, or publish other people's personal data without permission;",
              "use content or links that deceive visitors, such as fraud, phishing, malware or fake giveaways and campaigns;",
              "impersonate a person, brand or organisation, or infringe other people's intellectual property;",
              "strain the service: try to get around rate limits, run security tests without permission, try to access other people's accounts, open accounts in bulk by automated means or overload the system.",
            ],
          },
          "If you link to a site that is meant for adults but lawful, you must put an \"18+ warning\" on that link. The warning is not age verification and does not make linking to unlawful content acceptable.",
          `If you find a security vulnerability, please report it to ${site.email} without exploiting it.`,
        ],
      },
      {
        id: "reports",
        title: "Reporting unlawful content",
        body: [
          `Under Turkey's Law No. 5651, ${site.name} is a hosting provider. We are not required to review what users upload in advance, but once we learn about unlawful content we remove it.`,
          `To report content, write to ${site.email} with the content's address (for example linkiva.space/username), why it is unlawful and, if your rights were infringed, information showing that you hold them. We review reports as soon as we can.`,
          "We carry out the decisions of competent courts and administrative authorities within the legal time limits.",
          "Where possible, we tell the user whose content was removed why, by email. If you think we made a mistake, you can object at the same address.",
        ],
      },
      {
        id: "closing",
        title: "Closing your account",
        body: [
          "You can delete your account at any time under Settings, and export your data first. Your page goes offline at once; sign in within 15 days to restore your account, after that it is deleted permanently.",
          "If you break these terms we may remove your content, unpublish your page or close your account. For serious violations such as child abuse or fraud we may act without notice.",
        ],
      },
      {
        id: "liability",
        title: "Liability",
        body: [
          "The user who publishes content is responsible for it and for the sites their links lead to.",
          "To the extent the law allows, we are not liable for interruptions of the service, loss of data or indirect damages. Our liability for intent and gross negligence, and your statutory rights as a consumer, are not affected.",
          "We recommend exporting data that matters to you (such as your subscriber list) regularly.",
        ],
      },
      {
        id: "changes",
        title: "Changes",
        body: [
          "We may update these terms; the current date is at the top. Continuing to use the service afterwards means you accept the new terms; if you don't, you can delete your account.",
        ],
      },
      {
        id: "law",
        title: "Governing law and contact",
        body: [
          "These terms are governed by the laws of the Republic of Türkiye. Your statutory rights as a consumer are not affected.",
          `Questions: ${site.email}.`,
          "If the Turkish and English versions of these terms differ, the Turkish version prevails.",
        ],
      },
    ],
  },
};
