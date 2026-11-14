import React, { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Phone, Power, Timer, Navigation, Star, Wallet, PackageCheck, Clock } from "lucide-react";
import RippleButton from "../components/RippleButton";
import LiveMap from "../components/LiveMap";
import StatusBadge from "../components/StatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "../components/StateViews";
import { acceptPickup, advancePickup, getActiveJob, getMyCollector, getMyStats, listOpenPickups, releasePickup, setCollectorOnline, subscribeToMyJobs } from "../lib/api";
import { GeoError, geoErrorMessage, getCurrentPosition } from "../lib/geo";
import { friendlyError } from "../lib/errors";
import { useLocationSharing } from "../hooks/useLocationSharing";
import { formatDateTime, formatMoney, timeAgo } from "../lib/format";

const NEXT = {
  assigned: { to: "en_route", label: "Start driving to pickup" },
  en_route: { to: "arrived", label: "I've arrived" },
  arrived: { to: "collected", label: "Waste collected" },
  collected: { to: "completed", label: "Complete job", confirm: true },
};

const CONSENT_KEY = "cg_loc_consent_v1";
function readConsent() { try { const v = localStorage.getItem(CONSENT_KEY); return v === "share" || v === "decline" ? v : null; } catch { return null; } }
function saveConsent(v) { try { localStorage.setItem(CONSENT_KEY, v); } catch { /* storage unavailable: choice just won't persist */ } }

function shareMessage(consent, status, state) {
  if (consent !== "share") return "Not sharing. The customer can't see where you are, so they won't get live tracking.";
  if (status === "assigned") return "Sharing starts when you tap Start driving to pickup.";
  switch (state) {
    case "live": return "Sharing your live location with the customer. Keep this screen open — sharing stops automatically when you collect the waste or the job ends.";
    case "denied": return "Location permission is blocked. Allow it in your browser settings, then try again.";
    case "unavailable": return "Your device can't determine its location right now.";
    case "unsupported": return "This browser can't share location.";
    case "reconnecting": return "Connection problem — retrying…";
    default: return "Waiting for a GPS fix…";
  }
}

export default function CollectorDashboard({ theme, profile }) {
  const uid = profile.id;
  const [me, setMe] = useState(null);
  const [active, setActive] = useState(undefined); // undefined = loading, null = none
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [pollError, setPollError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [toggling, setToggling] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [advancing, setAdvancing] = useState(false);
  const [dialog, setDialog] = useState(null); // "complete" | "release"
  const pollRef = useRef(null);
  const [consent, setConsent] = useState(() => readConsent());

  const loadMe = useCallback(async () => {
    try { setMe(await getMyCollector(uid)); setLoadError(""); }
    catch (e) { setLoadError(friendlyError(e, "We couldn't load your collector account.")); }
  }, [uid]);
  const loadActive = useCallback(async () => {
    try { setActive(await getActiveJob(uid)); setLoadError(""); }
    catch (e) { setLoadError(friendlyError(e, "We couldn't load your active job.")); }
  }, [uid]);

  useEffect(() => {
    loadMe(); loadActive();
    getMyStats().then(setStats).catch(() => {});
    const off = subscribeToMyJobs(uid, () => { loadActive(); loadMe(); });
    const t = setInterval(() => { loadActive(); loadMe(); }, 15000);
    return () => { off(); clearInterval(t); };
  }, [uid, loadMe, loadActive]);

  const online = Boolean(me?.is_online);
  const idle = active === null;

  useEffect(() => {
    if (!online || !idle) { setJobs(null); setPollError(""); return; }
    let cancelled = false;
    const run = async () => {
      try {
        const p = await getCurrentPosition({ enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 });
        const rows = await listOpenPickups(p.lat, p.lng, 15);
        if (!cancelled) { setJobs(rows); setPollError(""); }
      } catch (e) {
        if (!cancelled) setPollError(e instanceof GeoError ? geoErrorMessage(e.code) : friendlyError(e, "We couldn't check for jobs. Retrying…"));
      }
    };
    pollRef.current = run;
    run();
    const t = setInterval(run, 10000);
    return () => { cancelled = true; clearInterval(t); };
  }, [online, idle]);

  const toggle = async () => {
    setToggling(true); setActionError(""); setNotice("");
    try { await setCollectorOnline(!online); await loadMe(); }
    catch (e) { setActionError(friendlyError(e)); }
    finally { setToggling(false); }
  };

  const accept = async (id) => {
    setBusyId(id); setActionError(""); setNotice("");
    try { await acceptPickup(id); await Promise.all([loadActive(), loadMe()]); }
    catch (e) { setActionError(friendlyError(e)); pollRef.current?.(); loadActive(); }
    finally { setBusyId(null); }
  };

  const next = active ? NEXT[active.status] : null;
  const sharingOn = consent === "share" && Boolean(active) && ["en_route", "arrived"].includes(active.status);
  const sharing = useLocationSharing({ jobId: active?.id, enabled: sharingOn });
  const changeConsent = (v) => { saveConsent(v); setConsent(v); };
  const onNext = () => {
    if (next.confirm) return setDialog("complete");
    if (next.to === "en_route" && consent === null) return setDialog("consent");
    return doAdvance();
  };
  const chooseConsent = (v) => { changeConsent(v); setDialog(null); doAdvance(); };
  const doAdvance = async () => {
    setAdvancing(true); setActionError("");
    try {
      await advancePickup(active.id, next.to);
      setDialog(null);
      if (next.to === "completed") setNotice("Job completed. Nice work.");
      await Promise.all([loadActive(), loadMe()]);
      getMyStats().then(setStats).catch(() => {});
    } catch (e) { setActionError(friendlyError(e)); setDialog(null); loadActive(); }
    finally { setAdvancing(false); }
  };
  const doRelease = async () => {
    setAdvancing(true); setActionError("");
    try { await releasePickup(active.id); setDialog(null); setNotice("Job released. It's available to other collectors again."); await Promise.all([loadActive(), loadMe()]); }
    catch (e) { setActionError(friendlyError(e)); setDialog(null); loadActive(); }
    finally { setAdvancing(false); }
  };

  const firstName = (profile.name || "").split(" ")[0] || "there";

  return (
    <section className="cg-page cg-page-wide cg-collector">
      <div className="cg-page-head cg-collector-head">
        <div>
          <h1>Hi, {firstName}</h1>
          <p className="cg-page-lede">{me?.vehicle_type ? `${me.vehicle_type} · ` : ""}{active ? "You have an active job." : online ? "You're online — nearby pickups appear below." : "Go online to see nearby pickups."}</p>
        </div>
        <button type="button" className={`cg-online-toggle ${online ? "is-online" : ""}`} onClick={toggle} disabled={toggling || !me || Boolean(active)} aria-pressed={online}>
          <Power size={16} /> {online ? "Online" : "Go online"}
        </button>
      </div>

      <div className="cg-earnings-row">
        <div className="cg-earnings-card glass"><PackageCheck size={18} className="cg-icon-blue" /><span className="cg-hero-card-label">Jobs completed</span><strong>{me ? me.completed_jobs : "—"}</strong></div>
        <div className="cg-earnings-card glass"><Star size={18} className="cg-icon-red" /><span className="cg-hero-card-label">Rating</span><strong>{me && me.rating_count > 0 ? `${Number(me.rating_avg).toFixed(1)} (${me.rating_count})` : "No ratings yet"}</strong></div>
        <div className="cg-earnings-card glass"><Wallet size={18} className="cg-icon-green" /><span className="cg-hero-card-label">Estimated earnings</span><strong>{stats ? formatMoney(stats.estimated_earnings) : "—"}</strong></div>
      </div>
      {stats && !stats.commission_approved && <p className="cg-field-hint">Earnings and payout estimates use a provisional commission rate that CarryGo hasn't approved yet. Payments aren't live.</p>}

      {actionError && <p className="cg-field-error" role="alert">{actionError}</p>}
      {notice && <p className="cg-field-ok" role="status">{notice}</p>}
      {loadError && active === undefined && <ErrorBlock message={loadError} onRetry={() => { loadMe(); loadActive(); }} />}
      {active === undefined && !loadError && <LoadingBlock />}

      {active && (
        <div className="cg-booking glass">
          <div className="cg-booking-map">
            <LiveMap theme={theme} pickup={{ lat: Number(active.lat), lng: Number(active.lng), label: active.address_text }} height={260} zoom={16} />
          </div>
          <div className="cg-booking-panel">
            <div className="cg-step-body">
              <div className="cg-detail-head"><h3>{active.reference}</h3><StatusBadge status={active.status} /></div>
              <div className="cg-review-list">
                <div className="cg-review-row"><PackageCheck size={15} /><span>{active.waste_categories?.label} × {active.quantity} {active.waste_categories?.unit}{active.quantity > 1 ? "s" : ""}</span></div>
                <div className="cg-review-row"><MapPin size={15} /><span>{active.address_text}</span></div>
                <div className="cg-review-row"><Clock size={15} /><span>{active.preferred_time ? `Scheduled for ${formatDateTime(active.preferred_time)}` : "As soon as possible"}</span></div>
                {active.customer && <div className="cg-review-row"><Phone size={15} /><span>{active.customer.full_name || "Customer"}{active.customer.phone ? <> · <a className="cg-text-link cg-inline-link" href={`tel:${active.customer.phone}`}>{active.customer.phone}</a></> : " · no phone number"}</span></div>}
              </div>
              <a className="cg-locate-btn cg-nav-link-btn" href={`https://www.google.com/maps/dir/?api=1&destination=${active.lat},${active.lng}`} target="_blank" rel="noopener noreferrer"><Navigation size={15} /> Open directions in Google Maps</a>
              {["assigned", "en_route", "arrived"].includes(active.status) && (
                <div className="cg-share-box">
                  <label className="cg-switch">
                    <input type="checkbox" checked={consent === "share"} onChange={(e) => changeConsent(e.target.checked ? "share" : "decline")} />
                    <span>Share my live location with the customer</span>
                  </label>
                  <p className="cg-field-hint" role="status">{shareMessage(consent, active.status, sharing.state)}</p>
                  {(sharing.state === "denied" || sharing.state === "unavailable") && <button type="button" className="cg-text-link" onClick={sharing.retry}>Try again</button>}
                </div>
              )}
              {next && (
                <RippleButton variant="primary" className="cg-btn-full" disabled={advancing} onClick={onNext}>
                  {advancing && !dialog ? "Updating…" : next.label}
                </RippleButton>
              )}
              {active.status === "assigned" && <button type="button" className="cg-text-link" onClick={() => setDialog("release")}>Release this job</button>}
            </div>
          </div>
        </div>
      )}

      {active === null && !online && (
        <EmptyBlock icon={Power} title="You're offline">Go online to see pickups near you and accept jobs.</EmptyBlock>
      )}
      {active === null && online && (
        <>
          {pollError && <p className="cg-field-error" role="alert">{pollError}</p>}
          {!pollError && jobs === null && <LoadingBlock label="Looking for nearby pickups…" />}
          {jobs && jobs.length === 0 && !pollError && <EmptyBlock icon={Timer} title="No open pickups nearby">Nothing within 15 km right now. We'll keep checking.</EmptyBlock>}
          {jobs && jobs.length > 0 && (
            <div className="cg-job-list">
              {jobs.map((j) => (
                <div key={j.id} className="cg-job-card glass">
                  <div className="cg-job-top"><strong>{j.category_label} × {j.quantity}</strong><span className="cg-pickup-date">{timeAgo(j.created_at)}</span></div>
                  <div className="cg-pickup-row"><MapPin size={15} /><span>About {Number(j.distance_km).toFixed(1)} km away · exact address after you accept</span></div>
                  <div className="cg-job-bottom">
                    <span>Est. payout <strong>{formatMoney(j.estimated_payout, j.currency)}</strong></span>
                    <RippleButton variant="primary" className="cg-btn-sm" disabled={busyId !== null} onClick={() => accept(j.id)}>{busyId === j.id ? "Accepting…" : "Accept job"}</RippleButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {dialog === "consent" && (
        <div className="cg-modal-backdrop">
          <div className="cg-modal glass" role="dialog" aria-modal="true" aria-labelledby="cg-consent-title">
            <h3 id="cg-consent-title">Share your live location?</h3>
            <div className="cg-modal-body">
              <p>While you're on the way, the customer for this job can see your live location on a map. It's shared only for this job and stops automatically when you collect the waste, complete, release or cancel the job.</p>
              <p>We don't keep a history of your route. You can switch sharing off at any time.</p>
            </div>
            <div className="cg-modal-actions cg-modal-actions-stack">
              <button type="button" className="cg-btn cg-btn-primary" onClick={() => chooseConsent("share")}>Share and start</button>
              <button type="button" className="cg-btn cg-btn-ghost" onClick={() => chooseConsent("decline")}>Start without sharing</button>
              <button type="button" className="cg-text-link" onClick={() => setDialog(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog open={dialog === "complete"} busy={advancing} title="Complete this job?" confirmLabel="Yes, complete job" cancelLabel="Not yet" onConfirm={doAdvance} onCancel={() => setDialog(null)}>
        <p>Only complete the job once the waste has been collected. The customer will be asked to rate it.</p>
      </ConfirmDialog>
      <ConfirmDialog open={dialog === "release"} danger busy={advancing} title="Release this job?" confirmLabel="Yes, release it" cancelLabel="Keep job" onConfirm={doRelease} onCancel={() => setDialog(null)}>
        <p>The customer will be told you're no longer available and we'll look for another collector.</p>
      </ConfirmDialog>
    </section>
  );
}
