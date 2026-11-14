import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, MapPin, Clock, Phone, Star, Check } from "lucide-react";
import RippleButton from "../components/RippleButton";
import StatusBadge from "../components/StatusBadge";
import StarRating from "../components/StarRating";
import ConfirmDialog from "../components/ConfirmDialog";
import LiveMap from "../components/LiveMap";
import { LoadingBlock, ErrorBlock } from "../components/StateViews";
import { useToast } from "../context/ToastContext";
import { cancelPickup, getMyReview, getPickup, getPickupEvents, submitComplaint, submitReview, subscribeToPickup } from "../lib/api";
import { friendlyError } from "../lib/errors";
import TrackingPanel from "../components/TrackingPanel";
import { useCollectorLocation } from "../hooks/useCollectorLocation";
import { useRoute } from "../hooks/useRoute";
import { PAYMENT_LABELS, TIMELINE, TIMELINE_LABELS, formatDateTime, formatMoney } from "../lib/format";

export default function PickupDetailPage({ pickupId, theme, onBack }) {
  const { showToast } = useToast();
  const [pickup, setPickup] = useState(null);
  const [events, setEvents] = useState([]);
  const [review, setReview] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | notfound | error
  const [error, setError] = useState("");

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [rateBusy, setRateBusy] = useState(false);
  const [rateError, setRateError] = useState("");

  const [reportOpen, setReportOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState("");

  const tracking = Boolean(pickup && ["en_route", "arrived"].includes(pickup.status));
  const { loc, now, freshness } = useCollectorLocation(pickupId, tracking);
  const pickupPoint = pickup ? { lat: Number(pickup.lat), lng: Number(pickup.lng) } : null;
  const routeState = useRoute(loc, pickupPoint, pickup?.status === "en_route" && freshness === "live");

  const load = useCallback(async () => {
    try {
      const [p, ev] = await Promise.all([getPickup(pickupId), getPickupEvents(pickupId)]);
      if (!p) { setState("notfound"); return; }
      setPickup(p);
      setEvents(ev || []);
      if (p.status === "completed") setReview(await getMyReview(pickupId));
      setState("ready");
    } catch (e) {
      setError(friendlyError(e, "We couldn't load this pickup."));
      setState((s) => (s === "ready" ? s : "error"));
    }
  }, [pickupId]);

  useEffect(() => {
    setState("loading");
    load();
    const off = subscribeToPickup(pickupId, load);
    const t = setInterval(load, 30000);
    const onVis = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { off(); clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [pickupId, load]);

  const doCancel = async () => {
    setCancelBusy(true);
    setCancelError("");
    try {
      await cancelPickup(pickupId, cancelReason.trim());
      setCancelOpen(false);
      setCancelReason("");
      showToast("Pickup cancelled.", "success");
      await load();
    } catch (e) {
      setCancelError(friendlyError(e, "We couldn't cancel this pickup. Please try again."));
      load();
    } finally { setCancelBusy(false); }
  };

  const doRate = async () => {
    setRateBusy(true);
    setRateError("");
    try {
      await submitReview(pickupId, rating, comment.trim());
      showToast("Thanks for your rating.", "success");
      setReview(await getMyReview(pickupId));
    } catch (e) { setRateError(friendlyError(e, "We couldn't save your rating.")); }
    finally { setRateBusy(false); }
  };

  const doReport = async (e) => {
    e.preventDefault();
    setReportBusy(true);
    setReportError("");
    try {
      await submitComplaint({ subject: subject.trim(), body: body.trim(), pickupId });
      showToast("Report sent. We'll look into it.", "success");
      setReportOpen(false); setSubject(""); setBody("");
    } catch (err) { setReportError(friendlyError(err, "We couldn't send your report.")); }
    finally { setReportBusy(false); }
  };

  if (state === "loading") return <section className="cg-page cg-page-wide"><LoadingBlock label="Loading pickup…" /></section>;
  if (state === "error") return <section className="cg-page cg-page-wide"><button className="cg-auth-back" onClick={onBack}><ArrowLeft size={15} /> My pickups</button><ErrorBlock message={error} onRetry={load} /></section>;
  if (state === "notfound") return <section className="cg-page cg-page-wide"><button className="cg-auth-back" onClick={onBack}><ArrowLeft size={15} /> My pickups</button><ErrorBlock message="We couldn't find that pickup." /></section>;

  const times = {};
  events.forEach((e) => { if (!times[e.to_status]) times[e.to_status] = e.created_at; });
  const curIdx = TIMELINE.indexOf(pickup.status);
  const cancelled = pickup.status === "cancelled";
  const canCancel = pickup.status === "requested" || pickup.status === "assigned";
  const collector = pickup.collector;
  const collectorName = collector?.profile?.full_name || "Your collector";

  return (
    <section className="cg-page cg-page-wide">
      <button className="cg-auth-back" onClick={onBack}><ArrowLeft size={15} /> My pickups</button>
      <div className="cg-detail-head">
        <div>
          <h1>{pickup.reference}</h1>
          <p className="cg-page-lede">{pickup.waste_categories?.label} × {pickup.quantity} {pickup.waste_categories?.unit}{pickup.quantity > 1 ? "s" : ""}</p>
        </div>
        <StatusBadge status={pickup.status} />
      </div>
      {error && <p className="cg-field-error" role="alert">{error}</p>}

      <div className="cg-detail-grid">
        <div className="cg-detail-col">
          <div className="cg-detail-card glass">
            <h3>Progress</h3>
            {cancelled && <p className="cg-banner cg-banner-neutral">This pickup was cancelled{pickup.cancelled_at ? ` on ${formatDateTime(pickup.cancelled_at)}` : ""}.{pickup.cancel_reason ? ` Reason: ${pickup.cancel_reason}` : ""}</p>}
            <ol className="cg-timeline">
              {TIMELINE.map((s, i) => {
                const done = !cancelled && (pickup.status === "completed" || i < curIdx);
                const current = !cancelled && pickup.status !== "completed" && i === curIdx;
                const reached = times[s];
                return (
                  <li key={s} className={done || (cancelled && reached) ? "is-done" : current ? "is-current" : ""}>
                    <span className="cg-timeline-dot">{done || (cancelled && reached) ? <Check size={11} strokeWidth={3} /> : null}</span>
                    <span className="cg-timeline-text"><strong>{TIMELINE_LABELS[s]}</strong>{reached && <em>{formatDateTime(reached)}</em>}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          {collector && !cancelled && (
            <div className="cg-detail-card glass">
              <h3>Your collector</h3>
              <p className="cg-collector-name">{collectorName}</p>
              <p className="cg-field-hint">{collector.vehicle_type}</p>
              <p className="cg-collector-rating"><Star size={14} className="cg-star-filled" fill="currentColor" /> {collector.rating_count > 0 ? `${Number(collector.rating_avg).toFixed(1)} (${collector.rating_count})` : "New collector"} · {collector.completed_jobs} job{collector.completed_jobs === 1 ? "" : "s"}</p>
              {collector.profile?.phone && <a className="cg-text-link cg-inline-link" href={`tel:${collector.profile.phone}`}><Phone size={13} /> Call {collector.profile.phone}</a>}
            </div>
          )}

          {pickup.status === "completed" && (
            <div className="cg-detail-card glass">
              <h3>Your rating</h3>
              {review ? (
                <>
                  <div className="cg-pickup-stars">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={16} fill={n <= review.rating ? "currentColor" : "none"} className={n <= review.rating ? "cg-star-filled" : "cg-star-empty"} />)}</div>
                  {review.comment && <p className="cg-pickup-comment">&ldquo;{review.comment}&rdquo;</p>}
                </>
              ) : (
                <>
                  <p className="cg-field-hint">How did it go?</p>
                  <StarRating value={rating} onChange={setRating} />
                  <textarea className="cg-textarea" rows={3} maxLength={500} placeholder="Optional comment" aria-label="Optional comment" value={comment} onChange={(e) => setComment(e.target.value)} />
                  {rateError && <p className="cg-field-error" role="alert">{rateError}</p>}
                  <RippleButton variant="primary" disabled={!rating || rateBusy} onClick={doRate}>{rateBusy ? "Saving…" : "Submit rating"}</RippleButton>
                </>
              )}
            </div>
          )}
        </div>

        <div className="cg-detail-col">
          <div className="cg-detail-card glass">
            <h3>Details</h3>
            <div className="cg-review-list">
              <div className="cg-review-row"><MapPin size={15} /><span>{pickup.address_text}</span></div>
              <div className="cg-review-row"><Clock size={15} /><span>{pickup.preferred_time ? `Scheduled for ${formatDateTime(pickup.preferred_time)}` : "As soon as possible"}</span></div>
            </div>
            <div className="cg-price-preview cg-price-preview-total">
              <span>{pickup.final_price != null ? "Final price" : "Estimated price"}</span>
              <strong>{formatMoney(pickup.final_price ?? pickup.estimated_price, pickup.currency)}</strong>
            </div>
            <p className="cg-field-hint">{PAYMENT_LABELS[pickup.payment_status] || pickup.payment_status}{pickup.price_was_approved ? "" : " · provisional pricing"}</p>
            <div className="cg-detail-map">
              <LiveMap theme={theme} pickup={{ lat: Number(pickup.lat), lng: Number(pickup.lng), label: pickup.address_text }}
                collector={tracking && loc ? { lat: loc.lat, lng: loc.lng } : null}
                routePath={routeState.status === "ok" && freshness === "live" ? routeState.route.path : null}
                height={tracking ? 260 : 200} zoom={16} />
            </div>
            <TrackingPanel status={pickup.status} loc={loc} freshness={freshness} now={now} pickup={pickupPoint} routeState={routeState} />
          </div>

          <div className="cg-detail-card glass">
            <h3>Need help?</h3>
            {canCancel && <RippleButton variant="ghost" className="cg-btn-full cg-mb" onClick={() => { setCancelError(""); setCancelOpen(true); }}>Cancel this pickup</RippleButton>}
            {!canCancel && !cancelled && pickup.status !== "completed" && <p className="cg-field-hint">Your collector is already on the way, so this pickup can't be cancelled online.</p>}
            {!reportOpen ? (
              <button type="button" className="cg-text-link" onClick={() => setReportOpen(true)}>Report a problem with this pickup</button>
            ) : (
              <form className="cg-auth-form" onSubmit={doReport}>
                <input className="cg-input" placeholder="Subject" aria-label="Subject" maxLength={150} value={subject} onChange={(e) => setSubject(e.target.value)} />
                <textarea className="cg-textarea" rows={4} maxLength={2000} placeholder="What went wrong?" aria-label="Describe the problem" value={body} onChange={(e) => setBody(e.target.value)} />
                {reportError && <p className="cg-field-error" role="alert">{reportError}</p>}
                <div className="cg-step-actions">
                  <button type="button" className="cg-text-link" onClick={() => setReportOpen(false)}>Close</button>
                  <RippleButton variant="primary" type="submit" disabled={reportBusy || subject.trim().length < 3 || body.trim().length < 5}>{reportBusy ? "Sending…" : "Send report"}</RippleButton>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog open={cancelOpen} danger busy={cancelBusy} title="Cancel this pickup?" confirmLabel="Yes, cancel pickup" cancelLabel="Keep pickup"
        onConfirm={doCancel} onCancel={() => setCancelOpen(false)}>
        <p>{pickup.reference} will be cancelled and any assigned collector will be told.</p>
        <textarea className="cg-textarea" rows={2} maxLength={300} placeholder="Reason (optional)" aria-label="Cancellation reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
        {cancelError && <p className="cg-field-error" role="alert">{cancelError}</p>}
      </ConfirmDialog>
    </section>
  );
}
