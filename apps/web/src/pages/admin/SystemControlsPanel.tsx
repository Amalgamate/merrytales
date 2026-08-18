import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Audit = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  createdAt: string;
  actor?: { firstName: string; lastName: string; email: string; role: string };
};
export function SystemControlsPanel() {
  const [items, setItems] = useState<Audit[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await apiRequest<Audit[]>("/operations/admin/audit"));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load audit history.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const filtered = useMemo(
    () =>
      items.filter((item) =>
        `${item.action} ${item.entityType} ${item.actor?.email ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [items, query],
  );
  if (loading)
    return (
      <div className="flex min-h-[45vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">System controls</h2>
          <p className="mt-1 text-sm text-gray-500">
            Immutable operational history for access, payout, integration and
            governance decisions.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void load()}
          className="rounded-xl"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh audit
        </Button>
      </div>
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card
          label="Recorded actions"
          value={String(items.length)}
          icon={FileText}
        />
        <Card label="Active control" value="Audited" icon={ShieldCheck} />
        <Card label="Access" value="Superadmin" icon={ShieldCheck} />
      </div>
      <section className="overflow-hidden rounded-2xl border bg-white">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-extrabold">Audit trail</h3>
            <p className="mt-1 text-xs text-gray-500">
              Searchable evidence of privileged actions. Records cannot be
              edited here.
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search audit trail"
              className="w-64 pl-9"
            />
          </div>
        </div>
        <div className="max-h-[600px] divide-y overflow-y-auto">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-bold">
                  {item.action.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {item.entityType}
                  {item.entityId ? ` · ${item.entityId}` : ""} ·{" "}
                  {item.actor
                    ? `${item.actor.firstName} ${item.actor.lastName} (${item.actor.role})`
                    : "System"}
                </p>
              </div>
              <p className="text-xs text-gray-400">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </article>
          ))}
          {!filtered.length && (
            <div className="p-14 text-center text-sm text-gray-400">
              No audit records match this search.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
function Card({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof FileText;
}) {
  return (
    <article className="rounded-2xl border bg-white p-5">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-4 text-xs font-bold text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </article>
  );
}
