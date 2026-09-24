import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { Wordmark } from "@/components/ui/surface";
import { site } from "@/lib/site";

type Section = { title: string; body: string[] };
type Doc = { title: string; updated: string; intro: string; sections: Section[] };

// Factual description of what the code does (features/analytics/record.ts, lib/tracking.ts).
// Kept in the page rather than the message catalogue because it is long-form legal text.
const CONTENT: Record<"tr" | "en", Doc> = {
  tr: {
    title: "Gizlilik",
    updated: "Son güncelleme: 24 Eylül 2026",
    intro: `${site.name}, profil sayfalarını ziyaret edenleri izlemez. Profil sahiplerine gösterilen istatistikler çerezsiz ve kişiyi tanımlamayan bir yöntemle ölçülür.`,
    sections: [
      {
        title: "Profil ziyaretçileri hakkında ne kaydediyoruz?",
        body: [
          "Bir profil görüntülendiğinde ya da bir linke tıklandığında şunları kaydederiz: olay türü (görüntülenme/tıklama), zaman, ülke ve şehir (barındırma sağlayıcısının bağlantıdan tahmin ettiği), cihaz sınıfı, işletim sistemi ve tarayıcı ailesi, geldiğin sitenin yalnızca alan adı (örneğin instagram.com) ve varsa utm_source değeri.",
          "IP adresini saklamayız. Tekil ziyaretçileri saymak için IP adresi, tarayıcı bilgisi ve profil kimliği her gün değişen gizli bir anahtarla tek yönlü olarak özetlenir. Bu özet ertesi gün değişir; aynı kişiyi günler ya da profiller arasında eşleştirmek mümkün değildir.",
          "Çerez ya da benzeri bir tanımlayıcı kullanmayız. Botlar, bağlantı önizlemeleri (WhatsApp, Telegram, X vb.), tarayıcı ön yüklemeleri ve profil sahibinin kendi ziyaretleri sayılmaz.",
        ],
      },
      {
        title: "E-posta toplama",
        body: [
          "Bir profildeki abone formuna e-posta adresini yazarsan, adres yalnızca o profilin sahibinin abone listesine eklenir. Profil sahibi listeyi görebilir, dışa aktarabilir ve kayıtları silebilir.",
        ],
      },
      {
        title: "Hesap sahipleri",
        body: [
          "Hesabın için e-posta adresini, şifrenin güvenli özetini (şifrenin kendisini değil), oturum bilgilerini ve sayfana eklediğin içerikleri saklarız. Google ile giriş yaparsan Google'dan adını, e-posta adresini ve profil fotoğrafını alırız.",
          "E-postalar Resend, dosyalar Vercel Blob, veritabanı Supabase (PostgreSQL) üzerinde tutulur; uygulama Vercel üzerinde çalışır.",
        ],
      },
      {
        title: "Haklarını kullanmak",
        body: [
          "KVKK ve GDPR kapsamındaki bilgi alma, düzeltme ve silme haklarını kullanmak için hesap ayarlarını kullanabilir ya da hello@linkiva.space adresine yazabilirsin. Hesabını sildiğinde sayfan, blokların, istatistiklerin ve abone listen kalıcı olarak silinir.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy",
    updated: "Last updated: 24 September 2026",
    intro: `${site.name} does not track the people who visit profile pages. The statistics shown to profile owners are measured without cookies and without identifying anyone.`,
    sections: [
      {
        title: "What we record about profile visitors",
        body: [
          "When a profile is viewed or a link is clicked we record: the event type (view/click), the time, country and city (as estimated by our hosting provider from the connection), device class, operating system and browser family, only the domain of the site you came from (for example instagram.com), and a utm_source value if present.",
          "We do not store IP addresses. To count unique visitors, the IP address, browser details and profile id are hashed one-way with a secret key that changes every day. The hash changes the next day; the same person cannot be linked across days or across profiles.",
          "We use no cookies or similar identifiers. Bots, link previews (WhatsApp, Telegram, X…), browser prefetches and the profile owner's own visits are not counted.",
        ],
      },
      {
        title: "Email collection",
        body: [
          "If you enter your email in a profile's subscribe form, the address is added only to that profile owner's list. The owner can see, export and delete those entries.",
        ],
      },
      {
        title: "Account holders",
        body: [
          "For your account we store your email address, a secure hash of your password (never the password itself), session data and the content you add to your page. If you sign in with Google we receive your name, email address and profile photo from Google.",
          "Email is sent through Resend, files are stored on Vercel Blob, the database runs on Supabase (PostgreSQL) and the app runs on Vercel.",
        ],
      },
      {
        title: "Your rights",
        body: [
          "To exercise your rights to access, correct or delete your data under GDPR/KVKK, use your account settings or write to hello@linkiva.space. Deleting your account permanently deletes your page, blocks, statistics and subscriber list.",
        ],
      },
    ],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) === "en" ? "en" : "tr";
  return { title: CONTENT[locale].title };
}

export default async function PrivacyPage() {
  const doc = CONTENT[(await getLocale()) === "en" ? "en" : "tr"];
  return (
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-16 sm:px-8">
      <header className="mx-auto max-w-2xl py-2">
        <Link href="/" className="inline-block">
          <Wordmark />
        </Link>
      </header>
      <main className="glass mx-auto mt-8 flex max-w-2xl flex-col gap-8 rounded-[28px] p-6 sm:p-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-[2.25rem] leading-tight font-semibold tracking-[-0.03em]">{doc.title}</h1>
          <p className="text-sm text-ink-3">{doc.updated}</p>
        </div>
        <p className="text-lg text-ink-2">{doc.intro}</p>
        {doc.sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">{section.title}</h2>
            {section.body.map((p) => (
              <p key={p.slice(0, 40)} className="max-w-[68ch] leading-relaxed text-ink-2">
                {p}
              </p>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
