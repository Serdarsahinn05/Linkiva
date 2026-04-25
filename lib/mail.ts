import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// 1. Profil Onay Maili
export const sendVerificationEmail = async (email: string, token: string) => {
    const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/verify?token=${token}`;

    await resend.emails.send({
        from: 'Linkiva <verify@linkiva.space>',
        to: email,
        subject: 'Profilini Onayla 🚀',
        // İpucu: Buradaki HTML yerine Resend'de taslak oluşturduysan 'templateId' de kullanabilirsin
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; background: #000; color: #fff; border-radius: 20px; text-align: center;">
        <h1 style="font-style: italic; letter-spacing: -1px;">Linkiva.</h1>
        <p style="color: #888;">Hesabını doğrulamak ve profilini aktif etmek için aşağıdaki butona tıkla:</p>
        <div style="margin: 30px 0;">
          <a href="${confirmLink}" style="background: #fff; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: 900; display: inline-block; font-size: 14px;">HESABIMI DOĞRULA</a>
        </div>
        <p style="color: #444; font-size: 11px;">Bu link 24 saat boyunca geçerlidir.</p>
      </div>
    `
    });
};

// 2. Şifre Sıfırlama Maili (YENİ)
export const sendPasswordResetEmail = async (email: string, token: string) => {
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/new-password?token=${token}&email=${email}`;

    await resend.emails.send({
        from: 'Linkiva <hello@linkiva.space>',
        to: email,
        subject: 'Şifreni Sıfırla 🔑',
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; background: #000; color: #fff; border-radius: 20px; text-align: center;">
        <h1 style="font-style: italic; letter-spacing: -1px;">Linkiva.</h1>
        <p style="color: #888;">Şifreni sıfırlamak için bir talep aldık. Eğer bunu sen yaptıysan butona tıkla:</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" style="background: #fff; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: 900; display: inline-block; font-size: 14px;">ŞİFREMİ SIFIRLA</a>
        </div>
        <p style="color: #444; font-size: 11px;">Bu link 1 saat boyunca geçerlidir. Eğer sen talep etmediysen bu maili silebilirsin.</p>
      </div>
    `
    });
};