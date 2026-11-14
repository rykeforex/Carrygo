import React from "react";
import { BRAND } from "../config/brand";

export default function PrivacyPage() {
  return (
    <section className="cg-page">
      <div className="cg-banner" role="note"><span>Draft — pending review by a qualified Ghanaian legal professional. Not yet legally binding.</span></div>
      <div className="cg-page-head">
        <h1>Privacy policy</h1>
        <p className="cg-page-lede">
          Last updated September 13, 2026. This explains what we collect and why.
          CarryGo is owned and operated by {BRAND.owner}, the data
          controller for the information described below.
        </p>
      </div>

      <div className="cg-legal">
        <h3>1. What we collect</h3>
        <ul>
          <li>Account details: name, phone number, email, payment method</li>
          <li>Pickup details: address, waste type, quantity, preferred time</li>
          <li>Location data: your pickup address and, during an active job, a collector's live position (shared only with the rider on that job, not stored beyond the job's record)</li>
          <li>Usage data: app interactions, device type, crash logs</li>
        </ul>

        <h3>2. How we use it</h3>
        <p>
          We use this information to match you with a collector, calculate
          pricing, process payment, provide live tracking, and improve routing
          and reliability over time.
        </p>

        <h3>3. Who we share it with</h3>
        <p>
          Your pickup address and waste details are shared with the collector
          assigned to your job, and a collector's live location is shared with
          the rider on that job only for the job's duration. Payment details are
          shared with our payment processor. We don't sell personal data to
          advertisers.
        </p>

        <h3>4. Maps and location services</h3>
        <p>
          Live maps are provided by Google Maps. When you use "current location"
          or view a live map, your browser may request your device's precise
          location; this is only used to center the map and calculate a route,
          and is never stored longer than the active job requires.
        </p>

        <h3>5. How long we keep it</h3>
        <p>
          Pickup history is kept for as long as your account is active, and for a
          limited period afterward to handle disputes or legal requirements.
        </p>

        <h3>6. Your choices</h3>
        <p>
          You can ask CarryGo for a copy of your data, to correct it, or to delete your account. Contact details for these requests will be published here before launch.
        </p>

        <h3>7. Local storage and third parties</h3>
        <p>
          CarryGo stores a sign-in session in your browser's local storage so you stay signed in. It does not currently use advertising trackers. Google Maps and Google Fonts are loaded from Google and are subject to Google's own policies.
        </p>

        <h3>8. Contact</h3>
        <p>
          Contact details for privacy questions will be published here before launch.
        </p>
      </div>
    </section>
  );
}
