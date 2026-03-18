export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Noctaras Contact <onboarding@resend.dev>',
      to: 'support@noctaras.com',
      reply_to: email,
      subject: `Support Request from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`
    })
  });

  if (response.ok) {
    res.status(200).json({ success: true });
  } else {
    const err = await response.text();
    res.status(500).json({ error: err });
  }
}
