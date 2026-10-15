import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, CalendarDays, MapPin, Search, TrainFront } from "lucide-react";

export default function TrainSearchPage() {
  const navigate = useNavigate();
  const [route, setRoute] = useState({ from: "New Delhi", to: "Mumbai Central", date: new Date().toISOString().slice(0,10), travelClass: "All classes" });
  const [message, setMessage] = useState("");
  function update(event) { setRoute({ ...route, [event.target.name]: event.target.value }); }
  function search(event) {
    event.preventDefault();
    if (route.from.trim().toLowerCase() === route.to.trim().toLowerCase()) { setMessage("Choose two different stations to search."); return; }
    sessionStorage.setItem("railway_search", JSON.stringify(route));
    setMessage("Your search details are ready. Connect this page to your train-search API to display live train availability.");
  }
  function swapStations() { setRoute({ ...route, from: route.to, to: route.from }); }
  return <div className="page-stack"><div className="page-heading"><span className="eyebrow">PLAN YOUR ROUTE</span><h1>Find your train</h1><p>Choose your stations and travel date to get started.</p></div>
    <section className="content-card search-panel"><div className="card-title"><span className="round-icon blue"><Search size={20}/></span><div><h2>Search trains</h2><p>Where will your journey take you?</p></div></div>
      <form onSubmit={search} className="search-form"><div className="field-grid"><div className="station-input"><label htmlFor="from">FROM STATION</label><div><MapPin size={18}/><input id="from" name="from" value={route.from} onChange={update} placeholder="Departure station" required/></div></div><button type="button" className="swap-control" onClick={swapStations} aria-label="Swap departure and arrival"><ArrowLeftRight size={18}/></button><div className="station-input"><label htmlFor="to">TO STATION</label><div><MapPin size={18}/><input id="to" name="to" value={route.to} onChange={update} placeholder="Arrival station" required/></div></div><div className="standard-field"><label htmlFor="date">JOURNEY DATE</label><div><CalendarDays size={18}/><input id="date" type="date" name="date" min={new Date().toISOString().slice(0,10)} value={route.date} onChange={update} required/></div></div><div className="standard-field"><label htmlFor="travelClass">TRAVEL CLASS</label><select id="travelClass" name="travelClass" value={route.travelClass} onChange={update}><option>All classes</option><option>AC First Class</option><option>AC 2 Tier</option><option>AC 3 Tier</option><option>Sleeper</option><option>Second Sitting</option></select></div></div><button className="primary-button" type="submit"><Search size={17}/> Search trains</button></form>
      {message && <p className="alert info" role="status">{message}</p>}
    </section>
    <section className="empty-state"><span className="empty-icon"><TrainFront size={28}/></span><h2>Your journey starts here</h2><p>Search results and seat availability will appear here once a train search endpoint is connected to the backend.</p><button className="text-button" onClick={()=>navigate("/booking")}>View booking page →</button></section>
  </div>;
}
