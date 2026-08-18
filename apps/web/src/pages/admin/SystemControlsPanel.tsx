import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Truck,
  Gift,
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

type SystemSetting = { key: string; value: unknown; updatedAt: string };

export function SystemControlsPanel() {
  const [items, setItems] = useState<Audit[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Platform settings state
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [settingsError, setSettingsError] = useState("");

  // Local editable state for delivery fees
  const [deliveryFees, setDeliveryFees] = useState<Record<string, number>>({});
  // Local editable state for referral rewards
  const [referralReferrer, setReferralReferrer] = useState<number>(0);
  const [referralReferee, setReferralReferee] = useState<number>(0);
  const [referralExpiry, setReferralExpiry] = useState<number>(0);

  const load = useCallback(async () => {
    setLoading(true);
    setSettingsLoading(true);
    setError("");
    setSettingsError("");
    try {
      const [auditItems, settingsRes] = await Promise.all([
        apiRequest<Audit[]>("/operations/admin/audit"),
        apiRequest<{ data: SystemSetting[] }>("/operations/admin/system-settings"),
      ]);
      setItems(auditItems);

      const settingsList = settingsRes.data ?? [];
      setSettings(settingsList);

      // Seed local delivery fees state
      const feesSetting = settingsList.find((s) => s.key === "delivery_fees");
      if (feesSetting && typeof feesSetting.value === "object" && feesSetting.value !== null) {
        setDeliveryFees(feesSetting.value as Record<string, number>);
      } else {
        // sensible defaults if not yet set
        setDeliveryFees({
          Nairobi: 500,
          Kiambu: 700,
          Mombasa: 1200,
          Nakuru: 800,
          Kisumu: 900,
          default: 1000,
        });
      }

      // Seed referral reward state
      const referrerSetting = settingsList.find(
        (s) => s.key === "referral_first_purchase_referrer_credit",
      );
      const refereeSetting = settingsList.find(
        (s) => s.key === "referral_first_purchase_referee_credit",
      );
      const expirySetting = settingsList.find(
        (s) => s.key === "referral_credit_expiry_days",
      );
      if (referrerSetting != null) setReferralReferrer(Number(referrerSetting.value));
      if (refereeSetting != null) setReferralReferee(Number(refereeSetting.value));
      if (expirySetting != null) setReferralExpiry(Number(expirySetting.value));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load audit history.",
      );
    } finally {
      setLoading(false);
      setSettingsLoading(false);
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

  // Save a single system setting via PUT
  const saveSetting = useCallback(
    async (key: string, value: unknown) => {
      setSavingKey(key);
      setSettingsError("");
      try {
        await apiRequest(`/operations/admin/system-settings/${key}`, {
          method: "PUT",
          body: JSON.stringify({ value }),
        });
        // Update local settings list so updatedAt reflects the change
        setSettings((prev) =>
          prev.map((s) =>
            s.key === key ? { ...s, value, updatedAt: new Date().toISOString() } : s,
          ),
        );
      } catch (cause) {
        setSettingsError(
          cause instanceof Error ? cause.message : `Failed to save "${key}".`,
        );
      } finally {
        setSavingKey("");
      }
    },
    [],
  );

  const handleSaveDeliveryFees = () => void saveSetting("delivery_fees", deliveryFees);

  const handleSaveRewards = () => {
    void saveSetting("referral_first_purchase_referrer_credit", referralReferrer);
    void saveSetting("referral_first_purchase_referee_credit", referralReferee);
    void saveSetting("referral_credit_expiry_days", referralExpiry);
  };

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

      {/* ── Platform Settings ── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-extrabold">Platform Settings</h3>
        </div>
        {settingsError && (
          <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {settingsError}
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Delivery Fees card */}
          <article className="rounded-2xl border bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <h4 className="font-extrabold">Delivery Fees</h4>
            </div>
            {settingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {Object.entries(deliveryFees).map(([county, fee]) => (
                    <div key={county} className="flex items-center gap-3">
                      <label className="w-28 shrink-0 text-sm font-medium capitalize text-gray-700">
                        {county === "default" ? "Default" : county}
                      </label>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                          KES
                        </span>
                        <Input
                          type="number"
                          min={0}
                          value={fee}
                          onChange={(e) =>
                            setDeliveryFees((prev) => ({
                              ...prev,
                              [county]: Number(e.target.value),
                            }))
                          }
                          className="pl-11"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleSaveDeliveryFees}
                  disabled={savingKey === "delivery_fees"}
                  className="mt-5 w-full rounded-xl"
                >
                  {savingKey === "delivery_fees" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save fees"
                  )}
                </Button>
              </>
            )}
          </article>

          {/* Referral Rewards card */}
          <article className="rounded-2xl border bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <h4 className="font-extrabold">Referral Rewards</h4>
            </div>
            {settingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Referrer reward (KES)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        KES
                      </span>
                      <Input
                        type="number"
                        min={0}
                        value={referralReferrer}
                        onChange={(e) => setReferralReferrer(Number(e.target.value))}
                        className="pl-11"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Referee reward (KES)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        KES
                      </span>
                      <Input
                        type="number"
                        min={0}
                        value={referralReferee}
                        onChange={(e) => setReferralReferee(Number(e.target.value))}
                        className="pl-11"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Credit expiry (days)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={referralExpiry}
                      onChange={(e) => setReferralExpiry(Number(e.target.value))}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSaveRewards}
                  disabled={
                    savingKey === "referral_first_purchase_referrer_credit" ||
                    savingKey === "referral_first_purchase_referee_credit" ||
                    savingKey === "referral_credit_expiry_days"
                  }
                  className="mt-5 w-full rounded-xl"
                >
                  {savingKey.startsWith("referral_") ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save rewards"
                  )}
                </Button>
              </>
            )}
          </article>
        </div>
      </section>

      {/* ── Audit Trail ── */}
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
