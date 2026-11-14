import React, { useCallback, useEffect, useState } from "react";
import { MapPin, PackageOpen } from "lucide-react";
import RippleButton from "../components/RippleButton";
import StatusBadge from "../components/StatusBadge";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "../components/StateViews";
import { listMyPickups, subscribeToMyPickups } from "../lib/api";
import { friendlyError } from "../lib/errors";
import { ACTIVE_STATUSES, formatDateTime, formatMoney } from "../lib/format";

export default function PickupsPage({ userId, onOpenPickup, onRequest }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("active");

  const load = useCallback(async () => {
    try { setItems(await listMyPickups()); setError(null); }
    catch (e) { setError(friendlyError(e, "We couldn't load your pickups.")); }
  }, []);

  useEffect(() => {
    load();
    return subscribeToMyPickups(userId, load);
  }, [load, userId]);

  const active = (items || []).filter((p) => ACTIVE_STATUSES.includes(p.status));
  const history = (items || []).filter((p) => !ACTIVE_STATUSES.includes(p.status));
  const shown = tab === "active" ? active : history;

  return (
    <section className="cg-page cg-page-wide">
      <div className="cg-page-head">
        <h1>My pickups</h1>
        <p className="cg-page-lede">Track requests in progress and look back at past pickups.</p>
      </div>

      {error && !items && <ErrorBlock message={error} onRetry={load} />}
      {!error && !items && <LoadingBlock label="Loading your pickups…" />}

      {items && (
        <>
          <div className="cg-auth-toggle cg-tabs" role="tablist">
            <button role="tab" aria-selected={tab === "active"} className={tab === "active" ? "is-active" : ""} onClick={() => setTab("active")}>Active ({active.length})</button>
            <button role="tab" aria-selected={tab === "history"} className={tab === "history" ? "is-active" : ""} onClick={() => setTab("history")}>History ({history.length})</button>
          </div>
          {error && <p className="cg-field-error" role="alert">{error}</p>}
          {shown.length === 0 ? (
            <EmptyBlock icon={PackageOpen} title={tab === "active" ? "No active pickups" : "No past pickups yet"}
              action={<RippleButton variant="primary" onClick={onRequest}>Request a pickup</RippleButton>}>
              {tab === "active" ? "Request a pickup and you can follow it here." : "Completed and cancelled pickups will show up here."}
            </EmptyBlock>
          ) : (
            <div className="cg-pickup-list">
              {shown.map((p) => (
                <button key={p.id} type="button" className="cg-pickup-card cg-pickup-card-btn glass" onClick={() => onOpenPickup(p.id)}>
                  <div className="cg-pickup-card-top">
                    <StatusBadge status={p.status} />
                    <span className="cg-pickup-date">{formatDateTime(p.created_at)}</span>
                  </div>
                  <div className="cg-pickup-row"><strong>{p.reference}</strong><span>· {p.waste_categories?.label} × {p.quantity}</span></div>
                  <div className="cg-pickup-row"><MapPin size={15} /><span>{p.address_text}</span></div>
                  <div className="cg-pickup-card-bottom">
                    <span className="cg-hero-card-label">{p.final_price != null ? "Final price" : "Estimated price"}</span>
                    <strong>{formatMoney(p.final_price ?? p.estimated_price, p.currency)}</strong>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
