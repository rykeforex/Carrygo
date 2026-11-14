import { describe, it, expect } from "vitest";
import { formatAge, formatDistance, formatEta, haversineKm, locationFreshness } from "./tracking";

const NOW = Date.parse("2026-01-01T12:00:00Z");
describe("locationFreshness", () => {
  it("is live for recent readings, stale for old ones, none for garbage", () => {
    expect(locationFreshness("2026-01-01T11:59:40Z", NOW)).toBe("live");
    expect(locationFreshness("2026-01-01T11:58:00Z", NOW)).toBe("stale");
    expect(locationFreshness(undefined, NOW)).toBe("none");
  });
});
describe("formatters", () => {
  it("formats age", () => {
    expect(formatAge("2026-01-01T11:59:58Z", NOW)).toBe("just now");
    expect(formatAge("2026-01-01T11:59:30Z", NOW)).toBe("30 s ago");
    expect(formatAge("2026-01-01T11:50:00Z", NOW)).toBe("10 min ago");
  });
  it("formats ETA and refuses invalid input", () => {
    expect(formatEta(20)).toBe("less than a minute");
    expect(formatEta(600)).toBe("10 min");
    expect(formatEta(3900)).toBe("1 h 5 min");
    expect(formatEta(NaN)).toBeNull();
    expect(formatEta(-5)).toBeNull();
  });
  it("formats distance", () => { expect(formatDistance(0.43)).toBe("430 m"); expect(formatDistance(2.345)).toBe("2.3 km"); });
  it("computes a sane great-circle distance (Accra -> Kumasi ~ 200 km)", () => {
    const d = haversineKm({ lat: 5.6037, lng: -0.187 }, { lat: 6.6885, lng: -1.6244 });
    expect(d).toBeGreaterThan(190); expect(d).toBeLessThan(215);
  });
});
