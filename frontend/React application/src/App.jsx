import AdminAppointments from "./pages/AdminAppointments";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AdminQueue from "./pages/AdminQueue";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminAIAnalytics from "./pages/AdminAIAnalytics";

import AdminDashboard from "./pages/AdminDashboard";
import AdminDoctors from "./pages/AdminDoctors";
import AdminPatients from "./pages/AdminPatients";
import AdminLogin from "./pages/AdminLogin";

import BookAppointment from "./pages/BookAppointment";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MyAppointments from "./pages/MyAppointments";
import Queue from "./pages/Queue";
import Register from "./pages/Register";

// Protect admin pages
function AdminProtectedRoute({ children }) {
  const adminToken = localStorage.getItem(
    "admin_access_token"
  );

  if (!adminToken) {
    return (
      <Navigate
        to="/admin-login"
        replace
      />
    );
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}

        <Route path="/" element={<Home />} />

        <Route
          path="/patient-login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/admin-login"
          element={<AdminLogin />}
        />

        {/* PATIENT PROTECTED ROUTES */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctors"
          element={
            <ProtectedRoute>
              <Doctors />
            </ProtectedRoute>
          }
        />

        <Route
          path="/book/:doctorId"
          element={
            <ProtectedRoute>
              <BookAppointment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <MyAppointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/queue"
          element={
            <ProtectedRoute>
              <Queue />
            </ProtectedRoute>
          }
        />

        <Route
  path="/admin/queue"
  element={
    <AdminProtectedRoute>
      <AdminQueue />
    </AdminProtectedRoute>
  }
/>

        <Route
  path="/admin/appointments"
  element={
    <AdminProtectedRoute>
      <AdminAppointments />
    </AdminProtectedRoute>
  }
/>

        {/* ADMIN PROTECTED ROUTES */}

        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/doctors"
          element={
            <AdminProtectedRoute>
              <AdminDoctors />
            </AdminProtectedRoute>
          }
        />

        {/* NEW: ADMIN PATIENT MANAGEMENT */}

        <Route
          path="/admin/patients"
          element={
            <AdminProtectedRoute>
              <AdminPatients />
            </AdminProtectedRoute>
          }
        />
        <Route
  path="/admin/analytics"
  element={
    <AdminProtectedRoute>
      <AdminAIAnalytics />
    </AdminProtectedRoute>
  }
/>

        {/* UNKNOWN ROUTES */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
