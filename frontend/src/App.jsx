import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import TrainSearchPage from "./pages/TrainSearchPage.jsx";
import RegistrationPage from "./pages/RegistrationPage.jsx";
import PasswordRecoveryPage from "./pages/PasswordRecoveryPage.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import TicketHistoryPage from "./pages/TicketHistoryPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="trains" element={<TrainSearchPage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="payment" element={<PaymentPage />} />
          <Route path="tickets" element={<TicketHistoryPage />} />
        </Route>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegistrationPage />} />
        <Route path="recover" element={<PasswordRecoveryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}