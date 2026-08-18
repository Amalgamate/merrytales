import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

const router = Router();

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(2000),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(12),
});

const fallbackReply = (message: string) => {
  const text = message.toLowerCase();
  if (text.includes('budget')) return 'Start with your total budget, guest count and three non-negotiables. A practical first split is 35% venue and catering, 15% production and décor, 10% photography, then reserve 10% for changes. Tell me your budget and guest count for a clearer estimate.';
  if (text.includes('vendor') || text.includes('photograph') || text.includes('cater')) return 'Compare vendors by verified work, availability, inclusions and the full delivered price—not the headline rate alone. Search the marketplace by service and location, shortlist three options, then request comparable quotes.';
  if (text.includes('gift')) return 'Choose the recipient, occasion and preferred delivery date first. You can then explore individual gifts, group contributions or experience-based options without collecting money manually.';
  return 'I can help you plan an event, shape a budget, find vendors or explore gifts. Tell me the occasion, location, date and approximate guest count, and I’ll suggest a practical next step.';
};

router.post('/chat', rateLimit({ windowMs: 60_000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false }), async (req, res, next) => {
  try {
    const { messages } = requestSchema.parse(req.body);
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.json({ data: { reply: fallbackReply(messages.at(-1)!.content), mode: 'guided' } });

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o',
        instructions: 'You are Merry, the concise event-planning assistant for Merry Tales, a Kenyan marketplace for all events. Help users clarify needs, budgets, vendors, gifts and next actions. Be warm, practical and corporate-natural. Prefer Kenya-relevant language and KSh when money is discussed. Never claim a booking, price, vendor availability or payment is confirmed. Ask at most one useful follow-up question. Keep answers under 120 words.',
        input: messages.map((message) => ({ role: message.role, content: message.content })),
        max_output_tokens: 350,
        text: { verbosity: 'low' },
      }),
    });
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    const body = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
    const reply = body.output_text || body.output?.flatMap((item) => item.content || []).map((item) => item.text || '').join('').trim();
    if (!reply) throw new Error('AI provider returned an empty response');
    res.json({ data: { reply, mode: 'ai' } });
  } catch (error) { next(error); }
});

export { router as assistantRouter };
