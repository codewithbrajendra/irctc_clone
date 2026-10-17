import React from "react";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import DownloadTicketButton from "../src/components/DownloadTicketButton";
import { apiDownload } from "../src/api/client";
vi.mock("../src/api/client", () => ({ apiDownload: vi.fn() }));
beforeEach(() => {
  vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:ticket-test"), revokeObjectURL: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
    expect(this.download).toBe("ticket-12.pdf"); expect(this.href).toContain("blob:ticket-test");
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
test("downloads a backend Blob using the encoded PNR and releases its object URL", async () => {
  const user = userEvent.setup(); apiDownload.mockResolvedValue(new Blob(["%PDF-test"], { type: "application/pdf" }));
  render(<DownloadTicketButton pnr="pnr/unsafe" bookingId={12}/>);
  await user.click(screen.getByRole("button", { name: "Download ticket PDF" }));
  expect(apiDownload).toHaveBeenCalledWith("/user/bookings/pnr/pnr%2Funsafe/ticket.pdf");
  expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:ticket-test"), { timeout: 2000 });
});
test("shows failures and allows a retry without creating a broken download", async () => {
  const user = userEvent.setup(); apiDownload.mockRejectedValue(new Error("Booking not found"));
  render(<DownloadTicketButton pnr="test" bookingId={12}/>);
  await user.click(screen.getByRole("button", { name: "Download ticket PDF" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Booking not found");
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  apiDownload.mockResolvedValue(new Blob(["%PDF-test"]));
  await user.click(screen.getByRole("button", { name: "Download ticket PDF" }));
  expect(apiDownload).toHaveBeenCalledTimes(2);
});
