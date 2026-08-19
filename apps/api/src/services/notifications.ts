import { NotificationSeverity, PrismaClient, CommunicationChannel, CommunicationStatus } from '@prisma/client';

// require a slightly larger subset of the client so we can enqueue external deliveries
type Db = Pick<PrismaClient, 'notification' | 'user' | 'communicationDelivery' | 'communicationConsent' | 'systemSetting'>;

export async function notifyUser(db: Db, input: {
  userId: string;
  title: string;
  body: string;
  category?: string;
  severity?: NotificationSeverity;
  actionUrl?: string;
}) {
  // create the in-app notification (primary, non-blocking for external delivery)
  const notif = await db.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      category: input.category ?? 'GENERAL',
      severity: input.severity ?? NotificationSeverity.INFO,
      actionUrl: input.actionUrl,
    },
  });

  // Attempt to enqueue external deliveries (email / sms) if user allows and system settings exist.
  // This is best-effort and must not fail the calling flow.
  (async () => {
    try {
      const user = await db.user.findUnique({ where: { id: input.userId }, select: { email: true, phone: true } });
      if (!user) return;

      // load communication consent (transactional) for email and sms
      const [emailConsent, smsConsent] = await Promise.all([
        db.communicationConsent.findUnique({ where: { userId_channel: { userId: input.userId, channel: 'EMAIL' } } }).catch(() => null),
        db.communicationConsent.findUnique({ where: { userId_channel: { userId: input.userId, channel: 'SMS' } } }).catch(() => null),
      ]);

      // system-level provider presence — stored in SystemSetting with key 'notifications' optionally
      const systemSetting = await db.systemSetting.findUnique({ where: { key: 'notifications' } }).catch(() => null);
      const settings = systemSetting?.value && typeof systemSetting.value === 'object' && !Array.isArray(systemSetting.value) ? systemSetting.value as Record<string, any> : {};

      // enqueue email if available
      if (user.email && (emailConsent?.transactionalAllowed ?? true) && settings.emailProvider?.enabled) {
        await db.communicationDelivery.create({
          data: {
            userId: input.userId,
            channel: CommunicationChannel.EMAIL,
            recipient: user.email,
            subject: input.title,
            body: input.body,
            status: CommunicationStatus.QUEUED,
            templateId: undefined,
          },
        });
      }

      // enqueue sms if available
      if (user.phone && (smsConsent?.transactionalAllowed ?? true) && settings.smsProvider?.enabled) {
        await db.communicationDelivery.create({
          data: {
            userId: input.userId,
            channel: CommunicationChannel.SMS,
            recipient: user.phone,
            body: input.body,
            status: CommunicationStatus.QUEUED,
            templateId: undefined,
          },
        });
      }
    } catch (err) {
      // swallow errors — external delivery should not affect main flow
      console.error('notifyUser: failed to enqueue external delivery', err);
    }
  })();

  return notif;
}
