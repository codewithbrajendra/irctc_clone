import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";

export default function PasswordRecoveryPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  function handleSubmit(event) {
    event.preventDefault();
    // The repository currently has no password-reset endpoint. Avoid pretending an email was sent.
    setSubmitted(true);
  }
  return <div className="auth-layout recovery-layout"><section className="auth-intro"><span className="auth-mark"><Mail size={27}/></span><span className="eyebrow">ACCOUNT RECOVERY</span><h1>A fresh start<br/>is one step away.</h1><p>Forgot your password? Start here to recover access to your account.</p><div className="auth-assurance"><ShieldCheck size={18}/> Account security matters</div></section>
    <section className="form-card recovery-card"><div className="form-heading"><span className="eyebrow">PASSWORD HELP</span><h2>Reset your password</h2><p>Enter the email address linked to your account.</p></div>
      {submitted ? <div className="recovery-notice"><span className="round-icon blue"><Mail size={21}/></span><h3>Recovery endpoint needed</h3><p>The current backend does not expose a password-reset endpoint, so no email has been sent. Add a secure reset-token flow to Spring Boot to enable this feature.</p><button className="primary-button full-button" onClick={()=>setSubmitted(false)}>Back to form</button></div> : <form className="form-stack" onSubmit={handleSubmit}><label htmlFor="recovery-email">Email address</label><input id="recovery-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/><button className="primary-button full-button">Continue <span>→</span></button></form>}
      <Link className="back-link" to="/login"><ArrowLeft size={15}/> Back to sign in</Link>
    </section>
  </div>;
}
