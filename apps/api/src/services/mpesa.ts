import { config } from '../config';

export interface MpesaRequest { amount: number; phone: string; reference: string; description: string; }
export interface MpesaResult { checkoutRequestId: string; merchantRequestId: string; responseDescription: string; }

export async function initiateStkPush(input: MpesaRequest): Promise<MpesaResult> {
  if (!config.MPESA_CONSUMER_KEY || !config.MPESA_CONSUMER_SECRET || !config.MPESA_SHORTCODE || !config.MPESA_PASSKEY || !config.MPESA_CALLBACK_URL) throw new Error('M-Pesa credentials are not configured.');
  const host = config.MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
  const basic = Buffer.from(`${config.MPESA_CONSUMER_KEY}:${config.MPESA_CONSUMER_SECRET}`).toString('base64');
  const authResponse = await fetch(`${host}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${basic}` } });
  if (!authResponse.ok) throw new Error('M-Pesa authentication failed.');
  const { access_token: token } = await authResponse.json() as { access_token: string };
  const now = new Date(); const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const password = Buffer.from(`${config.MPESA_SHORTCODE}${config.MPESA_PASSKEY}${timestamp}`).toString('base64');
  const response = await fetch(`${host}/mpesa/stkpush/v1/processrequest`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ BusinessShortCode: config.MPESA_SHORTCODE, Password: password, Timestamp: timestamp, TransactionType: 'CustomerPayBillOnline', Amount: Math.ceil(input.amount), PartyA: input.phone.replace(/^0/, '254'), PartyB: config.MPESA_SHORTCODE, PhoneNumber: input.phone.replace(/^0/, '254'), CallBackURL: config.MPESA_CALLBACK_URL, AccountReference: input.reference, TransactionDesc: input.description }) });
  if (!response.ok) throw new Error('M-Pesa payment request failed.');
  const data = await response.json() as { CheckoutRequestID: string; MerchantRequestID: string; ResponseDescription: string };
  return { checkoutRequestId: data.CheckoutRequestID, merchantRequestId: data.MerchantRequestID, responseDescription: data.ResponseDescription };
}
