import React from "react";
import { BRAND } from "../config/brand";

export default function AboutPage() {
  return (
    <section className="cg-page">
      <div className="cg-page-head">
        <h1>Why CarryGo exists</h1>
        <p className="cg-page-lede">
          Waste pickup shouldn't run on a fixed weekly clock when everything else in your
          life runs on demand. CarryGo is a marketplace that connects households in Ghana
          with independent collectors, with prices shown upfront in Ghana cedis.
        </p>
      </div>
      <div className="cg-page-grid">
        <div className="cg-page-card glass">
          <h3>What we do</h3>
          <p>CarryGo connects customers with independent collectors who pick up household waste, recycling, bulky items and e-waste, at a time you choose.</p>
        </div>
        <div className="cg-page-card glass">
          <h3>How collectors work</h3>
          <p>Collectors apply through the CarryGo collector app and are reviewed by CarryGo before they can accept jobs. Payout terms will be published before launch.</p>
        </div>
        <div className="cg-page-card glass">
          <h3>Where waste goes</h3>
          <p>How waste is disposed of or recycled depends on the facilities and partners CarryGo works with in each area. Partner details will be published here once they are confirmed.</p>
        </div>
      </div>
      <div className="cg-page-block glass">
        <h3>The company behind CarryGo</h3>
        <p>CarryGo is a product of {BRAND.owner}.</p>
      </div>
    </section>
  );
}
