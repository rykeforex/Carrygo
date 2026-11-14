import React, { useState } from "react";
import { FileCheck2, Loader2, Upload } from "lucide-react";
import RippleButton from "../components/RippleButton";
import { useAuth } from "../context/AuthContext";
import { uploadCollectorDocument } from "../lib/api";
import { DOC_TYPES, validateDocument } from "../lib/documents";
import { friendlyError } from "../lib/errors";

const COPY = {
  pending: "CarryGo reviews every application by hand. Approval is never automatic, and you can't accept jobs until you are approved.",
  rejected: "Your application wasn't approved. You can upload a new document and resubmit.",
  suspended: "Your collector access is suspended. Contact CarryGo support if you think this is a mistake.",
};

export default function CollectorApplicationPage({ application, onContinueCustomer, onSignOut }) {
  const { session, refreshProfile } = useAuth();
  const [docType, setDocType] = useState(application.id_document_type || DOC_TYPES[0].value);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const canUpload = application.status === "pending" || application.status === "rejected";

  const onFile = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setSent(false);
    setError(f ? validateDocument(f) || "" : "");
  };

  const submit = async (e) => {
    e.preventDefault();
    const problem = validateDocument(file);
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    try {
      await uploadCollectorDocument(session.user.id, file, docType);
      setFile(null);
      setSent(true);
      await refreshProfile();
    } catch (err) {
      setError(friendlyError(err, "We couldn't upload your document. Nothing was submitted — please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cg-auth">
      <div className="cg-auth-card glass cg-auth-wide">
        <span className="cg-auth-kicker">Collector application</span>
        <h2>Status: {application.status}</h2>
        <p className="cg-auth-sub">{COPY[application.status]}</p>
        {application.review_notes && <p className="cg-banner cg-banner-neutral"><span>Note from CarryGo: {application.review_notes}</span></p>}

        {canUpload && (
          <form className="cg-auth-form" onSubmit={submit}>
            <h3 className="cg-form-title">{application.has_document ? "Replace your ID document" : "Upload an ID document"}</h3>
            {application.has_document && <p className="cg-field-ok"><FileCheck2 size={13} /> A document is on file and waiting for review.</p>}
            <label className="cg-label" htmlFor="doc-type">Document type</label>
            <select id="doc-type" className="cg-input" value={docType} onChange={(e) => setDocType(e.target.value)}>
              {DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <label className="cg-label" htmlFor="doc-file">File (PDF, JPG or PNG, up to 5 MB)</label>
            <input id="doc-file" className="cg-input cg-file-input" type="file" accept="application/pdf,image/jpeg,image/png" onChange={onFile} />
            <p className="cg-field-hint">Your document is stored privately. Only you and CarryGo's reviewers can open it.</p>
            {error && <p className="cg-field-error" role="alert">{error}</p>}
            {sent && <p className="cg-field-ok" role="status">Document submitted. We'll notify you when it's reviewed.</p>}
            <RippleButton variant="primary" type="submit" className="cg-btn-full" disabled={busy || !file}>
              {busy ? <Loader2 size={16} className="cg-spin" /> : <><Upload size={15} /> Submit for review</>}
            </RippleButton>
          </form>
        )}

        <div className="cg-status-actions">
          <RippleButton variant="ghost" className="cg-btn-full" onClick={onContinueCustomer}>Continue as a customer</RippleButton>
          <RippleButton variant="ghost" className="cg-btn-full" onClick={onSignOut}>Sign out</RippleButton>
        </div>
      </div>
    </div>
  );
}
