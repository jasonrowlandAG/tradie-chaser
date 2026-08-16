import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

export async function sendSms(to: string, body: string) {
  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio not configured – SMS skipped');
    return { success: false, error: 'Twilio not configured' };
  }

  // Basic AU phone normalisation
  let normalised = to.replace(/\s+/g, '');
  if (normalised.startsWith('04')) {
    normalised = '+61' + normalised.slice(1);
  } else if (normalised.startsWith('4') && normalised.length === 9) {
    normalised = '+61' + normalised;
  } else if (!normalised.startsWith('+')) {
    normalised = '+' + normalised;
  }

  try {
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: normalised,
    });
    return { success: true, sid: message.sid };
  } catch (err: any) {
    console.error('SMS send error:', err.message);
    return { success: false, error: err.message };
  }
}
