import type { NextFunction, Request, Response } from 'express';

const SAFARICOM_IPS = new Set([
  '196.201.214.200',
  '196.201.214.206',
  '196.201.213.100',
  '196.201.214.207',
  '196.201.214.208',
  '196.201.213.109',
  '196.201.214.114',
  '196.201.214.115',
  '196.201.212.150',
  '196.201.214.180',
  '196.201.212.154',
  '196.201.212.152',
]);

function resolveClientIp(req: Request): string[] {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIps = forwarded
    ? (Array.isArray(forwarded) ? forwarded.join(',') : forwarded)
        .split(',')
        .map((ip) => ip.trim())
        .filter(Boolean)
    : [];
  const directIp = req.ip ?? '';
  return [...forwardedIps, ...(directIp ? [directIp] : [])];
}

export function requireMpesaIp(req: Request, res: Response, next: NextFunction) {
  if (process.env.MPESA_ENV !== 'production') {
    return next();
  }

  const candidateIps = resolveClientIp(req);
  const allowed = candidateIps.some((ip) => SAFARICOM_IPS.has(ip));

  if (!allowed) {
    const blocked = candidateIps.join(', ') || 'unknown';
    console.warn(`[mpesa-callback] blocked request from non-Safaricom IP: ${blocked}`);
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  next();
}
