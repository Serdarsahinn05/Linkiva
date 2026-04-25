import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, token: string) => {
    // Canlıya çıkınca burası https://linkiva.vercel.app olacak
    const confirmLink = `${process.env.NEXTAUTH_URL}/api/verify?token=${token}`;

    await resend.emails.send({
        from: 'Linkiva <verify@linkiva.space>',
        to: email,
        subject: 'Profilini Onayla 🚀',
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Linkiva'ya Hoş Geldin!</h2>
        <p>Hesabını doğrulamak ve profilini aktif etmek için aşağıdaki butona tıkla:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmLink}" style="background: #000; color: #fff; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">HESABIMI DOĞRULA</a>
        </div>
        <p style="color: #666; font-size: 12px;">Bu link 24 saat boyunca geçerlidir. Eğer bu hesabı sen oluşturmadıysan bu maili görmezden gelebilirsin.</p>
      </div>
    `
    });
};