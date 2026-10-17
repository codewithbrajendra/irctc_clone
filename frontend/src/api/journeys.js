import { apiRequest } from "./client.js";

export const COACH_TYPES = ["AC", "SLEEPER", "GENERAL"];
export const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));
export const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
export function readSaved(key) {
  try { return JSON.parse(sessionStorage.getItem(key)) || null; } catch { return null; }
}
export function searchTrains(route, options = {}) {
  return apiRequest("/user/trains/search", {
    ...options, method: "POST", body: JSON.stringify({
      sourceStationId: route.from.id, destinationStationId: route.to.id,
      journeyDate: route.date, coachType: route.coachType || null,
    }),
  });
}
export function createBooking(selection, passengers) {
  return apiRequest("/user/bookings", { method: "POST", body: JSON.stringify({
    trainScheduleId: selection.train.trainScheduleId, trainId: selection.train.trainId,
    sourceStationId: selection.from.id, destinationStationId: selection.to.id,
    journeyDate: selection.date, coachType: selection.coachType,
    passengers: passengers.map(({ name, age, gender }) => ({ name: name.trim(), age: Number(age), gender })),
  }) });
}
export const lookupBooking = pnr => apiRequest(`/user/bookings/pnr/${encodeURIComponent(pnr.trim())}`);
export const bookingHistory = (query = "", page = 0, options = {}) => apiRequest(`/user/bookings?${new URLSearchParams({ query, page, size: 20 })}`, options);
