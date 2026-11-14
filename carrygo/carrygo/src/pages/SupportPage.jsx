import React, { useCallback, useEffect, useState } from "react";
import { LifeBuoy } from "lucide-react";
import RippleButton from "../components/RippleButton";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "../components/StateViews";
import { listMyComplaints, listMyPickups, submitComplaint } from "../lib/api";
import { friendlyError } from "../lib/errors";
import { formatDateTime } from "../lib/format";

const STATUS = { open: "Received", in_review: "In review", resolved: "Resolved", dismissed: "Closed" };

export default function SupportPage() {
  const [items, setItems] = useState(null);
  const [pickups, setPickups] = useState([]);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pickupId, setPickupId] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([listMyComplaints(), listMyPickups()]);
      setItems(c); setPickups(p.slice(0, 20)); setError("");
    } catch (e) { setError(friendlyError(e, "We couldn't load your reports.")); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setFormError(""); setSent(false);
    try {
      await submitComplaint({ subject: subject.trim(), body: body.trim(), pickupId: pickupId || null });
      setSubject(""); setBody(""); setPickupId(""); setSent(true);
      await load();
    } catch (err) { setFormError(friendlyError(err, "We couldn't send your report.")); }
    finally { setBusy(false); }
  };

  return (
    <section className="cg-page cg-page-wide">
      <div className="cg-page-head">
        <h1>Support</h1>
        <p className="cg-page-lede">Tell us what went wrong and we'll look into it. You can follow the status of your reports here.</p>
      </div>
      <div className="cg-detail-grid">
        <form className="cg-detail-card glass cg-auth-form" onSubmit={submit}>
          <h3>New report</h3>
          <label className="cg-label" htmlFor="sp-pickup">Related pickup (optional)</label>
          <select id="sp-pickup" className="cg-input" value={pickupId} onChange={(e) => setPickupId(e.target.value)}>
            <option value="">Not about a specific pickup</option>
            {pickups.map((p) => <option key={p.id} value={p.id}>{p.reference} — {formatDateTime(p.created_at)}</option>)}
          </select>
          <label className="cg-label" htmlFor="sp-subject">Subject</label>
          <input id="sp-subject" className="cg-input" maxLength={150} value={subject} onChange={(e) => setSubject(e.target.value)} />
          <label className="cg-label" htmlFor="sp-body">Details</label>
          <textarea id="sp-body" className="cg-textarea" rows={5} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} />
          {formError && <p className="cg-field-error" role="alert">{formError}</p>}
          {sent && <p className="cg-field-ok" role="status">Report sent. We'll update its status below.</p>}
          <RippleButton variant="primary" type="submit" disabled={busy || subject.trim().length < 3 || body.trim().length < 5}>{busy ? "Sending…" : "Send report"}</RippleButton>
        </form>

        <div className="cg-detail-col">
          <h3 className="cg-col-title">Your reports</h3>
          {error && !items && <ErrorBlock message={error} onRetry={load} />}
          {!error && !items && <LoadingBlock />}
          {items && items.length === 0 && <EmptyBlock icon={LifeBuoy} title="No reports yet">Anything you send will show up here with its status.</EmptyBlock>}
          {items && items.map((c) => (
            <div key={c.id} className="cg-detail-card glass">
              <div className="cg-pickup-card-top"><strong>{c.subject}</strong><span className={`cg-status cg-status-c-${c.status}`}>{STATUS[c.status]}</span></div>
              <p className="cg-field-hint">{formatDateTime(c.created_at)}</p>
              <p className="cg-complaint-body">{c.body}</p>
              {c.resolution_note && <p className="cg-banner cg-banner-neutral"><span>Response: {c.resolution_note}</span></p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
