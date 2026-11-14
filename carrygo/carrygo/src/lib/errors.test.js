import { describe, it, expect } from "vitest";
import { friendlyError } from "./errors";

describe("friendlyError", () => {
  it("maps server error codes to readable messages", () => {
    expect(friendlyError(new Error("too_many_open_pickups"))).toMatch(/5 open pickups/);
    expect(friendlyError(new Error("price_changed"))).toMatch(/price changed/i);
    expect(friendlyError({ message: "cannot_cancel" })).toMatch(/on the way/);
  });
  it("handles network failures", () => { expect(friendlyError(new TypeError("Failed to fetch"))).toMatch(/Network problem/); });
  it("never leaks raw internals", () => {
    expect(friendlyError(new Error("relation \"x\" does not exist"))).toBe("Something went wrong. Please try again.");
  });
});
