import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Download, Search, Ticket } from "lucide-react";

export default function TicketHistoryPage() {
  const [query, setQuery] = useState("");
  const [reference, setReference] = useState("");
  const [notice, setNotice] = useState("");
  function handleSearch(event) {
    event.preventDefault();
    setNotice("Ticket history API is not configured yet. Connect this page to a protected endpoint that returns tickets for the signed-in user.");
  }
  return <div className="page-stack"><div className="page-heading page-heading-row"><div><span className="eyebrow">YOUR JOURNEY ARCHIVE</span><h1>Ticket history</h1><p>Find past journeys and keep your travel records together.</p></div><span className="large-heading-icon"><Ticket size={25}/></span></div>
    <section className="content-card"><div className="history-toolbar"><div><h2>Past and upcoming tickets</h2><p>Search using a PNR or train name.</p></div><form className="history-search" onSubmit={handleSearch}><Search size={17}/><input aria-label="Search tickets" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search tickets"/><button>Search</button></form></div>
      <div className="history-empty"><span className="empty-icon"><CalendarDays size={27}/></span><h2>No ticket records to show</h2><p>Your ticket list will appear here when booking history is connected to your account.</p><Link className="primary-button" to="/trains">Find a train</Link></div>
      <form className="lookup-row" onSubmit={e=>{e.preventDefault();setNotice("Ticket lookup needs a backend endpoint. No ticket record was changed.");}}><label htmlFor="pnr">Look up a ticket by PNR</label><input id="pnr" value={reference} onChange={e=>setReference(e.target.value)} placeholder="Enter PNR number" required/><button className="secondary-button"><Download size={16}/> Look up ticket</button></form>
      {notice && <p className="alert info" role="status">{notice}</p>}
    </section>
  </div>;
}
