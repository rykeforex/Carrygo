import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import RippleButton from "../components/RippleButton";
import { explainAuthError, useAuth } from "../context/AuthContext";

export default function ResetPasswordPage() {
  const { updatePassword, finishRecovery } = useAuth();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (pw.length < 8) return setError("Password must be at least 8 characters.");
    if (pw !== pw2) return setError("The two passwords don't match.");
    setBusy(true);
    const { error: err } = await updatePassword(pw);
    setBusy(false);
    if (err) return setError(explainAuthError(err));
    finishRecovery();
  };

  return (
    <div className="cg-auth">
      <div className="cg-auth-card glass">
        <span className="cg-auth-kicker">Account recovery</span>
        <h2>Choose a new password</h2>
        <form onSubmit={submit} className="cg-auth-form" noValidate>
          <input className="cg-input" type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" aria-label="New password" />
          <input className="cg-input" type="password" placeholder="Repeat new password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" aria-label="Repeat new password" />
          {error && <p className="cg-auth-error" role="alert">{error}</p>}
          <RippleButton variant="primary" className="cg-btn-full" type="submit" disabled={busy}>
            {busy ? <Loader2 size={16} className="cg-spin" /> : "Update password"}
          </RippleButton>
        </form>
      </div>
    </div>
  );
}
