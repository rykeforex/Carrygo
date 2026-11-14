import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import TrackingPanel from "./TrackingPanel";

const NOW = Date.parse("2026-01-01T12:00:00Z");
const pickup = { lat: 5.6, lng: -0.18 };
const loc = { lat: 5.61, lng: -0.19, recordedAt: "2026-01-01T11:59:55Z" };

describe("TrackingPanel", () => {
  it("says tracking hasn't started before the collector is on the way", () => {
    const { rerender } = render(<TrackingPanel status="requested" />);
    expect(screen.getByRole("status")).toHaveTextContent(/starts once a collector is on the way/i);
    rerender(<TrackingPanel status="assigned" />);
    expect(screen.getByRole("status")).toHaveTextContent(/share their location once they're on the way/i);
  });
  it("never invents a position when none is being shared", () => {
    render(<TrackingPanel status="en_route" loc={null} freshness="none" pickup={pickup} />);
    expect(screen.getByRole("status")).toHaveTextContent(/isn't sharing their location/i);
    expect(screen.getByRole("status")).not.toHaveTextContent(/\d+ ?(min|km|m)\b/);
  });
  it("shows a real Google ETA only when a route was actually returned", () => {
    render(<TrackingPanel status="en_route" loc={loc} freshness="live" now={NOW} pickup={pickup} routeState={{ status: "ok", route: { durationSec: 600, distanceM: 2300 } }} />);
    expect(screen.getByRole("status")).toHaveTextContent(/Live · updated 5 s ago/);
    expect(screen.getByRole("status")).toHaveTextContent(/about 10 min/i);
  });
  it("without a route, shows only a labelled straight-line distance and NO ETA", () => {
    render(<TrackingPanel status="en_route" loc={loc} freshness="live" now={NOW} pickup={pickup} routeState={{ status: "unavailable", route: null }} />);
    const el = screen.getByRole("status");
    expect(el).toHaveTextContent(/straight line/i);
    expect(el).toHaveTextContent(/isn't available right now/i);
    expect(el).not.toHaveTextContent(/arriving in/i);
  });
  it("flags a stale position instead of presenting it as live, and hides the ETA", () => {
    render(<TrackingPanel status="en_route" loc={{ ...loc, recordedAt: "2026-01-01T11:57:00Z" }} freshness="stale" now={NOW} pickup={pickup} routeState={{ status: "ok", route: { durationSec: 600, distanceM: 2300 } }} />);
    const el = screen.getByRole("status");
    expect(el).toHaveTextContent(/Last seen 3 min ago/);
    expect(el).toHaveTextContent(/weak signal/i);
    expect(el).not.toHaveTextContent(/arriving in/i);
  });
});
