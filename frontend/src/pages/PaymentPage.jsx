import { useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, LockKeyhole, ShieldCheck } from "lucide-react";

export default function PaymentPage() {
  const [method, setMethod] = useState("upi");
  const [reference, setReference] = useState("");
  const [notice, setNotice] = useState("");
  function handleSubmit(event) {
    event.preventDefault();
    setNotice("Payment processing is not connected yet. No money has been collected. Connect this screen to a server-side payment gateway and a valid booking before enabling payment.");
  }
  return <div className="page-stack"><div className="page-heading"><span className="eyebrow">SAFE & SECURE</span><h1>Payment</h1><p>Choose a payment method for a confirmed booking.</p></div>
    <div className="two-column payment-columns"><section className="content-card"><div className="card-title"><span className="round-icon blue"><CreditCard size={20}/></span><div><h2>Payment method</h2><p>Select how you would like to pay.</p></div></div><form className="form-stack" onSubmit={handleSubmit}><label htmlFor="payment-reference">Booking reference</label><input id="payment-reference" value={reference} onChange={e=>setReference(e.target.value)} placeholder="Enter confirmed booking reference" required/><div className="payment-methods"><label className={method==="upi"?"payment-option selected":"payment-option"}><input type="radio" name="method" value="upi" checked={method==="upi"} onChange={e=>setMethod(e.target.value)}/><span><strong>UPI</strong><small>Pay using a UPI app</small></span></label><label className={method==="card"?"payment-option selected":"payment-option"}><input type="radio" name="method" value="card" checked={method==="card"} onChange={e=>setMethod(e.target.value)}/><span><strong>Debit / credit card</strong><small>Visa, Mastercard and more</small></span></label><label className={method==="netbanking"?"payment-option selected":"payment-option"}><input type="radio" name="method" value="netbanking" checked={method==="netbanking"} onChange={e=>setMethod(e.target.value)}/><span><strong>Net banking</strong><small>Pay through your bank</small></span></label></div><button className="primary-button full-button"><LockKeyhole size={16}/> Continue securely</button></form>{notice && <p className="alert info" role="status">{notice}</p>}</section>
      <aside className="content-card payment-aside"><span className="round-icon green"><ShieldCheck size={21}/></span><h2>Payment protection</h2><p>For your safety, payments must be verified by the backend. This demo does not ask for card numbers, UPI PINs, or banking credentials.</p><div className="aside-divider"/><strong>Before you pay</strong><ul><li>Confirm your train and passenger details.</li><li>Check the total fare on the server.</li><li>Use a trusted payment gateway.</li></ul><Link className="text-button" to="/booking">Return to bookings →</Link></aside></div>
  </div>;
}
