import { useState } from 'react';
import { TrainFront, MapPin, CalendarDays, ArrowLeftRight, Search, ShieldCheck, Clock3, Headphones, Menu, X, Eye, EyeOff, ChevronDown, Ticket, UserRound, CheckCircle2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

function Brand() {
  return <a className="brand" href="#home" aria-label="Railway Connect home"><span className="brand-mark"><TrainFront size={25}/></span><span><b>railway<span>connect</span></b><small>YOUR JOURNEY, SIMPLIFIED</small></span></a>;
}

function LoginCard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email.trim(), password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || 'Login failed. Check your email and password.');
      if (data.accessToken) {
        if (remember) localStorage.setItem('railway_access_token', data.accessToken);
        if (data.refreshToken && remember) localStorage.setItem('railway_refresh_token', data.refreshToken);
      }
      setMessage({ type: 'success', text: 'Signed in successfully. You can now continue to your account.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not connect to the server. Check that your backend is running.' });
    } finally {
      setLoading(false);
    }
  }

  return <section className="login-card" id="login" aria-labelledby="login-heading">
    <div className="login-top"><div className="login-icon"><UserRound size={23}/></div><span className="secure-label"><ShieldCheck size={14}/> SECURE SIGN IN</span></div>
    <h2 id="login-heading">Welcome back</h2>
    <p className="login-subtitle">Sign in to manage your train journeys.</p>
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email address</label>
      <div className="input-wrap"><span className="input-symbol">@</span><input id="email" type="email" autoComplete="username" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
      <div className="password-label"><label htmlFor="password">Password</label><a href="#help" onClick={() => setMessage({type:'info',text:'Password reset can be connected to your backend when that endpoint is available.'})}>Forgot password?</a></div>
      <div className="input-wrap"><span className="input-symbol">⌑</span><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required minLength={1}/><button className="icon-button" type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
      <label className="remember"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/> Keep me signed in on this device</label>
      {message && <div className={`form-message ${message.type}`} role="status">{message.type === 'success' && <CheckCircle2 size={17}/>}<span>{message.text}</span></div>}
      <button className="sign-in-button" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'} <span>→</span></button>
    </form>
    <div className="register-line">New to Railway Connect? <a href="#register" onClick={() => setMessage({type:'info',text:'Registration form can be connected to POST /auth/register. This demo currently includes sign in.'})}>Create an account</a></div>
    <div className="card-foot"><ShieldCheck size={15}/> Your details are encrypted and secure</div>
  </section>;
}

function App() {
  const [mobileNav, setMobileNav] = useState(false);
  const [from, setFrom] = useState('New Delhi');
  const [to, setTo] = useState('Mumbai Central');
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [journeyMessage, setJourneyMessage] = useState('');
  const swap = () => { setFrom(to); setTo(from); };

  return <div id="home">
    <div className="announcement"><span className="announcement-dot"/> A simpler way to plan your next railway journey <span className="announcement-arrow">↗</span></div>
    <header className="site-header"><div className="header-inner"><Brand/><button className="mobile-menu" onClick={() => setMobileNav(v => !v)} aria-label="Toggle navigation">{mobileNav ? <X/> : <Menu/>}</button><nav className={mobileNav ? 'nav-links open' : 'nav-links'}><a href="#book" onClick={() => setMobileNav(false)}>Book tickets</a><a href="#features" onClick={() => setMobileNav(false)}>Why us</a><a href="#help" onClick={() => setMobileNav(false)}>Help & support</a><a className="nav-login" href="#login" onClick={() => setMobileNav(false)}><UserRound size={16}/> Sign in</a></nav></div></header>
    <main>
      <section className="hero">
        <div className="hero-bg-shape shape-one"/><div className="hero-bg-shape shape-two"/>
        <div className="hero-inner">
          <div className="hero-copy"><div className="eyebrow"><span/> YOUR NEXT ADVENTURE STARTS HERE</div><h1>Every journey<br/>has a <em>story.</em></h1><p className="hero-description">Make every mile memorable. Discover a smoother, smarter way to plan your next train journey across India.</p><div className="hero-trust"><div className="trust-icon"><ShieldCheck size={18}/></div><div><b>Travel with confidence</b><span>Simple. Secure. Reliable.</span></div><div className="trust-divider"/><div className="trust-icon"><Clock3 size={18}/></div><div><b>Less planning</b><span>More exploring</span></div></div>
            <div className="journey-note"><span className="note-spark">✳</span><span><b>India is calling.</b> Where will you go next?</span></div>
          </div>
          <div className="hero-right"><LoginCard/></div>
        </div>
        <div className="hero-bottom"><span>MADE FOR THE WAY YOU TRAVEL</span><div className="route-line"><span/><i/><span/></div><span>ACROSS INCREDIBLE INDIA</span></div>
      </section>
      <section className="booking-section" id="book"><div className="section-heading"><div><span className="section-kicker">PLAN AHEAD, TRAVEL BETTER</span><h2>Where to next?</h2></div><p>Your next great story is just a train ride away.</p></div>
        <div className="booking-card"><div className="station-field"><MapPin size={19}/><label>FROM<span><input aria-label="From station" value={from} onChange={e=>setFrom(e.target.value)} placeholder="Departure station"/></span></label></div><button className="swap-button" onClick={swap} aria-label="Swap stations"><ArrowLeftRight size={18}/></button><div className="station-field"><MapPin size={19}/><label>TO<span><input aria-label="To station" value={to} onChange={e=>setTo(e.target.value)} placeholder="Arrival station"/></span></label></div><div className="date-field"><CalendarDays size={19}/><label>JOURNEY DATE<span><input aria-label="Journey date" type="date" min={new Date().toISOString().slice(0,10)} value={date} onChange={e=>setDate(e.target.value)}/></span></label></div><button className="search-trains" onClick={()=>setJourneyMessage(from.trim() && to.trim() && from.trim().toLowerCase()!==to.trim().toLowerCase() ? `Journey search ready: ${from} → ${to} on ${date}. Connect this form to your train search API to show live trains.` : 'Please enter two different stations.') }><Search size={18}/> Find trains</button></div>
        {journeyMessage && <p className="journey-message" role="status">{journeyMessage}</p>}
        <div className="booking-caption"><span><ShieldCheck size={15}/> Secure booking experience</span><span>Plan your trip in a few simple steps <ChevronDown size={14}/></span></div>
      </section>
      <section className="features-section" id="features"><div className="features-title"><span className="section-kicker">THE JOURNEY, REIMAGINED</span><h2>Little things that make<br/>a big difference.</h2></div><div className="feature-grid"><article className="feature"><div className="feature-icon blue"><Ticket size={21}/></div><h3>Travel, made simple</h3><p>A clean, easy-to-use experience that keeps your trip planning stress-free.</p></article><article className="feature"><div className="feature-icon orange"><ShieldCheck size={21}/></div><h3>Your security matters</h3><p>Sign in securely and keep your account details in one convenient place.</p></article><article className="feature" id="help"><div className="feature-icon green"><Headphones size={21}/></div><h3>Here when you need us</h3><p>A helpful starting point for questions, trip planning, and support.</p></article></div></section>
    </main>
    <footer className="footer"><Brand/><p>Made for journeys big and small.</p><span>© {new Date().getFullYear()} Railway Connect · Independent project UI</span></footer>
  </div>;
}

export default App;