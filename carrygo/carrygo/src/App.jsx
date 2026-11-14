import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import LandingChooser from "./pages/LandingChooser";
import CustomerAuthPage from "./pages/CustomerAuthPage";
import CollectorAuthPage from "./pages/CollectorAuthPage";
import StaffAuthPage from "./pages/StaffAuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AccountStatusPage from "./pages/AccountStatusPage";
import CollectorApplicationPage from "./pages/CollectorApplicationPage";
import CustomerAppShell from "./shells/CustomerAppShell";
import CollectorAppShell from "./shells/CollectorAppShell";
import AdminShell from "./shells/AdminShell";
import RootFrame from "./components/RootFrame";
import SplashScreen, { shouldShowSplash } from "./components/SplashScreen";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

function Spinner() {
  return (
    <RootFrame theme="light">
      <div className="cg-auth"><Loader2 size={28} className="cg-spin" aria-label="Loading" /></div>
    </RootFrame>
  );
}

function Gate() {
  const { configured, loading, session, profile, collectorApp, profileError, recovery, signOut, refreshProfile } = useAuth();
  const [authView, setAuthView] = useState(null);
  const [asCustomer, setAsCustomer] = useState(false);

  if (!configured) {
    return (
      <RootFrame theme="light">
        <AccountStatusPage kicker="Configuration" title="Backend not configured" actions={[]}>
          <p>The Supabase settings were not found. Make sure a file named exactly <code>.env</code> (not <code>.env.txt</code>) sits in the project root next to <code>package.json</code> and contains <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>. Then stop and restart <code>npm run dev</code> — Vite only reads .env at startup.</p>
        </AccountStatusPage>
      </RootFrame>
    );
  }
  if (loading) return <Spinner />;
  if (recovery) return <RootFrame theme="light"><ResetPasswordPage /></RootFrame>;

  if (!session) {
    if (authView === "customer") return <RootFrame theme="light"><CustomerAuthPage onBack={() => setAuthView(null)} /></RootFrame>;
    if (authView === "collector") return <RootFrame theme="dark" className="cg-role-collector"><CollectorAuthPage onBack={() => setAuthView(null)} /></RootFrame>;
    if (authView === "staff") return <RootFrame theme="light"><StaffAuthPage onBack={() => setAuthView(null)} /></RootFrame>;
    return <RootFrame theme="light"><LandingChooser onPick={setAuthView} /></RootFrame>;
  }

  if (profileError || !profile) {
    return (
      <RootFrame theme="light">
        <AccountStatusPage kicker="Account" title="We couldn't load your account"
          actions={[{ label: "Try again", primary: true, onClick: refreshProfile }, { label: "Sign out", onClick: signOut }]}>
          <p>{profileError || "Your profile is unavailable."}</p>
        </AccountStatusPage>
      </RootFrame>
    );
  }

  if (profile.is_suspended) {
    return (
      <RootFrame theme="light">
        <AccountStatusPage kicker="Account" title="Account suspended" actions={[{ label: "Sign out", onClick: signOut }]}>
          <p>This account has been suspended. Contact CarryGo support if you believe this is a mistake.</p>
        </AccountStatusPage>
      </RootFrame>
    );
  }

  const account = {
    id: session.user.id,
    name: profile.full_name || session.user.email.split("@")[0],
    email: session.user.email,
    vehicleType: collectorApp?.vehicle_type,
  };

  if (profile.role === "admin") return <AdminShell profile={account} onLogout={signOut} />;
  if (profile.role === "collector" && collectorApp?.status === "approved") return <CollectorAppShell profile={account} onLogout={signOut} />;

  if (collectorApp && collectorApp.status !== "approved" && !asCustomer) {
    return (
      <RootFrame theme="dark" className="cg-role-collector">
        <CollectorApplicationPage application={collectorApp} onContinueCustomer={() => setAsCustomer(true)} onSignOut={signOut} />
      </RootFrame>
    );
  }

  return <CustomerAppShell profile={account} onLogout={signOut} />;
}

export default function App() {
  const [splash, setSplash] = useState(shouldShowSplash);
  return (
    <ToastProvider>
      <AuthProvider>
        {/* The app loads behind the splash, so nothing waits on it. */}
        <Gate />
        {splash && <SplashScreen onDone={() => setSplash(false)} />}
      </AuthProvider>
    </ToastProvider>
  );
}
