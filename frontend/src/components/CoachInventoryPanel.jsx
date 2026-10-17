import { useState } from "react";
import { apiRequest } from "../api/client";
import { COACH_TYPES, money } from "../api/journeys";

export default function CoachInventoryPanel() {
  const [form, setForm] = useState({ trainScheduleId: "", coachType: "AC", totalSeats: 40, price: 500, trainSeatOrder: 1 });
  const [coaches, setCoaches] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function load() {
    if (!form.trainScheduleId) return;
    setError(""); setBusy(true);
    try { setCoaches(await apiRequest(`/admin/train-seats/schedule/${form.trainScheduleId}`)); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function create(e) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      await apiRequest("/admin/train-seats", { method: "POST", body: JSON.stringify({
        trainScheduleId: Number(form.trainScheduleId), coachType: form.coachType,
        totalSeats: Number(form.totalSeats), availableSeats: Number(form.totalSeats),
        price: Number(form.price), trainSeatOrder: Number(form.trainSeatOrder), seatNumberToAssign: 1,
      }) });
      setNotice("Coach inventory created. This schedule can now appear with bookable seats."); await load();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <section className="content-card"><h2>Coach inventory for a schedule</h2><p>A schedule needs coaches before passengers can reserve seats. Price is the fare per passenger for the selected journey in this demo.</p>
    <form className="form-stack" onSubmit={create}><fieldset disabled={busy} className="passenger-list"><div className="admin-form">
      {[["trainScheduleId", "Schedule ID"], ["totalSeats", "Total seats"], ["price", "Fare per passenger"], ["trainSeatOrder", "Coach order"]].map(([key, label]) => <label className="admin-field" key={key}><span>{label}</span><input type="number" required min={key === "price" ? "0" : "1"} step={key === "price" ? "0.01" : "1"} value={form[key]} onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); if (key === "trainScheduleId") setCoaches([]); }}/></label>)}
      <label className="admin-field"><span>Coach type</span><select value={form.coachType} onChange={e => setForm(f => ({ ...f, coachType: e.target.value }))}>{COACH_TYPES.map(c => <option key={c}>{c}</option>)}</select></label>
    </div></fieldset><div className="admin-form-actions"><button className="primary-button" disabled={busy}>Add coach</button><button type="button" className="secondary-button" disabled={busy || !form.trainScheduleId} onClick={load}>Load coaches</button></div></form>
    {error && <p role="alert" className="alert error">{error}</p>}{notice && <p role="status" className="alert success">{notice}</p>}
    {coaches.length > 0 && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Coach ID</th><th>Type</th><th>Available</th><th>Fare</th></tr></thead><tbody>{coaches.map(c => <tr key={c.id}><td>{c.id}</td><td>{c.coachType}</td><td>{c.availableSeats}</td><td>{money(c.price)}</td></tr>)}</tbody></table></div>}
  </section>;
}
