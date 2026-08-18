import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  FileCheck2,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Radio,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Store,
  Truck,
  Users,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FinancePanel } from "./FinancePanel";
import { CustomerSuccessPanel } from "./CustomerSuccessPanel";
import { SystemControlsPanel } from "./SystemControlsPanel";
import { CommunicationCenterPanel } from "./CommunicationCenterPanel";

type Summary = {
  users: number;
  vendors: number;
  orders: number;
  revenue: number;
};
type Command = {
  queues: {
    pendingVendors: number;
    pendingListings: number;
    pendingPayments: number;
    failedPayments: number;
    activeDeliveries: number;
    deliveryIssues: number;
    openJobs: number;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    total: number;
    currency: string;
    createdAt: string;
    customer: { firstName: string; lastName: string };
    fulfillments: { status: string }[];
  }[];
  recentAudit: {
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    actor?: { firstName: string; lastName: string; role: string };
  }[];
};
type PlatformUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  mustChangePassword: boolean;
  createdAt: string;
};
type ComplianceDocument = {
  id: string;
  type: string;
  status: string;
  reviewNotes?: string;
  expiresAt?: string;
};
type Vendor = {
  id: string;
  businessName: string;
  slug: string;
  category: string;
  city: string;
  status: string;
  taxComplianceStatus: string;
  etimsStatus: string;
  owner: { email: string; firstName: string; lastName: string };
  verificationDocuments?: ComplianceDocument[];
};
type Listing = {
  id: string;
  name: string;
  category: string;
  price: number;
  moderationStatus: string;
  moderationReason?: string;
  submittedAt?: string;
  vendor?: {
    businessName: string;
    status: string;
    taxComplianceStatus: string;
    etimsStatus: string;
  };
};
type Fulfillment = {
  id: string;
  trackingCode: string;
  status: string;
  recipientName: string;
  recipientPhone: string;
  county: string;
  addressLine: string;
  estimatedEnd?: string;
  courierName?: string;
  vendor?: { businessName: string; slug: string; whatsapp?: string };
  order: {
    orderNumber: string;
    customer: { firstName: string; lastName: string };
  };
};
type Notice = {
  id: string;
  title: string;
  body: string;
  severity: string;
  category: string;
  actionUrl?: string;
  readAt?: string;
  createdAt: string;
};
type Message = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string; role: string };
};
type Thread = {
  id: string;
  title: string;
  type: string;
  isClosed: boolean;
  updatedAt: string;
  messages: Message[];
  participants: {
    user: { id: string; firstName: string; lastName: string; role: string };
  }[];
};
type MobileSasa = {
  settings: { enabled: boolean; portalUrl: string; supportEmail: string };
  summary: {
    vendors: number;
    connected: number;
    healthy: number;
    errors: number;
  };
  connections: {
    vendorId: string;
    senderId: string;
    status: string;
    lastTestedAt?: string;
    vendor: { businessName: string };
  }[];
};
const money = (amount: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(amount));
const severityTone: Record<string, string> = {
  INFO: "bg-blue-50 text-blue-700 border-blue-100",
  SUCCESS: "bg-green-50 text-green-700 border-green-100",
  WARNING: "bg-amber-50 text-amber-700 border-amber-100",
  CRITICAL: "bg-red-50 text-red-700 border-red-100",
};
const managedRoles = [
  "CUSTOMER",
  "VENDOR",
  "STUDIO",
  "STAFF",
  "ADMIN",
  "SUPERADMIN",
];
const managedStatuses = ["ACTIVE", "SUSPENDED", "PENDING_VERIFICATION"];
const fulfillmentTransitions: Record<string, string[]> = {
  PENDING: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP", "CANCELLED"],
  READY_FOR_PICKUP: ["COURIER_ASSIGNED", "PICKED_UP"],
  COURIER_ASSIGNED: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["ARRIVING", "DELIVERY_FAILED"],
  ARRIVING: ["DELIVERED", "DELIVERY_FAILED"],
  DELIVERY_FAILED: ["COURIER_ASSIGNED", "RETURNING"],
  RETURN_REQUESTED: ["RETURNING"],
  RETURNING: ["RETURNED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURNED: [],
  CANCELLED: [],
};

export function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isSuper = user?.role === "SUPERADMIN";
  const canManage = ["SUPERADMIN", "ADMIN"].includes(user?.role ?? "");
  const [tab, setTab] = useState(
    () => location.hash.replace("#", "") || "overview",
  );
  const [mobile, setMobile] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [command, setCommand] = useState<Command | null>(null);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [compliance, setCompliance] = useState<Vendor[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [fulfillments, setFulfillments] = useState<Fulfillment[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState("");
  const [draft, setDraft] = useState("");
  const [mobileSasa, setMobileSasa] = useState<MobileSasa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [userEdits, setUserEdits] = useState<
    Record<string, { role: string; status: string }>
  >({});
  const [savingUser, setSavingUser] = useState("");
  const [operatingAction, setOperatingAction] = useState("");
  const [broadcast, setBroadcast] = useState({
    title: "",
    body: "",
    severity: "INFO",
    roles: ["CUSTOMER"] as string[],
    actionUrl: "",
  });
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const load = useCallback(async () => {
    setError("");
    try {
      const [result, ops, notificationData, chat] = await Promise.all([
        apiRequest<Summary>("/operations/admin/summary"),
        apiRequest<Command>("/operations/admin/command-center"),
        apiRequest<{ items: Notice[]; unread: number }>("/notifications"),
        apiRequest<Thread[]>("/operations/admin/chat/threads"),
      ]);
      setSummary(result);
      setCommand(ops);
      setNotices(notificationData.items);
      setUnread(notificationData.unread);
      setThreads(chat);
      setSelectedThread((current) => current || chat[0]?.id || "");
      if (isSuper)
        apiRequest<PlatformUser[]>("/operations/admin/users").then(setUsers);
      if (canManage) {
        apiRequest<MobileSasa>(
          "/operations/admin/integrations/mobilesasa",
        ).then(setMobileSasa);
        Promise.all([
          apiRequest<Vendor[]>("/operations/admin/vendors"),
          apiRequest<Vendor[]>("/operations/admin/compliance"),
          apiRequest<Listing[]>(
            "/operations/admin/listings?status=PENDING_REVIEW",
          ),
          apiRequest<Fulfillment[]>("/orders/vendor/fulfillments"),
        ])
          .then(
            ([vendorData, complianceData, listingData, fulfillmentData]) => {
              setVendors(vendorData);
              setCompliance(complianceData);
              setListings(listingData);
              setFulfillments(fulfillmentData);
            },
          )
          .catch((cause) =>
            setError(
              cause instanceof Error
                ? cause.message
                : "Unable to load operational queues.",
            ),
          );
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load command centre.",
      );
    } finally {
      setLoading(false);
    }
  }, [isSuper, canManage]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (tab !== "chat") return;
    const timer = setInterval(
      () =>
        apiRequest<Thread[]>("/operations/admin/chat/threads").then(setThreads),
      10000,
    );
    return () => clearInterval(timer);
  }, [tab]);
  const choose = (id: string) => {
    setTab(id);
    location.hash = id;
    setMobile(false);
  };
  const activeThread = threads.find((item) => item.id === selectedThread);
  const filteredUsers = users.filter((item) =>
    `${item.firstName} ${item.lastName} ${item.email} ${item.role}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const send = async () => {
    if (!selectedThread || !draft.trim()) return;
    const message = await apiRequest<Message>(
      `/operations/admin/chat/threads/${selectedThread}/messages`,
      { method: "POST", body: JSON.stringify({ body: draft }) },
    );
    setThreads((current) =>
      current.map((thread) =>
        thread.id === selectedThread
          ? { ...thread, messages: [...thread.messages, message] }
          : thread,
      ),
    );
    setDraft("");
  };
  const readNotice = async (item: Notice) => {
    if (!item.readAt) {
      await apiRequest(`/notifications/${item.id}/read`, { method: "PATCH" });
      setNotices((current) =>
        current.map((value) =>
          value.id === item.id
            ? { ...value, readAt: new Date().toISOString() }
            : value,
        ),
      );
      setUnread((value) => Math.max(0, value - 1));
    }
    if (item.actionUrl) navigate(item.actionUrl);
  };
  const readAll = async () => {
    await apiRequest("/notifications/read-all", { method: "PATCH" });
    setNotices((current) =>
      current.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    );
    setUnread(0);
  };
  const saveUser = async (account: PlatformUser) => {
    const edit = userEdits[account.id];
    if (!edit || account.id === user?.id) return;
    setSavingUser(account.id);
    setError("");
    try {
      const updated = await apiRequest<PlatformUser>(
        `/operations/admin/users/${account.id}`,
        { method: "PATCH", body: JSON.stringify(edit) },
      );
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setUserEdits((current) => {
        const next = { ...current };
        delete next[account.id];
        return next;
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to update this user.",
      );
    } finally {
      setSavingUser("");
    }
  };
  const resetUserPassword = async (account: PlatformUser) => {
    if (
      account.id === user?.id ||
      !window.confirm(`Create a new one-time password for ${account.email}?`)
    )
      return;
    setSavingUser(account.id);
    setError("");
    try {
      const result = await apiRequest<{
        email: string;
        temporaryPassword: string;
      }>(`/operations/admin/users/${account.id}/reset-password`, {
        method: "POST",
      });
      setTemporaryPassword({
        email: result.email,
        password: result.temporaryPassword,
      });
      setUsers((current) =>
        current.map((item) =>
          item.id === account.id ? { ...item, mustChangePassword: true } : item,
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to reset this password.",
      );
    } finally {
      setSavingUser("");
    }
  };
  const decideVendor = async (
    vendor: Vendor,
    decision: "VERIFY" | "REJECT" | "SUSPEND",
  ) => {
    const notes =
      window.prompt(
        `${decision === "VERIFY" ? "Verification" : "Decision"} note for ${vendor.businessName}:`,
        decision === "VERIFY" ? "Verified by operations" : "",
      ) ?? "";
    if (decision !== "VERIFY" && !notes.trim()) return;
    setOperatingAction(vendor.id);
    setError("");
    try {
      const updated = await apiRequest<Vendor>(
        `/operations/admin/compliance/vendors/${vendor.id}/decision`,
        { method: "POST", body: JSON.stringify({ decision, notes }) },
      );
      setCompliance((current) =>
        current.filter((item) => item.id !== updated.id),
      );
      setVendors((current) =>
        current.map((item) =>
          item.id === updated.id ? { ...item, status: updated.status } : item,
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to update this vendor.",
      );
    } finally {
      setOperatingAction("");
    }
  };
  const reviewDocument = async (
    vendorId: string,
    document: ComplianceDocument,
    status: "APPROVED" | "REJECTED",
  ) => {
    const reviewNotes =
      status === "REJECTED"
        ? window.prompt(`Why is ${document.type} rejected?`)
        : "";
    if (status === "REJECTED" && !reviewNotes?.trim()) return;
    setOperatingAction(document.id);
    setError("");
    try {
      await apiRequest(
        `/operations/admin/compliance/documents/${document.id}`,
        { method: "PATCH", body: JSON.stringify({ status, reviewNotes }) },
      );
      setCompliance((current) =>
        current.map((vendor) =>
          vendor.id === vendorId
            ? {
                ...vendor,
                verificationDocuments: vendor.verificationDocuments?.map(
                  (item) =>
                    item.id === document.id
                      ? {
                          ...item,
                          status,
                          reviewNotes: reviewNotes || undefined,
                        }
                      : item,
                ),
              }
            : vendor,
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to review this document.",
      );
    } finally {
      setOperatingAction("");
    }
  };
  const decideListing = async (
    listing: Listing,
    decision: "APPROVE" | "CHANGES_REQUIRED" | "REJECT" | "SUSPEND",
  ) => {
    const reason =
      decision === "APPROVE"
        ? "Approved by operations"
        : window.prompt(
            `Reason for ${decision.replaceAll("_", " ").toLowerCase()}:`,
          );
    if (!reason?.trim()) return;
    setOperatingAction(listing.id);
    setError("");
    try {
      await apiRequest(`/operations/admin/listings/${listing.id}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, reason }),
      });
      setListings((current) =>
        current.filter((item) => item.id !== listing.id),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to moderate this listing.",
      );
    } finally {
      setOperatingAction("");
    }
  };
  const moveFulfillment = async (fulfillment: Fulfillment, status: string) => {
    if (!status) return;
    const detail =
      window.prompt(`Optional update note for ${fulfillment.trackingCode}:`) ??
      undefined;
    setOperatingAction(fulfillment.id);
    setError("");
    try {
      const updated = await apiRequest<{ id: string; status: string }>(
        `/orders/vendor/fulfillments/${fulfillment.id}/status`,
        { method: "PATCH", body: JSON.stringify({ status, detail }) },
      );
      setFulfillments((current) =>
        current.map((item) =>
          item.id === updated.id ? { ...item, status: updated.status } : item,
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to update this delivery.",
      );
    } finally {
      setOperatingAction("");
    }
  };
  const toggleBroadcastRole = (role: string) =>
    setBroadcast((current) => ({
      ...current,
      roles: current.roles.includes(role)
        ? current.roles.filter((item) => item !== role)
        : [...current.roles, role],
    }));
  const sendBroadcast = async () => {
    if (
      !broadcast.title.trim() ||
      !broadcast.body.trim() ||
      !broadcast.roles.length
    )
      return;
    setBroadcasting(true);
    setBroadcastResult("");
    setError("");
    try {
      const result = await apiRequest<{ recipients: number }>(
        "/operations/admin/notifications/broadcast",
        {
          method: "POST",
          body: JSON.stringify({
            ...broadcast,
            actionUrl: broadcast.actionUrl.trim() || undefined,
          }),
        },
      );
      setBroadcastResult(
        `Sent to ${result.recipients} account${result.recipients === 1 ? "" : "s"}.`,
      );
      setBroadcast((current) => ({
        ...current,
        title: "",
        body: "",
        actionUrl: "",
      }));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to send broadcast.",
      );
    } finally {
      setBroadcasting(false);
    }
  };
  const nav = [
    ["overview", "Command centre", LayoutDashboard],
    ...(canManage
      ? [["finance", "Finance control", CircleDollarSign] as const]
      : []),
    ...(isSuper
      ? [["communications", "Messaging control", MessageSquare] as const]
      : []),
    ["customers", "Customer success", Users],
    ["orders", "Orders & delivery", Package],
    ["vendors", "Vendor operations", Store],
    ["chat", "Operations chat", MessageSquare],
    ["notifications", "Notifications", Bell],
    ...(isSuper ? [["users", "User governance", Users] as const] : []),
    ...(canManage ? [["integrations", "Integrations", Radio] as const] : []),
    ["settings", "System controls", Settings],
  ] as const;
  const stats = [
    {
      label: "Paid revenue",
      value: money(summary?.revenue ?? 0),
      icon: CircleDollarSign,
      tone: "bg-green-100 text-green-700",
    },
    {
      label: "Marketplace vendors",
      value: summary?.vendors ?? "—",
      icon: Store,
      tone: "bg-purple-100 text-purple-700",
    },
    {
      label: "Orders",
      value: summary?.orders ?? "—",
      icon: Package,
      tone: "bg-blue-100 text-blue-700",
    },
    {
      label: "Platform users",
      value: summary?.users ?? "—",
      icon: Users,
      tone: "bg-primary/10 text-primary",
    },
  ];
  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f6fa] text-[#171735]">
      {mobile && (
        <button
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        className={`${mobile ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:relative inset-y-0 left-0 z-40 w-[280px] shrink-0 bg-[#14142f] text-white flex flex-col transition-transform`}
      >
        <div className="h-20 px-6 border-b border-white/10 flex items-center">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" className="h-9 brightness-0 invert" />
            <div>
              <p className="font-extrabold">Merry Tales</p>
              <p className="text-[10px] uppercase tracking-[.16em] text-white/40">
                Operations control
              </p>
            </div>
          </Link>
          <button
            className="ml-auto md:hidden"
            onClick={() => setMobile(false)}
          >
            <X />
          </button>
        </div>
        <div className="m-4 rounded-2xl bg-white/[.06] border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-extrabold">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-white/45 uppercase tracking-wider">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
        <nav className="px-3 space-y-1 flex-1 overflow-y-auto">
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => choose(id)}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${tab === id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/60 hover:bg-white/[.07] hover:text-white"}`}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span>{label}</span>
              {id === "notifications" && unread > 0 && (
                <span className="ml-auto bg-red-500 rounded-full min-w-5 px-1.5 py-0.5 text-[10px] font-bold">
                  {unread}
                </span>
              )}
              {id === "chat" && threads.some((t) => t.messages.length) && (
                <span className="ml-auto w-2 h-2 bg-green-400 rounded-full" />
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {
              signOut();
              navigate("/login");
            }}
            className="flex items-center gap-3 text-sm text-white/60 hover:text-white px-3 py-2"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-20 bg-white/90 backdrop-blur-xl border-b flex items-center px-4 md:px-7 gap-4 shrink-0">
          <button
            className="md:hidden p-2 border rounded-xl"
            onClick={() => setMobile(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] uppercase tracking-[.16em] text-gray-400 font-bold">
              {isSuper ? "Executive control" : "Operations workspace"}
            </p>
            <h1 className="text-lg font-extrabold">
              {nav.find(([id]) => id === tab)?.[1] ?? "Command centre"}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => void load()}
              className="p-2.5 rounded-xl hover:bg-gray-100"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => choose("notifications")}
              className="relative p-2.5 rounded-xl hover:bg-gray-100"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
              )}
            </button>
            <div className="hidden sm:flex items-center gap-2 border-l pl-3">
              <div className="w-9 h-9 rounded-xl bg-[#171735] text-white flex items-center justify-center text-xs font-bold">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-7">
          <div className="max-w-[1500px] mx-auto">
            {user?.mustChangePassword && (
              <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-800 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold">
                    Set a new password before continuing.
                  </p>
                  <p className="mt-1 text-sm text-red-700">
                    Your temporary password only unlocks the secure
                    password-change screen.
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/change-password")}
                  className="shrink-0 rounded-xl"
                >
                  Change password
                </Button>
              </div>
            )}
            {error && (
              <div className="mb-5 bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4">
                {error}
              </div>
            )}
            {loading ? (
              <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {tab === "overview" && (
                  <div className="space-y-6">
                    <section className="rounded-[28px] bg-[#171735] text-white p-7 md:p-9 relative overflow-hidden">
                      <div className="absolute -right-20 -top-24 w-72 h-72 bg-primary/25 rounded-full blur-3xl" />
                      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                          <div className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-widest">
                            <Activity className="h-4 w-4" />
                            Platform operational
                          </div>
                          <h2 className="text-3xl md:text-4xl font-extrabold mt-3">
                            Good{" "}
                            {new Date().getHours() < 12
                              ? "morning"
                              : new Date().getHours() < 18
                                ? "afternoon"
                                : "evening"}
                            , {user?.firstName}
                          </h2>
                          <p className="text-white/55 mt-2 max-w-xl">
                            Monitor money, marketplace trust, fulfilment and
                            team response from one command layer.
                          </p>
                        </div>
                        <div className="text-sm text-white/50">
                          <Clock3 className="h-4 w-4 inline mr-2" />
                          Updated{" "}
                          {new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </section>
                    <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                      {stats.map(({ label, value, icon: Icon, tone }) => (
                        <article
                          key={label}
                          className="bg-white border rounded-2xl p-5"
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <p className="text-xs text-gray-500 font-semibold mt-4">
                            {label}
                          </p>
                          <p className="text-2xl font-extrabold mt-1">
                            {value}
                          </p>
                        </article>
                      ))}
                    </section>
                    <div className="grid xl:grid-cols-[1.4fr_.8fr] gap-6">
                      <section className="bg-white border rounded-2xl overflow-hidden">
                        <div className="p-5 border-b flex justify-between">
                          <div>
                            <h3 className="font-extrabold">
                              Operational queues
                            </h3>
                            <p className="text-xs text-gray-500">
                              Items that need intervention
                            </p>
                          </div>
                          <ShieldCheck className="text-primary" />
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100">
                          {[
                            {
                              label: "Vendor reviews",
                              value: command?.queues.pendingVendors,
                              icon: Store,
                            },
                            {
                              label: "Listing reviews",
                              value: command?.queues.pendingListings,
                              icon: FileCheck2,
                            },
                            {
                              label: "Failed payments",
                              value: command?.queues.failedPayments,
                              icon: AlertTriangle,
                            },
                            {
                              label: "Pending payments",
                              value: command?.queues.pendingPayments,
                              icon: Clock3,
                            },
                            {
                              label: "Delivery issues",
                              value: command?.queues.deliveryIssues,
                              icon: Truck,
                            },
                            {
                              label: "Open production",
                              value: command?.queues.openJobs,
                              icon: Package,
                            },
                          ].map(({ label, value, icon: Icon }) => (
                            <button
                              key={label}
                              className="bg-white p-5 text-left hover:bg-gray-50"
                            >
                              <div className="flex justify-between">
                                <Icon className="h-4 w-4 text-gray-400" />
                                <ChevronRight className="h-4 w-4 text-gray-300" />
                              </div>
                              <p
                                className={`text-2xl font-extrabold mt-4 ${Number(value) > 0 ? "text-primary" : ""}`}
                              >
                                {value ?? 0}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {label}
                              </p>
                            </button>
                          ))}
                        </div>
                      </section>
                      <section className="bg-white border rounded-2xl p-5">
                        <h3 className="font-extrabold">System posture</h3>
                        <div className="mt-5 space-y-4">
                          {[
                            [
                              "Payments API",
                              Number(command?.queues.failedPayments) === 0,
                            ],
                            [
                              "Delivery workflow",
                              Number(command?.queues.deliveryIssues) === 0,
                            ],
                            [
                              "Vendor messaging",
                              mobileSasa?.summary.errors === 0,
                            ],
                            ["Audit logging", true],
                          ].map(([label, healthy]) => (
                            <div
                              key={String(label)}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm">{String(label)}</span>
                              <span
                                className={`flex items-center gap-1 text-xs font-bold ${healthy ? "text-green-600" : "text-amber-600"}`}
                              >
                                {healthy ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4" />
                                )}
                                {healthy ? "Healthy" : "Attention"}
                              </span>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => choose("notifications")}
                          className="mt-6 w-full rounded-xl bg-gray-50 p-3 text-sm font-bold text-primary"
                        >
                          Open incident inbox
                        </button>
                      </section>
                    </div>
                    <div className="grid xl:grid-cols-[1.2fr_1fr] gap-6">
                      <section className="bg-white border rounded-2xl overflow-hidden">
                        <div className="p-5 border-b">
                          <h3 className="font-extrabold">Recent orders</h3>
                        </div>
                        <div className="divide-y">
                          {command?.recentOrders.map((order) => (
                            <div
                              key={order.id}
                              className="p-4 flex items-center justify-between gap-4"
                            >
                              <div>
                                <p className="font-bold text-sm">
                                  {order.orderNumber}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {order.customer.firstName}{" "}
                                  {order.customer.lastName} ·{" "}
                                  {new Date(
                                    order.createdAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-extrabold text-sm">
                                  {order.currency}{" "}
                                  {Number(order.total).toLocaleString()}
                                </p>
                                <p className="text-[10px] text-gray-500 font-bold">
                                  {order.status.replaceAll("_", " ")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                      <section className="bg-white border rounded-2xl overflow-hidden">
                        <div className="p-5 border-b">
                          <h3 className="font-extrabold">Control activity</h3>
                        </div>
                        <div className="divide-y max-h-96 overflow-y-auto">
                          {command?.recentAudit.map((event) => (
                            <div key={event.id} className="p-4 flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <Check className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold">
                                  {event.action.replaceAll("_", " ")}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {event.actor
                                    ? `${event.actor.firstName} ${event.actor.lastName}`
                                    : "System"}{" "}
                                  · {new Date(event.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  </div>
                )}
                {tab === "chat" && (
                  <div className="bg-white border rounded-2xl overflow-hidden h-[calc(100vh-150px)] min-h-[560px] grid md:grid-cols-[320px_1fr]">
                    <aside className="border-r flex flex-col">
                      <div className="p-5 border-b">
                        <h2 className="font-extrabold">
                          Operations conversations
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                          Internal coordination and incidents
                        </p>
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {threads.map((thread) => (
                          <button
                            key={thread.id}
                            onClick={() => setSelectedThread(thread.id)}
                            className={`w-full p-4 border-b text-left ${selectedThread === thread.id ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-gray-50"}`}
                          >
                            <div className="flex justify-between">
                              <p className="font-bold text-sm">
                                {thread.title}
                              </p>
                              <span className="text-[9px] bg-gray-100 rounded px-1.5 py-1">
                                {thread.type}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {thread.messages.at(-1)?.body ??
                                "No messages yet"}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-2">
                              {thread.participants.length} participants
                            </p>
                          </button>
                        ))}
                      </div>
                    </aside>
                    <section className="flex flex-col min-w-0">
                      <header className="h-20 p-5 border-b flex items-center">
                        <div>
                          <h2 className="font-extrabold">
                            {activeThread?.title ?? "Select a conversation"}
                          </h2>
                          <p className="text-xs text-gray-500">
                            {activeThread?.participants
                              .map((p) => p.user.firstName)
                              .join(", ")}
                          </p>
                        </div>
                        <div className="ml-auto flex items-center gap-2 text-xs text-green-600 font-bold">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          Live polling
                        </div>
                      </header>
                      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
                        {activeThread?.messages.map((message) => {
                          const mine = message.sender.id === user?.id;
                          return (
                            <div
                              key={message.id}
                              className={`flex ${mine ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-2xl p-3.5 ${mine ? "bg-primary text-white rounded-br-sm" : "bg-white border rounded-bl-sm"}`}
                              >
                                <p
                                  className={`text-[10px] font-bold mb-1 ${mine ? "text-white/65" : "text-primary"}`}
                                >
                                  {message.sender.firstName}{" "}
                                  {message.sender.lastName} ·{" "}
                                  {message.sender.role}
                                </p>
                                <p className="text-sm whitespace-pre-wrap">
                                  {message.body}
                                </p>
                                <p
                                  className={`text-[9px] mt-2 ${mine ? "text-white/50" : "text-gray-400"}`}
                                >
                                  {new Date(
                                    message.createdAt,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        {!activeThread?.messages.length && (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <MessageSquare className="h-10 w-10 mb-3" />
                            <p className="font-bold">
                              Start the operations conversation
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="p-4 border-t flex gap-2">
                        <Input
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void send();
                          }}
                          placeholder="Message the operations team…"
                        />
                        <Button
                          onClick={() => void send()}
                          disabled={!draft.trim()}
                          className="rounded-xl"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </section>
                  </div>
                )}
                {tab === "notifications" && (
                  <div className="grid xl:grid-cols-[1fr_320px] gap-6">
                    <section className="bg-white border rounded-2xl overflow-hidden">
                      <div className="p-5 border-b flex items-center justify-between">
                        <div>
                          <h2 className="font-extrabold">
                            Notification centre
                          </h2>
                          <p className="text-xs text-gray-500">
                            Dedicated operational alerts and updates
                          </p>
                        </div>
                        {unread > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void readAll()}
                            className="rounded-full"
                          >
                            Mark all read
                          </Button>
                        )}
                      </div>
                      <div className="divide-y">
                        {notices.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => void readNotice(item)}
                            className={`w-full text-left p-5 flex gap-4 hover:bg-gray-50 ${!item.readAt ? "bg-primary/[.025]" : ""}`}
                          >
                            <div
                              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${severityTone[item.severity] ?? severityTone.INFO}`}
                            >
                              {item.severity === "CRITICAL" ? (
                                <AlertTriangle className="h-5 w-5" />
                              ) : (
                                <Bell className="h-5 w-5" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm">
                                  {item.title}
                                </p>
                                {!item.readAt && (
                                  <span className="w-2 h-2 rounded-full bg-primary" />
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {item.body}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-2 uppercase font-bold">
                                {item.category} ·{" "}
                                {new Date(item.createdAt).toLocaleString()}
                              </p>
                            </div>
                            {item.actionUrl && (
                              <ChevronRight className="h-4 w-4 text-gray-300 mt-3" />
                            )}
                          </button>
                        ))}
                        {!notices.length && (
                          <div className="p-16 text-center text-gray-400">
                            <Inbox className="h-10 w-10 mx-auto mb-3" />
                            <p className="font-bold">Inbox clear</p>
                          </div>
                        )}
                      </div>
                    </section>
                    <aside className="space-y-4">
                      <div className="bg-[#171735] text-white rounded-2xl p-6">
                        <p className="text-xs text-white/45 uppercase font-bold">
                          Unread
                        </p>
                        <p className="text-4xl font-extrabold mt-2">{unread}</p>
                        <p className="text-sm text-white/55 mt-2">
                          alerts awaiting review
                        </p>
                      </div>
                      <div className="bg-white border rounded-2xl p-5">
                        <h3 className="font-bold">Severity guide</h3>
                        <div className="mt-4 space-y-3">
                          {Object.entries(severityTone).map(([level, tone]) => (
                            <div
                              key={level}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm">{level}</span>
                              <span
                                className={`w-3 h-3 rounded-full border ${tone}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </aside>
                  </div>
                )}
                {tab === "users" && isSuper && (
                  <section className="space-y-4">
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
                      <p className="font-bold">Superadmin safeguard</p>
                      <p className="mt-1">
                        Your own role, status and password cannot be changed
                        from this table.{" "}
                        <button
                          onClick={() => navigate("/change-password")}
                          className="font-bold text-primary underline underline-offset-2"
                        >
                          Change your own password
                        </button>{" "}
                        on the secure password page.
                      </p>
                    </div>
                    {temporaryPassword && (
                      <div className="rounded-2xl border border-primary/20 bg-pink-50 p-4 text-sm text-[#3a2340]">
                        <p className="font-bold">
                          One-time password created for{" "}
                          {temporaryPassword.email}
                        </p>
                        <p className="mt-1">
                          Share it securely. The user must set a new password at
                          their next sign-in.
                        </p>
                        <code className="mt-3 block w-fit rounded-lg bg-white px-3 py-2 font-bold text-[#171735]">
                          {temporaryPassword.password}
                        </code>
                        <button
                          onClick={() => setTemporaryPassword(null)}
                          className="mt-3 text-xs font-bold text-primary underline"
                        >
                          I have copied it
                        </button>
                      </div>
                    )}
                    <div className="bg-white border rounded-2xl overflow-hidden">
                      <div className="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h2 className="font-extrabold">User governance</h2>
                          <p className="text-xs text-gray-500">
                            Manage roles, access and one-time password resets.
                            Every change is recorded.
                          </p>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search users"
                            className="pl-9 w-72"
                          />
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-sm">
                          <thead className="bg-gray-50 text-gray-500 text-left">
                            <tr>
                              <th className="p-4">Identity</th>
                              <th className="p-4">Role</th>
                              <th className="p-4">Status</th>
                              <th className="p-4">Security</th>
                              <th className="p-4">Joined</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUsers.map((account) => {
                              const edit = userEdits[account.id] ?? {
                                role: account.role,
                                status: account.status,
                              };
                              const changed =
                                edit.role !== account.role ||
                                edit.status !== account.status;
                              const isSelf = account.id === user?.id;
                              return (
                                <tr
                                  key={account.id}
                                  className="border-t align-top"
                                >
                                  <td className="p-4">
                                    <p className="font-bold">
                                      {account.firstName} {account.lastName}
                                      {isSelf && (
                                        <span className="ml-2 text-[10px] text-primary">
                                          YOU
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {account.email}
                                    </p>
                                  </td>
                                  <td className="p-4">
                                    <select
                                      value={edit.role}
                                      disabled={isSelf}
                                      onChange={(event) =>
                                        setUserEdits((current) => ({
                                          ...current,
                                          [account.id]: {
                                            ...edit,
                                            role: event.target.value,
                                          },
                                        }))
                                      }
                                      className="rounded-lg border bg-white px-2.5 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:bg-gray-100"
                                    >
                                      {managedRoles.map((role) => (
                                        <option key={role}>{role}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="p-4">
                                    <select
                                      value={edit.status}
                                      disabled={isSelf}
                                      onChange={(event) =>
                                        setUserEdits((current) => ({
                                          ...current,
                                          [account.id]: {
                                            ...edit,
                                            status: event.target.value,
                                          },
                                        }))
                                      }
                                      className="rounded-lg border bg-white px-2.5 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:bg-gray-100"
                                    >
                                      {managedStatuses.map((status) => (
                                        <option key={status}>{status}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="p-4">
                                    {account.mustChangePassword ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                                        <KeyRound className="h-3.5 w-3.5" />
                                        Password change required
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Secure
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 text-gray-500">
                                    {new Date(
                                      account.createdAt,
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="p-4">
                                    <div className="flex justify-end gap-2">
                                      {isSelf ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            navigate("/change-password")
                                          }
                                          className="rounded-lg"
                                        >
                                          Change password
                                        </Button>
                                      ) : (
                                        <>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={
                                              !changed ||
                                              savingUser === account.id
                                            }
                                            onClick={() =>
                                              void saveUser(account)
                                            }
                                            className="rounded-lg"
                                          >
                                            <Save className="mr-1 h-3.5 w-3.5" />
                                            Save
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={savingUser === account.id}
                                            onClick={() =>
                                              void resetUserPassword(account)
                                            }
                                            className="rounded-lg text-primary"
                                          >
                                            <KeyRound className="mr-1 h-3.5 w-3.5" />
                                            Reset password
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                )}
                {tab === "integrations" && canManage && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-extrabold">
                        Integration health
                      </h2>
                      <p className="text-gray-500 text-sm">
                        Provider status without exposing credentials.
                      </p>
                    </div>
                    <div className="grid sm:grid-cols-4 gap-4">
                      {[
                        ["Vendors", mobileSasa?.summary.vendors],
                        ["Connected", mobileSasa?.summary.connected],
                        ["Healthy", mobileSasa?.summary.healthy],
                        ["Errors", mobileSasa?.summary.errors],
                      ].map(([label, value]) => (
                        <div
                          key={String(label)}
                          className="bg-white border rounded-2xl p-5"
                        >
                          <p className="text-xs text-gray-500">{label}</p>
                          <p className="text-2xl font-extrabold mt-1">
                            {value ?? 0}
                          </p>
                        </div>
                      ))}
                    </div>
                    <section className="bg-white border rounded-2xl overflow-hidden">
                      <div className="p-5 border-b flex justify-between">
                        <div>
                          <h3 className="font-extrabold">
                            MobileSasa vendor connections
                          </h3>
                          <p className="text-xs text-gray-500">
                            Messaging service health
                          </p>
                        </div>
                        <a
                          href={mobileSasa?.settings.portalUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="text-primary" />
                        </a>
                      </div>
                      <div className="divide-y">
                        {mobileSasa?.connections.map((connection) => (
                          <div
                            key={connection.vendorId}
                            className="p-5 flex justify-between"
                          >
                            <div>
                              <p className="font-bold">
                                {connection.vendor.businessName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {connection.senderId} · Last test{" "}
                                {connection.lastTestedAt
                                  ? new Date(
                                      connection.lastTestedAt,
                                    ).toLocaleString()
                                  : "never"}
                              </p>
                            </div>
                            {connection.status === "CONNECTED" ? (
                              <CheckCircle2 className="text-green-600" />
                            ) : (
                              <AlertTriangle className="text-red-600" />
                            )}
                          </div>
                        ))}
                        {!mobileSasa?.connections.length && (
                          <div className="p-12 text-center text-gray-400">
                            No vendor connections yet
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                )}
                {tab === "vendors" && canManage && (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-extrabold">
                          Vendor operations
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Verify trusted providers, review compliance documents
                          and moderate marketplace listings.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => void load()}
                        className="rounded-xl"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh queues
                      </Button>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="bg-white border rounded-2xl p-5">
                        <p className="text-xs font-bold text-gray-500">
                          Pending verification
                        </p>
                        <p className="mt-2 text-3xl font-extrabold text-primary">
                          {compliance.length}
                        </p>
                      </div>
                      <div className="bg-white border rounded-2xl p-5">
                        <p className="text-xs font-bold text-gray-500">
                          Listings awaiting review
                        </p>
                        <p className="mt-2 text-3xl font-extrabold">
                          {listings.length}
                        </p>
                      </div>
                      <div className="bg-white border rounded-2xl p-5">
                        <p className="text-xs font-bold text-gray-500">
                          Verified marketplace vendors
                        </p>
                        <p className="mt-2 text-3xl font-extrabold text-green-600">
                          {
                            vendors.filter((item) => item.status === "VERIFIED")
                              .length
                          }
                        </p>
                      </div>
                    </div>
                    <section className="bg-white border rounded-2xl overflow-hidden">
                      <div className="p-5 border-b">
                        <h3 className="font-extrabold">
                          Compliance review queue
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                          Approve each required document before verifying a
                          provider.
                        </p>
                      </div>
                      <div className="divide-y">
                        {compliance.map((vendor) => {
                          const approved =
                            vendor.verificationDocuments?.filter(
                              (document) => document.status === "APPROVED",
                            ).length ?? 0;
                          const total =
                            vendor.verificationDocuments?.length ?? 0;
                          return (
                            <div key={vendor.id} className="p-5">
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                  <p className="font-bold">
                                    {vendor.businessName}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {vendor.category} · {vendor.city} ·{" "}
                                    {vendor.owner.email}
                                  </p>
                                  <p className="mt-2 text-xs font-bold text-amber-700">
                                    {approved}/{total} documents approved
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    disabled={
                                      approved !== total ||
                                      total === 0 ||
                                      operatingAction === vendor.id
                                    }
                                    onClick={() =>
                                      void decideVendor(vendor, "VERIFY")
                                    }
                                    className="rounded-lg"
                                  >
                                    Verify vendor
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={operatingAction === vendor.id}
                                    onClick={() =>
                                      void decideVendor(vendor, "REJECT")
                                    }
                                    className="rounded-lg"
                                  >
                                    Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={operatingAction === vendor.id}
                                    onClick={() =>
                                      void decideVendor(vendor, "SUSPEND")
                                    }
                                    className="rounded-lg text-red-600"
                                  >
                                    Suspend
                                  </Button>
                                </div>
                              </div>
                              {total > 0 && (
                                <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                  {vendor.verificationDocuments?.map(
                                    (document) => (
                                      <div
                                        key={document.id}
                                        className="rounded-xl border bg-gray-50 p-3"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <p className="text-xs font-bold">
                                              {document.type.replaceAll(
                                                "_",
                                                " ",
                                              )}
                                            </p>
                                            <p
                                              className={`mt-1 text-[10px] font-bold ${document.status === "APPROVED" ? "text-green-600" : document.status === "REJECTED" ? "text-red-600" : "text-amber-700"}`}
                                            >
                                              {document.status}
                                            </p>
                                          </div>
                                          <div className="flex gap-1">
                                            <button
                                              disabled={
                                                operatingAction === document.id
                                              }
                                              onClick={() =>
                                                void reviewDocument(
                                                  vendor.id,
                                                  document,
                                                  "APPROVED",
                                                )
                                              }
                                              className="rounded-md bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700 disabled:opacity-50"
                                            >
                                              Approve
                                            </button>
                                            <button
                                              disabled={
                                                operatingAction === document.id
                                              }
                                              onClick={() =>
                                                void reviewDocument(
                                                  vendor.id,
                                                  document,
                                                  "REJECTED",
                                                )
                                              }
                                              className="rounded-md bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700 disabled:opacity-50"
                                            >
                                              Reject
                                            </button>
                                          </div>
                                        </div>
                                        {document.reviewNotes && (
                                          <p className="mt-2 text-[10px] text-gray-500">
                                            {document.reviewNotes}
                                          </p>
                                        )}
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {!compliance.length && (
                          <div className="p-14 text-center text-sm text-gray-400">
                            No vendor compliance reviews are waiting.
                          </div>
                        )}
                      </div>
                    </section>
                    <section className="bg-white border rounded-2xl overflow-hidden">
                      <div className="p-5 border-b">
                        <h3 className="font-extrabold">
                          Listing moderation queue
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                          Only verified vendors with active subscriptions can
                          publish approved listings.
                        </p>
                      </div>
                      <div className="divide-y">
                        {listings.map((listing) => (
                          <div
                            key={listing.id}
                            className="p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                          >
                            <div>
                              <p className="font-bold">{listing.name}</p>
                              <p className="mt-1 text-xs text-gray-500">
                                {listing.vendor?.businessName ?? "Merry Tales"}{" "}
                                · {listing.category} · KES{" "}
                                {Number(listing.price).toLocaleString()}
                              </p>
                              {listing.moderationReason && (
                                <p className="mt-2 text-xs text-amber-700">
                                  {listing.moderationReason}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                disabled={operatingAction === listing.id}
                                onClick={() =>
                                  void decideListing(listing, "APPROVE")
                                }
                                className="rounded-lg"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={operatingAction === listing.id}
                                onClick={() =>
                                  void decideListing(
                                    listing,
                                    "CHANGES_REQUIRED",
                                  )
                                }
                                className="rounded-lg"
                              >
                                Request changes
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={operatingAction === listing.id}
                                onClick={() =>
                                  void decideListing(listing, "REJECT")
                                }
                                className="rounded-lg text-red-600"
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                        {!listings.length && (
                          <div className="p-14 text-center text-sm text-gray-400">
                            No listings are waiting for moderation.
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                )}
                {tab === "orders" && canManage && (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-extrabold">
                          Orders & delivery
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Monitor every fulfillment, move delivery stages
                          forward and resolve exceptions.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => void load()}
                        className="rounded-xl"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh deliveries
                      </Button>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="bg-white border rounded-2xl p-5">
                        <p className="text-xs font-bold text-gray-500">
                          Active fulfillments
                        </p>
                        <p className="mt-2 text-3xl font-extrabold text-primary">
                          {
                            fulfillments.filter(
                              (item) =>
                                ![
                                  "DELIVERED",
                                  "CANCELLED",
                                  "RETURNED",
                                ].includes(item.status),
                            ).length
                          }
                        </p>
                      </div>
                      <div className="bg-white border rounded-2xl p-5">
                        <p className="text-xs font-bold text-gray-500">
                          Delivery exceptions
                        </p>
                        <p className="mt-2 text-3xl font-extrabold text-red-600">
                          {
                            fulfillments.filter((item) =>
                              [
                                "DELIVERY_FAILED",
                                "RETURN_REQUESTED",
                                "RETURNING",
                              ].includes(item.status),
                            ).length
                          }
                        </p>
                      </div>
                      <div className="bg-white border rounded-2xl p-5">
                        <p className="text-xs font-bold text-gray-500">
                          Delivered
                        </p>
                        <p className="mt-2 text-3xl font-extrabold text-green-600">
                          {
                            fulfillments.filter(
                              (item) => item.status === "DELIVERED",
                            ).length
                          }
                        </p>
                      </div>
                    </div>
                    <section className="bg-white border rounded-2xl overflow-hidden">
                      <div className="p-5 border-b">
                        <h3 className="font-extrabold">
                          Fulfillment control board
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                          Each status transition is validated by the delivery
                          workflow and recorded in the delivery timeline.
                        </p>
                      </div>
                      <div className="divide-y">
                        {fulfillments.map((fulfillment) => {
                          const nextSteps =
                            fulfillmentTransitions[fulfillment.status] ?? [];
                          return (
                            <div
                              key={fulfillment.id}
                              className="p-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
                            >
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-bold">
                                    {fulfillment.order.orderNumber}
                                  </p>
                                  <span
                                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${fulfillment.status === "DELIVERED" ? "bg-green-50 text-green-700" : fulfillment.status === "DELIVERY_FAILED" ? "bg-red-50 text-red-700" : "bg-primary/10 text-primary"}`}
                                  >
                                    {fulfillment.status.replaceAll("_", " ")}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                  {fulfillment.trackingCode} ·{" "}
                                  {fulfillment.vendor?.businessName ??
                                    "Merry Tales fulfillment"}{" "}
                                  · Customer:{" "}
                                  {fulfillment.order.customer.firstName}{" "}
                                  {fulfillment.order.customer.lastName}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  To: {fulfillment.recipientName},{" "}
                                  {fulfillment.county} —{" "}
                                  {fulfillment.addressLine}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {fulfillment.estimatedEnd
                                    ? `ETA ${new Date(fulfillment.estimatedEnd).toLocaleDateString()}`
                                    : "No ETA"}
                                </span>
                                {nextSteps.length > 0 ? (
                                  <select
                                    defaultValue=""
                                    disabled={
                                      operatingAction === fulfillment.id
                                    }
                                    onChange={(event) => {
                                      void moveFulfillment(
                                        fulfillment,
                                        event.target.value,
                                      );
                                      event.currentTarget.value = "";
                                    }}
                                    className="rounded-lg border bg-white px-3 py-2 text-xs font-bold"
                                  >
                                    <option value="">Move to…</option>
                                    {nextSteps.map((status) => (
                                      <option key={status} value={status}>
                                        {status.replaceAll("_", " ")}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-xs font-bold text-gray-400">
                                    Final state
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {!fulfillments.length && (
                          <div className="p-14 text-center text-sm text-gray-400">
                            No fulfillment records are available yet.
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                )}
                {tab === "finance" && canManage && <FinancePanel />}
                {tab === "communications" && isSuper && (
                  <CommunicationCenterPanel />
                )}
                {tab === "customers" && <CustomerSuccessPanel />}
                {tab === "settings" && isSuper && <SystemControlsPanel />}
                {tab === "settings" && !isSuper && (
                  <div className="grid md:grid-cols-2 gap-5">
                    <button
                      onClick={() => choose("overview")}
                      className="bg-white border rounded-2xl p-6 text-left"
                    >
                      <h2 className="font-extrabold">Operational queue</h2>
                      <p className="text-sm text-gray-500 mt-2">
                        This domain is monitored in the command centre with
                        role-scoped actions.
                      </p>
                    </button>
                    <Link
                      to="/admin#integrations"
                      className="bg-[#171735] text-white rounded-2xl p-6"
                    >
                      <ExternalLink className="text-primary" />
                      <h2 className="font-extrabold mt-4">Open integrations</h2>
                      <p className="text-sm text-white/55 mt-2">
                        Review messaging platform health and configuration.
                      </p>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      {tab === "notifications" && isSuper && (
        <section className="fixed bottom-5 right-5 z-20 w-[min(360px,calc(100vw-2.5rem))] rounded-2xl border bg-white p-5 shadow-2xl">
          <h3 className="font-extrabold">Send an update</h3>
          <p className="mt-1 text-xs text-gray-500">
            Send an in-app operations notice to selected account groups.
          </p>
          <div className="mt-4 space-y-3">
            <Input
              value={broadcast.title}
              maxLength={120}
              onChange={(event) =>
                setBroadcast((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Short title"
            />
            <textarea
              value={broadcast.body}
              maxLength={1000}
              onChange={(event) =>
                setBroadcast((current) => ({
                  ...current,
                  body: event.target.value,
                }))
              }
              placeholder="Write the update…"
              className="min-h-24 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={broadcast.severity}
                onChange={(event) =>
                  setBroadcast((current) => ({
                    ...current,
                    severity: event.target.value,
                  }))
                }
                className="rounded-xl border bg-white px-3 py-2 text-xs font-bold"
              >
                {Object.keys(severityTone).map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
              <Input
                value={broadcast.actionUrl}
                maxLength={300}
                onChange={(event) =>
                  setBroadcast((current) => ({
                    ...current,
                    actionUrl: event.target.value,
                  }))
                }
                placeholder="Optional link"
                className="text-xs"
              />
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Recipients
              </p>
              <div className="flex flex-wrap gap-2">
                {managedRoles.map((role) => (
                  <label
                    key={role}
                    className={`cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-bold ${broadcast.roles.includes(role) ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-500"}`}
                  >
                    <input
                      type="checkbox"
                      checked={broadcast.roles.includes(role)}
                      onChange={() => toggleBroadcastRole(role)}
                      className="sr-only"
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>
            <Button
              onClick={() => void sendBroadcast()}
              disabled={
                broadcasting ||
                !broadcast.title.trim() ||
                !broadcast.body.trim() ||
                !broadcast.roles.length
              }
              className="w-full rounded-xl"
            >
              {broadcasting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send notification
            </Button>
            {broadcastResult && (
              <p className="text-xs font-bold text-green-600">
                {broadcastResult}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
