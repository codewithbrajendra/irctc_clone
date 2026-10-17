import React from "react";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, test, expect, vi } from "vitest";
import App from "../src/App";
import { saveAuth, clearAuth } from "../src/api/client";
const source = { id: 1, name: "New Delhi", code: "NDLS" };
const destination = { id: 2, name: "Mumbai Central", code: "MMCT" };
const train = { trainId: 10, trainScheduleId: 20, trainName: "Test Express", trainNumber: "12345", scheduleDate: "2099-01-01", departureTime: "08:00", arrivalTime: "18:00", seatsAvailable: { AC: 2 }, priceByCoach: { AC: 500 } };
const ticket = { bookingId: 30, pnr: "test-owned-pnr", trainName: train.trainName, trainNumber: train.trainNumber, journeyDate: "2099-01-01", sourceStation: source, destinationStation: destination, totalFare: 500, bookingStatus: "CONFIRMED", paymentStatus: "NOT_PAID", passengers: [{ id: 1, name: "Brajendra", age: 30, gender: "MALE", coachId: "40", seatNumber: "1" }] };
const token = () => `header.${btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 }))}.signature`;
let requests;
beforeEach(() => {
  clearAuth(); requests = [];
  window.history.replaceState({}, "", "/trains");
  saveAuth({ token: token(), refreshToken: token(), user: { name: "Brajendra", email: "user@example.com", roles: [{ name: "ROLE_NORMAL" }] } });
  vi.stubGlobal("fetch", vi.fn(async (url, options = {}) => {
    requests.push({ url, options });
    if (url.includes("/user/stations")) return { ok: true, status: 200, json: async () => [source, destination] };
    if (url.includes("/user/trains/search")) return { ok: true, status: 200, json: async () => [train] };
    if (url.endsWith("/user/bookings")) return { ok: true, status: 201, json: async () => ticket };
    if (url.includes("/user/bookings/pnr/")) return { ok: true, status: 200, json: async () => ticket };
    if (url.includes("/user/bookings?")) return { ok: true, status: 200, json: async () => ({ content: [ticket], totalElements: 1, page: 0, totalPages: 1, first: true, last: true }) };
    throw new Error(`Unexpected API call: ${url}`);
  }));
});
afterEach(() => { cleanup(); clearAuth(); vi.unstubAllGlobals(); });

test("search, select class, submit passengers and retrieve owned ticket history", async () => {
  const user = userEvent.setup(); render(<App/>);
  await user.type(await screen.findByLabelText("From station"), "Delhi");
  await user.click(await screen.findByRole("button", { name: "New Delhi NDLS" }));
  await user.type(screen.getByLabelText("To station"), "Mumbai");
  await user.click(await screen.findByRole("button", { name: "Mumbai Central MMCT" }));
  await user.clear(screen.getByLabelText("Journey date"));
  await user.type(screen.getByLabelText("Journey date"), "2099-01-01");
  await user.click(screen.getByRole("button", { name: "Search trains" }));
  await user.click(await screen.findByRole("button", { name: "Book AC" }));
  const search = requests.find(r => r.url.includes("/trains/search"));
  expect(JSON.parse(search.options.body)).toEqual({ sourceStationId: 1, destinationStationId: 2, journeyDate: "2099-01-01", coachType: null });
  await user.type(screen.getByLabelText("Passenger 1 name"), "Brajendra");
  await user.type(screen.getByLabelText("Passenger 1 age"), "30");
  await user.click(screen.getByRole("button", { name: "Create booking" }));
  expect(await screen.findByText("test-owned-pnr")).toBeTruthy();
  expect(screen.getByText(/Payment has not been collected/)).toBeTruthy();
  const booking = JSON.parse(requests.find(r => r.url.endsWith("/user/bookings")).options.body);
  expect(booking).toMatchObject({ trainScheduleId: 20, sourceStationId: 1, destinationStationId: 2, coachType: "AC" });
  expect(booking.userId).toBeUndefined();
  await user.click(screen.getByRole("link", { name: "View ticket history" }));
  expect(await screen.findByText("test-owned-pnr")).toBeTruthy();
  await user.type(screen.getByLabelText("Search ticket history"), "12345");
  await user.click(screen.getByRole("button", { name: "Search history" }));
  await waitFor(() => expect(requests.some(r => r.url.includes("query=12345"))).toBe(true));
  expect(requests.some(r => r.url.includes("refresh-token"))).toBe(false);
  await user.click(screen.getByRole("button", { name: "Sign out" }));
  expect(await screen.findByRole("heading", { name: "Sign in" })).toBeTruthy();
  expect(sessionStorage.getItem("railway_selected_train")).toBeNull();
});

test("a normal user cannot open admin management by URL", async () => {
  window.history.replaceState({}, "", "/admin/train-schedules"); render(<App/>);
  await waitFor(() => expect(window.location.pathname).toBe("/"));
  expect(screen.queryByText("Manage stations")).toBeNull();
});

test("invalid typed station names do not send a train search", async () => {
  const user = userEvent.setup(); render(<App/>);
  await user.type(await screen.findByLabelText("From station"), "Not a selected station");
  await user.type(screen.getByLabelText("To station"), "Another typed name");
  await user.click(screen.getByRole("button", { name: "Search trains" }));
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(requests.some(r => r.url.includes("/trains/search"))).toBe(false);
});
