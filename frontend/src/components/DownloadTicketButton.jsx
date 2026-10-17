import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { apiDownload } from "../api/client";

export default function DownloadTicketButton({ pnr, bookingId }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  async function download() {
    if (busy.current || !pnr) return;
    busy.current = true; setDownloading(true); setError("");
    try {
      const blob = await apiDownload(`/user/bookings/pnr/${encodeURIComponent(pnr)}/ticket.pdf`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ticket-${String(bookingId ?? "reservation").replace(/[^a-zA-Z0-9_-]/g, "")}.pdf`;
      document.body.appendChild(anchor);
      try { anchor.click(); } finally {
        anchor.remove();
        // Allow the browser time to start reading the Blob before releasing it.
        const revoke = URL.revokeObjectURL.bind(URL);
        setTimeout(() => revoke(url), 1000);
      }
    } catch (e) { setError(e.message || "Could not download your ticket. Please try again."); }
    finally { busy.current = false; setDownloading(false); }
  }
  return <div className="ticket-download"><button type="button" className="secondary-button" onClick={download} disabled={downloading || !pnr}>
    <Download size={16}/>{downloading ? "Downloading…" : "Download ticket PDF"}
  </button>{error && <p className="alert error" role="alert">{error}</p>}</div>;
}
