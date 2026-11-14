import { describe, it, expect } from "vitest";
import { formatMoney, timeAgo } from "./format";

describe("formatMoney", () => {
  it("formats cedis with two decimals", () => { expect(formatMoney(32, "GHS")).toMatch(/32\.00/); });
  it("never renders NaN", () => { expect(formatMoney("abc")).toBe("—"); expect(formatMoney(null)).toBe("—"); });
});
describe("timeAgo", () => {
  const now = Date.parse("2026-01-01T12:00:00Z");
  it("handles ranges", () => {
    expect(timeAgo("2026-01-01T11:59:40Z", now)).toBe("just now");
    expect(timeAgo("2026-01-01T11:30:00Z", now)).toBe("30 min ago");
    expect(timeAgo("2026-01-01T09:00:00Z", now)).toBe("3 h ago");
    expect(timeAgo("2025-12-30T12:00:00Z", now)).toBe("2 d ago");
  });
  it("returns empty string for garbage", () => { expect(timeAgo("nope", now)).toBe(""); });
});
