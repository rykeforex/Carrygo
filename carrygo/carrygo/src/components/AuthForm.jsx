import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import RippleButton from "./RippleButton";
import { explainAuthError, useAuth } from "../context/AuthContext";

const VEHICLE_TYPES = ["Tricycle", "Pickup truck", "Van", "Motorbike"];
const STAFF_MAX_ATTEMPTS = 5;
const STAFF_LOCK_MS = 60_000;

export default function AuthForm({ role, kicker, subtitle, onBack, allowSignup = true, externalError = "" }) {
  const { signIn, signInStaff, signUp, sendReset } = useAuth();
  const [mode, setMode] = useState("signin"); // signin | signup | forgot
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[0]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [failures, setFailures] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);

  useEffect(() => {
    if (externalError) setError(externalError);
  }, [externalError]);

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setNotice("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const em = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(em)) return setError("Enter a valid email address.");

    if (mode === "forgot") {
      setBusy(true);
      const { error: err } = await sendReset(em);
      setBusy(false);
      if (err) return setError(explainAuthError(err));
      return setNotice("If an account exists for that email, a reset link is on its way.");
    }
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (mode === "signup" && !name.trim()) return setError("Enter your name.");

    if (role === "staff" && mode === "signin" && lockedUntil > Date.now()) {
      const secs = Math.ceil((lockedUntil - Date.now()) / 1000);
      return setError(`Too many attempts. Try again in ${secs}s.`);
    }

    setBusy(true);
    if (mode === "signin") {
      const { error: err } = role === "staff" ? await signInStaff(em, password) : await signIn(em, password);
      setBusy(false);
      if (err) {
        setError(explainAuthError(err));
        if (role === "staff") {
          const n = failures + 1;
          if (n >= STAFF_MAX_ATTEMPTS) { setFailures(0); setLockedUntil(Date.now() + STAFF_LOCK_MS); }
          else setFailures(n);
        }
      }
      return; // on success the session listener routes the user
    }
    const { error: err, needsConfirmation } = await signUp({
      email: em, password, fullName: name.trim(), applyCollector: role === "collector", vehicleType,
    });
    setBusy(false);
    if (err) return setError(explainAuthError(err));
    if (needsConfirmation) setNotice("Almost done — check your email and click the confirmation link, then sign in.");
  };

  return (
    <div className={`cg-auth cg-auth-${role}`}>
      <div className="cg-auth-card glass">
        <button className="cg-auth-back" onClick={onBack} type="button">
          <ArrowLeft size={15} /> Back
        </button>
        <span className="cg-auth-kicker">{kicker}</span>
        <h2>{mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}</h2>
        <p className="cg-auth-sub">{subtitle}</p>

        {mode !== "forgot" && allowSignup && (
          <div className="cg-auth-toggle">
            <button type="button" className={mode === "signin" ? "is-active" : ""} onClick={() => switchMode("signin")}>Sign in</button>
            <button type="button" className={mode === "signup" ? "is-active" : ""} onClick={() => switchMode("signup")}>Create account</button>
          </div>
        )}

        <form onSubmit={submit} className="cg-auth-form" noValidate>
          {mode === "signup" && (
            <input className="cg-input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" aria-label="Full name" />
          )}
          <input className="cg-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-label="Email" />
          {mode !== "forgot" && (
            <input className="cg-input" type="password" placeholder="Password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} aria-label="Password" />
          )}
          {role === "collector" && mode === "signup" && (
            <select className="cg-input" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} aria-label="Vehicle type">
              {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          )}
          {mode === "signin" && (
            <button type="button" className="cg-auth-link" onClick={() => switchMode("forgot")}>Forgot password?</button>
          )}
          {mode === "forgot" && (
            <button type="button" className="cg-auth-link" onClick={() => switchMode("signin")}>Back to sign in</button>
          )}
          {error && <p className="cg-auth-error" role="alert">{error}</p>}
          {notice && <p className="cg-auth-notice" role="status">{notice}</p>}
          <RippleButton variant="primary" className="cg-btn-full" type="submit" disabled={busy}>
            {busy ? <Loader2 size={16} className="cg-spin" /> : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </RippleButton>
        </form>
        {role === "collector" && mode === "signup" && (
          <p className="cg-auth-fine">Collector accounts start as an application. You can accept jobs only after CarryGo approves you.</p>
        )}
      </div>
    </div>
  );
}
