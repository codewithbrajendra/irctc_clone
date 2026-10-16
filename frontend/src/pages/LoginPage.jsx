import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, TrainFront } from "lucide-react";
import { apiRequest, saveAuth } from "../api/client";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (!(data.accessToken || data.token)) throw new Error("The server did not return an access token.");
      saveAuth(data, remember, form.username);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="auth-layout"><section className="auth-intro"><span className="auth-mark"><TrainFront size={28}/></span><span className="eyebrow">WELCOME BACK</span><h1>Your next journey<br/>is waiting.</h1><p>Sign in to keep your travel plans moving and your journeys all in one place.</p><div className="auth-assurance"><ShieldCheck size={18}/> Secure sign-in experience</div></section>
    <section className="form-card"><div className="form-heading"><span className="eyebrow">YOUR ACCOUNT</span><h2>Sign in</h2><p>Enter your account details to continue.</p></div>
      <form onSubmit={handleSubmit} className="form-stack">
        <label htmlFor="username">Email address</label><input id="username" name="username" type="email" autoComplete="username" placeholder="you@example.com" value={form.username} onChange={update} required/>
        <div className="field-heading"><label htmlFor="password">Password</label><Link to="/recover">Forgot password?</Link></div>
        <div className="password-field"><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={update} required/><button type="button" className="password-toggle" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
        <label className="check-label"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/> Keep me signed in on this device</label>
        {error && <p className="alert error" role="alert">{error}</p>}
        <button className="primary-button full-button" disabled={loading}>{loading ? "Signing in…" : "Sign in"} <span>→</span></button>
      </form>
      <p className="form-bottom">New to Railway Connect? <Link to="/register">Create an account</Link></p><p className="secure-note"><ShieldCheck size={15}/> Your details are protected.</p>
    </section>
  </div>;
}
