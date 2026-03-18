import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const { error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'support@noctaras.com',
    reply_to: email,
    subject: `Support Request from ${name}`,
    html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p>${message.replace(/\n/g, '<br>')}</p>`
  });

  if (error) {
    return res.status(500).json({ error });
  }

  res.status(200).json({ success: true });
}
