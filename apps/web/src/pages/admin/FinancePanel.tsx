import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

type MoneyTotal = { count: number; amount: number };
type Payment = {
  id: string;
  provider: string;
  providerReference?: string;
  phone?: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  order: {
    orderNumber: string;
    customer: { firstName: string; lastName: string; email: string };
  };
};
type Settlement = {
  id: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  currency: string;
  status: string;
  paidAt?: string;
  createdAt: string;
  vendor: { businessName: string; slug: string };
  order: { orderNumber: string };
  orderItem: { name: string };
};
type Subscription = {
  id: string;
  tier: string;
  status: string;
  priceKes: number;
  paymentReference?: string;
  endsAt?: string;
  vendor: { businessName: string; slug: string };
};
type RefundCase = {
  id: string;
  paymentId: string;
  requestedAmount: number;
  reason: string;
  status:
    | "REQUESTED"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED";
  providerReference?: string;
  reviewerId?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
};
type FinanceData = {
  payments: Payment[];
  settlements: Settlement[];
  subscriptions: Subscription[];
  paymentTotals: Partial<Record<string, MoneyTotal>>;
  settlementTotals: Partial<Record<string, MoneyTotal>>;
  pendingSubscriptions: number;
};

const money = (amount: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(amount));
const paymentTone: Record<string, string> = {
  PAID: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-700",
  PROCESSING: "bg-blue-50 text-blue-700",
  PENDING: "bg-amber-50 text-amber-700",
  REFUNDED: "bg-purple-50 text-purple-700",
};
const refundTone: Record<RefundCase["status"], string> = {
  REQUESTED: "bg-amber-50 text-amber-700",
  UNDER_REVIEW: "bg-blue-50 text-blue-700",
  APPROVED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  PROCESSING: "bg-indigo-50 text-indigo-700",
  COMPLETED: "bg-purple-50 text-purple-700",
  FAILED: "bg-red-50 text-red-700",
};
const refundStatuses: RefundCase["status"][] = [
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
];

export function FinancePanel() {
  const { user } = useAuth();
  const isSuper = user?.role === "SUPERADMIN";
  const [data, setData] = useState<FinanceData | null>(null);
  const [refunds, setRefunds] = useState<RefundCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [finance, refundData] = await Promise.all([
        apiRequest<FinanceData>("/settlements/admin/finance"),
        apiRequest<RefundCase[]>("/operations/admin/refunds"),
      ]);
      setData(finance);
      setRefunds(refundData);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load finance controls.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const recordPayout = async (settlement: Settlement) => {
    if (
      !window.confirm(
        `Record ${money(settlement.netAmount)} as paid to ${settlement.vendor.businessName}? Only do this after confirming the actual transfer.`,
      )
    )
      return;
    setBusy(settlement.id);
    setError("");
    try {
      const updated = await apiRequest<Settlement>(
        `/settlements/${settlement.id}/paid`,
        { method: "PATCH" },
      );
      setData((current) =>
        current
          ? {
              ...current,
              settlements: current.settlements.map((item) =>
                item.id === updated.id
                  ? { ...item, status: updated.status, paidAt: updated.paidAt }
                  : item,
              ),
              settlementTotals: {
                ...current.settlementTotals,
                READY: {
                  count: Math.max(
                    0,
                    (current.settlementTotals.READY?.count ?? 1) - 1,
                  ),
                  amount: Math.max(
                    0,
                    (current.settlementTotals.READY?.amount ?? 0) -
                      Number(settlement.netAmount),
                  ),
                },
                PAID: {
                  count: (current.settlementTotals.PAID?.count ?? 0) + 1,
                  amount:
                    (current.settlementTotals.PAID?.amount ?? 0) +
                    Number(settlement.netAmount),
                },
              },
            }
          : current,
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to record payout.",
      );
    } finally {
      setBusy("");
    }
  };

  const openRefundCase = async (payment: Payment) => {
    const amount = Number(
      window.prompt(
        `Refund amount for ${payment.order.orderNumber}:`,
        String(Number(payment.amount)),
      ),
    );
    if (!Number.isFinite(amount) || amount <= 0 || amount > Number(payment.amount))
      return;
    const reason = window.prompt(
      "Why should this payment enter refund review?",
      "Customer support refund request",
    );
    if (!reason?.trim()) return;
    setBusy(payment.id);
    setError("");
    try {
      const created = await apiRequest<RefundCase>("/operations/admin/refunds", {
        method: "POST",
        body: JSON.stringify({
          paymentId: payment.id,
          requestedAmount: amount,
          reason,
        }),
      });
      setRefunds((current) => [created, ...current]);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to open refund case.",
      );
    } finally {
      setBusy("");
    }
  };

  const updateRefundCase = async (item: RefundCase, status: RefundCase["status"]) => {
    const providerReference =
      ["PROCESSING", "COMPLETED"].includes(status)
        ? window.prompt(
            "Provider refund/reversal reference from the payment gateway:",
            item.providerReference ?? "",
          )
        : item.providerReference;
    if (["PROCESSING", "COMPLETED"].includes(status) && !providerReference?.trim())
      return;
    const reviewNotes =
      window.prompt("Review note, optional:", item.reviewNotes ?? "") ?? "";
    setBusy(item.id);
    setError("");
    try {
      const updated = await apiRequest<RefundCase>(
        `/operations/admin/refunds/${item.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
            providerReference: providerReference?.trim() || undefined,
            reviewNotes: reviewNotes.trim() || undefined,
          }),
        },
      );
      setRefunds((current) =>
        current.map((refund) => (refund.id === updated.id ? updated : refund)),
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to update refund case.",
      );
    } finally {
      setBusy("");
    }
  };

  const activateSubscription = async (subscription: Subscription) => {
    const paymentReference = window.prompt(
      `Payment reference for ${subscription.vendor.businessName}:`,
    );
    if (!paymentReference?.trim()) return;
    const months = Number(
      window.prompt("How many months should this plan be active?", "1"),
    );
    if (!Number.isInteger(months) || months < 1 || months > 12) return;
    setBusy(subscription.id);
    setError("");
    try {
      const updated = await apiRequest<Subscription>(
        `/operations/admin/subscriptions/${subscription.id}/activate`,
        { method: "POST", body: JSON.stringify({ paymentReference, months }) },
      );
      setData((current) =>
        current
          ? {
              ...current,
              pendingSubscriptions: Math.max(
                0,
                current.pendingSubscriptions - 1,
              ),
              subscriptions: current.subscriptions.map((item) =>
                item.id === updated.id
                  ? {
                      ...item,
                      status: updated.status,
                      endsAt: updated.endsAt,
                      paymentReference: updated.paymentReference,
                    }
                  : item,
              ),
            }
          : current,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to activate subscription.",
      );
    } finally {
      setBusy("");
    }
  };

  if (loading)
    return (
      <div className="flex min-h-[45vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  const paid = data?.paymentTotals.PAID?.amount ?? 0;
  const failed = data?.paymentTotals.FAILED?.amount ?? 0;
  const ready = data?.settlementTotals.READY?.amount ?? 0;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">Finance control</h2>
          <p className="mt-1 text-sm text-gray-500">
            Reconcile marketplace payments, confirm vendor payouts and monitor
            subscriptions.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void load()}
          className="rounded-xl"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh finance
        </Button>
      </div>
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Paid through platform"
          value={money(paid)}
          icon={CircleDollarSign}
          tone="text-green-600"
        />
        <Metric
          label="Awaiting vendor payout"
          value={money(ready)}
          icon={WalletCards}
          tone="text-primary"
        />
        <Metric
          label="Failed payment value"
          value={money(failed)}
          icon={AlertTriangle}
          tone="text-red-600"
        />
        <Metric
          label="Open refund cases"
          value={String(
            refunds.filter((item) => !["COMPLETED", "REJECTED"].includes(item.status))
              .length,
          )}
          icon={RotateCcw}
          tone="text-amber-600"
        />
      </div>
      <section className="overflow-hidden rounded-2xl border bg-white">
        <div className="border-b p-5">
          <h3 className="font-extrabold">Vendor payout queue</h3>
          <p className="mt-1 text-xs text-gray-500">
            Record a payout only after it has been transferred through the
            approved finance channel. The vendor is notified automatically.
          </p>
        </div>
        <div className="divide-y">
          {data?.settlements
            .filter((item) => item.status !== "PAID")
            .map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{item.vendor.businessName}</p>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {item.order.orderNumber} · {item.orderItem.name} · Gross{" "}
                    {money(item.grossAmount)} · Commission{" "}
                    {money(item.commissionAmount)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-extrabold">{money(item.netAmount)}</p>
                  <Button
                    size="sm"
                    disabled={busy === item.id}
                    onClick={() => void recordPayout(item)}
                    className="rounded-lg"
                  >
                    {busy === item.id && (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    )}
                    Record paid
                  </Button>
                </div>
              </div>
            ))}
          {!data?.settlements.some((item) => item.status !== "PAID") && (
            <div className="p-14 text-center text-sm text-gray-400">
              No vendor payouts are awaiting action.
            </div>
          )}
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border bg-white">
          <div className="border-b p-5">
            <h3 className="font-extrabold">Recent payment activity</h3>
            <p className="mt-1 text-xs text-gray-500">
              Open refund review from a paid transaction, then record the
              gateway reference when the provider reversal is processed.
            </p>
          </div>
          <div className="max-h-[520px] divide-y overflow-y-auto">
            {data?.payments.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">
                      {item.order.orderNumber} · {money(item.amount)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {item.order.customer.firstName}{" "}
                      {item.order.customer.lastName} · {item.provider} ·{" "}
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${paymentTone[item.status] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {item.status}
                  </span>
                  {item.status === "PAID" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        busy === item.id ||
                        refunds.some(
                          (refund) =>
                            refund.paymentId === item.id &&
                            !["COMPLETED", "REJECTED"].includes(refund.status),
                        )
                      }
                      onClick={() => void openRefundCase(item)}
                      className="rounded-lg text-primary"
                    >
                      {busy === item.id ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="mr-1 h-3.5 w-3.5" />
                      )}
                      Refund
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {!data?.payments.length && (
              <div className="p-14 text-center text-sm text-gray-400">
                No payment activity yet.
              </div>
            )}
          </div>
        </section>
        <section className="overflow-hidden rounded-2xl border bg-white">
          <div className="border-b p-5">
            <h3 className="font-extrabold">Refund and chargeback cases</h3>
            <p className="mt-1 text-xs text-gray-500">
              Provider-backed cases require a gateway reversal reference before
              processing or completion can be recorded.
            </p>
          </div>
          <div className="max-h-[520px] divide-y overflow-y-auto">
            {refunds.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold">{money(item.requestedAmount)}</p>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${refundTone[item.status]}`}
                      >
                        {item.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Payment {item.paymentId.slice(0, 10)} ·{" "}
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs text-gray-600">{item.reason}</p>
                    {item.providerReference && (
                      <p className="mt-1 text-xs font-bold text-primary">
                        Gateway ref: {item.providerReference}
                      </p>
                    )}
                    {item.reviewNotes && (
                      <p className="mt-1 text-xs text-gray-500">
                        Note: {item.reviewNotes}
                      </p>
                    )}
                  </div>
                  {isSuper && (
                    <select
                      value=""
                      disabled={busy === item.id}
                      onChange={(event) => {
                        void updateRefundCase(
                          item,
                          event.target.value as RefundCase["status"],
                        );
                        event.currentTarget.value = "";
                      }}
                      className="rounded-lg border bg-white px-3 py-2 text-xs font-bold"
                    >
                      <option value="">Move case...</option>
                      {refundStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
            {!refunds.length && (
              <div className="p-14 text-center text-sm text-gray-400">
                No refund or chargeback cases are open.
              </div>
            )}
          </div>
        </section>
      </div>
      <section className="overflow-hidden rounded-2xl border bg-white">
        <div className="border-b p-5">
          <h3 className="font-extrabold">Subscription approvals</h3>
          <p className="mt-1 text-xs text-gray-500">
            Superadmins can activate paid vendor plans after the manual payment
            reference is confirmed.
          </p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Awaiting payment"
            value={String(data?.pendingSubscriptions ?? 0)}
            icon={CheckCircle2}
            tone="text-amber-600"
          />
          <Metric
            label="Active subscriptions"
            value={String(
              data?.subscriptions.filter((item) => item.status === "ACTIVE")
                .length ?? 0,
            )}
            icon={ShieldCheck}
            tone="text-green-600"
          />
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border bg-white">
          <div className="border-b p-5">
            <h3 className="font-extrabold">Vendor subscriptions</h3>
            <p className="mt-1 text-xs text-gray-500">
              Review plans awaiting payment before activating them in Vendor
              operations.
            </p>
          </div>
          <div className="max-h-[520px] divide-y overflow-y-auto">
            {data?.subscriptions.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="text-sm font-bold">
                    {item.vendor.businessName} · {item.tier}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {money(item.priceKes)}
                    {item.endsAt
                      ? ` · ends ${new Date(item.endsAt).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${item.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
                  >
                    {item.status.replaceAll("_", " ")}
                  </span>
                  {isSuper && item.status === "PENDING_PAYMENT" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === item.id}
                      onClick={() => void activateSubscription(item)}
                      className="rounded-lg text-primary"
                    >
                      Activate
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {!data?.subscriptions.length && (
              <div className="p-14 text-center text-sm text-gray-400">
                No vendor subscriptions yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof CircleDollarSign;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border bg-white p-5">
      <Icon className={`h-5 w-5 ${tone}`} />
      <p className="mt-4 text-xs font-bold text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${tone}`}>{value}</p>
    </article>
  );
}
