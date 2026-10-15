import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, ShieldCheck } from "lucide-react";
import { apiRequest } from "../api/client";

const initialForm = { name: "", email: "", password: "", phone: "" };

export default function RegistrationPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  function update(event) { setForm({ ...form, [event.target.name]: event.target.value }); }

  async function handleSubmit(event) {
    event.preventDefault(); setError(""); setSuccess(""); setLoading(true);
    try {
      await apiRequest("/auth/register", { method: "POST", body: JSON.stringify(form) });
      setSuccess("Your account was created. You can now sign in.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message || "Registration could not be completed.");
    } finally { setLoading(false); }
  }

  return <div className="auth-layout compact-auth"><section className="auth-intro"><span className="auth-mark"><UserPlus size={27}/></span><span className="eyebrow">JOIN RAILWAY CONNECT</span><h1>Good journeys<br/>begin here.</h1><p>Create an account to keep your travel plans organized in one place.</p><div className="auth-assurance"><ShieldCheck size={18}/> Your account, your journeys</div></section>
    <section className="form-card"><div className="form-heading"><span className="eyebrow">GET STARTED</span><h2>Create account</h2><p>Fill in your details to register.</p></div><form className="form-stack" onSubmit={handleSubmit}>
      <label htmlFor="name">Full name</label><input id="name" name="name" value={form.name} onChange={update} placeholder="Your full name" required/>
      <label htmlFor="email">Email address</label><input id="email" name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" required/>
      <label htmlFor="phone">Phone number</label><input id="phone" name="phone" type="tel" value={form.phone} onChange={update} placeholder="Your contact number"/>
      <label htmlFor="password">Create password</label><input id="password" name="password" type="password" value={form.password} onChange={update} placeholder="Choose a strong password" minLength={8} required/>
      <p className="field-hint">Use at least 8 characters for your password.</p>
      {error && <p className="alert error" role="alert">{error}</p>}{success && <p className="alert success" role="status">{success}</p>}
      <button className="primary-button full-button" disabled={loading}>{loading ? "Creating account…" : "Create account"} <span>→</span></button>
    </form><p className="form-bottom">Already registered? <Link to="/login">Sign in</Link></p></section>
  </div>;
}
