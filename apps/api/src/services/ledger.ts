import { LedgerAccountType, LedgerSide, Prisma } from '@prisma/client';

type Transaction = Prisma.TransactionClient;

export const EVENT_ACCOUNT_DEFINITIONS = [
  { code: '1000', name: 'Provider cash', type: LedgerAccountType.ASSET },
  { code: '2000', name: 'Event funds liability', type: LedgerAccountType.LIABILITY },
  { code: '2100', name: 'Vendor payable', type: LedgerAccountType.LIABILITY },
  { code: '4900', name: 'Reconciliation suspense', type: LedgerAccountType.LIABILITY },
] as const;

export async function ensureEventAccounts(tx: Transaction, eventId: string, currency: string) {
  for (const definition of EVENT_ACCOUNT_DEFINITIONS) {
    await tx.financialAccount.upsert({
      where: { eventId_code_currency: { eventId, code: definition.code, currency } },
      update: {},
      create: { eventId, currency, ...definition },
    });
  }
}

type PostingInput = { accountId: string; side: LedgerSide; amount: Prisma.Decimal | string | number; currency: string };

export async function postBalancedJournal(tx: Transaction, input: {
  eventId: string;
  reference: string;
  description: string;
  sourceType: string;
  sourceId?: string;
  idempotencyKey: string;
  postings: PostingInput[];
}) {
  if (input.postings.length < 2) throw new Error('A journal requires at least two postings.');
  const currencies = new Map<string, { debit: Prisma.Decimal; credit: Prisma.Decimal }>();
  for (const posting of input.postings) {
    const amount = new Prisma.Decimal(posting.amount);
    if (amount.lte(0)) throw new Error('Ledger posting amounts must be positive.');
    const totals = currencies.get(posting.currency) ?? { debit: new Prisma.Decimal(0), credit: new Prisma.Decimal(0) };
    totals[posting.side === LedgerSide.DEBIT ? 'debit' : 'credit'] = totals[posting.side === LedgerSide.DEBIT ? 'debit' : 'credit'].plus(amount);
    currencies.set(posting.currency, totals);
  }
  for (const [currency, totals] of currencies) {
    if (!totals.debit.equals(totals.credit)) throw new Error(`Unbalanced ${currency} journal.`);
  }
  return tx.ledgerJournal.create({
    data: {
      eventId: input.eventId,
      reference: input.reference,
      description: input.description,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      idempotencyKey: input.idempotencyKey,
      postings: { create: input.postings },
    },
    include: { postings: true },
  });
}
