type ResendEmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export async function sendResendEmail(payload: ResendEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const replyTo = process.env.RESEND_REPLY_TO_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Resend ni nastavljen.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      ...(replyTo ? { reply_to: replyTo } : {})
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Pošiljanje emaila ni uspelo.");
  }

  return response.json();
}
