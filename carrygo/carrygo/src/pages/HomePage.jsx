import React, { useState } from "react";
import { MapPin, Truck, Shield, Leaf, Clock4, ScanLine } from "lucide-react";
import RippleButton from "../components/RippleButton";
import LiveMap from "../components/LiveMap";
import BookingFlow from "../features/BookingFlow";
import { useReveal } from "../hooks/useReveal";
import { useCountUp } from "../hooks/useCountUp";

const HERO_COORDS = { lat: 5.6037, lng: -0.187 };
const HERO_COLLECTOR = { lat: 5.6091, lng: -0.1795 };

function StatBlock({ value, suffix = "", label, decimals = 0 }) {
  const [ref, visible] = useReveal();
  const count = useCountUp(value, visible);
  return (
    <div ref={ref} className="cg-stat">
      <strong>
        {decimals ? count.toFixed(decimals) : count}
        {suffix}
      </strong>
      <span>{label}</span>
    </div>
  );
}

export default function HomePage({ setPage, theme, openPickup }) {
  const [howRef, howVisible] = useReveal();
  const [bentoRef, bentoVisible] = useReveal();

  return (
    <>
      <section className="cg-hero">
        <div className="cg-hero-copy">
          <span className="cg-eyebrow-plain">
            <span className="cg-dot cg-dot-live" /> Built for Ghana · prices in GHS
          </span>
          <h1>
            Waste pickup,
            <br />
            <span className="cg-hero-light">on your schedule.</span>
          </h1>
          <p className="cg-hero-sub">
            Request a collector the way you'd request a ride. Live tracking,
            upfront pricing, four waste streams — no bin day to remember.
          </p>
          <div className="cg-hero-actions">
            <RippleButton
              variant="primary"
              onClick={() => document.getElementById("cg-book")?.scrollIntoView({ behavior: "smooth" })}
            >
              Request a pickup
            </RippleButton>
            <RippleButton
              variant="ghost"
              onClick={() => document.getElementById("cg-how")?.scrollIntoView({ behavior: "smooth" })}
            >
              See how it works
            </RippleButton>
          </div>
          <div className="cg-hero-stats">
            <div className="cg-stat"><strong>GHS</strong><span>price shown before you confirm</span></div>
            <div className="cg-stat"><strong>4</strong><span>waste categories</span></div>
            <div className="cg-stat"><strong>GPS</strong><span>tracking during active pickups</span></div>
          </div>
        </div>

        <div className="cg-hero-visual">
          <div className="cg-hero-glow" />
          <div className="cg-hero-card-back glass" />
          <div className="cg-hero-card glass">
            <div className="cg-hero-card-top">
              <span className="cg-dot cg-dot-live" />
              Product preview · illustration
            </div>
            <LiveMap
              theme={theme}
              pickup={{ ...HERO_COORDS, label: "Sample pickup" }}
              collector={HERO_COLLECTOR}
              height={180}
              zoom={13}
            />
            <div className="cg-hero-card-bottom">
              <div>
                <span className="cg-hero-card-label">ETA</span>
                <strong>Shown live</strong>
              </div>
              <div>
                <span className="cg-hero-card-label">Tracking</span>
                <strong>Real GPS</strong>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      <section className="cg-how" id="cg-how" ref={howRef}>
        <h2>Three taps, one clean curb</h2>
        <div className={`cg-how-grid ${howVisible ? "is-visible" : ""}`}>
          <div className="cg-how-card glass">
            <span className="cg-how-num">1</span>
            <MapPin size={22} className="cg-icon-red" />
            <h3>Drop a pin</h3>
            <p>Type your address or use your current location — pricing shows instantly.</p>
          </div>
          <div className="cg-how-card glass">
            <span className="cg-how-num">2</span>
            <Clock4 size={22} className="cg-icon-blue" />
            <h3>Pick a time</h3>
            <p>Right now, this afternoon, or a slot tomorrow. No fixed weekly schedule to remember.</p>
          </div>
          <div className="cg-how-card glass">
            <span className="cg-how-num">3</span>
            <ScanLine size={22} className="cg-icon-green" />
            <h3>Watch it happen</h3>
            <p>A live map shows your collector arrive, then you rate the pickup when it's done.</p>
          </div>
        </div>
      </section>

      <section className="cg-bento" ref={bentoRef}>
        <div className={`cg-bento-grid ${bentoVisible ? "is-visible" : ""}`}>
          <div className="cg-bento-card cg-bento-card-lg glass">
            <span className="cg-bento-kicker">Live tracking</span>
            <h3>Not a schedule you hope holds — a map you can actually watch.</h3>
            <p>Once a collector accepts your pickup, you'll see their live GPS position on the map until they arrive.</p>
          </div>
          <div className="cg-bento-card glass">
            <Truck size={20} className="cg-icon-blue" />
            <h4>4 waste streams</h4>
            <p>Household, recycling, bulky items, and e-waste — one app, four pickup types.</p>
          </div>
          <div className="cg-bento-card glass">
            <Shield size={20} className="cg-icon-red" />
            <h4>Approved collectors</h4>
            <p>Collectors apply and are reviewed by CarryGo before they can accept jobs, and are rated after each job.</p>
          </div>
          <div className="cg-bento-card cg-bento-card-wide glass">
            <Leaf size={20} className="cg-icon-green" />
            <h4>Transparent, upfront pricing</h4>
            <p>See your estimate before you confirm — priced by waste type and quantity, not by surprise.</p>
          </div>
        </div>
      </section>

      <BookingFlow theme={theme} onOpenPickup={openPickup} />

      <section className="cg-trust">
        <div className="cg-trust-inner glass">
          <Shield size={20} />
          <p>
            Hazardous or medical waste isn't accepted through CarryGo — see our{" "}
            <button onClick={() => setPage("terms")}>terms</button> for the full list of
            what we can and can't collect.
          </p>
        </div>
      </section>

      <section className="cg-cta-band">
        <h2>Stop waiting for bin day.</h2>
        <p>Request a pickup in a few taps.</p>
        <RippleButton
          variant="primary"
          onClick={() => document.getElementById("cg-book")?.scrollIntoView({ behavior: "smooth" })}
        >
          Request a pickup
        </RippleButton>
      </section>
    </>
  );
}
