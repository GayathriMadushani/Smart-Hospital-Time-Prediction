import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import api from "../api/api";
import "./AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const email = form.email.trim();

    if (!email || !form.password) {
      await Swal.fire({
        title: "Missing information",
        text: "Enter the admin email and password.",
        icon: "warning",
        confirmButtonColor: "#173f62",
      });

      return;
    }

    setLoading(true);

    try {
      const loginData = new URLSearchParams();

      loginData.append("username", email);
      loginData.append("password", form.password);

      const response = await api.post(
        "/admin/auth/login",
        loginData,
        {
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
        }
      );

      if (!response.data?.access_token) {
        throw new Error(
          "The server did not return an admin token."
        );
      }

      localStorage.setItem(
        "admin_access_token",
        response.data.access_token
      );

      await Swal.fire({
        title: "Admin login successful",
        text: "Welcome to the administration portal.",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });

      navigate("/admin/dashboard", {
        replace: true,
      });
    } catch (error) {
      await Swal.fire({
        title: "Admin login failed",
        text:
          error.response?.data?.detail ||
          "The admin login endpoint is not ready yet.",
        icon: "error",
        confirmButtonColor: "#c92a2a",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <button
        type="button"
        className="admin-back-button"
        onClick={() => navigate("/")}
      >
        ← Back to Home
      </button>

      <section className="admin-login-layout">
        <div className="admin-information-panel">
          <span className="admin-badge">
            HOSPITAL ADMINISTRATION
          </span>

          <h1>
            Manage hospital operations from one secure portal.
          </h1>

          <p>
            Administrators and authorized staff can manage
            doctors, appointments, patients, and consultation
            queues.
          </p>

          <div className="admin-feature-list">
            <article>
              <span>01</span>
              <div>
                <h3>Doctor management</h3>
                <p>
                  Add, edit, and manage doctor availability.
                </p>
              </div>
            </article>

            <article>
              <span>02</span>
              <div>
                <h3>Appointment monitoring</h3>
                <p>
                  Review scheduled, completed, and cancelled
                  appointments.
                </p>
              </div>
            </article>

            <article>
              <span>03</span>
              <div>
                <h3>Queue control</h3>
                <p>
                  Start and complete consultations and track
                  patient flow.
                </p>
              </div>
            </article>
          </div>
        </div>

        <section className="admin-login-card">
          <div className="admin-login-brand">
            <div className="admin-logo">+</div>

            <div>
              <h2>Smart Hospital</h2>
              <p>Administration Portal</p>
            </div>
          </div>

          <div className="admin-login-heading">
            <h1>Admin Login</h1>

            <p>
              Sign in using your authorized administrator
              account.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Admin email</label>

            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@smarthospital.lk"
              disabled={loading}
              required
            />

            <label htmlFor="password">Password</label>

            <div className="admin-password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={loading}
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              type="submit"
              className="admin-submit-button"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Login to Admin Portal"}
            </button>
          </form>

          <button
            type="button"
            className="patient-portal-link"
            onClick={() => navigate("/patient-login")}
          >
            Patient? Go to Patient Login
          </button>
        </section>
      </section>
    </main>
  );
}