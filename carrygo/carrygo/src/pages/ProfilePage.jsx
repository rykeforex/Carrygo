import React, { useState } from "react";
import RippleButton from "../components/RippleButton";
import { useAuth } from "../context/AuthContext";
import { updateMyProfile } from "../lib/api";
import { friendlyError } from "../lib/errors";

const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;

export default function ProfilePage() {
  const { profile, session, refreshProfile } = useAuth();
  const [name, setName] = useState(profile.full_name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setSaved(false);
    if (name.trim().length > 120) return setError("Name is too long.");
    if (phone.trim() && !PHONE_RE.test(phone.trim())) return setError("Enter a valid phone number, e.g. +233 24 123 4567.");
    setBusy(true);
    try {
      await updateMyProfile(profile.id, { full_name: name.trim() || null, phone: phone.trim() || null });
      await refreshProfile();
      setSaved(true);
    } catch (err) { setError(friendlyError(err, "We couldn't save your profile.")); }
    finally { setBusy(false); }
  };

  return (
    <section className="cg-page">
      <div className="cg-page-head">
        <h1>Profile</h1>
        <p className="cg-page-lede">Your name and phone number help collectors find and reach you during a pickup.</p>
      </div>
      <form className="cg-detail-card glass cg-auth-form" onSubmit={submit}>
        <label className="cg-label" htmlFor="pf-email">Email</label>
        <input id="pf-email" className="cg-input" value={session.user.email} readOnly />
        <label className="cg-label" htmlFor="pf-name">Full name</label>
        <input id="pf-name" className="cg-input" value={name} maxLength={120} autoComplete="name" onChange={(e) => setName(e.target.value)} />
        <label className="cg-label" htmlFor="pf-phone">Phone</label>
        <input id="pf-phone" className="cg-input" value={phone} maxLength={20} autoComplete="tel" placeholder="+233 24 123 4567" onChange={(e) => setPhone(e.target.value)} />
        {error && <p className="cg-field-error" role="alert">{error}</p>}
        {saved && <p className="cg-field-ok" role="status">Profile saved.</p>}
        <RippleButton variant="primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</RippleButton>
      </form>
    </section>
  );
}
