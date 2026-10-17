import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, Search } from "lucide-react";
import StationPicker from "../components/StationPicker";
import { COACH_TYPES, money, readSaved, searchTrains, today } from "../api/journeys";

export default function TrainSearchPage() {
  const navigate = useNavigate();
  const [route, setRoute] = useState(() => {
    const saved = readSaved("railway_search");
    return saved?.from?.id && saved?.to?.id ? saved : { from: null, to: null, date: today(), coachType: "" };
  });
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);
  async function search(event) {
    event.preventDefault();
    if (pending.current) return;
    setError(""); setResults([]); setSearched(null);
    if (!route.from?.id || !route.to?.id) { setError("Choose both stations from the matching station list."); return; }
    if (route.from.id === route.to.id) { setError("Choose two different stations."); return; }
    pending.current = true; setLoading(true);
    try {
      const data = await searchTrains(route);
      setResults(data); setSearched(route);
      sessionStorage.setItem("railway_search", JSON.stringify(route));
    } catch (e) { setError(e.message); }
    finally { pending.current = false; setLoading(false); }
  }
  function book(train, coachType) {
    const selection = { ...searched, train, coachType };
    sessionStorage.setItem("railway_selected_train", JSON.stringify(selection));
    navigate("/booking", { state: { selection } });
  }
  return <div className="page-stack"><div className="page-heading"><span className="eyebrow">PLAN YOUR ROUTE</span><h1>Find your train</h1><p>Choose stations from the list to see scheduled trains and available seats.</p></div>
    <section className="content-card"><form onSubmit={search} className="form-stack">
      <fieldset disabled={loading} className="journey-fields"><StationPicker label="From station" value={route.from} onChange={from => setRoute(r => ({ ...r, from }))} />
        <button type="button" className="swap-control" aria-label="Swap stations" onClick={() => setRoute(r => ({ ...r, from: r.to, to: r.from }))}><ArrowLeftRight size={18}/></button>
        <StationPicker label="To station" value={route.to} onChange={to => setRoute(r => ({ ...r, to }))} />
        <label className="admin-field"><span>Journey date</span><input type="date" required min={today()} value={route.date} onChange={e => setRoute(r => ({ ...r, date: e.target.value }))}/></label>
        <label className="admin-field"><span>Travel class</span><select value={route.coachType} onChange={e => setRoute(r => ({ ...r, coachType: e.target.value }))}><option value="">All classes</option>{COACH_TYPES.map(type => <option key={type}>{type}</option>)}</select></label>
      </fieldset><button className="primary-button" disabled={loading}><Search size={17}/>{loading ? "Searching…" : "Search trains"}</button>
    </form>{error && <p role="alert" className="alert error">{error}</p>}</section>
    {searched && <p role="status">{results.length} train schedule{results.length === 1 ? "" : "s"} found for {searched.from.name} → {searched.to.name} on {searched.date}.</p>}
    {searched && !results.length && <section className="content-card"><h2>No trains found</h2><p>Try another date or class. The train must have an ordered route, a schedule for this date and coach inventory.</p></section>}
    {results.map(train => <article className="content-card train-result" key={train.trainScheduleId}>
      <h2>{train.trainName} <small>({train.trainNumber})</small></h2><p>{train.scheduleDate} · Departure {train.departureTime || "—"} · Arrival {train.arrivalTime || "—"}</p>
      <div className="coach-options">{Object.entries(train.seatsAvailable || {}).map(([type, seats]) => <div className="coach-option" key={type}>
        <strong>{type}</strong><span>{seats} seats available</span><span>From {money(train.priceByCoach[type])} per passenger</span>
        <button className="primary-button" onClick={() => book(train, type)} disabled={seats < 1}>Book {type}</button>
      </div>)}</div>{!Object.keys(train.seatsAvailable || {}).length && <p>Sold out or coach inventory has not been configured.</p>}
    </article>)}
  </div>;
}
