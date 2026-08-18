import { Router } from 'express';
import { db } from '../db';

const router = Router();

export interface Story {
  id: string;
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  image: string;
  date: string;
}

router.get('/', async (_req, res, next) => {
  try {
    const setting = await db.systemSetting.findUnique({ where: { key: 'stories' } });
    const stories = Array.isArray(setting?.value) ? (setting!.value as Story[]) : [];
    return res.json({ data: stories });
  } catch (error) { next(error); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const setting = await db.systemSetting.findUnique({ where: { key: 'stories' } });
    const stories = Array.isArray(setting?.value) ? (setting!.value as Story[]) : [];
    const story = stories.find((s) => s.slug === req.params.slug);
    if (!story) return res.status(404).json({ error: { code: 'STORY_NOT_FOUND', message: 'Story not found.' } });
    return res.json({ data: story });
  } catch (error) { next(error); }
});

export { router as storiesRouter };
