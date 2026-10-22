interface MessageResult {
  delivered: boolean;
  provider: 'WHATSAPP' | 'SMS';
  messageId: string | null;
}

export async function sendGuardianMessage(
  phone: string,
  message: string
): Promise<MessageResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (accessToken && phoneNumberId) {
    try {
      const version = process.env.WHATSAPP_API_VERSION?.trim() || 'v21.0';
      const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
          type: 'text',
          text: { preview_url: false, body: message },
        }),
        cache: 'no-store',
      });
      if (response.ok) {
        const result = await response.json().catch(() => null);
        return { delivered: true, provider: 'WHATSAPP', messageId: result?.messages?.[0]?.id ?? null };
      }
      const providerError = await response.json().catch(() => null);
      console.error('WhatsApp message submission failed:', providerError?.error?.message ?? response.status);
    } catch (error) {
      console.error('WhatsApp provider request failed:', error);
    }
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim();
  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('No WhatsApp or SMS messaging provider is configured.');
  }

  const form = new URLSearchParams({ To: phone, From: fromNumber, Body: message });
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
      cache: 'no-store',
    }
  );
  if (!response.ok) {
    const providerError = await response.json().catch(() => null);
    console.error('Guardian message delivery failed:', providerError?.message ?? response.status);
    return { delivered: false, provider: 'SMS', messageId: null };
  }
  const result = await response.json().catch(() => null);
  return { delivered: true, provider: 'SMS', messageId: result?.sid ?? null };
}
