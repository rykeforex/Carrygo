import React, { useCallback, useEffect, useState } from "react";
import { FileText, Inbox } from "lucide-react";
import RippleButton from "../components/RippleButton";
import ConfirmDialog from "../components/ConfirmDialog";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "../components/StateViews";
import { useToast } from "../context/ToastContext";
import { adminDocumentUrl, adminListCollectors, adminReviewCollector } from "../lib/api";
import { DOC_TYPES } from "../lib/documents";
import { friendlyError } from "../lib/errors";
import { formatDateTime } from "../lib/format";

const TABS = ["pending", "approved", "rejected", "suspended"];
const DECISIONS = {
  approve: { title: "Approve this collector?", label: "Approve", danger: false, hint: "They will be able to go online and accept jobs." },
  reject: { title: "Reject this application?", label: "Reject", danger: true, hint: "They can upload a new document and resubmit. Add a note explaining why." },
  suspend: { title: "Suspend this collector?", label: "Suspend", danger: true, hint: "They go offline immediately and can't accept jobs. Any active job needs reassigning." },
};

export default function AdminApplicationsPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState("pending");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [docBusy, setDocBusy] = useState(null);
  const [dialog, setDialog] = useState(null); // { row, decision }
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState("");

  const load = useCallback(async () => {
    setRows(null); setError("");
    try { setRows(await adminListCollectors(tab)); }
    catch (e) { setError(friendlyError(e, "We couldn't load applications.")); }
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  const openDoc = async (row) => {
    setDocBusy(row.user_id);
    try { window.open(await adminDocumentUrl(row.id_document_path), "_blank", "noopener,noreferrer"); }
    catch (e) { setError(friendlyError(e, "We couldn't open that document.")); }
    finally { setDocBusy(null); }
  };

  const decide = async () => {
    setBusy(true); setDialogError("");
    try {
      await adminReviewCollector(dialog.row.user_id, dialog.decision, notes.trim());
      showToast(`Collector ${dialog.decision === "approve" ? "approved" : dialog.decision === "reject" ? "rejected" : "suspended"}.`, "success");
      setDialog(null); setNotes("");
      await load();
    } catch (e) { setDialogError(friendlyError(e, "That action failed. Nothing was changed.")); }
    finally { setBusy(false); }
  };

  const typeLabel = (v) => DOC_TYPES.find((d) => d.value === v)?.label || "—";
  const d = dialog ? DECISIONS[dialog.decision] : null;

  return (
    <section className="cg-page cg-page-wide">
      <div className="cg-page-head">
        <h1>Collector applications</h1>
        <p className="cg-page-lede">Review identity documents and decide who can accept jobs. Every decision is written to the audit log.</p>
      </div>
      <div className="cg-auth-toggle cg-tabs cg-tabs-wide" role="tablist">
        {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "is-active" : ""} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}
      </div>
      {error && !rows && <ErrorBlock message={error} onRetry={load} />}
      {error && rows && <p className="cg-field-error" role="alert">{error}</p>}
      {!rows && !error && <LoadingBlock />}
      {rows && rows.length === 0 && <EmptyBlock icon={Inbox} title={`No ${tab} applications`}>Nothing to review here right now.</EmptyBlock>}
      <div className="cg-pickup-list">
        {rows && rows.map((r) => (
          <div key={r.user_id} className="cg-pickup-card glass">
            <div className="cg-pickup-card-top"><strong>{r.full_name || "(no name)"}</strong><span className="cg-pickup-date">Applied {formatDateTime(r.created_at)}</span></div>
            <div className="cg-pickup-row"><span>{r.email}{r.phone ? ` · ${r.phone}` : ""}</span></div>
            <div className="cg-pickup-row"><span>{r.vehicle_type} · {r.id_document_path ? typeLabel(r.id_document_type) : "No document uploaded yet"}</span></div>
            {r.review_notes && <p className="cg-pickup-comment">Notes: {r.review_notes}</p>}
            <div className="cg-admin-actions">
              {r.id_document_path && <RippleButton variant="ghost" className="cg-btn-sm" disabled={docBusy === r.user_id} onClick={() => openDoc(r)}><FileText size={14} /> {docBusy === r.user_id ? "Opening…" : "View document"}</RippleButton>}
              {r.status !== "approved" && <RippleButton variant="primary" className="cg-btn-sm" disabled={!r.id_document_path} onClick={() => { setNotes(""); setDialogError(""); setDialog({ row: r, decision: "approve" }); }}>Approve</RippleButton>}
              {r.status === "pending" && <RippleButton variant="ghost" className="cg-btn-sm" onClick={() => { setNotes(""); setDialogError(""); setDialog({ row: r, decision: "reject" }); }}>Reject</RippleButton>}
              {r.status === "approved" && <RippleButton variant="ghost" className="cg-btn-sm" onClick={() => { setNotes(""); setDialogError(""); setDialog({ row: r, decision: "suspend" }); }}>Suspend</RippleButton>}
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog open={!!dialog} danger={d?.danger} busy={busy} title={d?.title} confirmLabel={d?.label} cancelLabel="Cancel" onConfirm={decide} onCancel={() => !busy && setDialog(null)}>
        <p>{dialog?.row.full_name || dialog?.row.email} — {d?.hint}</p>
        <textarea className="cg-textarea" rows={3} maxLength={1000} placeholder="Notes (shown to the collector)" aria-label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        {dialogError && <p className="cg-field-error" role="alert">{dialogError}</p>}
      </ConfirmDialog>
    </section>
  );
}
