import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trash2, Recycle, Package, Cpu, Clock, MapPin, Check, Minus, Plus, Navigation, Search, AlertTriangle, Loader2 } from "lucide-react";
import RippleButton from "../components/RippleButton";
import LiveMap from "../components/LiveMap";
import StatusBadge from "../components/StatusBadge";
import { LoadingBlock, ErrorBlock } from "../components/StateViews";
import { listCategories, quotePickup, createPickup } from "../lib/api";
import { getCurrentPosition, geoErrorMessage, geocodeAddress, reverseGeocode, inGhana } from "../lib/geo";
import { friendlyError } from "../lib/errors";
import { formatMoney, formatDateTime } from "../lib/format";
import { parseSchedule, scheduleBounds } from "../lib/schedule";
import { newKey } from "../lib/ids";

const ICONS = { general: Trash2, recycling: Recycle, bulky: Package, ewaste: Cpu };
const STEPS = ["where", "what", "when", "review"];
const STEP_LABELS = { where: "Location", what: "Waste", when: "Time", review: "Review" };

export default function BookingFlow({ theme, onOpenPickup }) {
  const [step, setStep] = useState("where");

  const [address, setAddress] = useState("");
  const [addressAuto, setAddressAuto] = useState(false);
  const [coords, setCoords] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [locError, setLocError] = useState("");
  const [mapStatus, setMapStatus] = useState("loading");

  const [categories, setCategories] = useState([]);
  const [catState, setCatState] = useState("loading");
  const [categoryCode, setCategoryCode] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const quoteReq = useRef(0);

  const [whenMode, setWhenMode] = useState("asap");
  const [laterValue, setLaterValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [created, setCreated] = useState(null);
  const idemKey = useRef(null);
  if (!idemKey.current) idemKey.current = newKey();

  const loadCategories = useCallback(async () => {
    setCatState("loading");
    try { setCategories(await listCategories()); setCatState("ready"); }
    catch { setCatState("error"); }
  }, []);
  useEffect(() => { loadCategories(); }, [loadCategories]);

  const category = categories.find((c) => c.code === categoryCode);

  useEffect(() => {
    if (!categoryCode) return;
    const id = ++quoteReq.current;
    setQuoteLoading(true);
    setQuoteError("");
    const t = setTimeout(async () => {
      try {
        const q = await quotePickup(categoryCode, quantity);
        if (id === quoteReq.current) setQuote(q || null);
      } catch (e) {
        if (id === quoteReq.current) { setQuote(null); setQuoteError(friendlyError(e, "We couldn't calculate a price.")); }
      } finally {
        if (id === quoteReq.current) setQuoteLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [categoryCode, quantity]);

  const locateMe = async () => {
    setLocating(true);
    setLocError("");
    try {
      const pos = await getCurrentPosition();
      setCoords({ lat: pos.lat, lng: pos.lng });
      setAccuracy(pos.accuracy ?? null);
      if (!address.trim() || addressAuto) {
        let label = null;
        try { label = await reverseGeocode(pos.lat, pos.lng); } catch { /* maps unavailable */ }
        setAddress(label || `Near ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`);
        setAddressAuto(true);
      }
    } catch (e) {
      setLocError(geoErrorMessage(e?.code));
    } finally {
      setLocating(false);
    }
  };

  const findOnMap = async () => {
    setGeocoding(true);
    setLocError("");
    try {
      const g = await geocodeAddress(address.trim());
      setCoords({ lat: g.lat, lng: g.lng });
      setAccuracy(null);
    } catch {
      setLocError("We couldn't find that address. Add the area or town, or tap the map to drop a pin.");
    } finally {
      setGeocoding(false);
    }
  };

  const onPick = useCallback(async ({ lat, lng }) => {
    setCoords({ lat, lng });
    setAccuracy(null);
    setLocError("");
    if (addressAuto || !address.trim()) {
      try {
        const l = await reverseGeocode(lat, lng);
        if (l) { setAddress(l); setAddressAuto(true); }
      } catch { /* ignore */ }
    }
  }, [addressAuto, address]);

  const pickupProp = useMemo(() => (coords ? { lat: coords.lat, lng: coords.lng, label: address } : null), [coords, address]);
  const bounds = useMemo(() => scheduleBounds(), [step]); // eslint-disable-line react-hooks/exhaustive-deps
  const schedule = whenMode === "later" ? parseSchedule(laterValue) : { ok: true, iso: null };

  const canWhere = Boolean(coords) && address.trim().length >= 5;
  const mapReady = mapStatus === "ready";
  const mapUnavailable = mapStatus === "no-key" || mapStatus === "error";

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const row = await createPickup({
        category: categoryCode, quantity, address: address.trim(), lat: coords.lat, lng: coords.lng,
        preferredTime: schedule.iso, idempotencyKey: idemKey.current, expectedPrice: quote?.amount,
      });
      setCreated(row);
      setStep("done");
    } catch (e) {
      if (/price_changed/.test(e?.message || "")) {
        try {
          const q = await quotePickup(categoryCode, quantity);
          setQuote(q);
          setSubmitError(`The price has changed to ${formatMoney(q.amount, q.currency)}. Please review it and confirm again.`);
        } catch { setSubmitError(friendlyError(e)); }
      } else {
        setSubmitError(friendlyError(e, "We couldn't create your pickup. Nothing was booked — please try again."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    idemKey.current = newKey();
    setStep("where"); setAddress(""); setAddressAuto(false); setCoords(null); setAccuracy(null); setLocError("");
    setCategoryCode(null); setQuantity(1); setQuote(null); setQuoteError("");
    setWhenMode("asap"); setLaterValue(""); setSubmitError(""); setCreated(null);
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="cg-booking glass" id="cg-book">
      <div className="cg-booking-map">
        <LiveMap theme={theme} pickup={pickupProp} height={260} zoom={16} editable={step === "where"} onPick={onPick} onStatus={setMapStatus} />
      </div>

      <div className="cg-booking-panel">
        {step !== "done" && (
          <ol className="cg-stepper" aria-label="Booking progress">
            {STEPS.map((id, i) => (
              <li key={id} className={`cg-stepper-item ${i < stepIndex ? "is-done" : ""} ${step === id ? "is-active" : ""}`} aria-current={step === id ? "step" : undefined}>
                <span className="cg-stepper-dot">{i < stepIndex ? <Check size={11} strokeWidth={3} /> : i + 1}</span>
                <span className="cg-stepper-label">{STEP_LABELS[id]}</span>
              </li>
            ))}
          </ol>
        )}

        {step === "where" && (
          <div className="cg-step-body">
            <h3>Where should we collect from?</h3>
            <label className="cg-label" htmlFor="cg-address">Pickup address</label>
            <input id="cg-address" className="cg-input" value={address} maxLength={300} placeholder="Street, area, landmark"
              autoComplete="street-address" onChange={(e) => { setAddress(e.target.value); setAddressAuto(false); }} />
            <div className="cg-loc-actions">
              <button type="button" className="cg-locate-btn" onClick={locateMe} disabled={locating}>
                <Navigation size={15} /> {locating ? "Locating…" : "Use my current location"}
              </button>
              {mapReady && (
                <button type="button" className="cg-locate-btn" onClick={findOnMap} disabled={geocoding || address.trim().length < 5}>
                  <Search size={15} /> {geocoding ? "Searching…" : "Find address on map"}
                </button>
              )}
            </div>
            {mapReady && !coords && <p className="cg-field-hint">You can also tap the map to drop a pin.</p>}
            {mapUnavailable && !coords && <p className="cg-field-hint">Address search needs a Google Maps key. Use your current location to set the pin.</p>}
            {locError && <p className="cg-field-error" role="alert">{locError}</p>}
            {coords && (
              <p className="cg-field-ok" role="status">
                <Check size={13} /> Location set{accuracy ? ` (±${Math.round(accuracy)} m)` : ""}. {mapReady ? "Drag the pin to adjust it." : "Make sure it's where you want us to collect."}
              </p>
            )}
            {coords && !inGhana(coords.lat, coords.lng) && (
              <p className="cg-field-warn" role="alert"><AlertTriangle size={13} /> This location looks to be outside Ghana. Double-check the pin.</p>
            )}
            <div className="cg-step-actions cg-step-actions-end">
              <RippleButton variant="primary" disabled={!canWhere} onClick={() => setStep("what")}>Continue</RippleButton>
            </div>
          </div>
        )}

        {step === "what" && (
          <div className="cg-step-body">
            <h3>What's going?</h3>
            {catState === "loading" && <LoadingBlock label="Loading categories…" />}
            {catState === "error" && <ErrorBlock message="We couldn't load waste categories." onRetry={loadCategories} />}
            {catState === "ready" && (
              <div className="cg-chip-row">
                {categories.map((c) => {
                  const Icon = ICONS[c.code] || Trash2;
                  const active = categoryCode === c.code;
                  return (
                    <button key={c.code} type="button" aria-pressed={active} className={`cg-chip ${active ? "is-active" : ""}`}
                      onClick={() => { setCategoryCode(c.code); setQuantity((q) => Math.min(q, c.max_quantity)); }}>
                      <Icon size={18} strokeWidth={2} />
                      <span><strong>{c.label}</strong><em>per {c.unit}</em></span>
                    </button>
                  );
                })}
              </div>
            )}
            {category && (
              <div className="cg-qty-row">
                <span className="cg-qty-label" id="cg-qty-label">Number of {category.unit}s</span>
                <div className="cg-qty-control" role="group" aria-labelledby="cg-qty-label">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" disabled={quantity <= 1}><Minus size={14} /></button>
                  <span aria-live="polite">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((q) => Math.min(category.max_quantity, q + 1))} aria-label="Increase quantity" disabled={quantity >= category.max_quantity}><Plus size={14} /></button>
                </div>
              </div>
            )}
            {categoryCode && (
              <div className="cg-price-preview" aria-live="polite">
                <span>Price</span>
                {quoteLoading ? <strong className="cg-skeleton-text">Calculating…</strong> : <strong>{quote ? formatMoney(quote.amount, quote.currency) : "—"}</strong>}
              </div>
            )}
            {quote && !quoteLoading && !quote.is_approved && <p className="cg-field-hint">Provisional pricing — final prices are still being confirmed.</p>}
            {quoteError && <p className="cg-field-error" role="alert">{quoteError}</p>}
            <div className="cg-step-actions">
              <button type="button" className="cg-text-link" onClick={() => setStep("where")}>Back</button>
              <RippleButton variant="primary" disabled={!quote || quoteLoading} onClick={() => setStep("when")}>Continue</RippleButton>
            </div>
          </div>
        )}

        {step === "when" && (
          <div className="cg-step-body">
            <h3>When works?</h3>
            <div className="cg-radio-group" role="radiogroup" aria-label="Collection time">
              <label className={`cg-radio ${whenMode === "asap" ? "is-active" : ""}`}>
                <input type="radio" name="when" checked={whenMode === "asap"} onChange={() => setWhenMode("asap")} />
                <span><strong>As soon as possible</strong><em>Assigned when a collector accepts</em></span>
              </label>
              <label className={`cg-radio ${whenMode === "later" ? "is-active" : ""}`}>
                <input type="radio" name="when" checked={whenMode === "later"} onChange={() => setWhenMode("later")} />
                <span><strong>Schedule for later</strong><em>At least 30 minutes ahead, up to 30 days</em></span>
              </label>
            </div>
            {whenMode === "later" && (
              <>
                <input type="datetime-local" className="cg-input" aria-label="Preferred collection time" min={bounds.min} max={bounds.max} value={laterValue} onChange={(e) => setLaterValue(e.target.value)} />
                {laterValue && !schedule.ok && <p className="cg-field-error" role="alert">{schedule.error}</p>}
              </>
            )}
            <div className="cg-step-actions">
              <button type="button" className="cg-text-link" onClick={() => setStep("what")}>Back</button>
              <RippleButton variant="primary" disabled={!schedule.ok} onClick={() => setStep("review")}>Continue</RippleButton>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="cg-step-body">
            <h3>Review &amp; confirm</h3>
            <div className="cg-review-list">
              <div className="cg-review-row"><MapPin size={15} /><span>{address}</span></div>
              <div className="cg-review-row"><Trash2 size={15} /><span>{category?.label} · {quantity} {category?.unit}{quantity > 1 ? "s" : ""}</span></div>
              <div className="cg-review-row"><Clock size={15} /><span>{whenMode === "later" && schedule.iso ? formatDateTime(schedule.iso) : "As soon as possible"}</span></div>
            </div>
            <div className="cg-price-preview cg-price-preview-total">
              <span>Total</span>
              <strong>{quote ? formatMoney(quote.amount, quote.currency) : "—"}</strong>
            </div>
            <p className="cg-field-hint">No payment is taken in this version. You'll only be charged the price shown above.</p>
            {submitError && <p className="cg-field-error" role="alert">{submitError}</p>}
            <div className="cg-step-actions">
              <button type="button" className="cg-text-link" onClick={() => setStep("when")} disabled={submitting}>Back</button>
              <RippleButton variant="primary" disabled={submitting || !quote} onClick={submit}>
                {submitting ? <Loader2 size={16} className="cg-spin" /> : "Confirm pickup"}
              </RippleButton>
            </div>
          </div>
        )}

        {step === "done" && created && (
          <div className="cg-step-body cg-rate-step">
            <div className="cg-confirmed-icon"><Check size={22} strokeWidth={3} /></div>
            <h3>Pickup requested</h3>
            <p className="cg-confirmed-sub">Reference <strong>{created.reference}</strong></p>
            <StatusBadge status={created.status} />
            <p className="cg-confirmed-sub cg-mt">{formatMoney(created.estimated_price, created.currency)} · we'll notify you as soon as a collector accepts.</p>
            <div className="cg-step-actions cg-step-actions-center">
              <RippleButton variant="ghost" onClick={reset}>Book another</RippleButton>
              <RippleButton variant="primary" onClick={() => onOpenPickup(created.id)}>Track this pickup</RippleButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
