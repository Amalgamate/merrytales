import { useCallback, useEffect, useState } from "react";
import {
  CalendarHeart,
  Gift,
  Loader2,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Event = {
  id: string;
  title: string;
  type: string;
  eventDate?: string;
  city?: string;
  budget?: number;
  currency: string;
  traditions: string[];
  planningPreferences: string[];
  updatedAt: string;
  owner: { firstName: string; lastName: string; email: string };
  budgetEnvelopes: { allocatedAmount: number }[];
  quotes: { status: string; total: number }[];
};
type Referral = {
  id: string;
  status: string;
  createdAt: string;
  qualifiedAt?: string;
  purchaseQualifiedAt?: string;
  referrerCredit: number;
  refereeCredit: number;
  referrer: { firstName: string; lastName: string; email: string };
  referee: { firstName: string; lastName: string; email: string };
};
type SuccessData = {
  events: Event[];
  referrals: Referral[];
  availableCredits: { count: number; amount: number };
};
const money = (amount: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(amount));

export function CustomerSuccessPanel() {
  const [data, setData] = useState<SuccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(
        await apiRequest<SuccessData>("/operations/admin/customer-success"),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load customer success data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  if (loading)
    return (
      <div className="flex min-h-[45vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  const upcoming =
    data?.events.filter(
      (item) => item.eventDate && new Date(item.eventDate) >= new Date(),
    ).length ?? 0;
  const qualified =
    data?.referrals.filter((item) => item.status === "QUALIFIED").length ?? 0;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">Customer success</h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor event planners, inclusive celebration needs and referral
            health before customers need help.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void load()}
          className="rounded-xl"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="Active planners"
          value={String(data?.events.length ?? 0)}
          icon={CalendarHeart}
          tone="text-primary"
        />
        <Metric
          label="Upcoming celebrations"
          value={String(upcoming)}
          icon={UsersRound}
          tone="text-blue-600"
        />
        <Metric
          label="Available referral credits"
          value={money(data?.availableCredits.amount ?? 0)}
          icon={Gift}
          tone="text-green-600"
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="overflow-hidden rounded-2xl border bg-white">
          <div className="border-b p-5">
            <h3 className="font-extrabold">Planner health</h3>
            <p className="mt-1 text-xs text-gray-500">
              Planning activity, budget setup and culture-aware preferences
              across current events.
            </p>
          </div>
          <div className="max-h-[650px] divide-y overflow-y-auto">
            {data?.events.map((event) => {
              const allocated = event.budgetEnvelopes.reduce(
                (sum, item) => sum + Number(item.allocatedAmount),
                0,
              );
              return (
                <article key={event.id} className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold">{event.title}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {event.owner.firstName} {event.owner.lastName} ·{" "}
                        {event.type} ·{" "}
                        {event.city ?? "Location to be confirmed"}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-gray-500">
                      Updated {new Date(event.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold">
                    {event.eventDate && (
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                        {new Date(event.eventDate).toLocaleDateString()}
                      </span>
                    )}
                    {event.traditions.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-primary/10 px-2 py-1 text-primary"
                      >
                        {item}
                      </span>
                    ))}
                    {event.planningPreferences.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-gray-100 px-2 py-1 text-gray-600"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    Budget: {event.budget ? money(event.budget) : "Not set"} ·
                    Allocated: {money(allocated)} · Quotes:{" "}
                    {event.quotes.length}
                  </p>
                </article>
              );
            })}
            {!data?.events.length && (
              <div className="p-14 text-center text-sm text-gray-400">
                No planner events exist yet.
              </div>
            )}
          </div>
        </section>
        <section className="overflow-hidden rounded-2xl border bg-white">
          <div className="border-b p-5">
            <h3 className="font-extrabold">Referral health</h3>
            <p className="mt-1 text-xs text-gray-500">
              {qualified} qualified referral{qualified === 1 ? "" : "s"} in the
              current history.
            </p>
          </div>
          <div className="max-h-[650px] divide-y overflow-y-auto">
            {data?.referrals.map((referral) => (
              <article key={referral.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">
                      {referral.referrer.firstName} →{" "}
                      {referral.referee.firstName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Created{" "}
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${referral.status === "QUALIFIED" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
                  >
                    {referral.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Reward path: {money(referral.referrerCredit)} referrer ·{" "}
                  {money(referral.refereeCredit)} new planner
                </p>
              </article>
            ))}
            {!data?.referrals.length && (
              <div className="p-14 text-center text-sm text-gray-400">
                No referrals have been recorded yet.
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
  icon: typeof CalendarHeart;
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
