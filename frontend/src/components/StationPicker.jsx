import { useEffect, useId, useState } from "react";
import { apiRequest } from "../api/client";

export default function StationPicker({ label, value, onChange }) {
  const id = useId();
  const [query, setQuery] = useState(value ? `${value.name} (${value.code})` : "");
  const [stations, setStations] = useState([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (value) setQuery(`${value.name} (${value.code})`); }, [value]);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const result = await apiRequest(`/user/stations?query=${encodeURIComponent(value ? "" : query)}`, { signal: controller.signal });
        if (!controller.signal.aborted) setStations(result);
      } catch (e) { if (!controller.signal.aborted) setError(e.message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, value, open]);
  return <div className="station-picker" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}><label htmlFor={id}>{label}</label>
    <input id={id} value={query} autoComplete="off" required placeholder="Type station name or code"
      onFocus={() => setOpen(true)}
      onChange={e => { setQuery(e.target.value); onChange(null); setOpen(true); }} />
    {open && <div className="station-options" aria-label={`${label} matches`}>
      {loading ? <p role="status">Loading stations…</p> : stations.map(station => <button key={station.id} type="button"
        onMouseDown={e => e.preventDefault()} onClick={() => { onChange(station); setOpen(false); }}>
        {station.name} <small>{station.code}</small></button>)}
      {!loading && !stations.length && !error && <p>No stations found. Try a station code.</p>}
      {error && <p role="alert">{error}</p>}
    </div>}
  </div>;
}
