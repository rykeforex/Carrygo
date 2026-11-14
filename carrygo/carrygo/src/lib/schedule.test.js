import { describe, it, expect } from "vitest";
import { parseSchedule, scheduleBounds } from "./schedule";

const now = new Date(2026, 0, 15, 10, 0, 0);
describe("parseSchedule", () => {
  it("requires a value", () => { expect(parseSchedule("", now).ok).toBe(false); });
  it("rejects times less than 30 minutes ahead", () => { expect(parseSchedule("2026-01-15T10:10", now).ok).toBe(false); });
  it("accepts the earliest allowed minute", () => {
    const { min } = scheduleBounds(now);
    expect(parseSchedule(min, now).ok).toBe(true);
  });
  it("rejects beyond 30 days", () => { expect(parseSchedule("2026-03-15T10:00", now).ok).toBe(false); });
  it("returns an ISO string when valid", () => { expect(parseSchedule("2026-01-16T09:00", now).iso).toMatch(/^\d{4}-\d{2}-\d{2}T/); });
});
