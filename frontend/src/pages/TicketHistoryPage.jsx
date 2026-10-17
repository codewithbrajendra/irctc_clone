import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BookingTicket from "../components/BookingTicket";
import { bookingHistory, lookupBooking } from "../api/journeys";

export default function TicketHistoryPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState({ query: "", page: 0, revision: 0 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pnr, setPnr] = useState("");
  const [ticket, setTicket] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setResult(null);
    bookingHistory(filter.query, filter.page, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setResult(data); })
      .catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filter]);
  async function lookup(e) {
    e.preventDefault(); setLookingUp(true); setError(""); setTicket(null);
    try { setTicket(await lookupBooking(pnr)); } catch (err) { setError(err.message); }
    finally { setLookingUp(false); }
  }
  return <div className="page-stack"><div className="page-heading"><span className="eyebrow">YOUR JOURNEY ARCHIVE</span><h1>Ticket history</h1><p>Past and upcoming bookings for your signed-in account.</p></div>
    <section className="content-card"><form className="history-toolbar" onSubmit={e => { e.preventDefault(); setFilter({ query: query.trim(), page: 0, revision: filter.revision + 1 }); }}>
      <label className="admin-field"><span>Search PNR, train name or train number</span><input aria-label="Search ticket history" maxLength={100} value={query} onChange={e => setQuery(e.target.value)} placeholder="PNR or train"/></label>
      <button className="primary-button" disabled={loading}>Search history</button><button type="button" className="secondary-button" onClick={() => setFilter(f => ({ ...f, revision: f.revision + 1 }))} disabled={loading}>Refresh</button>
    </form><form className="lookup-row" onSubmit={lookup}><label htmlFor="history-pnr">Exact PNR lookup</label><input id="history-pnr" value={pnr} onChange={e => setPnr(e.target.value)} required/><button className="secondary-button" disabled={lookingUp}>{lookingUp ? "Looking up…" : "Find PNR"}</button></form></section>
    {error && <p className="alert error" role="alert">{error}</p>}{loading && <p role="status">Loading your bookings…</p>}
    {ticket && <section className="page-stack"><h2>PNR lookup result</h2><BookingTicket booking={ticket}/><button className="text-button" onClick={() => setTicket(null)}>Close lookup</button></section>}
    {result && <><p role="status">{result.totalElements} matching booking{result.totalElements === 1 ? "" : "s"}.</p>
      {!result.content.length && <section className="content-card"><h2>No matching bookings</h2><p>Try another search or create your first booking.</p><Link className="primary-button" to="/trains">Find a train</Link></section>}
      {result.content.map(booking => <BookingTicket key={booking.bookingId} booking={booking}/>)}
      {result.totalPages > 1 && <div className="history-toolbar"><button className="secondary-button" disabled={result.first || loading} onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}>Previous</button><span>Page {result.page + 1} of {result.totalPages}</span><button className="secondary-button" disabled={result.last || loading} onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}>Next</button></div>}
    </>}
  </div>;
}
