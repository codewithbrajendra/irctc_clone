# Railway Connect — React frontend

A readable, component-based React 19 + Vite UI for the IRCTC clone project.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Project structure

```text
frontend/
├── index.html
├── package.json
└── src/
    ├── api/
    │   └── client.js
    ├── components/
    │   └── Layout.jsx
    ├── pages/
    │   ├── HomePage.jsx
    │   ├── LoginPage.jsx
    │   ├── TrainSearchPage.jsx
    │   ├── RegistrationPage.jsx
    │   ├── PasswordRecoveryPage.jsx
    │   ├── BookingPage.jsx
    │   ├── PaymentPage.jsx
    │   └── TicketHistoryPage.jsx
    ├── App.jsx
    ├── main.jsx
    └── styles.css
```

## Routes

- `/` — Homepage
- `/login` — Login
- `/trains` — Train search
- `/register` — Registration
- `/recover` — Password recovery
- `/booking` — Booking centre
- `/payment` — Payment
- `/tickets` — Ticket history

## Backend integration

Set the backend URL in `.env.local` if needed:

```env
VITE_API_BASE_URL=http://localhost:8080
```

The shared API client sends JSON requests and adds the saved access token as a Bearer token when available.

- Login: `POST /auth/login` with `{ "username": "email", "password": "..." }`
- Registration: `POST /auth/register` with user fields such as `name`, `email`, `password`, and `phone`

The Spring Security CORS configuration in this repository currently allows `http://localhost:4200`. For Vite development, allow `http://localhost:5173` in the backend CORS configuration as well.

## Important scope notes

All eight requested pages are split into individual components and have responsive UI. Login and registration call the existing auth endpoints. The backend currently needs matching train-search, booking-details, ticket-history, and password-reset APIs before those screens can show real records. The payment page is a safe UI scaffold; connect it to the existing server-side payment initiation/confirmation flow and a payment gateway before accepting real payments. No real payment is processed by this UI.
