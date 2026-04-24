import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  return transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
}

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Recuperação de Senha</h2>
      <p>Você solicitou a recuperação de senha da sua conta.</p>
      <p>Clique no botão abaixo para criar uma nova senha:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Redefinir Senha
        </a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">
        Este link expires em 30 minutos.<br>
        Se você não solicitou esta recuperação, ignore este email.
      </p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
        ou copie e cole este link no seu navegador:<br>
        ${resetUrl}
      </p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Recuperação de Senha - Contatos App',
    html,
  });
}