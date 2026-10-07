// services/smsService.js
// Sends an SMS via Twilio when credentials are configured, otherwise prints a
// clearly labelled simulation log so the feature is testable without a Twilio
// account.

export async function sendSms(to, message) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;

  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: TWILIO_FROM_NUMBER, Body: message }).toString(),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Twilio error (${resp.status}): ${text}`);
    }
    return await resp.json();
  }

  // No credentials — log a simulation so the developer can see what would be sent.
  console.log(`\n[SMS SIMULATION] ──────────────────────────────`);
  console.log(`  To:      ${to}`);
  console.log(`  Message: ${message}`);
  console.log(`────────────────────────────────────────────────\n`);
  return { simulated: true };
}
