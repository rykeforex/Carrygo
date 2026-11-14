import React from "react";
import { BRAND } from "../config/brand";

export default function TermsPage() {
  return (
    <section className="cg-page">
      <div className="cg-banner" role="note"><span>Draft — pending review by a qualified Ghanaian legal professional. Not yet legally binding.</span></div>
      <div className="cg-page-head">
        <h1>Terms &amp; conditions</h1>
        <p className="cg-page-lede">
          Last updated September 13, 2026. Using CarryGo means you agree to these
          terms. CarryGo is a service owned and operated by {BRAND.owner}.
        </p>
      </div>

      <div className="cg-legal">
        <h3>1. The service</h3>
        <p>
          CarryGo is a platform, owned and operated by {BRAND.owner},
          that connects customers with independent collectors (also called
          "riders" in the CarryGo collector app) for on-demand waste pickup.
          CarryGo is not itself a waste hauler; collectors are independent
          operators who accept jobs through the collector app.
        </p>

        <h3>2. Scheduling and cancellation</h3>
        <p>
          You can cancel a pickup at no charge while it is waiting for a collector, or after a collector has accepted it but has not yet started travelling to you. Once a collector is on the way, please contact CarryGo. Any cancellation fees will be confirmed before launch.
        </p>

        <h3>3. Accepted and prohibited waste</h3>
        <p>Accepted categories are household waste, recycling, bulky items, and e-waste. The following are never accepted through CarryGo:</p>
        <ul>
          <li>Hazardous, flammable, or chemical waste</li>
          <li>Medical, biohazard, or sharps waste</li>
          <li>Asbestos, paint, or construction debris over 20kg</li>
          <li>Any item a collector reasonably deems unsafe to transport</li>
        </ul>
        <p>Presenting prohibited waste for pickup may result in a cancelled job, a fee, and suspension of your account.</p>

        <h3>4. Payment and pricing</h3>
        <p>
          The price for a pickup is calculated by CarryGo from the waste type and quantity and shown before you confirm. Payment methods and timing will be confirmed before launch.
        </p>

        <h3>5. Collectors ("riders")</h3>
        <p>
          Collectors — called "riders" inside the collector app — must be approved by CarryGo before accepting jobs, may share their location only while a job is active, and must complete or release a job rather than leaving it unresolved. Payout terms will be published before launch.
        </p>

        <h3>6. Liability</h3>
        <p>
          CarryGo reviews collector applications but does not guarantee the conduct of any individual collector. The extent of CarryGo's liability is subject to legal review before launch.
        </p>

        <h3>7. Account suspension</h3>
        <p>
          We may suspend or close accounts that repeatedly misrepresent waste
          type, abuse collectors or customers, or violate these terms.
        </p>

        <h3>8. Changes to these terms</h3>
        <p>
          We'll update this page when terms change and, for material changes,
          notify you in the app before your next pickup.
        </p>
      </div>
    </section>
  );
}
