# Railway Connect — React UI

Responsive React 19 + Vite UI for the IRCTC clone backend. Includes a sign-in form and a train-search interface.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in your terminal (usually http://localhost:5173).

## Backend connection

By default, sign-in posts to `http://localhost:8080/auth/login` using the backend's expected body:

```json
{ "username": "your-email@example.com", "password": "your-password" }
```

Override the API URL by creating `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

The form expects the backend login response to include `accessToken` and optionally `refreshToken`. Tokens are stored in localStorage only when “Keep me signed in” is selected. For production, prefer secure, HttpOnly cookies and your backend's established token policy.

## CORS

The current Spring Security CORS configuration allows `http://localhost:4200`. For local Vite development, add `http://localhost:5173` to the allowed origins in `SecurityConfig.java` (or your shared CORS configuration) before testing the login request.

## Current scope

- Sign-in UI with show/hide password, validation, loading and API error states
- Responsive landing page and train search form
- Train search currently validates the route locally; connect it to your route/train-search API to display live results
- Registration and password recovery are UI entry points only until corresponding flows are wired up
