import { money } from "../api/journeys";

export default function BookingTicket({ booking }) {
  return <article className="content-card booking-ticket">
    <div className="ticket-heading"><div><h2>{booking.trainName} <small>({booking.trainNumber})</small></h2>
      <p>{booking.journeyDate} · {booking.sourceStation?.name} → {booking.destinationStation?.name}</p></div>
      <strong>{booking.bookingStatus}</strong></div>
    <p><strong>PNR:</strong> <span className="pnr">{booking.pnr}</span></p>
    <p>Departure: {booking.departureTime || "—"} · Arrival: {booking.arrivalTime || "—"}</p>
    <p><strong>Total fare: {money(booking.totalFare)}</strong> · Payment: {booking.paymentStatus}</p>
    {booking.paymentStatus !== "PAID" && <p className="alert info">Seats have been allocated. Payment has not been collected by this application.</p>}
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Passenger</th><th>Age</th><th>Gender</th><th>Coach ID</th><th>Seat</th></tr></thead>
      <tbody>{booking.passengers?.map((p, i) => <tr key={p.id || i}><td>{p.name}</td><td>{p.age}</td><td>{p.gender}</td><td>{p.coachId}</td><td>{p.seatNumber}</td></tr>)}</tbody></table></div>
  </article>;
}
