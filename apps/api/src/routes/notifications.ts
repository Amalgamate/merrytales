import { Router } from 'express';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';
const router = Router(); router.use(requireAuth);
router.get('/', async (req, res, next) => { try { const [items, unread] = await Promise.all([db.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 100 }), db.notification.count({ where: { userId: req.user!.id, readAt: null } })]); res.json({ data: { items, unread } }); } catch (error) { next(error); } });
router.patch('/read-all', async (req, res, next) => { try { res.json({ data: await db.notification.updateMany({ where: { userId: req.user!.id, readAt: null }, data: { readAt: new Date() } }) }); } catch (error) { next(error); } });
router.patch('/:id/read', async (req, res, next) => { try { const item = await db.notification.updateMany({ where: { id: req.params.id, userId: req.user!.id }, data: { readAt: new Date() } }); res.json({ data: item }); } catch (error) { next(error); } });
export { router as notificationsRouter };
