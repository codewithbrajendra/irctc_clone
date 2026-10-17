import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import BookingTicket from "../components/BookingTicket";
import { createBooking, lookupBooking, money, readSaved } from "../api/journeys";
const emptyPassenger = () => ({ name: "", age: "", gender: "MALE" });

export default function BookingPage() {
  const location = useLocation();
  const [selection, setSelection] = useState(() => location.state?.selection || readSaved("railway_selected_train"));
  const [passengers, setPassengers] = useState([emptyPassenger()]);
  const [ticket, setTicket] = useState(null);
  const [pnr, setPnr] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const submitting = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError(""); setTicket(null); setNotice("");
    try {
      const result = await createBooking(selection, passengers);
      setTicket(result); setSelection(null); sessionStorage.removeItem("railway_selected_train");
      setNotice("Booking created. Your PNR and assigned seats are shown below and saved in ticket history.");
    } catch (e) { setError(`${e.message} If the connection was interrupted, check ticket history before submitting again.`); }
    finally { submitting.current = false; setBusy(false); }
  }
  async function lookup(event) {
    event.preventDefault(); setBusy(true); setError(""); setTicket(null); setNotice("");
    try { setTicket(await lookupBooking(pnr)); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <div className="page-stack"><div className="page-heading"><span className="eyebrow">YOUR TRAVEL PLANS</span><h1>Booking centre</h1><p>Reserve seats or look up a booking belonging to your account.</p></div>
    {selection?.train?.trainScheduleId && <section className="content-card"><h2>{selection.train.trainName} · {selection.coachType}</h2>
      <p>{selection.from.name} → {selection.to.name} · {selection.date}</p><p>Fare from {money(selection.train.priceByCoach[selection.coachType])} per passenger. The server calculates the final fare from allocated coaches.</p>
      <form className="form-stack" onSubmit={submit}><fieldset disabled={busy} className="passenger-list"><legend>Passengers</legend>
        {passengers.map((passenger, index) => <div className="passenger-row" key={index}>
          <label>Name<input aria-label={`Passenger ${index + 1} name`} required maxLength={100} value={passenger.name} onChange={e => setPassengers(p => p.map((v, i) => i === index ? { ...v, name: e.target.value } : v))}/></label>
          <label>Age<input aria-label={`Passenger ${index + 1} age`} required type="number" min="1" max="120" value={passenger.age} onChange={e => setPassengers(p => p.map((v, i) => i === index ? { ...v, age: e.target.value } : v))}/></label>
          <label>Gender<select aria-label={`Passenger ${index + 1} gender`} value={passenger.gender} onChange={e => setPassengers(p => p.map((v, i) => i === index ? { ...v, gender: e.target.value } : v))}>{["MALE", "FEMALE", "OTHER"].map(g => <option key={g}>{g}</option>)}</select></label>
          {passengers.length > 1 && <button type="button" className="text-button" onClick={() => setPassengers(p => p.filter((_, i) => i !== index))}>Remove passenger {index + 1}</button>}
        </div>)}
        <button type="button" className="secondary-button" disabled={passengers.length >= Math.min(6, selection.train.seatsAvailable[selection.coachType])} onClick={() => setPassengers(p => [...p, emptyPassenger()])}>Add passenger</button>
      </fieldset><p>A booking supports up to six passengers. Seats may be in different coaches. Availability is checked again when you submit. Payment remains NOT_PAID.</p>
      <button className="primary-button" disabled={busy}>{busy ? "Creating booking…" : "Create booking"}</button></form>
    </section>}
    {!selection && !ticket && <section className="content-card"><p>Choose a train and class before adding passengers.</p><Link className="primary-button" to="/trains">Find a train</Link></section>}
    {notice && <p className="alert success" role="status">{notice}</p>}{error && <p className="alert error" role="alert">{error}</p>}
    {ticket && <><BookingTicket booking={ticket}/><Link className="secondary-button" to="/tickets">View ticket history</Link></>}
    <section className="content-card"><h2>Find your booking by PNR</h2><form className="lookup-row" onSubmit={lookup}><input aria-label="Booking PNR" required value={pnr} onChange={e => setPnr(e.target.value)} placeholder="Enter your PNR"/><button className="secondary-button" disabled={busy}>Look up booking</button></form></section>
  </div>;
}
