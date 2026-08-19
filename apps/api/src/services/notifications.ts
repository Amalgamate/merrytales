import { NotificationSeverity, PrismaClient } from '@prisma/client';

type Db = Pick<PrismaClient, 'notification'>;

export async function notifyUser(db: Db, input: {
  userId: string;
  title: string;
  body: string;
  category?: string;
  severity?: NotificationSeverity;
  actionUrl?: string;
}) {
  return db.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      category: input.category ?? 'GENERAL',
      severity: input.severity ?? NotificationSeverity.INFO,
      actionUrl: input.actionUrl,
    },
  });
}
