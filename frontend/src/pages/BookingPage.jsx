import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, CheckCircle2, ClipboardList, CreditCard, Search } from "lucide-react";

export default function BookingPage() {
  const savedSearch = JSON.parse(sessionStorage.getItem("railway_search") || "null");
  const [bookingReference, setBookingReference] = useState("");
  const [notice, setNotice] = useState("");
  function handleSubmit(event) {
    event.preventDefault();
    setNotice("Booking lookup needs a booking-details endpoint in the Spring Boot backend. No booking has been created or changed.");
  }
  return <div className="page-stack"><div className="page-heading"><span className="eyebrow">YOUR TRAVEL PLANS</span><h1>Booking centre</h1><p>Review a journey or continue planning your trip.</p></div>
    <div className="two-column"><section className="content-card"><div className="card-title"><span className="round-icon blue"><ClipboardList size={20}/></span><div><h2>Find a booking</h2><p>Enter your booking reference to look it up.</p></div></div><form className="form-stack booking-lookup" onSubmit={handleSubmit}><label htmlFor="reference">Booking reference / PNR</label><input id="reference" value={bookingReference} onChange={e=>setBookingReference(e.target.value)} placeholder="Enter your reference" required/><button className="primary-button"><Search size={17}/> Look up booking</button></form>{notice && <p className="alert info" role="status">{notice}</p>}</section>
      <section className="content-card"><div className="card-title"><span className="round-icon orange"><CalendarCheck size={20}/></span><div><h2>Continue your journey</h2><p>Your last train search on this device.</p></div></div>{savedSearch ? <div className="route-summary"><div><span>FROM</span><strong>{savedSearch.from}</strong></div><div className="route-dots">······→</div><div><span>TO</span><strong>{savedSearch.to}</strong></div><div className="summary-date">{savedSearch.date} · {savedSearch.travelClass}</div><Link className="primary-button full-button" to="/trains">Edit search</Link></div> : <div className="small-empty"><p>You haven't saved a route on this device yet.</p><Link className="text-button" to="/trains">Search for trains →</Link></div>}</section></div>
    <section className="info-strip"><div className="info-item"><CheckCircle2 size={20}/><div><strong>Booking details</strong><span>Connect your booking API to retrieve live records.</span></div></div><div className="info-item"><CreditCard size={20}/><div><strong>Payments</strong><span>Payment is only available for an actual booking.</span></div></div></section>
  </div>;
}
