import React from "react";
import { render, screen, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../lib/api", () => ({
  getMyCollector: vi.fn(), setCollectorOnline: vi.fn(), listOpenPickups: vi.fn(), acceptPickup: vi.fn(), releasePickup: vi.fn(),
  advancePickup: vi.fn(), getActiveJob: vi.fn(), getMyStats: vi.fn(), subscribeToMyJobs: vi.fn(() => () => {}), updateLocation: vi.fn(),
}));
vi.mock("../lib/geo", async (orig) => ({ ...(await orig()), getCurrentPosition: vi.fn() }));

import CollectorDashboard from "./CollectorDashboard";
import * as api from "../lib/api";
import { getCurrentPosition, GeoError } from "../lib/geo";

const profile = { id: "u1", name: "Ama Mensah", vehicleType: "Van" };
const JOB = { id: "j1", reference: "CG-ABC12345", status: "assigned", quantity: 2, address_text: "12 Test Street, Accra", lat: 5.6, lng: -0.18, estimated_price: 32, currency: "GHS", preferred_time: null, waste_categories: { label: "Household", unit: "bag" }, customer: { full_name: "Kofi", phone: "+233241234567" } };
const OPEN = { id: "j1", reference: "CG-1", category_label: "Household", quantity: 2, distance_km: 1.4, estimated_payout: 25.6, currency: "GHS", created_at: new Date().toISOString() };
let online, posCb, geo;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  online = false;
  geo = { watchPosition: vi.fn((ok) => { posCb = ok; return 9; }), clearWatch: vi.fn() };
  Object.defineProperty(global.navigator, "geolocation", { value: geo, configurable: true });
  api.getMyCollector.mockImplementation(async () => ({ status: "approved", is_online: online, vehicle_type: "Van", rating_avg: 4.5, rating_count: 2, completed_jobs: 3 }));
  api.setCollectorOnline.mockImplementation(async (v) => { online = v; return v; });
  api.getActiveJob.mockResolvedValue(null);
  api.getMyStats.mockResolvedValue({ completed_jobs: 3, estimated_earnings: 80, commission_approved: false });
  api.listOpenPickups.mockResolvedValue([OPEN]);
  api.updateLocation.mockResolvedValue(true);
  getCurrentPosition.mockResolvedValue({ lat: 5.6, lng: -0.18, accuracy: 20 });
});

describe("CollectorDashboard — jobs", () => {
  it("going online calls the backend and then lists nearby jobs without exact addresses", async () => {
    const user = userEvent.setup();
    render(<CollectorDashboard theme="dark" profile={profile} />);
    await user.click(await screen.findByRole("button", { name: /go online/i }));
    expect(api.setCollectorOnline).toHaveBeenCalledWith(true);
    expect(await screen.findByText(/household × 2/i)).toBeInTheDocument();
    expect(screen.getByText(/exact address after you accept/i)).toBeInTheDocument();
  });

  it("tells the collector clearly when another collector took the job first", async () => {
    const user = userEvent.setup();
    online = true;
    api.acceptPickup.mockRejectedValue(new Error("job_unavailable"));
    render(<CollectorDashboard theme="dark" profile={profile} />);
    await user.click(await screen.findByRole("button", { name: /accept job/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/another collector just took that job/i);
    expect(screen.queryByRole("button", { name: /start driving/i })).not.toBeInTheDocument();
  });

  it("only offers the next valid step and sends it to the server", async () => {
    const user = userEvent.setup();
    localStorage.setItem("cg_loc_consent_v1", "decline");
    online = true;
    api.getActiveJob.mockResolvedValue(JOB);
    api.advancePickup.mockResolvedValue({ ...JOB, status: "en_route" });
    render(<CollectorDashboard theme="dark" profile={profile} />);
    const start = await screen.findByRole("button", { name: /start driving to pickup/i });
    expect(screen.queryByRole("button", { name: /complete job/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /waste collected/i })).not.toBeInTheDocument();
    await user.click(start);
    expect(api.advancePickup).toHaveBeenCalledWith("j1", "en_route");
  });

  it("requires explicit confirmation before completing a job", async () => {
    const user = userEvent.setup();
    online = true;
    api.getActiveJob.mockResolvedValue({ ...JOB, status: "collected" });
    api.advancePickup.mockResolvedValue({ ...JOB, status: "completed" });
    render(<CollectorDashboard theme="dark" profile={profile} />);
    await user.click(await screen.findByRole("button", { name: /^complete job$/i }));
    const dialog = await screen.findByRole("dialog");
    expect(api.advancePickup).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: /yes, complete job/i }));
    expect(api.advancePickup).toHaveBeenCalledWith("j1", "completed");
  });

  it("explains how to fix a denied location permission instead of showing an empty list", async () => {
    online = true;
    getCurrentPosition.mockRejectedValue(new GeoError("denied"));
    render(<CollectorDashboard theme="dark" profile={profile} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/location access was blocked/i);
    expect(api.listOpenPickups).not.toHaveBeenCalled();
  });

  it("shows the customer's phone only while a job is active", async () => {
    online = true;
    api.getActiveJob.mockResolvedValue(JOB);
    render(<CollectorDashboard theme="dark" profile={profile} />);
    expect(await screen.findByRole("link", { name: "+233241234567" })).toHaveAttribute("href", "tel:+233241234567");
  });
});

describe("CollectorDashboard — live location consent & sharing", () => {
  it("asks for consent the first time and does NOT advance until the collector chooses", async () => {
    const user = userEvent.setup();
    online = true;
    api.getActiveJob.mockResolvedValue(JOB);
    api.advancePickup.mockResolvedValue({ ...JOB, status: "en_route" });
    render(<CollectorDashboard theme="dark" profile={profile} />);
    await user.click(await screen.findByRole("button", { name: /start driving to pickup/i }));
    const dialog = await screen.findByRole("dialog", { name: /share your live location/i });
    expect(dialog).toHaveTextContent(/don't keep a history of your route/i);
    expect(api.advancePickup).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: /^cancel$/i }));
    expect(api.advancePickup).not.toHaveBeenCalled();
    expect(geo.watchPosition).not.toHaveBeenCalled();
  });

  it("'Start without sharing' advances but never touches GPS, and remembers the choice", async () => {
    const user = userEvent.setup();
    online = true;
    api.getActiveJob.mockResolvedValue(JOB);
    api.advancePickup.mockResolvedValue({ ...JOB, status: "en_route" });
    render(<CollectorDashboard theme="dark" profile={profile} />);
    await user.click(await screen.findByRole("button", { name: /start driving to pickup/i }));
    await user.click(await screen.findByRole("button", { name: /start without sharing/i }));
    expect(api.advancePickup).toHaveBeenCalledWith("j1", "en_route");
    expect(localStorage.getItem("cg_loc_consent_v1")).toBe("decline");
    expect(geo.watchPosition).not.toHaveBeenCalled();
  });

  it("with consent and an en-route job, shares real GPS fixes and says so", async () => {
    localStorage.setItem("cg_loc_consent_v1", "share");
    online = true;
    api.getActiveJob.mockResolvedValue({ ...JOB, status: "en_route" });
    render(<CollectorDashboard theme="dark" profile={profile} />);
    await screen.findByRole("button", { name: /i've arrived/i });
    expect(geo.watchPosition).toHaveBeenCalledTimes(1);
    await act(async () => { posCb({ coords: { latitude: 5.61, longitude: -0.19, accuracy: 8, heading: null } }); });
    expect(api.updateLocation).toHaveBeenCalledWith("j1", 5.61, -0.19, null, 8);
    expect(await screen.findByText(/sharing your live location with the customer/i)).toBeInTheDocument();
  });

  it("switching sharing off stops the GPS watch immediately", async () => {
    const user = userEvent.setup();
    localStorage.setItem("cg_loc_consent_v1", "share");
    online = true;
    api.getActiveJob.mockResolvedValue({ ...JOB, status: "en_route" });
    render(<CollectorDashboard theme="dark" profile={profile} />);
    const toggle = await screen.findByRole("checkbox", { name: /share my live location/i });
    expect(geo.watchPosition).toHaveBeenCalledTimes(1);
    await user.click(toggle);
    expect(geo.clearWatch).toHaveBeenCalledWith(9);
    expect(localStorage.getItem("cg_loc_consent_v1")).toBe("decline");
  });

  it("does not share while the job is merely assigned, even with consent", async () => {
    localStorage.setItem("cg_loc_consent_v1", "share");
    online = true;
    api.getActiveJob.mockResolvedValue(JOB);
    render(<CollectorDashboard theme="dark" profile={profile} />);
    await screen.findByRole("button", { name: /start driving to pickup/i });
    expect(geo.watchPosition).not.toHaveBeenCalled();
    expect(screen.getByText(/sharing starts when you tap start driving/i)).toBeInTheDocument();
  });
});
