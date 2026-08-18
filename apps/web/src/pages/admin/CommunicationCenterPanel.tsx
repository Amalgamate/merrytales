import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Edit3,
  Loader2,
  Mail,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Channel = "EMAIL" | "WHATSAPP" | "SMS";
type DeliveryStatus =
  | "DRAFT"
  | "QUEUED"
  | "SENDING"
  | "SENT"
  | "DELIVERED"
  | "READ"
  | "FAILED"
  | "SUPPRESSED";
type Template = {
  id: string;
  name: string;
  channel: Channel;
  subject?: string;
  body: string;
  providerTemplateId?: string;
  isActive: boolean;
  updatedAt: string;
};
type Delivery = {
  id: string;
  templateId?: string;
  userId?: string;
  channel: Channel;
  recipient: string;
  subject?: string;
  body: string;
  status: DeliveryStatus;
  attempts: number;
  providerMessageId?: string;
  lastError?: string;
  nextRetryAt?: string;
  deliveredAt?: string;
  createdAt: string;
};
type ConsentSummary = {
  channel: Channel;
  _count: number;
};
type CommunicationData = {
  templates: Template[];
  deliveries: Delivery[];
  consents: ConsentSummary[];
};
type TemplateDraft = {
  id?: string;
  name: string;
  channel: Channel;
  subject: string;
  providerTemplateId: string;
  body: string;
  isActive: boolean;
};
type DeliveryDraft = {
  templateId: string;
  channel: Channel;
  recipient: string;
  subject: string;
  body: string;
};

const channels: Channel[] = ["EMAIL", "WHATSAPP", "SMS"];
const statusTone: Record<DeliveryStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  QUEUED: "bg-blue-50 text-blue-700",
  SENDING: "bg-indigo-50 text-indigo-700",
  SENT: "bg-sky-50 text-sky-700",
  DELIVERED: "bg-green-50 text-green-700",
  READ: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  SUPPRESSED: "bg-amber-50 text-amber-700",
};
const blankTemplate: TemplateDraft = {
  name: "",
  channel: "EMAIL",
  subject: "",
  providerTemplateId: "",
  body: "",
  isActive: true,
};
const blankDelivery: DeliveryDraft = {
  templateId: "",
  channel: "EMAIL",
  recipient: "",
  subject: "",
  body: "",
};

export function CommunicationCenterPanel() {
  const [data, setData] = useState<CommunicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [templateDraft, setTemplateDraft] =
    useState<TemplateDraft>(blankTemplate);
  const [deliveryDraft, setDeliveryDraft] =
    useState<DeliveryDraft>(blankDelivery);
  const [consentDraft, setConsentDraft] = useState({
    userId: "",
    channel: "WHATSAPP" as Channel,
    marketingAllowed: false,
    transactionalAllowed: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiRequest<CommunicationData>("/operations/admin/communications"));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load messaging controls.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeTemplates = useMemo(
    () => data?.templates.filter((item) => item.isActive) ?? [],
    [data?.templates],
  );
  const deliveryCounts = useMemo(
    () =>
      (data?.deliveries ?? []).reduce<Record<string, number>>((total, item) => {
        total[item.status] = (total[item.status] ?? 0) + 1;
        return total;
      }, {}),
    [data?.deliveries],
  );

  const startEdit = (template: Template) => {
    setTemplateDraft({
      id: template.id,
      name: template.name,
      channel: template.channel,
      subject: template.subject ?? "",
      providerTemplateId: template.providerTemplateId ?? "",
      body: template.body,
      isActive: template.isActive,
    });
    setNotice("");
  };

  const saveTemplate = async () => {
    if (!templateDraft.name.trim() || !templateDraft.body.trim()) return;
    setBusy("template");
    setError("");
    setNotice("");
    try {
      const payload = {
        name: templateDraft.name,
        channel: templateDraft.channel,
        subject:
          templateDraft.channel === "EMAIL" && templateDraft.subject.trim()
            ? templateDraft.subject
            : null,
        body: templateDraft.body,
        providerTemplateId: templateDraft.providerTemplateId.trim() || null,
        isActive: templateDraft.isActive,
      };
      const saved = await apiRequest<Template>(
        templateDraft.id
          ? `/operations/admin/communications/templates/${templateDraft.id}`
          : "/operations/admin/communications/templates",
        {
          method: templateDraft.id ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setData((current) =>
        current
          ? {
              ...current,
              templates: templateDraft.id
                ? current.templates.map((item) =>
                    item.id === saved.id ? saved : item,
                  )
                : [saved, ...current.templates],
            }
          : current,
      );
      setTemplateDraft(blankTemplate);
      setNotice("Template saved.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save template.",
      );
    } finally {
      setBusy("");
    }
  };

  const chooseTemplateForDelivery = (templateId: string) => {
    const template = activeTemplates.find((item) => item.id === templateId);
    setDeliveryDraft((current) => ({
      ...current,
      templateId,
      channel: template?.channel ?? current.channel,
      subject: template?.subject ?? current.subject,
      body: template?.body ?? current.body,
    }));
  };

  const queueDelivery = async () => {
    if (!deliveryDraft.recipient.trim() || !deliveryDraft.body.trim()) return;
    setBusy("delivery");
    setError("");
    setNotice("");
    try {
      const queued = await apiRequest<Delivery>(
        "/operations/admin/communications/deliveries",
        {
          method: "POST",
          body: JSON.stringify({
            ...deliveryDraft,
            templateId: deliveryDraft.templateId || undefined,
            subject: deliveryDraft.subject.trim() || undefined,
          }),
        },
      );
      setData((current) =>
        current
          ? { ...current, deliveries: [queued, ...current.deliveries] }
          : current,
      );
      setDeliveryDraft(blankDelivery);
      setNotice("Delivery queued for the messaging worker.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to queue delivery.");
    } finally {
      setBusy("");
    }
  };

  const retryDelivery = async (delivery: Delivery) => {
    setBusy(delivery.id);
    setError("");
    setNotice("");
    try {
      const updated = await apiRequest<Delivery>(
        `/operations/admin/communications/deliveries/${delivery.id}/retry`,
        { method: "POST" },
      );
      setData((current) =>
        current
          ? {
              ...current,
              deliveries: current.deliveries.map((item) =>
                item.id === updated.id ? updated : item,
              ),
            }
          : current,
      );
      setNotice("Delivery placed back on the queue.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to retry delivery.");
    } finally {
      setBusy("");
    }
  };

  const saveConsent = async () => {
    if (!consentDraft.userId.trim()) return;
    setBusy("consent");
    setError("");
    setNotice("");
    try {
      await apiRequest("/operations/admin/communications/consents", {
        method: "POST",
        body: JSON.stringify(consentDraft),
      });
      setConsentDraft((current) => ({ ...current, userId: "" }));
      setNotice("Consent preference updated.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update consent.");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">Messaging control</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage message templates, consent and delivery retries across
            WhatsApp, email and SMS.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} className="rounded-xl">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh messages
        </Button>
      </div>
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold text-green-700">
          {notice}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Active templates"
          value={String(activeTemplates.length)}
          icon={Edit3}
          tone="text-primary"
        />
        <Metric
          label="Queued deliveries"
          value={String(deliveryCounts.QUEUED ?? 0)}
          icon={Clock3}
          tone="text-blue-600"
        />
        <Metric
          label="Failed deliveries"
          value={String(deliveryCounts.FAILED ?? 0)}
          icon={RotateCcw}
          tone="text-red-600"
        />
        <Metric
          label="Consent records"
          value={String(
            data?.consents.reduce((total, item) => total + item._count, 0) ?? 0,
          )}
          icon={ShieldCheck}
          tone="text-green-600"
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="overflow-hidden rounded-2xl border bg-white">
          <div className="border-b p-5">
            <h3 className="font-extrabold">Template editor</h3>
            <p className="mt-1 text-xs text-gray-500">
              WhatsApp templates should match the approved MobileSasa template
              ID before live sending is enabled.
            </p>
          </div>
          <div className="space-y-3 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={templateDraft.name}
                onChange={(event) =>
                  setTemplateDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Template name"
              />
              <select
                value={templateDraft.channel}
                onChange={(event) =>
                  setTemplateDraft((current) => ({
                    ...current,
                    channel: event.target.value as Channel,
                  }))
                }
                className="rounded-xl border bg-white px-3 py-2 text-sm font-bold"
              >
                {channels.map((channel) => (
                  <option key={channel}>{channel}</option>
                ))}
              </select>
            </div>
            <Input
              value={templateDraft.subject}
              onChange={(event) =>
                setTemplateDraft((current) => ({
                  ...current,
                  subject: event.target.value,
                }))
              }
              placeholder="Email subject, optional"
            />
            <Input
              value={templateDraft.providerTemplateId}
              onChange={(event) =>
                setTemplateDraft((current) => ({
                  ...current,
                  providerTemplateId: event.target.value,
                }))
              }
              placeholder="Provider template ID, optional"
            />
            <textarea
              value={templateDraft.body}
              onChange={(event) =>
                setTemplateDraft((current) => ({
                  ...current,
                  body: event.target.value,
                }))
              }
              placeholder="Message body. Use variables like {{firstName}}, {{orderNumber}} or {{eventName}}."
              className="min-h-40 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={templateDraft.isActive}
                onChange={(event) =>
                  setTemplateDraft((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active for new sends
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={
                  busy === "template" ||
                  !templateDraft.name.trim() ||
                  !templateDraft.body.trim()
                }
                onClick={() => void saveTemplate()}
                className="rounded-xl"
              >
                {busy === "template" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save template
              </Button>
              {templateDraft.id && (
                <Button
                  variant="outline"
                  onClick={() => setTemplateDraft(blankTemplate)}
                  className="rounded-xl"
                >
                  New template
                </Button>
              )}
            </div>
          </div>
          <div className="max-h-[360px] divide-y overflow-y-auto border-t">
            {data?.templates.map((template) => (
              <button
                key={template.id}
                onClick={() => startEdit(template)}
                className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-gray-50"
              >
                <span>
                  <span className="block text-sm font-bold">{template.name}</span>
                  <span className="mt-1 block text-xs text-gray-500">
                    {template.channel} · {template.providerTemplateId || "local copy"}
                  </span>
                </span>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-bold ${template.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {template.isActive ? "ACTIVE" : "OFF"}
                </span>
              </button>
            ))}
            {!data?.templates.length && (
              <div className="p-10 text-center text-sm text-gray-400">
                No templates have been created yet.
              </div>
            )}
          </div>
        </section>
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border bg-white">
            <div className="border-b p-5">
              <h3 className="font-extrabold">Queue a delivery</h3>
              <p className="mt-1 text-xs text-gray-500">
                Queued messages are logged now; live provider sending can be
                enabled once WhatsApp and email credentials are confirmed.
              </p>
            </div>
            <div className="space-y-3 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={deliveryDraft.templateId}
                  onChange={(event) => chooseTemplateForDelivery(event.target.value)}
                  className="rounded-xl border bg-white px-3 py-2 text-sm font-bold"
                >
                  <option value="">Manual message</option>
                  {activeTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <select
                  value={deliveryDraft.channel}
                  onChange={(event) =>
                    setDeliveryDraft((current) => ({
                      ...current,
                      channel: event.target.value as Channel,
                    }))
                  }
                  className="rounded-xl border bg-white px-3 py-2 text-sm font-bold"
                >
                  {channels.map((channel) => (
                    <option key={channel}>{channel}</option>
                  ))}
                </select>
              </div>
              <Input
                value={deliveryDraft.recipient}
                onChange={(event) =>
                  setDeliveryDraft((current) => ({
                    ...current,
                    recipient: event.target.value,
                  }))
                }
                placeholder="Recipient email or phone"
              />
              <Input
                value={deliveryDraft.subject}
                onChange={(event) =>
                  setDeliveryDraft((current) => ({
                    ...current,
                    subject: event.target.value,
                  }))
                }
                placeholder="Subject, optional"
              />
              <textarea
                value={deliveryDraft.body}
                onChange={(event) =>
                  setDeliveryDraft((current) => ({
                    ...current,
                    body: event.target.value,
                  }))
                }
                placeholder="Message body"
                className="min-h-28 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button
                disabled={
                  busy === "delivery" ||
                  !deliveryDraft.recipient.trim() ||
                  !deliveryDraft.body.trim()
                }
                onClick={() => void queueDelivery()}
                className="rounded-xl"
              >
                {busy === "delivery" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Queue delivery
              </Button>
            </div>
          </section>
          <section className="overflow-hidden rounded-2xl border bg-white">
            <div className="border-b p-5">
              <h3 className="font-extrabold">Consent management</h3>
              <p className="mt-1 text-xs text-gray-500">
                Update a user channel preference when they opt in or opt out
                through support.
              </p>
            </div>
            <div className="space-y-3 p-5">
              <Input
                value={consentDraft.userId}
                onChange={(event) =>
                  setConsentDraft((current) => ({
                    ...current,
                    userId: event.target.value,
                  }))
                }
                placeholder="User ID"
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <select
                  value={consentDraft.channel}
                  onChange={(event) =>
                    setConsentDraft((current) => ({
                      ...current,
                      channel: event.target.value as Channel,
                    }))
                  }
                  className="rounded-xl border bg-white px-3 py-2 text-sm font-bold"
                >
                  {channels.map((channel) => (
                    <option key={channel}>{channel}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={consentDraft.marketingAllowed}
                    onChange={(event) =>
                      setConsentDraft((current) => ({
                        ...current,
                        marketingAllowed: event.target.checked,
                      }))
                    }
                  />
                  Marketing
                </label>
                <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={consentDraft.transactionalAllowed}
                    onChange={(event) =>
                      setConsentDraft((current) => ({
                        ...current,
                        transactionalAllowed: event.target.checked,
                      }))
                    }
                  />
                  Transactional
                </label>
              </div>
              <Button
                variant="outline"
                disabled={busy === "consent" || !consentDraft.userId.trim()}
                onClick={() => void saveConsent()}
                className="rounded-xl"
              >
                {busy === "consent" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                Save consent
              </Button>
              <div className="flex flex-wrap gap-2 pt-1">
                {channels.map((channel) => (
                  <span
                    key={channel}
                    className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-600"
                  >
                    {channel}:{" "}
                    {data?.consents.find((item) => item.channel === channel)?._count ??
                      0}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
      <section className="overflow-hidden rounded-2xl border bg-white">
        <div className="border-b p-5">
          <h3 className="font-extrabold">Delivery log and retries</h3>
          <p className="mt-1 text-xs text-gray-500">
            Failed or suppressed entries can be moved back to the queue after
            the contact details or provider issue is corrected.
          </p>
        </div>
        <div className="max-h-[560px] divide-y overflow-y-auto">
          {data?.deliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="flex flex-col gap-4 p-4 xl:flex-row xl:items-center xl:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {delivery.channel === "EMAIL" ? (
                    <Mail className="h-4 w-4 text-primary" />
                  ) : (
                    <MessageCircle className="h-4 w-4 text-primary" />
                  )}
                  <p className="truncate text-sm font-bold">{delivery.recipient}</p>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusTone[delivery.status]}`}
                  >
                    {delivery.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {delivery.subject || delivery.body.slice(0, 90)}
                  {delivery.body.length > 90 ? "..." : ""} · attempts{" "}
                  {delivery.attempts} ·{" "}
                  {new Date(delivery.createdAt).toLocaleString()}
                </p>
                {delivery.lastError && (
                  <p className="mt-1 text-xs text-red-600">{delivery.lastError}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {delivery.deliveredAt && (
                  <span className="flex items-center text-xs font-bold text-green-700">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    Delivered
                  </span>
                )}
                {["FAILED", "SUPPRESSED", "QUEUED"].includes(delivery.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === delivery.id}
                    onClick={() => void retryDelivery(delivery)}
                    className="rounded-lg"
                  >
                    {busy === delivery.id ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />
                    )}
                    Retry
                  </Button>
                )}
              </div>
            </div>
          ))}
          {!data?.deliveries.length && (
            <div className="p-14 text-center text-sm text-gray-400">
              No delivery logs have been recorded yet.
            </div>
          )}
        </div>
      </section>
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
  icon: typeof Edit3;
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
