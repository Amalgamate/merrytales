import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/merry/MobileBottomNav';
import { AppLayout } from './components/layout/AppLayout';

// Public Pages
import { Home } from './pages/Home';
import { Vendors } from './pages/Vendors';
import { VendorProfile } from './pages/VendorProfile';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Stories } from './pages/Stories';
import { Plan } from './pages/Plan';
import { Create } from './pages/Create';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Favorites } from './pages/Favorites';
import { NotFound } from './pages/NotFound';
import { Login } from './pages/Login';
import { ChangePassword } from './pages/ChangePassword';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { Gifts } from './pages/Gifts';
import { Partners } from './pages/Partners';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StudioDashboard } from './pages/studio/StudioDashboard';

// App Pages
import { Dashboard } from './pages/app/Dashboard';
import { WeddingOverview } from './pages/app/WeddingOverview';
import { InvitationBuilder } from './pages/app/InvitationBuilder';
import { Printables } from './pages/app/Printables';
import { Memories } from './pages/app/Memories';
import { Orders } from './pages/app/Orders';
import { EventTreasury } from './pages/app/EventTreasury';
import { GlobalMotion } from './components/motion/GlobalMotion';
import { QuoteReview } from './pages/QuoteReview';
import { AIChat } from './components/merry/AIChat';
import { EngagementOverlays } from './components/merry/EngagementOverlays';
import { NewsletterAction } from './pages/NewsletterAction';
import { Referrals } from './pages/app/Referrals';
import { ReferralLanding } from './pages/ReferralLanding';

// Vendor Pages
import { VendorJoin } from './pages/vendor/VendorJoin';
import { VendorDashboard } from './pages/vendor/VendorDashboard';

function PublicLayout() {
  return (
    <div data-motion-scope className="font-sans antialiased text-foreground bg-background flex flex-col min-h-screen">
      <GlobalMotion />
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
      <AIChat />
      <EngagementOverlays />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/quote/:token" element={<QuoteReview />} />
        {/* Public Routes with Navbar/Footer */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/vendors/:slug" element={<VendorProfile />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:slug" element={<ProductDetail />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/stories/real-weddings" element={<Stories />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/create" element={<Create />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/vendor/join" element={<VendorJoin />} />
          <Route path="/gifts" element={<Gifts />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/r/:code" element={<ReferralLanding />} />
          <Route path="/shop/category/*" element={<Shop />} />
          <Route path="/discover/*" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Focused authentication routes without marketplace navigation */}
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/newsletter/confirm" element={<NewsletterAction action="confirm" />} />
        <Route path="/newsletter/unsubscribe" element={<NewsletterAction action="unsubscribe" />} />

        {/* Vendor Portal Route (Independent Layout) */}
        <Route element={<ProtectedRoute roles={['VENDOR', 'ADMIN', 'SUPERADMIN']} />}><Route path="/vendor" element={<VendorDashboard />} /></Route>

        {/* App Routes with AppLayout (Sidebar) */}
        <Route element={<ProtectedRoute roles={['CUSTOMER']} />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="wedding" element={<WeddingOverview />} />
            <Route path="treasury" element={<EventTreasury />} />
            <Route path="invitation" element={<InvitationBuilder />} />
            <Route path="printables" element={<Printables />} />
            <Route path="memories" element={<Memories />} />
            <Route path="orders" element={<Orders />} />
            <Route path="referrals" element={<Referrals />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute roles={['SUPERADMIN', 'ADMIN', 'STAFF']} />}><Route path="/admin" element={<AdminDashboard />} /></Route>
        <Route element={<ProtectedRoute roles={['STUDIO', 'ADMIN', 'SUPERADMIN']} />}><Route path="/studio" element={<StudioDashboard />} /></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
