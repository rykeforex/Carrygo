import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../lib/api", () => ({ listCategories: vi.fn(), quotePickup: vi.fn(), createPickup: vi.fn() }));
vi.mock("../lib/geo", async (orig) => {
  const actual = await orig();
  return { ...actual, getCurrentPosition: vi.fn(), reverseGeocode: vi.fn().mockRejectedValue(new Error("no maps")), geocodeAddress: vi.fn() };
});

import BookingFlow from "./BookingFlow";
import { listCategories, quotePickup, createPickup } from "../lib/api";
import { getCurrentPosition } from "../lib/geo";

const ROW = { id: "p1", reference: "CG-ABC12345", status: "requested", estimated_price: 32, currency: "GHS" };
const continueBtn = () => screen.getByRole("button", { name: /^continue$/i });

async function reachReview(user) {
  await user.type(screen.getByLabelText(/pickup address/i), "12 Test Street, Accra");
  await user.click(screen.getByRole("button", { name: /use my current location/i }));
  await screen.findByText(/location set/i);
  await user.click(continueBtn());
  await user.click(await screen.findByRole("button", { name: /household/i }));
  await screen.findByText(/32\.00/);
  await user.click(continueBtn());
  await user.click(continueBtn());
  return screen.findByRole("button", { name: /confirm pickup/i });
}

beforeEach(() => {
  vi.clearAllMocks();
  listCategories.mockResolvedValue([{ code: "general", label: "Household", unit: "bag", max_quantity: 20, sort_order: 1 }]);
  quotePickup.mockResolvedValue({ amount: 32, currency: "GHS", is_approved: true });
  getCurrentPosition.mockResolvedValue({ lat: 5.6, lng: -0.18, accuracy: 12 });
});

describe("BookingFlow", () => {
  it("cannot continue without a confirmed location", async () => {
    const user = userEvent.setup();
    render(<BookingFlow theme="light" onOpenPickup={() => {}} />);
    expect(continueBtn()).toBeDisabled();
    await user.type(screen.getByLabelText(/pickup address/i), "12 Test Street, Accra");
    expect(continueBtn()).toBeDisabled(); // an address alone is not enough — coordinates are required
  });

  it("does not show success until the backend confirms", async () => {
    const user = userEvent.setup();
    let resolve;
    createPickup.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<BookingFlow theme="light" onOpenPickup={() => {}} />);
    await user.click(await reachReview(user));
    expect(createPickup).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/pickup requested/i)).not.toBeInTheDocument();
    const args = createPickup.mock.calls[0][0];
    expect(args).toMatchObject({ category: "general", quantity: 1, lat: 5.6, lng: -0.18, expectedPrice: 32 });
    expect(typeof args.idempotencyKey).toBe("string");
    resolve(ROW);
    expect(await screen.findByText("CG-ABC12345")).toBeInTheDocument();
    expect(screen.getByText(/pickup requested/i)).toBeInTheDocument();
  });

  it("shows a clear error, books nothing, and retries with the SAME idempotency key", async () => {
    const user = userEvent.setup();
    createPickup.mockRejectedValueOnce(new Error("too_many_open_pickups")).mockResolvedValueOnce(ROW);
    render(<BookingFlow theme="light" onOpenPickup={() => {}} />);
    const confirm = await reachReview(user);
    await user.click(confirm);
    expect(await screen.findByRole("alert")).toHaveTextContent(/5 open pickups/i);
    expect(screen.queryByText(/pickup requested/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /confirm pickup/i }));
    expect(await screen.findByText("CG-ABC12345")).toBeInTheDocument();
    expect(createPickup.mock.calls[0][0].idempotencyKey).toBe(createPickup.mock.calls[1][0].idempotencyKey);
  });

  it("re-quotes and asks for re-confirmation when the server says the price changed", async () => {
    const user = userEvent.setup();
    createPickup.mockRejectedValueOnce(new Error("price_changed"));
    render(<BookingFlow theme="light" onOpenPickup={() => {}} />);
    const confirm = await reachReview(user);
    quotePickup.mockResolvedValue({ amount: 35, currency: "GHS", is_approved: true });
    await user.click(confirm);
    expect(await screen.findByRole("alert")).toHaveTextContent(/changed to .*35\.00/i);
    expect(screen.queryByText(/pickup requested/i)).not.toBeInTheDocument();
  });
});
