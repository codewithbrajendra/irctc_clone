import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { TrainFront, LayoutDashboard, Search, CalendarCheck, CreditCard, Ticket, UserRound, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const navigation = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/trains", label: "Find trains", icon: Search },
  { to: "/booking", label: "Bookings", icon: CalendarCheck },
  { to: "/payment", label: "Payments", icon: CreditCard },
  { to: "/tickets", label: "Ticket history", icon: Ticket },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const signedIn = Boolean(localStorage.getItem("railway_access_token"));

  function signOut() {
    localStorage.removeItem("railway_access_token");
    localStorage.removeItem("railway_refresh_token");
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className={menuOpen ? "sidebar sidebar-open" : "sidebar"}>
        <NavLink className="brand" to="/" onClick={() => setMenuOpen(false)}>
          <span className="brand-icon"><TrainFront size={23} /></span>
          <span className="brand-copy"><strong>Railway<span>Connect</span></strong><small>YOUR JOURNEY, SIMPLIFIED</small></span>
        </NavLink>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-icon">?</span><div><strong>Need a hand?</strong><small>We're here to help.</small></div><a href="mailto:support@example.com" aria-label="Email support">↗</a></div>
          {signedIn ? <button className="nav-item signout" onClick={signOut}><LogOut size={18}/><span>Sign out</span></button> : <NavLink className="nav-item" to="/login"><UserRound size={18}/><span>Sign in</span></NavLink>}
          <div className="sidebar-foot">© {new Date().getFullYear()} Railway Connect</div>
        </div>
      </aside>
      {menuOpen && <button className="mobile-scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
      <div className="main-column">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle navigation">{menuOpen ? <X/> : <Menu/>}</button>
          <div className="breadcrumb"><span>Railway Connect</span><b>/</b><strong>Plan your journey</strong></div>
          <NavLink className="topbar-account" to={signedIn ? "/tickets" : "/login"}><span className="avatar"><UserRound size={17}/></span><span>{signedIn ? "My account" : "Sign in"}</span></NavLink>
        </header>
        <main className="page-content"><Outlet /></main>
        <footer className="main-footer"><span>Travel with confidence.</span><span>Independent railway booking demo · Not an official IRCTC website</span></footer>
      </div>
    </div>
  );
}
