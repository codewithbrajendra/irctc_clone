# Railway Connect frontend

React 19 UI for the Spring Boot backend. Train search, booking creation, account-scoped PNR lookup and booking history are connected to real backend endpoints.

## Run locally on Windows

Use Java 21 and MySQL for the backend. Configure the existing `src/main/resources/application.properties` database settings for your local database. The default backend port is 8081.

From the repository root in PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

Open a second terminal:

```powershell
cd frontend
npm ci
npm run dev -- --host localhost --port 5173 --strictPort
```

Open http://localhost:5173. If the backend runs elsewhere, create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8081
```

The backend allows the localhost Vite origin on port 5173. Sign in again after switching branches and restarting the backend.

## Prepare bookable data as an administrator

Use the existing management screens in this order. IDs are shown in each resource list.

1. Create departure and destination stations (and any intermediate stations).
2. Create a train with its source and destination station IDs.
3. Add Train routes for that train. Use distinct increasing `stationOrder` values, for example 1, 2, 3. Add source departure and destination arrival times using HH:mm.
4. Add a Train schedule for a future run date. The schedule page has a train-ID filter; load it to find the schedule ID.
5. In the new **Coach inventory for a schedule** section, enter the schedule ID, coach type, total seats, fare per passenger and coach order. Add one or more coaches. New coaches start with all seats available and seat numbering at 1; those values are computed on the server.

The schedule's `availableSeats` field is only a summary. Actual bookable inventory lives in coaches (`train_seats`). Creating a schedule with a seat count alone does not create coaches. Coach creation and booking synchronize that summary with actual coach availability. Inventory with allocated seats cannot be reset or deleted through the coach endpoints.

## Search and book

1. Sign in as a normal user or administrator.
2. Open **Find trains**. Type a station name or code and select an actual match for each station.
3. Choose a future date and optionally AC, SLEEPER or GENERAL. These are the coach types supported by the backend.
4. Select **Search trains**. Results come from `POST /user/trains/search`; reverse-direction routes and schedules on other dates do not match.
5. Select **Book** for a class with seats, enter 1–6 passengers and create the booking.
6. The returned PNR, coach IDs, seat numbers, fare and payment status appear immediately. Open **Ticket history** to retrieve the saved record from the backend.
7. Search history by PNR, train name or train number, or use exact PNR lookup. Only your own records are returned. History includes both past and future bookings, newest first.

If a booking request loses its connection, check history before submitting again. A button guard prevents duplicate submissions in a mounted page, but the API does not yet implement persistent idempotency keys.

## Endpoints

All these endpoints require a valid access token; both NORMAL and ADMIN may use them.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/user/stations?query=Delhi` | Up to 30 station matches by name or code |
| POST | `/user/trains/search` | Ordered route and date search with optional coach type |
| POST | `/user/bookings` | Validate and allocate seats for the authenticated account |
| GET | `/user/bookings?query=&page=0&size=20` | Paginated account history, maximum page size 100 |
| GET | `/user/bookings/pnr/{pnr}` | Exact PNR lookup scoped to the authenticated account |

Example search body:

```json
{
  "sourceStationId": 1,
  "destinationStationId": 2,
  "journeyDate": "2026-12-01",
  "coachType": "AC"
}
```

Example booking body (use the real schedule ID returned by search):

```json
{
  "trainScheduleId": 10,
  "sourceStationId": 1,
  "destinationStationId": 2,
  "coachType": "AC",
  "passengers": [{ "name": "Example Passenger", "age": 30, "gender": "MALE" }]
}
```

The server derives the owner, train, date, fare, PNR and assigned seats. A browser-supplied user ID cannot change the owner. Passenger IDs and seat numbers supplied by the browser are ignored. Gender values are MALE, FEMALE or OTHER; passenger ages are 1–120.

## Why refresh-token appeared when searching

The old search handler was a placeholder and did not call a search API. Separately, the backend used a 30-second access-token lifetime, and the session hook checked every second. Successful refresh calls were normal renewal traffic rather than search results.

The default access lifetime is now 15 minutes, with a one-hour refresh lifetime. Both are configurable:

```properties
security.jwt.access-token-validity-ms=900000
security.jwt.refresh-token-validity-ms=3600000
```

The session hook schedules a check at access-token expiry and when the window regains focus. API requests also ensure the session is usable. Concurrent requests share one refresh promise. Refresh credentials are rejected as Bearer access tokens. Invalid, expired or unavailable sessions redirect to sign-in.

## Booking rules and remaining boundaries

- This is a reservation demo. It allocates seats immediately and records `CONFIRMED` with payment `NOT_PAID`, preserving the existing backend policy. The ticket displays this explicitly. The payment page and Razorpay scaffold are not connected to booking settlement. No money is collected by this flow.
- Fare is the configured price per passenger on each allocated coach, summed on the backend. Search shows the lowest configured class price as “From”. There is no distance-based fare calculation.
- All route times are treated as occurring on the schedule date in Asia/Kolkata. Multi-day trains need route day offsets, which this model does not have.
- Seats are consumed for the whole scheduled run; intermediate segments do not reuse the same seat. Passengers can be spread across coaches of the selected class.
- A database transaction and pessimistic locks protect allocation and coach inventory changes. Search results are a snapshot; a stale result can return HTTP 409 when booking.
- Cancellation, refunds, waiting lists, payment holds and persistent booking idempotency are not part of this change.
- The application retains the existing browser-token storage design. Production session-cookie and token-revocation design remains separate work.

## Tests

From the root with Java 21:

```powershell
.\mvnw.cmd test
cd frontend
npm test
npm run build
```

Backend tests use an isolated in-memory H2 database under the test profile, not your local MySQL database. They exercise authentication, route search, cross-coach allocation, ownership, sold-out behavior, concurrent requests, admin inventory and refresh-token misuse. Mockito uses the subclass mock maker to avoid requiring dynamic agent attachment in restricted test environments.

Frontend tests include an authentication lifecycle regression and rendered component interactions for search → booking → history → logout, invalid station entry and normal-user admin-route denial. Frontend interaction tests mock API responses; backend integration tests exercise real persistence and Spring Security independently. A manual MySQL/browser run is still useful before merging.

## Download a ticket PDF

After creating a booking, select **Download ticket PDF** on its confirmation card. The same button is on every ticket card in **Ticket history**, including PNR lookup results.

- API: `GET /user/bookings/pnr/{pnr}/ticket.pdf`
- Authentication: `Authorization: Bearer <access-token>`; ownership is resolved from the authenticated principal, not a request user ID. A different account, including an administrator, cannot download another account's ticket.
- Success: `200 application/pdf`, `Content-Disposition: attachment; filename="ticket-{bookingId}.pdf"` and `Cache-Control: private, no-store, max-age=0`.
- Missing or unowned PNR: `404`; unauthenticated requests: `401`.
- PDF generation stays in the backend. `BookingPdfService` resolves the saved booking. Thymeleaf fills `src/main/resources/templates/ticket/ticket.html`, and OpenHTMLtoPDF converts it to PDF using `ticket.css`. `pdf/TicketView.java` formats values; `pdf/TicketPdfTemplate.java` only connects the template and renderer. Editing instructions and embedded font licenses are in the template directory.
- The browser fetches the binary response with the shared token-refresh handling and saves a Blob. It does not generate the PDF or put credentials in download URLs. Errors are shown on the card, and an error response is not saved as a PDF.
- Downloading does not change bookings, seat availability or payment status. Unpaid reservations remain visibly `NOT_PAID`. Quota and berth information are not modelled, so they are not invented. The existing missing overnight day offsets also mean arrival date is not inferred in the PDF.

The backend includes PDF extraction and authorization tests plus visual QA fixtures generated with synthetic data under `target/ticket-preview/`. Fonts are bundled for consistent deployment. DejaVu covers its supported Unicode glyphs; unsupported glyphs use `?`, and complex-script shaping is not implemented.
