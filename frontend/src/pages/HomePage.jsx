import { Link } from "react-router-dom";
import { ArrowRight, Search, ShieldCheck, Clock3, Ticket, MapPin, CalendarDays, TrainFront } from "lucide-react";

const shortcuts = [
  { title: "Find your train", text: "Explore routes and journey options.", to: "/trains", icon: Search, tone: "blue" },
  { title: "Manage bookings", text: "Review your upcoming travel plans.", to: "/booking", icon: Ticket, tone: "orange" },
  { title: "Ticket history", text: "Keep past journeys close at hand.", to: "/tickets", icon: Clock3, tone: "green" },
];

export default function HomePage() {
  return (
    <div className="page-stack">
      <section className="welcome-banner">
        <div className="welcome-copy"><span className="eyebrow">YOUR NEXT ADVENTURE STARTS HERE</span><h1>Every journey has<br/>a <em>story.</em></h1><p>Plan your next railway journey with a simpler, clearer travel experience.</p><Link className="primary-button" to="/trains">Plan a journey <ArrowRight size={17}/></Link></div>
        <div className="welcome-art" aria-hidden="true"><div className="sun-disc"/><div className="rail-track"/><div className="train-illustration"><TrainFront size={86} strokeWidth={1.2}/></div><span className="art-label"><MapPin size={14}/> Incredible India</span></div>
      </section>
      <section className="section-block">
        <div className="section-title"><div><span className="eyebrow">YOUR TRAVEL SPACE</span><h2>Where would you like to go?</h2></div><p>Everything you need for a smoother trip.</p></div>
        <div className="shortcut-grid">{shortcuts.map(({title,text,to,icon:Icon,tone})=><Link className="shortcut-card" to={to} key={to}><span className={`shortcut-icon ${tone}`}><Icon size={21}/></span><span className="shortcut-title">{title}</span><span className="shortcut-text">{text}</span><span className="shortcut-arrow"><ArrowRight size={17}/></span></Link>)}</div>
      </section>
      <section className="info-strip"><div className="info-item"><ShieldCheck size={20}/><div><strong>Security first</strong><span>Sign in to access your account.</span></div></div><div className="info-item"><Clock3 size={20}/><div><strong>Less hassle</strong><span>Keep trip details in one place.</span></div></div><div className="info-item"><CalendarDays size={20}/><div><strong>Plan ahead</strong><span>Start with your route and date.</span></div></div></section>
    </div>
  );
}
