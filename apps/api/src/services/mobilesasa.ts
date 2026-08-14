import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { config } from '../config';

const API_URL = 'https://api.mobilesasa.com';
const encryptionKey = createHash('sha256').update(config.MOBILESASA_ENCRYPTION_KEY ?? config.JWT_SECRET).digest();

export interface MobileSasaBalances {
  smsBalance: number;
  walletBalance: number;
  emailBalance: number;
  internationalBalance: number;
  accountNumber: string | null;
}

export function encryptMobileSasaToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return `${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${encrypted.toString('base64')}`;
}

export function decryptMobileSasaToken(value: string): string {
  const [iv, tag, encrypted] = value.split('.');
  if (!iv || !tag || !encrypted) throw new Error('Invalid encrypted MobileSasa credential.');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64')), decipher.final()]).toString('utf8');
}

async function mobileSasaRequest<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
  });
  const body = await response.json().catch(() => ({})) as T & { message?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message ?? body.message ?? `MobileSasa request failed (${response.status}).`);
  return body;
}

export async function getMobileSasaBalances(token: string): Promise<MobileSasaBalances> {
  const result = await mobileSasaRequest<{ success: boolean; data: { sms_balance: number; wallet_balance: number; email_balance: number; intl_balance: number; local_account_no?: string } }>(token, '/api/v1/units/balance');
  return { smsBalance: Number(result.data.sms_balance), walletBalance: Number(result.data.wallet_balance), emailBalance: Number(result.data.email_balance), internationalBalance: Number(result.data.intl_balance), accountNumber: result.data.local_account_no ?? null };
}

export async function sendMobileSasaMessage(token: string, senderId: string, phone: string, message: string) {
  return mobileSasaRequest<{ status: boolean; responseCode: string; message: string; messageId?: string }>(token, '/v1/send/message', { method: 'POST', body: JSON.stringify({ senderID: senderId, phone, message }) });
}

export async function topUpMobileSasaWallet(token: string, phone: string, amount: number) {
  return mobileSasaRequest<{ success: boolean; data: { message: string } }>(token, '/api/v1/wallet/stk-push', { method: 'POST', body: JSON.stringify({ phone, amount }) });
}
