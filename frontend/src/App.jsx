import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import TrainSearchPage from "./pages/TrainSearchPage.jsx";
import RegistrationPage from "./pages/RegistrationPage.jsx";
import PasswordRecoveryPage from "./pages/PasswordRecoveryPage.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import TicketHistoryPage from "./pages/TicketHistoryPage.jsx";
import StationAdminPage from "./pages/StationAdminPage.jsx";
import TrainAdminPage from "./pages/TrainAdminPage.jsx";
import TrainRouteAdminPage from "./pages/TrainRouteAdminPage.jsx";
import TrainScheduleAdminPage from "./pages/TrainScheduleAdminPage.jsx";
import { hasSession, hasRole } from "./api/client";

function RequireAuth() {
  const location = useLocation();
  return hasSession() ? <Layout /> : <Navigate to="/login" replace state={{ from: location }} />;
}
function RequireAdmin({ children }) {
  if (!hasSession()) return <Navigate to="/login" replace />;
  if (!hasRole("ADMIN")) return <Navigate to="/" replace />;
  return children;
}
function GuestOnly({ children }) {
  return hasSession() ? <Navigate to="/" replace /> : children;
}
export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
    <Route path="/register" element={<GuestOnly><RegistrationPage /></GuestOnly>} />
    <Route path="/recover" element={<GuestOnly><PasswordRecoveryPage /></GuestOnly>} />
    <Route element={<RequireAuth />}>
      <Route index element={<HomePage />} />
      <Route path="trains" element={<TrainSearchPage />} />
      <Route path="booking" element={<BookingPage />} />
      <Route path="payment" element={<PaymentPage />} />
      <Route path="tickets" element={<TicketHistoryPage />} />
      <Route path="admin/stations" element={<RequireAdmin><StationAdminPage /></RequireAdmin>} />
      <Route path="admin/trains" element={<RequireAdmin><TrainAdminPage /></RequireAdmin>} />
      <Route path="admin/train-routes" element={<RequireAdmin><TrainRouteAdminPage /></RequireAdmin>} />
      <Route path="admin/train-schedules" element={<RequireAdmin><TrainScheduleAdminPage /></RequireAdmin>} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>;
}
