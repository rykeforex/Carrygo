import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

vi.mock("../lib/api", () => ({ updateLocation: vi.fn() }));
import { updateLocation } from "../lib/api";
import { useLocationSharing } from "./useLocationSharing";

let posCb, errCb, geo;
const fix = (lat = 5.6, lng = -0.18) => ({ coords: { latitude: lat, longitude: lng, accuracy: 10, heading: null } });
const setup = (enabled = true) => renderHook(({ enabled }) => useLocationSharing({ jobId: "j1", enabled }), { initialProps: { enabled } });

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  updateLocation.mockResolvedValue(true);
  geo = { watchPosition: vi.fn((ok, err) => { posCb = ok; errCb = err; return 7; }), clearWatch: vi.fn() };
  Object.defineProperty(global.navigator, "geolocation", { value: geo, configurable: true });
});
afterEach(() => vi.useRealTimers());

describe("useLocationSharing", () => {
  it("does nothing at all while disabled", () => {
    const { result } = setup(false);
    expect(geo.watchPosition).not.toHaveBeenCalled();
    expect(updateLocation).not.toHaveBeenCalled();
    expect(result.current.state).toBe("off");
  });

  it("starts watching, sends the first fix immediately, and only heartbeats when unchanged", async () => {
    const { result } = setup(true);
    expect(geo.watchPosition).toHaveBeenCalledTimes(1);
    await act(async () => { posCb(fix()); });
    expect(updateLocation).toHaveBeenCalledWith("j1", 5.6, -0.18, null, 10);
    expect(result.current.state).toBe("live");
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(updateLocation).toHaveBeenCalledTimes(1);          // unchanged, within heartbeat window
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(updateLocation).toHaveBeenCalledTimes(2);          // 15s heartbeat
    await act(async () => { posCb(fix(5.61, -0.19)); await vi.advanceTimersByTimeAsync(5000); });
    expect(updateLocation).toHaveBeenCalledTimes(3);          // moved -> sent on next tick
  });

  it("stops watching and sending the moment sharing is disabled (job left an active state)", async () => {
    const { rerender } = setup(true);
    await act(async () => { posCb(fix()); });
    rerender({ enabled: false });
    expect(geo.clearWatch).toHaveBeenCalledWith(7);
    const calls = updateLocation.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
    expect(updateLocation.mock.calls.length).toBe(calls);
  });

  it("reports a denied permission and never sends", async () => {
    const { result } = setup(true);
    await act(async () => { errCb({ code: 1 }); });
    expect(result.current.state).toBe("denied");
    expect(updateLocation).not.toHaveBeenCalled();
  });

  it("shows 'reconnecting' after repeated failures and recovers on its own", async () => {
    updateLocation.mockRejectedValueOnce(new Error("Failed to fetch")).mockRejectedValueOnce(new Error("Failed to fetch")).mockResolvedValue(true);
    const { result } = setup(true);
    await act(async () => { posCb(fix()); });
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(result.current.state).toBe("reconnecting");
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(result.current.state).toBe("live");
  });

  it("stops by itself if the server says sharing is no longer allowed", async () => {
    updateLocation.mockRejectedValue(new Error("not_sharing_allowed"));
    const { result } = setup(true);
    await act(async () => { posCb(fix()); });
    expect(result.current.state).toBe("off");
    const calls = updateLocation.mock.calls.length;
    await act(async () => { posCb(fix(5.7, -0.2)); await vi.advanceTimersByTimeAsync(20000); });
    expect(updateLocation.mock.calls.length).toBe(calls);
  });

  it("reports an unsupported browser instead of crashing", () => {
    Object.defineProperty(global.navigator, "geolocation", { value: undefined, configurable: true });
    const { result } = setup(true);
    expect(result.current.state).toBe("unsupported");
  });
});
