import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, MessageSquare, Settings, Bell, Boxes, WalletCards, Radio, ExternalLink, RefreshCw, Menu, PanelLeftClose, PanelLeftOpen, Search, ChevronDown, Plus, Store, LogOut, HelpCircle, X, ArrowRight, CheckCircle2, Sparkles, Package, Wrench, KeyRound, Layers3, MapPin, Clock3, Trash2, Truck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { VendorDeliveries } from "./VendorDeliveries";
import { VendorSales } from "./VendorSales";
import { useAuth } from "@/contexts/AuthContext";

interface VendorAccount {
  businessName: string;
  slug?: string;
  status: string;
  rating: number;
  reviewCount: number;
  description?: string;
  category: string;
  city: string;
  whatsapp?: string;
  startingPrice?: number;
}
interface VendorMessage {
  id: string;
  body: string;
  createdAt: string;
}
interface VendorLead {
  id: string;
  name: string;
  eventDate?: string;
  message: string;
  status: string;
  createdAt: string;
  conversation?: { messages: VendorMessage[] };
}
interface MarketplaceListing {
  id: string;
  name: string;
  category: string;
  listingType: "PRODUCT" | "SERVICE" | "RENTAL" | "PACKAGE";
  priceUnit: string;
  price: number;
  stockQuantity?: number;
  minimumOrder: number;
  leadTimeDays: number;
  serviceArea?: string;
  isActive: boolean;
}
interface SmsConnection {
  senderId: string;
  tokenLastFour: string;
  status: string;
  lastTestedAt?: string;
  lastSuccessfulSendAt?: string;
  lastError?: string;
  updatedAt: string;
}
interface SmsBalance {
  smsBalance: number;
  walletBalance: number;
  emailBalance: number;
  internationalBalance: number;
  accountNumber: string | null;
}
interface SmsPlatformSettings {
  enabled: boolean;
  agentRegistrationUrl: string;
  portalUrl: string;
  docsUrl: string;
  supportEmail: string;
  minimumWalletTopUp: number;
  onboardingNote: string;
}
interface MarketplaceCategory {
  name: string;
  slug: string;
  subcategories: readonly string[];
}

export function VendorDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [vendor, setVendor] = useState<VendorAccount | null>(null);
  const [leads, setLeads] = useState<VendorLead[]>([]);
  const [draft, setDraft] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [notice, setNotice] = useState("");
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [smsConnection, setSmsConnection] = useState<SmsConnection | null>(null);
  const [smsBalance, setSmsBalance] = useState<SmsBalance | null>(null);
  const [smsForm, setSmsForm] = useState({
    apiToken: "",
    senderId: "",
    testPhone: "",
  });
  const [topUp, setTopUp] = useState({ phone: "", amount: "500" });
  const [smsNotice, setSmsNotice] = useState("");
  const [smsError, setSmsError] = useState("");
  const [smsBusy, setSmsBusy] = useState(false);
  const [smsPlatform, setSmsPlatform] = useState<SmsPlatformSettings>({
    enabled: true,
    agentRegistrationUrl: "https://account.mobilesasa.com/",
    portalUrl: "https://account.mobilesasa.com/",
    docsUrl: "https://docs.mobilesasa.com/",
    supportEmail: "support@mobilesasa.com",
    minimumWalletTopUp: 500,
    onboardingNote: "Create your MobileSasa account, buy SMS units, create a scoped API token, then connect it to Merry Tales.",
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("vendor_sidebar_collapsed") === "true");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [sidebarAccountOpen, setSidebarAccountOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [marketplaceCategories, setMarketplaceCategories] = useState<MarketplaceCategory[]>([]);
  const [listingDepartment, setListingDepartment] = useState("");
  const [listingBusy, setListingBusy] = useState(false);
  const [profileStep, setProfileStep] = useState(0);
  const [listingError, setListingError] = useState("");
  const [listingNotice, setListingNotice] = useState("");
  const [listingDraft, setListingDraft] = useState({
    name: "",
    description: "",
    terms: "",
    category: "",
    listingType: "SERVICE",
    priceUnit: "EVENT",
    price: "",
    stockQuantity: "",
    minimumOrder: "1",
    leadTimeDays: "0",
    serviceArea: "Kenya",
    depositAmount: "",
  });
  const updateLead = async (id: string, status: string) => {
    const updated = await apiRequest<VendorLead>(`/leads/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, ...updated, conversation: lead.conversation } : lead)));
  };
  const sendMessage = async () => {
    if (!selectedLeadId || !draft.trim()) return;
    const message = await apiRequest<VendorMessage>(`/leads/${selectedLeadId}/messages`, { method: "POST", body: JSON.stringify({ body: draft }) });
    setLeads((current) =>
      current.map((lead) =>
        lead.id === selectedLeadId
          ? {
              ...lead,
              conversation: {
                messages: [...(lead.conversation?.messages ?? []), message],
              },
            }
          : lead,
      ),
    );
    setDraft("");
  };
  const saveProfile = async () => {
    if (!vendor) return;
    const updated = await apiRequest<VendorAccount>("/vendors/account/me", {
      method: "PATCH",
      body: JSON.stringify({
        businessName: vendor.businessName,
        description: vendor.description || null,
        category: vendor.category,
        city: vendor.city,
        whatsapp: vendor.whatsapp || null,
        startingPrice: vendor.startingPrice || null,
      }),
    });
    setVendor(updated);
    setNotice("Storefront profile saved.");
  };
  const addListing = async () => {
    if (!listingDraft.name || !listingDraft.category) return;
    setListingBusy(true);
    setListingError("");
    setListingNotice("");
    try {
      const created = await apiRequest<MarketplaceListing>("/products/vendor", {
        method: "POST",
        body: JSON.stringify({
          ...listingDraft,
          description: listingDraft.description || null,
          terms: listingDraft.terms || null,
          price: Number(listingDraft.price || 0),
          stockQuantity: listingDraft.stockQuantity ? Number(listingDraft.stockQuantity) : null,
          minimumOrder: Number(listingDraft.minimumOrder),
          leadTimeDays: Number(listingDraft.leadTimeDays),
          depositAmount: listingDraft.depositAmount ? Number(listingDraft.depositAmount) : null,
          currency: "KES",
          isDigital: false,
          isActive: true,
        }),
      });
      setListings((current) => [created, ...current]);
      setListingDraft({
        ...listingDraft,
        name: "",
        description: "",
        terms: "",
        price: "",
        stockQuantity: "",
        depositAmount: "",
      });
      setListingNotice("Listing saved as a draft. You can review it before submitting for approval.");
    } catch (cause) {
      setListingError(cause instanceof Error ? cause.message : "Unable to save listing.");
    } finally {
      setListingBusy(false);
    }
  };
  const removeListing = async (id: string) => {
    await apiRequest(`/products/vendor/${id}`, { method: "DELETE" });
    setListings((current) => current.filter((listing) => listing.id !== id));
  };
  const refreshSmsBalance = async () => {
    setSmsError("");
    try {
      setSmsBalance(await apiRequest<SmsBalance>("/vendors/account/sms/balance"));
    } catch (cause) {
      setSmsError(cause instanceof Error ? cause.message : "Unable to load MobileSasa balances.");
    }
  };
  const saveSmsConnection = async () => {
    if (!smsForm.apiToken || !smsForm.senderId) return;
    setSmsBusy(true);
    setSmsError("");
    setSmsNotice("");
    try {
      const connection = await apiRequest<SmsConnection>("/vendors/account/sms", {
        method: "PUT",
        body: JSON.stringify({
          apiToken: smsForm.apiToken,
          senderId: smsForm.senderId,
        }),
      });
      setSmsConnection(connection);
      setSmsForm((current) => ({
        ...current,
        apiToken: "",
        senderId: connection.senderId,
      }));
      setSmsNotice("MobileSasa account connected securely.");
      await refreshSmsBalance();
    } catch (cause) {
      setSmsError(cause instanceof Error ? cause.message : "Unable to connect MobileSasa.");
    } finally {
      setSmsBusy(false);
    }
  };
  const sendTestSms = async () => {
    if (!smsForm.testPhone) return;
    setSmsBusy(true);
    setSmsError("");
    setSmsNotice("");
    try {
      await apiRequest("/vendors/account/sms/test", {
        method: "POST",
        body: JSON.stringify({ phone: smsForm.testPhone }),
      });
      setSmsNotice("Test SMS accepted by MobileSasa.");
      await refreshSmsBalance();
    } catch (cause) {
      setSmsError(cause instanceof Error ? cause.message : "Test SMS failed.");
    } finally {
      setSmsBusy(false);
    }
  };
  const topUpWallet = async () => {
    if (!topUp.phone || !topUp.amount) return;
    setSmsBusy(true);
    setSmsError("");
    setSmsNotice("");
    try {
      const result = await apiRequest<{ message: string }>("/vendors/account/sms/wallet/top-up", {
        method: "POST",
        body: JSON.stringify({
          phone: topUp.phone,
          amount: Number(topUp.amount),
        }),
      });
      setSmsNotice(result.message || "M-Pesa prompt sent. Complete it on your phone, then refresh the balance.");
    } catch (cause) {
      setSmsError(cause instanceof Error ? cause.message : "Unable to start wallet top-up.");
    } finally {
      setSmsBusy(false);
    }
  };
  useEffect(() => {
    Promise.all([apiRequest<VendorAccount>("/vendors/account/me"), apiRequest<VendorLead[]>("/leads/vendor"), apiRequest<MarketplaceListing[]>("/products/vendor/mine"), apiRequest<SmsConnection | null>("/vendors/account/sms"), apiRequest<SmsPlatformSettings>("/vendors/account/sms/platform-settings"), apiRequest<MarketplaceCategory[]>("/products/categories")])
      .then(([account, inquiries, shopListings, connection, platform, categories]) => {
        setVendor(account);
        setLeads(inquiries);
        setListings(shopListings);
        setSmsConnection(connection);
        setSmsPlatform(platform);
        setMarketplaceCategories(categories);
        setTopUp((current) => ({
          ...current,
          amount: String(platform.minimumWalletTopUp),
        }));
        if (connection) {
          setSmsForm((current) => ({
            ...current,
            senderId: connection.senderId,
          }));
          void refreshSmsBalance();
        }
      })
      .catch((cause) => setDashboardError(cause instanceof Error ? cause.message : "Unable to load your vendor workspace."))
      .finally(() => setDashboardLoading(false));
  }, []);

  const initials = (vendor?.businessName ?? "Vendor Partner")
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  const profileChecks = [Boolean(vendor?.description), Boolean(vendor?.whatsapp), Boolean(vendor?.startingPrice), listings.length > 0, Boolean(smsConnection)];
  const profileCompletion = Math.round((profileChecks.filter(Boolean).length / profileChecks.length) * 100);
  const profileSteps = ["Essentials", "Contact & price", "Your story"];
  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    {
      id: "leads",
      label: "Leads & inquiries",
      icon: Users,
      badge: leads.filter((lead) => lead.status === "NEW").length,
    },
    { id: "calendar", label: "Availability", icon: Calendar },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "profile", label: "Premium shop", icon: Settings },
    { id: "listings", label: "Products & services", icon: Boxes },
    { id: "sales", label: "Quotes & invoices", icon: FileText },
    { id: "deliveries", label: "Delivery desk", icon: Truck },
    { id: "sms", label: "MobileSasa SMS", icon: Radio },
  ];
  const selectTab = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    setQuickMenuOpen(false);
  };
  const toggleSidebar = () =>
    setSidebarCollapsed((current) => {
      localStorage.setItem("vendor_sidebar_collapsed", String(!current));
      return !current;
    });
  const requestLogout = () => {
    setAccountMenuOpen(false);
    setSidebarAccountOpen(false);
    setLogoutOpen(true);
  };
  const confirmLogout = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen bg-[#f7f7fa] overflow-hidden font-sans text-[#171735]">
      {mobileMenuOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-[#10102a]/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200" onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} ${sidebarCollapsed ? "md:w-[84px]" : "md:w-[280px]"} fixed md:relative inset-y-0 left-0 z-40 flex w-[280px] shrink-0 flex-col bg-[#171735] text-white transition-[width,transform] duration-300 ease-out md:translate-x-0`}>
        <div className={`h-20 border-b border-white/10 flex items-center ${sidebarCollapsed ? "justify-center px-3" : "px-6"}`}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
            <Store className="h-4 w-4" />
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3 animate-in fade-in duration-200">
              <p className="font-bold text-sm">Vendor workspace</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">Merry Tales partner</p>
            </div>
          )}
          <button className="ml-auto md:hidden rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <button onClick={() => setSidebarAccountOpen((current) => !current)} className={`relative mx-3 mt-4 flex items-center rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition-colors hover:bg-white/[0.08] ${sidebarCollapsed ? "justify-center" : ""}`}>
          <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-[#a82672] flex items-center justify-center font-extrabold shadow-lg shadow-primary/20">{initials}</div>
          {!sidebarCollapsed && (
            <>
              <div className="ml-3 min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{vendor?.businessName ?? "Vendor workspace"}</p>
                <p className="mt-0.5 truncate text-[11px] uppercase tracking-wider text-white/45">{vendor?.status.replaceAll("_", " ") ?? "Partner account"}</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${sidebarAccountOpen ? "rotate-180" : ""}`} />
            </>
          )}
        </button>
        {sidebarAccountOpen && !sidebarCollapsed && (
          <div className="absolute left-3 right-3 top-[146px] z-50 overflow-hidden rounded-2xl border border-white/10 bg-[#222244] p-1 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <button onClick={() => selectTab("profile")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/75 hover:bg-white/10 hover:text-white">
              <Store className="h-4 w-4" />
              Storefront profile
            </button>
            <button onClick={() => selectTab("sms")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/75 hover:bg-white/10 hover:text-white">
              <Radio className="h-4 w-4" />
              MobileSasa
            </button>
            <a href={`mailto:${smsPlatform.supportEmail}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/75 hover:bg-white/10 hover:text-white">
              <HelpCircle className="h-4 w-4" />
              Help & support
            </a>
            <div className="my-1 border-t border-white/10" />
            <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white">
              <ExternalLink className="h-4 w-4" />
              Visit main site
            </Link>
            <button onClick={requestLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-300 hover:bg-red-400/10 hover:text-red-200">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1.5">
          {navItems.map(({ id, label, icon: Icon, badge }) => (
            <button key={id} title={sidebarCollapsed ? label : undefined} onClick={() => selectTab(id)} className={`group w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${sidebarCollapsed ? "justify-center px-2 py-3" : "px-3.5 py-3"} ${activeTab === id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/60 hover:bg-white/[0.07] hover:text-white"}`}>
              <Icon className={`h-[19px] w-[19px] shrink-0 ${!sidebarCollapsed ? "mr-3" : ""}`} />
              {!sidebarCollapsed && (
                <>
                  <span className="truncate">{label}</span>
                  {Boolean(badge) && <span className="ml-auto min-w-5 rounded-full bg-white/15 px-1.5 py-0.5 text-center text-[10px] font-bold">{badge}</span>}
                </>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button onClick={toggleSidebar} className="hidden md:flex w-full items-center justify-center rounded-xl p-3 text-white/50 hover:bg-white/[0.07] hover:text-white">
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <>
                <PanelLeftClose className="h-5 w-5 mr-3" />
                <span className="text-sm">Collapse sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white/90 backdrop-blur-xl border-b border-[#e9e9ef] flex items-center justify-between px-4 sm:px-6 z-20 shrink-0">
          <div className="flex min-w-0 items-center gap-3">
            <button className="md:hidden rounded-xl border p-2.5 text-gray-600" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="hidden sm:block text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">Vendor workspace</p>
              <h2 className="truncate font-extrabold text-lg capitalize">{navItems.find((item) => item.id === activeTab)?.label ?? activeTab}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="hidden lg:flex w-64 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-sm text-gray-400 hover:border-gray-300 hover:bg-white">
              <Search className="h-4 w-4" />
              <span className="flex-1">Search workspace</span>
              <kbd className="rounded border bg-white px-1.5 py-0.5 text-[10px]">⌘K</kbd>
            </button>
            <div className="relative">
              <button onClick={() => setQuickMenuOpen((current) => !current)} className="hidden sm:flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform">
                <Plus className="h-4 w-4" />
                Create
              </button>
              {quickMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-52 rounded-2xl border bg-white p-1.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <button onClick={() => selectTab("leads")} className="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-gray-50">
                    Review new leads
                  </button>
                  <button onClick={() => selectTab("listings")} className="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-gray-50">
                    Create listing
                  </button>
                  <button onClick={() => selectTab("calendar")} className="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-gray-50">
                    Update availability
                  </button>
                  <button onClick={() => selectTab("sms")} className="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-gray-50">
                    Send SMS
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => selectTab("sms")} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-gray-700 hover:border-primary/40 hover:text-primary transition-colors" title="MobileSasa wallet">
              <WalletCards className="h-4 w-4" />
              <span className="hidden xl:inline">{smsBalance ? `KSh ${smsBalance.walletBalance.toLocaleString()}` : "SMS wallet"}</span>
            </button>
            <button className="relative rounded-xl p-2.5 text-gray-500 hover:bg-gray-100 hover:text-primary">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <div className="relative">
              <button onClick={() => setAccountMenuOpen((current) => !current)} aria-label="Open account menu" className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#24244d] to-[#171735] text-sm font-extrabold text-white shadow-sm">
                {initials}
              </button>
              {accountMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border bg-white p-1.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="border-b px-3 py-3">
                    <p className="truncate text-sm font-bold">{vendor?.businessName ?? "Vendor workspace"}</p>
                    <p className="mt-0.5 text-xs uppercase tracking-wide text-gray-500">{vendor?.status.replaceAll("_", " ") ?? "Partner account"}</p>
                  </div>
                  <button onClick={() => selectTab("profile")} className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-gray-50">
                    <Store className="h-4 w-4" />
                    Storefront profile
                  </button>
                  <button onClick={() => selectTab("sms")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-gray-50">
                    <Radio className="h-4 w-4" />
                    MobileSasa
                  </button>
                  <a href={`mailto:${smsPlatform.supportEmail}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-gray-50">
                    <HelpCircle className="h-4 w-4" />
                    Help & support
                  </a>
                  <div className="my-1 border-t" />
                  <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-gray-50">
                    <ExternalLink className="h-4 w-4" />
                    Visit main site
                  </Link>
                  <button onClick={requestLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
          {activeTab === "overview" && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
              {dashboardLoading ? (
                <div className="space-y-5">
                  <div className="h-28 rounded-2xl bg-white border animate-pulse" />
                  <div className="grid md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-32 rounded-2xl bg-white border animate-pulse" />
                    ))}
                  </div>
                  <div className="h-64 rounded-2xl bg-white border animate-pulse" />
                </div>
              ) : dashboardError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                  <h3 className="font-bold text-red-800">We couldn’t load your workspace</h3>
                  <p className="mt-1 text-sm text-red-700">{dashboardError}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {dashboardError.toLowerCase().includes("vendor profile not found") && (
                      <Button onClick={() => navigate("/vendor/join")}>
                        Complete vendor setup
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      Try again
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <section className="relative overflow-hidden rounded-2xl border border-[#e6e6ed] bg-white px-5 py-6 md:px-7 md:py-7">
                    <div className="absolute -right-16 -top-24 h-56 w-56 rounded-full bg-primary/[0.07] blur-2xl" />
                    <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                          <Sparkles className="h-4 w-4" />
                          Today at a glance
                        </div>
                        <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">Welcome back, {vendor?.businessName ?? "partner"}</h1>
                        <p className="mt-1.5 text-sm text-gray-500">{leads.filter((lead) => lead.status === "NEW").length ? `You have ${leads.filter((lead) => lead.status === "NEW").length} new ${leads.filter((lead) => lead.status === "NEW").length === 1 ? "inquiry" : "inquiries"} waiting for a response.` : "Your workspace is clear. Keep your storefront fresh to attract the next customer."}</p>
                      </div>
                      <Button onClick={() => selectTab(leads.some((lead) => lead.status === "NEW") ? "leads" : "listings")} className="shrink-0 rounded-xl shadow-lg shadow-primary/20">
                        {leads.some((lead) => lead.status === "NEW") ? "Review new leads" : "Improve storefront"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </section>
                  <div className="grid lg:grid-cols-[1fr_340px] gap-5">
                    <div className="space-y-5">
                      <section className="grid grid-cols-2 md:grid-cols-4 overflow-hidden rounded-2xl border border-[#e6e6ed] bg-white">
                        {[
                          {
                            label: "New leads",
                            value: leads.filter((lead) => lead.status === "NEW").length,
                            caption: "Need a response",
                          },
                          {
                            label: "Won leads",
                            value: leads.filter((lead) => lead.status === "WON").length,
                            caption: "Converted",
                          },
                          {
                            label: "Live listings",
                            value: listings.filter((item) => item.isActive).length,
                            caption: "In your storefront",
                          },
                          {
                            label: "Rating",
                            value: vendor?.reviewCount ? Number(vendor.rating).toFixed(1) : "—",
                            caption: `${vendor?.reviewCount ?? 0} verified reviews`,
                          },
                        ].map((metric, index) => (
                          <article key={metric.label} className={`p-5 md:p-6 ${index % 2 === 0 ? "border-r" : ""} ${index < 2 ? "border-b md:border-b-0" : ""} md:border-r md:last:border-r-0 border-[#ececf1]`}>
                            <p className="text-xs font-semibold text-gray-500">{metric.label}</p>
                            <p className="mt-2 text-2xl font-extrabold tabular-nums">{metric.value}</p>
                            <p className="mt-1 text-[11px] text-gray-400">{metric.caption}</p>
                          </article>
                        ))}
                      </section>
                      <section className="overflow-hidden rounded-2xl border border-[#e6e6ed] bg-white">
                        <div className="flex items-center justify-between border-b border-[#ededf2] px-5 py-4">
                          <div>
                            <h3 className="font-bold">Recent inquiries</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Your latest customer opportunities</p>
                          </div>
                          {leads.length > 0 && (
                            <button className="text-sm font-bold text-primary hover:underline" onClick={() => selectTab("leads")}>
                              View all
                            </button>
                          )}
                        </div>
                        {leads.length === 0 ? (
                          <div className="flex flex-col items-center px-6 py-12 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary">
                              <Users className="h-6 w-6" />
                            </div>
                            <h4 className="mt-4 font-bold">Prepare for your first inquiry</h4>
                            <p className="mt-1 max-w-sm text-sm text-gray-500">A complete storefront with clear packages helps customers understand what makes your business special.</p>
                            <Button variant="outline" className="mt-5 rounded-xl" onClick={() => selectTab(listings.length ? "profile" : "listings")}>
                              {listings.length ? "Complete storefront" : "Publish your first listing"}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="divide-y divide-[#ededf2]">
                            {leads.slice(0, 5).map((lead) => (
                              <button
                                key={lead.id}
                                onClick={() => {
                                  setSelectedLeadId(lead.id);
                                  selectTab("leads");
                                }}
                                className="group flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-[#fafafd] transition-colors"
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0eff9] text-sm font-extrabold text-[#56527d]">{lead.name.slice(0, 2).toUpperCase()}</div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-bold">{lead.name}</p>
                                  <p className="mt-0.5 truncate text-xs text-gray-500">{lead.message}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${lead.status === "NEW" ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600"}`}>{lead.status}</span>
                                  <p className="mt-1.5 text-[10px] text-gray-400">{new Date(lead.createdAt).toLocaleDateString()}</p>
                                </div>
                                <ArrowRight className="hidden h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 sm:block" />
                              </button>
                            ))}
                          </div>
                        )}
                      </section>
                    </div>
                    <aside className="space-y-5">
                      <section className="rounded-2xl bg-[#171735] p-5 text-white shadow-xl shadow-[#171735]/10">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/45">Storefront readiness</p>
                            <p className="mt-2 text-3xl font-extrabold tabular-nums">{profileCompletion}%</p>
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out" style={{ width: `${profileCompletion}%` }} />
                        </div>
                        <div className="mt-5 space-y-2.5 text-xs">
                          {[
                            {
                              label: "Business description",
                              done: Boolean(vendor?.description),
                            },
                            {
                              label: "WhatsApp contact",
                              done: Boolean(vendor?.whatsapp),
                            },
                            {
                              label: "Starting price",
                              done: Boolean(vendor?.startingPrice),
                            },
                            {
                              label: "Published listing",
                              done: listings.length > 0,
                            },
                            {
                              label: "MobileSasa connected",
                              done: Boolean(smsConnection),
                            },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center gap-2">
                              <span className={`flex h-4 w-4 items-center justify-center rounded-full ${item.done ? "bg-green-400 text-[#171735]" : "border border-white/25"}`}>{item.done && <CheckCircle2 className="h-3 w-3" />}</span>
                              <span className={item.done ? "text-white/55 line-through" : "text-white/85"}>{item.label}</span>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => selectTab(profileCompletion < 60 ? "profile" : listings.length ? "sms" : "listings")} className="mt-5 flex w-full items-center justify-center rounded-xl bg-white px-3 py-2.5 text-sm font-bold text-[#171735] hover:bg-white/90">
                          Continue setup
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </button>
                      </section>
                      <section className="rounded-2xl border border-[#e6e6ed] bg-white p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-gray-500">MobileSasa</p>
                            <p className="mt-1 font-bold">{smsConnection ? "Account connected" : "Not connected"}</p>
                          </div>
                          <span className={`h-2.5 w-2.5 rounded-full ${smsConnection?.status === "CONNECTED" ? "bg-green-500 shadow-[0_0_0_4px_rgba(34,197,94,.12)]" : "bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,.14)]"}`} />
                        </div>
                        <div className="mt-4 flex items-end justify-between">
                          <div>
                            <p className="text-[11px] text-gray-400">SMS units</p>
                            <p className="mt-0.5 text-xl font-extrabold tabular-nums">{smsBalance?.smsBalance.toLocaleString() ?? "—"}</p>
                          </div>
                          <button onClick={() => selectTab("sms")} className="text-xs font-bold text-primary">
                            Manage
                          </button>
                        </div>
                      </section>
                    </aside>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "leads" && (
            <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-border-soft overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold">Lead pipeline</h3>
                <p className="text-sm text-gray-500">Respond to every enquiry and keep its stage current.</p>
              </div>
              {leads.length === 0 ? (
                <div className="p-10 text-center text-gray-500">No enquiries yet.</div>
              ) : (
                leads.map((lead) => (
                  <div key={lead.id} className="p-6 border-b last:border-0 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold">{lead.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{lead.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{lead.eventDate ? new Date(lead.eventDate).toLocaleDateString() : "Date not supplied"}</p>
                    </div>
                    <select value={lead.status} onChange={(event) => void updateLead(lead.id, event.target.value)} className="border rounded-xl px-3 py-2 text-sm font-semibold">
                      <option>NEW</option>
                      <option>CONTACTED</option>
                      <option>QUOTED</option>
                      <option>WON</option>
                      <option>LOST</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          )}
          {activeTab === "calendar" && (
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-3xl border p-6">
                <h3 className="text-xl font-bold mb-1">Upcoming event dates</h3>
                <p className="text-sm text-gray-500 mb-6">Dates supplied by couples in your enquiry pipeline.</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {leads.filter((lead) => lead.eventDate).length ? (
                    leads
                      .filter((lead) => lead.eventDate)
                      .sort((a, b) => +new Date(a.eventDate!) - +new Date(b.eventDate!))
                      .map((lead) => (
                        <div key={lead.id} className="rounded-2xl border p-4 flex items-center gap-4">
                          <div className="bg-primary/10 text-primary rounded-xl p-3 font-bold">{new Date(lead.eventDate!).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                          <div>
                            <h4 className="font-bold">{lead.name}</h4>
                            <p className="text-sm text-gray-500">{lead.status.replaceAll("_", " ")}</p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-500">No event dates have been supplied yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === "messages" && (
            <div className="max-w-5xl mx-auto grid md:grid-cols-[280px_1fr] bg-white rounded-3xl border min-h-[520px] overflow-hidden">
              <aside className="border-r">
                {leads.map((lead) => (
                  <button key={lead.id} onClick={() => setSelectedLeadId(lead.id)} className={`w-full text-left p-4 border-b ${selectedLeadId === lead.id ? "bg-primary/5" : ""}`}>
                    <strong>{lead.name}</strong>
                    <p className="text-xs text-gray-500 truncate">{lead.conversation?.messages.at(-1)?.body ?? lead.message}</p>
                  </button>
                ))}
              </aside>
              <section className="p-6 flex flex-col">
                {selectedLeadId ? (
                  <>
                    <div className="flex-1 space-y-3 overflow-y-auto">
                      {leads
                        .find((lead) => lead.id === selectedLeadId)
                        ?.conversation?.messages.map((message) => (
                          <div key={message.id} className="ml-auto max-w-[80%] bg-primary text-white rounded-2xl rounded-br-sm p-3 text-sm">
                            {message.body}
                          </div>
                        ))}
                      {!leads.find((lead) => lead.id === selectedLeadId)?.conversation?.messages.length && <p className="text-center text-gray-400 mt-20">Start the conversation with a helpful response.</p>}
                    </div>
                    <div className="flex gap-2 pt-4 border-t">
                      <Input
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") void sendMessage();
                        }}
                        placeholder="Write a response…"
                      />
                      <Button onClick={() => void sendMessage()}>Send</Button>
                    </div>
                  </>
                ) : (
                  <p className="m-auto text-gray-500">Select an enquiry to message.</p>
                )}
              </section>
            </div>
          )}
          {activeTab === "deliveries" && <VendorDeliveries />}
          {activeTab === "sales" && <VendorSales />}
          {activeTab === "profile" && vendor?.slug && (
            <div className="mx-auto mb-4 flex max-w-7xl flex-col gap-3 rounded-2xl border border-primary/15 bg-primary/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-extrabold text-[#171735]">Your customer-facing premium shop is ready to preview.</p>
                <p className="mt-0.5 text-xs text-gray-500">Open it in a new tab, or share its link on WhatsApp and social media.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/vendors/${vendor.slug}`} target="_blank" className="inline-flex h-10 items-center rounded-xl border bg-white px-3.5 text-sm font-bold text-[#171735] transition hover:border-primary/35 hover:text-primary">
                  Preview storefront
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/vendors/${vendor.slug}`;
                    if (navigator.share) {
                      void navigator
                        .share({
                          title: vendor.businessName,
                          text: `Visit ${vendor.businessName} on Merry Tales`,
                          url,
                        })
                        .catch(() => undefined);
                    } else {
                      void navigator.clipboard.writeText(url).then(() => setNotice("Storefront link copied."));
                    }
                  }}
                  className="inline-flex h-10 items-center rounded-xl bg-primary px-3.5 text-sm font-bold text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90"
                >
                  Share shop
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          {activeTab === "profile" && vendor && (
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-primary">
                    <Sparkles className="h-4 w-4" />
                    Premium shop studio
                  </p>
                  <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Make your storefront unmistakably yours.</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Complete the details couples need, then see exactly how your shop presents across Merry Tales.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border bg-white px-4 py-3 text-right shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[.14em] text-gray-400">Shop readiness</p>
                    <p className="mt-1 text-xl font-extrabold text-[#171735]">{profileCompletion}%</p>
                  </div>
                  {vendor.slug && (
                    <Link to={`/vendors/${vendor.slug}`} target="_blank" className="inline-flex h-11 items-center rounded-xl border bg-white px-4 text-sm font-bold text-[#171735] shadow-sm transition hover:border-primary/35 hover:text-primary">
                      Preview shop
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <section className="overflow-hidden rounded-[28px] border border-[#e7e6ef] bg-white shadow-[0_18px_55px_rgba(24,23,53,.06)]">
                  <div className="border-b border-[#eeeef4] bg-[radial-gradient(circle_at_top_right,rgba(232,62,131,.13),transparent_32%),linear-gradient(135deg,#fff7fb,#faf8ff)] px-5 py-6 sm:px-7">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Storefront setup</p>
                        <h2 className="mt-1 text-xl font-extrabold">Build your premium business page</h2>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-500 shadow-sm">
                        Step {profileStep + 1} of {profileSteps.length}
                      </span>
                    </div>
                    <div className="mt-6 grid grid-cols-3 gap-2">
                      {profileSteps.map((label, index) => (
                        <button key={label} type="button" onClick={() => setProfileStep(index)} className={`rounded-xl px-2 py-2.5 text-left transition ${profileStep === index ? "bg-[#171735] text-white shadow-lg" : "bg-white/75 text-gray-500 hover:bg-white"}`}>
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold ${profileStep === index ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>{index + 1}</span>
                          <span className="mt-2 block truncate text-[11px] font-bold">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-5 sm:p-7">
                    <div className="min-h-[360px]">
                      {profileStep === 0 && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          <div>
                            <h3 className="text-lg font-extrabold">The essentials</h3>
                            <p className="mt-1 text-sm text-gray-500">These are the first details a customer uses to recognise your shop.</p>
                          </div>
                          <div className="grid gap-5 md:grid-cols-2">
                            <label className="text-sm font-bold text-[#25253f]">
                              Business name
                              <Input
                                value={vendor.businessName}
                                onChange={(e) =>
                                  setVendor({
                                    ...vendor,
                                    businessName: e.target.value,
                                  })
                                }
                                placeholder="Your business name"
                                className="mt-2 h-12 rounded-xl bg-[#fcfbfe]"
                              />
                              <span className="mt-1.5 block text-xs font-normal text-gray-400">Use the name customers know you by.</span>
                            </label>
                            <label className="text-sm font-bold text-[#25253f]">
                              Primary category
                              <select
                                value={vendor.category}
                                onChange={(e) =>
                                  setVendor({
                                    ...vendor,
                                    category: e.target.value,
                                  })
                                }
                                className="mt-2 h-12 w-full rounded-xl border border-input bg-[#fcfbfe] px-3 text-sm font-medium"
                              >
                                <option value="">Choose your category</option>
                                {marketplaceCategories.map((item) => (
                                  <option key={item.slug} value={item.name}>
                                    {item.name}
                                  </option>
                                ))}
                              </select>
                              <span className="mt-1.5 block text-xs font-normal text-gray-400">This shapes where customers discover you.</span>
                            </label>
                            <label className="text-sm font-bold text-[#25253f] md:col-span-2">
                              Your primary city
                              <Input value={vendor.city} onChange={(e) => setVendor({ ...vendor, city: e.target.value })} placeholder="Nairobi" className="mt-2 h-12 rounded-xl bg-[#fcfbfe]" />
                              <span className="mt-1.5 block text-xs font-normal text-gray-400">You can still list wider delivery or service areas on each offer.</span>
                            </label>
                          </div>
                        </div>
                      )}
                      {profileStep === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          <div>
                            <h3 className="text-lg font-extrabold">Contact and pricing</h3>
                            <p className="mt-1 text-sm text-gray-500">Make it easy for serious customers to reach you and understand your price point.</p>
                          </div>
                          <div className="grid gap-5 md:grid-cols-2">
                            <label className="text-sm font-bold text-[#25253f]">
                              WhatsApp number
                              <div className="mt-2 flex overflow-hidden rounded-xl border border-input bg-[#fcfbfe] focus-within:ring-2 focus-within:ring-primary/15">
                                <span className="flex items-center border-r bg-white px-3 text-sm font-bold text-gray-500">+254</span>
                                <Input
                                  type="tel"
                                  inputMode="tel"
                                  value={(vendor.whatsapp ?? "").replace(/^\+?254/, "")}
                                  onChange={(e) =>
                                    setVendor({
                                      ...vendor,
                                      whatsapp: e.target.value.replace(/\D/g, ""),
                                    })
                                  }
                                  placeholder="712 345 678"
                                  className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0"
                                />
                              </div>
                              <span className="mt-1.5 block text-xs font-normal text-gray-400">Shown only when customers choose to contact you.</span>
                            </label>
                            <label className="text-sm font-bold text-[#25253f]">
                              Starting from
                              <div className="mt-2 flex overflow-hidden rounded-xl border border-input bg-[#fcfbfe] focus-within:ring-2 focus-within:ring-primary/15">
                                <span className="flex items-center border-r bg-white px-3 text-sm font-bold text-gray-500">KES</span>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min="0"
                                  value={vendor.startingPrice ?? ""}
                                  onChange={(e) =>
                                    setVendor({
                                      ...vendor,
                                      startingPrice: e.target.value ? Number(e.target.value) : undefined,
                                    })
                                  }
                                  placeholder="20,000"
                                  className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0"
                                />
                              </div>
                              <span className="mt-1.5 block text-xs font-normal text-gray-400">This sets expectations; exact prices belong on listings.</span>
                            </label>
                          </div>
                          <div className="rounded-2xl border border-[#f1d8e6] bg-[#fff8fc] p-4 text-sm text-[#5a3150]">
                            <strong>Good pricing builds trust.</strong>
                            <span className="ml-1 text-[#755a6d]">Show a genuine entry price and use your catalogue for packages, quotes and add-ons.</span>
                          </div>
                        </div>
                      )}
                      {profileStep === 2 && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          <div>
                            <h3 className="text-lg font-extrabold">Tell customers your story</h3>
                            <p className="mt-1 text-sm text-gray-500">A clear description makes a shop feel human and helps the right customers choose you.</p>
                          </div>
                          <label className="block text-sm font-bold text-[#25253f]">
                            Storefront introduction
                            <textarea
                              maxLength={800}
                              value={vendor.description ?? ""}
                              onChange={(e) =>
                                setVendor({
                                  ...vendor,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Tell customers what you specialise in, who you serve, and what makes your experience memorable."
                              className="mt-2 min-h-44 w-full rounded-2xl border border-input bg-[#fcfbfe] p-4 text-sm font-normal leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                            />
                            <span className="mt-2 flex justify-between text-xs font-normal text-gray-400">
                              <span>Tip: mention your signature style, experience and the kind of events you love.</span>
                              <span>{(vendor.description ?? "").length}/800</span>
                            </span>
                          </label>
                          <div className="grid gap-3 sm:grid-cols-3">
                            {[
                              ["Clear promise", "Tell them what you do best"],
                              ["Trust signal", "Share your experience"],
                              ["Warm invitation", "Make the next step obvious"],
                            ].map(([title, copy]) => (
                              <div key={title} className="rounded-2xl border bg-[#fafafd] p-3">
                                <p className="text-xs font-bold text-[#25253f]">{title}</p>
                                <p className="mt-1 text-[11px] leading-4 text-gray-500">{copy}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {notice && (
                      <p role="status" className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                        {notice}
                      </p>
                    )}
                    <div className="mt-7 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <Button variant="ghost" disabled={profileStep === 0} onClick={() => setProfileStep((current) => current - 1)} className="h-11 rounded-xl">
                        Back
                      </Button>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setNotice("Your storefront draft is kept in this form until you save.")} className="h-11 rounded-xl">
                          Save draft
                        </Button>
                        {profileStep < profileSteps.length - 1 ? (
                          <Button onClick={() => setProfileStep((current) => current + 1)} className="h-11 rounded-xl px-5">
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        ) : (
                          <Button onClick={() => void saveProfile()} className="h-11 rounded-xl px-5 shadow-lg shadow-primary/20">
                            Save premium shop
                            <CheckCircle2 className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
                <aside className="hidden xl:block">
                  <div className="sticky top-5 overflow-hidden rounded-[28px] border border-[#e7e6ef] bg-white shadow-[0_18px_55px_rgba(24,23,53,.08)]">
                    <div className="relative h-28 bg-[radial-gradient(circle_at_18%_15%,rgba(255,255,255,.7),transparent_18%),radial-gradient(circle_at_85%_0%,rgba(232,62,131,.55),transparent_32%),linear-gradient(135deg,#27254f,#171735)]">
                      <span className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-extrabold text-primary shadow-lg">{initials}</span>
                      <span className="absolute bottom-4 right-4 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Premium shop</span>
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">Live storefront preview</p>
                      <h3 className="mt-2 text-xl font-extrabold">{vendor.businessName || "Your business name"}</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {vendor.category || "Your category"} · {vendor.city || "Your city"}
                      </p>
                      <div className="mt-5 rounded-2xl bg-[#fafafd] p-4">
                        <p className="text-xs leading-5 text-gray-600">{vendor.description || "Your storefront introduction will give customers a memorable reason to choose you."}</p>
                      </div>
                      <div className="mt-5 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-gray-400">Starting from</p>
                          <p className="mt-1 text-lg font-extrabold">{vendor.startingPrice ? `KES ${Number(vendor.startingPrice).toLocaleString()}` : "Add a price"}</p>
                        </div>
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700">{listings.length} offers</span>
                      </div>
                      <button type="button" className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/20">
                        Contact on WhatsApp
                      </button>
                    </div>
                  </div>
                </aside>
              </div>
              <div className="fixed inset-x-3 bottom-3 z-20 flex items-center justify-between rounded-2xl border border-white/70 bg-white/95 p-3 shadow-2xl backdrop-blur-xl xl:hidden">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.12em] text-gray-400">Shop readiness</p>
                  <p className="text-sm font-extrabold">{profileCompletion}% complete</p>
                </div>
                <Button onClick={() => void saveProfile()} className="h-10 rounded-xl px-4">
                  Save shop
                </Button>
              </div>
            </div>
          )}
          {activeTab === "sms" && (
            <div className="max-w-6xl mx-auto space-y-6">
              <section className="rounded-3xl bg-[#171735] text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/60">
                    <Radio className="h-4 w-4" /> Vendor-owned messaging
                  </div>
                  <h3 className="text-2xl font-extrabold mt-2">MobileSasa SMS</h3>
                  <p className="text-white/65 mt-2 max-w-2xl">{smsPlatform.onboardingNote}</p>
                </div>
                <a href={smsPlatform.agentRegistrationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#171735]">
                  Create or open account
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </section>
              {smsError && (
                <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  {smsError}
                </div>
              )}
              {smsNotice && <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">{smsNotice}</div>}
              <div className="grid lg:grid-cols-2 gap-6">
                <section className="bg-white rounded-3xl border p-6 space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xl font-bold">API connection</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Create a scoped <code>mbs_</code> token in MobileSasa with message-send and balance-view permissions.
                      </p>
                    </div>
                    {smsConnection && <span className={`rounded-full px-3 py-1 text-xs font-bold ${smsConnection.status === "CONNECTED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{smsConnection.status}</span>}
                  </div>
                  {smsConnection && (
                    <div className="rounded-2xl bg-gray-50 p-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sender ID</span>
                        <strong>{smsConnection.senderId}</strong>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-gray-500">API token</span>
                        <strong>••••{smsConnection.tokenLastFour}</strong>
                      </div>
                      {smsConnection.lastError && <p className="text-red-600 mt-3">{smsConnection.lastError}</p>}
                    </div>
                  )}
                  <label className="text-sm font-semibold block">
                    Sender ID
                    <Input
                      maxLength={11}
                      value={smsForm.senderId}
                      onChange={(e) =>
                        setSmsForm({
                          ...smsForm,
                          senderId: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="YOURBRAND"
                    />
                  </label>
                  <label className="text-sm font-semibold block">
                    {smsConnection ? "Replace API token" : "API token"}
                    <Input type="password" autoComplete="new-password" value={smsForm.apiToken} onChange={(e) => setSmsForm({ ...smsForm, apiToken: e.target.value })} placeholder="mbs_••••••••" />
                  </label>
                  <Button disabled={smsBusy || !smsForm.apiToken || !smsForm.senderId} onClick={() => void saveSmsConnection()}>
                    {smsConnection ? "Update connection" : "Connect MobileSasa"}
                  </Button>
                  {smsConnection && (
                    <div className="border-t pt-5">
                      <p className="font-bold text-sm mb-3">Send connection test</p>
                      <div className="flex gap-2">
                        <Input
                          value={smsForm.testPhone}
                          onChange={(e) =>
                            setSmsForm({
                              ...smsForm,
                              testPhone: e.target.value,
                            })
                          }
                          placeholder="0712 345 678"
                        />
                        <Button variant="outline" disabled={smsBusy || !smsForm.testPhone} onClick={() => void sendTestSms()}>
                          Send test
                        </Button>
                      </div>
                    </div>
                  )}
                </section>
                <section className="bg-white rounded-3xl border p-6 space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xl font-bold flex items-center gap-2">
                        <WalletCards className="text-primary" /> Wallet & units
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">Balances belong to your MobileSasa account.</p>
                    </div>
                    <button disabled={!smsConnection} onClick={() => void refreshSmsBalance()} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" title="Refresh balances">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-primary/5 p-4">
                      <p className="text-xs font-bold uppercase text-gray-500">SMS units</p>
                      <p className="text-2xl font-extrabold mt-2">{smsBalance?.smsBalance.toLocaleString() ?? "—"}</p>
                      <p className="text-xs text-gray-500 mt-1">Used for messages</p>
                    </div>
                    <div className="rounded-2xl bg-green-50 p-4">
                      <p className="text-xs font-bold uppercase text-gray-500">KES wallet</p>
                      <p className="text-2xl font-extrabold mt-2">KSh {smsBalance?.walletBalance.toLocaleString() ?? "—"}</p>
                      <p className="text-xs text-gray-500 mt-1">Used for service fees</p>
                    </div>
                  </div>
                  {smsBalance?.accountNumber && (
                    <div className="rounded-xl border p-4 text-sm">
                      <p className="text-gray-500">Manual M-Pesa top-up</p>
                      <p className="mt-2">
                        Paybill <strong>4078003</strong> · Account <strong>{smsBalance.accountNumber}</strong>
                      </p>
                    </div>
                  )}
                  <div className="border-t pt-5">
                    <p className="font-bold">Top up KES wallet</p>
                    <p className="text-xs text-gray-500 mt-1 mb-3">MobileSasa sends an M-Pesa prompt. This wallet covers sender IDs and service fees, not SMS units.</p>
                    <div className="grid sm:grid-cols-[1fr_140px_auto] gap-2">
                      <Input value={topUp.phone} onChange={(e) => setTopUp({ ...topUp, phone: e.target.value })} placeholder="M-Pesa phone" />
                      <Input type="number" min="1" max="70000" value={topUp.amount} onChange={(e) => setTopUp({ ...topUp, amount: e.target.value })} placeholder="Amount" />
                      <Button disabled={smsBusy || !smsConnection || !topUp.phone || !topUp.amount} onClick={() => void topUpWallet()}>
                        <WalletCards className="mr-2 h-4 w-4" />
                        Top up
                      </Button>
                    </div>
                  </div>
                  <a href={smsPlatform.portalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-bold text-primary">
                    Buy SMS units in MobileSasa
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </section>
              </div>
            </div>
          )}
          {activeTab === "listings" && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Storefront catalogue</p>
                  <h1 className="mt-1 text-2xl font-extrabold">Products & services</h1>
                  <p className="mt-1 text-sm text-gray-500">Create clear, bookable offers that help customers choose you.</p>
                </div>
                <div className="rounded-xl border bg-white px-4 py-2.5 text-sm">
                  <span className="font-extrabold">{listings.length}</span>
                  <span className="ml-1.5 text-gray-500">{listings.length === 1 ? "listing" : "listings"}</span>
                </div>
              </div>
              <section className="overflow-hidden rounded-2xl border border-[#e5e5ec] bg-white">
                <div className="border-b border-[#ededf2] px-5 py-5 md:px-7">
                  <h2 className="text-lg font-bold">Create a new listing</h2>
                  <p className="mt-1 text-sm text-gray-500">Start with the offer type. The form adapts to what you are selling.</p>
                </div>
                <div className="p-5 md:p-7">
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                      {
                        id: "PRODUCT",
                        label: "Product",
                        copy: "A physical or digital item",
                        icon: Package,
                      },
                      {
                        id: "SERVICE",
                        label: "Service",
                        copy: "Your skill or professional time",
                        icon: Wrench,
                      },
                      {
                        id: "RENTAL",
                        label: "Rental",
                        copy: "Inventory hired by date",
                        icon: KeyRound,
                      },
                      {
                        id: "PACKAGE",
                        label: "Package",
                        copy: "A bundled event outcome",
                        icon: Layers3,
                      },
                    ].map(({ id, label, copy, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() =>
                          setListingDraft({
                            ...listingDraft,
                            listingType: id,
                            priceUnit: id === "RENTAL" ? "DAY" : id === "PRODUCT" ? "ITEM" : "EVENT",
                          })
                        }
                        className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${listingDraft.listingType === id ? "border-primary bg-primary/[0.05] shadow-[0_0_0_3px_rgba(232,62,131,.08)]" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                      >
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${listingDraft.listingType === id ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <span>
                          <strong className="block text-sm">{label}</strong>
                          <span className="mt-1 block text-xs leading-4 text-gray-500">{copy}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  {listingError && (
                    <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                      {listingError}
                    </div>
                  )}
                  {listingNotice && <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-700">{listingNotice}</div>}
                  <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-7">
                      <fieldset>
                        <legend className="text-sm font-bold">1. What are you offering?</legend>
                        <p className="mt-1 text-xs text-gray-500">Use a specific name and choose the closest marketplace category.</p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label className="text-xs font-bold text-gray-600 md:col-span-2">
                            Listing name
                            <Input
                              value={listingDraft.name}
                              onChange={(e) =>
                                setListingDraft({
                                  ...listingDraft,
                                  name: e.target.value,
                                })
                              }
                              placeholder={listingDraft.listingType === "PRODUCT" ? "e.g. Personalised photo frame" : listingDraft.listingType === "RENTAL" ? "e.g. Gold chiavari chair hire" : "e.g. Full-day wedding photography"}
                              className="mt-1.5 h-11 rounded-xl"
                            />
                          </label>
                          <label className="text-xs font-bold text-gray-600">
                            Department
                            <select
                              value={listingDepartment}
                              onChange={(e) => {
                                setListingDepartment(e.target.value);
                                setListingDraft({
                                  ...listingDraft,
                                  category: "",
                                });
                              }}
                              className="mt-1.5 h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
                            >
                              <option value="">Choose a department</option>
                              {marketplaceCategories.map((category) => (
                                <option key={category.slug} value={category.slug}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="text-xs font-bold text-gray-600">
                            Specialisation
                            <select
                              value={listingDraft.category}
                              disabled={!listingDepartment}
                              onChange={(e) =>
                                setListingDraft({
                                  ...listingDraft,
                                  category: e.target.value,
                                })
                              }
                              className="mt-1.5 h-11 w-full rounded-xl border border-input bg-white px-3 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                            >
                              <option value="">{listingDepartment ? "Choose a specialisation" : "Select department first"}</option>
                              {marketplaceCategories
                                .find((category) => category.slug === listingDepartment)
                                ?.subcategories.map((item) => (
                                  <option key={item}>{item}</option>
                                ))}
                            </select>
                          </label>
                          <label className="text-xs font-bold text-gray-600 md:col-span-2">
                            Description
                            <textarea
                              value={listingDraft.description}
                              onChange={(e) =>
                                setListingDraft({
                                  ...listingDraft,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Describe what is included, who it is for, and what makes the offer valuable."
                              className="mt-1.5 min-h-28 w-full rounded-xl border border-input p-3 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                            />
                          </label>
                        </div>
                      </fieldset>
                      <fieldset className="border-t pt-7">
                        <legend className="text-sm font-bold">2. Pricing</legend>
                        <p className="mt-1 text-xs text-gray-500">Set a public starting price or let customers request a quote.</p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label className="text-xs font-bold text-gray-600">
                            Price (KES)
                            <Input
                              type="number"
                              min="0"
                              value={listingDraft.price}
                              onChange={(e) =>
                                setListingDraft({
                                  ...listingDraft,
                                  price: e.target.value,
                                })
                              }
                              placeholder="0"
                              className="mt-1.5 h-11 rounded-xl"
                            />
                          </label>
                          <label className="text-xs font-bold text-gray-600">
                            Pricing model
                            <select
                              value={listingDraft.priceUnit}
                              onChange={(e) =>
                                setListingDraft({
                                  ...listingDraft,
                                  priceUnit: e.target.value,
                                })
                              }
                              className="mt-1.5 h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
                            >
                              <option value="ITEM">Per item</option>
                              <option value="FIXED">Fixed price</option>
                              <option value="PERSON">Per person</option>
                              <option value="HOUR">Per hour</option>
                              <option value="DAY">Per day</option>
                              <option value="EVENT">Per event</option>
                              <option value="QUOTE">Request a quote</option>
                            </select>
                          </label>
                        </div>
                      </fieldset>
                      <fieldset className="border-t pt-7">
                        <legend className="text-sm font-bold">3. Fulfilment & availability</legend>
                        <p className="mt-1 text-xs text-gray-500">Help customers understand capacity, preparation time, and where you operate.</p>
                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                          {(listingDraft.listingType === "PRODUCT" || listingDraft.listingType === "RENTAL") && (
                            <label className="text-xs font-bold text-gray-600">
                              {listingDraft.listingType === "RENTAL" ? "Units available" : "Stock quantity"}
                              <Input
                                type="number"
                                min="0"
                                value={listingDraft.stockQuantity}
                                onChange={(e) =>
                                  setListingDraft({
                                    ...listingDraft,
                                    stockQuantity: e.target.value,
                                  })
                                }
                                placeholder="Optional"
                                className="mt-1.5 h-11 rounded-xl"
                              />
                            </label>
                          )}
                          <label className="text-xs font-bold text-gray-600">
                            Minimum order
                            <Input
                              type="number"
                              min="1"
                              value={listingDraft.minimumOrder}
                              onChange={(e) =>
                                setListingDraft({
                                  ...listingDraft,
                                  minimumOrder: e.target.value,
                                })
                              }
                              className="mt-1.5 h-11 rounded-xl"
                            />
                          </label>
                          <label className="text-xs font-bold text-gray-600">
                            Lead time (days)
                            <Input
                              type="number"
                              min="0"
                              value={listingDraft.leadTimeDays}
                              onChange={(e) =>
                                setListingDraft({
                                  ...listingDraft,
                                  leadTimeDays: e.target.value,
                                })
                              }
                              className="mt-1.5 h-11 rounded-xl"
                            />
                          </label>
                          <label className="text-xs font-bold text-gray-600 md:col-span-2">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              Service or delivery area
                            </span>
                            <Input
                              value={listingDraft.serviceArea}
                              onChange={(e) =>
                                setListingDraft({
                                  ...listingDraft,
                                  serviceArea: e.target.value,
                                })
                              }
                              placeholder="e.g. Nairobi and Kiambu"
                              className="mt-1.5 h-11 rounded-xl"
                            />
                          </label>
                          {listingDraft.listingType === "RENTAL" && (
                            <label className="text-xs font-bold text-gray-600">
                              Refundable deposit
                              <Input
                                type="number"
                                min="0"
                                value={listingDraft.depositAmount}
                                onChange={(e) =>
                                  setListingDraft({
                                    ...listingDraft,
                                    depositAmount: e.target.value,
                                  })
                                }
                                placeholder="KES"
                                className="mt-1.5 h-11 rounded-xl"
                              />
                            </label>
                          )}
                          <label className="text-xs font-bold text-gray-600 md:col-span-3">
                            Terms and conditions
                            <textarea
                              value={listingDraft.terms}
                              onChange={(e) =>
                                setListingDraft({
                                  ...listingDraft,
                                  terms: e.target.value,
                                })
                              }
                              placeholder="Cancellation, delivery, usage or return conditions."
                              className="mt-1.5 min-h-24 w-full rounded-xl border border-input p-3 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                            />
                          </label>
                        </div>
                      </fieldset>
                      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-gray-500">The listing is saved as a draft before marketplace review.</p>
                        <Button disabled={listingBusy || !listingDraft.name || !listingDraft.category} onClick={() => void addListing()} className="rounded-xl px-5 shadow-lg shadow-primary/20">
                          {listingBusy ? "Saving…" : "Save listing draft"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <aside className="h-fit rounded-2xl border border-[#e5e5ec] bg-[#fafafd] p-5 xl:sticky xl:top-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Listing preview</p>
                      <div className="mt-4 flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white text-center">
                        <div>
                          <Package className="mx-auto h-6 w-6 text-gray-300" />
                          <p className="mt-2 text-xs text-gray-400">Photos can be added in the next step</p>
                        </div>
                      </div>
                      <span className="mt-4 inline-flex rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{listingDraft.listingType}</span>
                      <h3 className="mt-3 font-bold">{listingDraft.name || "Your listing name"}</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {listingDraft.category || "Category"} · {listingDraft.serviceArea || "Service area"}
                      </p>
                      <p className="mt-4 text-lg font-extrabold">{listingDraft.priceUnit === "QUOTE" ? "Request a quote" : listingDraft.price ? `KES ${Number(listingDraft.price).toLocaleString()}` : "Add a price"}</p>
                      <div className="mt-5 space-y-2 border-t pt-4 text-xs text-gray-500">
                        <p className="flex items-center gap-2">
                          <Clock3 className="h-3.5 w-3.5" />
                          {listingDraft.leadTimeDays || 0} day lead time
                        </p>
                        <p className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Minimum order {listingDraft.minimumOrder || 1}
                        </p>
                      </div>
                    </aside>
                  </div>
                </div>
              </section>
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold">Your listings</h2>
                    <p className="mt-0.5 text-xs text-gray-500">Drafts and offers currently attached to your storefront</p>
                  </div>
                </div>
                {listings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
                    <Boxes className="mx-auto h-7 w-7 text-gray-300" />
                    <h3 className="mt-3 font-bold">No listings yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Your first offer will appear here after you save it.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {listings.map((listing) => (
                      <article key={listing.id} className="group rounded-2xl border border-[#e5e5ec] bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                        <div className="flex justify-between">
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{listing.listingType}</span>
                          <span className={`text-[10px] font-bold ${listing.isActive ? "text-green-700" : "text-gray-400"}`}>{listing.isActive ? "ACTIVE" : "HIDDEN"}</span>
                        </div>
                        <h4 className="mt-4 text-lg font-bold">{listing.name}</h4>
                        <p className="mt-1 text-xs text-gray-500">{listing.category}</p>
                        <p className="mt-4 font-extrabold">{listing.priceUnit === "QUOTE" ? "Request a quote" : `KES ${Number(listing.price).toLocaleString()} / ${listing.priceUnit.toLowerCase()}`}</p>
                        <div className="mt-4 flex items-center gap-3 border-t pt-4 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock3 className="h-3 w-3" />
                            {listing.leadTimeDays} days
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {listing.serviceArea || "By arrangement"}
                          </span>
                          <button onClick={() => void removeListing(listing.id)} className="ml-auto rounded-lg p-2 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100" title="Delete listing">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
        <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-2xl border border-white/60 bg-white/95 p-1.5 shadow-2xl shadow-[#171735]/15 backdrop-blur-xl md:hidden">
          {[
            { id: "overview", label: "Home", icon: LayoutDashboard },
            { id: "leads", label: "Leads", icon: Users },
            { id: "calendar", label: "Calendar", icon: Calendar },
            { id: "sms", label: "SMS", icon: Radio },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => selectTab(id)} className={`flex flex-col items-center rounded-xl px-2 py-2 text-[10px] font-bold transition-colors ${activeTab === id ? "bg-primary/10 text-primary" : "text-gray-400"}`}>
              <Icon className="mb-1 h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </main>
      {logoutOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0d0d24]/55 p-3 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLogoutOpen(false);
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/50 bg-white shadow-[0_30px_90px_rgba(10,10,32,.35)] animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="relative bg-[#171735] px-6 pb-7 pt-6 text-white">
              <button onClick={() => setLogoutOpen(false)} aria-label="Close sign out dialog" className="absolute right-4 top-4 rounded-full p-2 text-white/55 transition hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/25">
                <LogOut className="h-5 w-5" />
              </div>
              <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.2em] text-white/45">Vendor workspace</p>
              <h2 id="logout-title" className="mt-1 text-2xl font-extrabold">
                Ready to sign out?
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/65">Your storefront stays live and your saved workspace remains secure. You can return whenever you are ready.</p>
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3 rounded-2xl border bg-[#fafafd] p-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#a82672] font-extrabold text-white">{initials}</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{vendor?.businessName ?? "Vendor workspace"}</p>
                  <p className="text-xs text-gray-500">This device will be signed out</p>
                </div>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Button variant="outline" onClick={() => setLogoutOpen(false)} className="h-11 rounded-xl font-bold">
                  Stay signed in
                </Button>
                <Button onClick={confirmLogout} className="h-11 rounded-xl bg-red-600 font-bold text-white hover:bg-red-700">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
