import { db } from '../db';
import { sendEmail, emailFrame } from './email';
import { sendMobileSasaMessage } from './mobilesasa';

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [2 * 60_000, 10 * 60_000, 60 * 60_000]; // 2min, 10min, 1hr

async function processDelivery(id: string): Promise<void> {
  // 1. Mark as SENDING (atomic check to avoid double-processing)
  const updated = await db.communicationDelivery.updateMany({
    where: { id, status: 'QUEUED' },
    data: { status: 'SENDING' },
  });
  if (updated.count === 0) return; // already picked up by another process

  const delivery = await db.communicationDelivery.findUnique({ where: { id } });
  if (!delivery) return;

  try {
    let providerMessageId: string | undefined;

    if (delivery.channel === 'EMAIL') {
      const html =
        delivery.body.startsWith('<!doctype') || delivery.body.startsWith('<html')
          ? delivery.body
          : emailFrame(delivery.body);
      const result = await sendEmail({
        to: delivery.recipient,
        subject: delivery.subject ?? 'Merry Tales notification',
        html,
        idempotencyKey: `comm-delivery-${delivery.id}`,
      });
      if (result.sent) providerMessageId = result.id;
      else throw new Error(`Email not configured: ${result.reason}`);
    } else if (delivery.channel === 'SMS') {
      const platformToken = process.env.PLATFORM_MOBILESASA_TOKEN;
      const platformSenderId = process.env.PLATFORM_MOBILESASA_SENDER_ID;
      if (!platformToken || !platformSenderId) {
        throw new Error(
          'Platform SMS not configured (PLATFORM_MOBILESASA_TOKEN / PLATFORM_MOBILESASA_SENDER_ID missing).',
        );
      }
      const result = await sendMobileSasaMessage(
        platformToken,
        platformSenderId,
        delivery.recipient,
        delivery.body,
      );
      providerMessageId = result.messageId;
    } else {
      // WHATSAPP — not yet implemented at platform level
      throw new Error(`Channel ${delivery.channel} is not yet supported by the platform worker.`);
    }

    await db.communicationDelivery.update({
      where: { id: delivery.id },
      data: { status: 'SENT', providerMessageId, deliveredAt: new Date(), lastError: null },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown delivery error';
    const nextAttempt = delivery.attempts + 1;
    const retryAfterMs =
      RETRY_DELAYS_MS[nextAttempt - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
    const nextRetryAt = new Date(Date.now() + retryAfterMs);
    const status = nextAttempt >= MAX_ATTEMPTS ? 'FAILED' : 'QUEUED';
    await db.communicationDelivery.update({
      where: { id: delivery.id },
      data: {
        status,
        attempts: nextAttempt,
        lastError: message,
        nextRetryAt: status === 'QUEUED' ? nextRetryAt : null,
      },
    });
    if (status === 'FAILED') {
      console.error(
        `[comm-worker] delivery ${delivery.id} permanently failed after ${nextAttempt} attempts: ${message}`,
      );
    }
  }
}

async function runWorkerTick(): Promise<void> {
  try {
    const due = await db.communicationDelivery.findMany({
      where: {
        status: 'QUEUED',
        nextRetryAt: { lte: new Date() },
      },
      orderBy: { nextRetryAt: 'asc' },
      take: 10,
      select: { id: true },
    });
    await Promise.allSettled(due.map((item) => processDelivery(item.id)));
  } catch (err) {
    console.error('[comm-worker] tick error:', err);
  }
}

let workerTimer: ReturnType<typeof setInterval> | null = null;

export function startCommunicationWorker(intervalMs = 30_000): void {
  if (workerTimer) return;
  console.log('[comm-worker] starting — polling every', intervalMs / 1000, 's');
  workerTimer = setInterval(() => {
    void runWorkerTick();
  }, intervalMs);
  // Run immediately on start
  void runWorkerTick();
}

export function stopCommunicationWorker(): void {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
    console.log('[comm-worker] stopped');
  }
}
