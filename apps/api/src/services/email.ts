const from = process.env.RESEND_FROM || 'Merry Tales <hello@merrytales.co.ke>';

export async function sendEmail(input: { to: string; subject: string; html: string; idempotencyKey: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false as const, reason: 'RESEND_NOT_CONFIGURED' as const };
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': input.idempotencyKey.slice(0, 256) },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html, reply_to: process.env.RESEND_REPLY_TO || undefined }),
  });
  const body = await response.json().catch(() => ({})) as { id?: string; message?: string };
  if (!response.ok) throw new Error(`Resend email failed (${response.status}): ${body.message || 'Unknown error'}`);
  return { sent: true as const, id: body.id };
}

export const emailFrame = (content: string) => `<!doctype html><html><body style="margin:0;background:#f7f6fa;font-family:Arial,sans-serif;color:#171735"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table width="100%" style="max-width:600px;background:#fff;border-radius:24px;overflow:hidden"><tr><td style="background:#171735;padding:24px 32px;color:#fff;font-size:22px;font-weight:800">Merry Tales</td></tr><tr><td style="padding:36px 32px">${content}</td></tr><tr><td style="padding:20px 32px;background:#faf9fc;color:#777;font-size:11px">Merry Tales · Kenya’s marketplace for every event.</td></tr></table></td></tr></table></body></html>`;
