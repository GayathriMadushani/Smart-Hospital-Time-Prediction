import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import api from "../api/api";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function getApiError(error) {
    const detail = error.response?.data?.detail;

    if (Array.isArray(detail)) {
      return detail
        .map((item) => item.msg || "Validation error")
        .join(", ");
    }

    return (
      detail ||
      "Login failed. Please check your email and password."
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const email = form.email.trim();

    if (!email || !form.password) {
      await Swal.fire({
        title: "Missing information",
        text: "Please enter your email and password.",
        icon: "warning",
        confirmButtonColor: "#087f5b",
      });

      return;
    }

    setLoading(true);

    try {
      localStorage.removeItem("access_token");

      const loginData = new URLSearchParams();
      loginData.append("username", email);
      loginData.append("password", form.password);

      const response = await api.post(
        "/auth/login",
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
          "The server did not return an access token."
        );
      }

      localStorage.setItem(
        "access_token",
        response.data.access_token
      );

      await Swal.fire({
        title: "Welcome back",
        text: "Login successful.",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });

      navigate("/dashboard", { replace: true });
    } catch (error) {
      localStorage.removeItem("access_token");

      await Swal.fire({
        title: "Login failed",
        text: getApiError(error),
        icon: "error",
        confirmButtonText: "Try again",
        confirmButtonColor: "#c92a2a",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="patient-login-page">
      <div className="login-background-grid" />
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />

      <button
        type="button"
        className="back-home-button"
        onClick={() => navigate("/")}
      >
        <span>←</span>
        Back to Home
      </button>

      <div className="login-layout">
        <section className="login-information-panel">
          <div className="information-badge">
            <span />
            SMART HOSPITAL ACCESS
          </div>

          <h1>
            Your hospital visit,
            <span> easier to manage.</span>
          </h1>

          <p className="information-description">
            Sign in to book consultations, manage your
            appointments, check in online, and follow your
            queue status from one secure place.
          </p>

          <div className="login-benefits">
            <article>
              <div className="benefit-icon">✓</div>

              <div>
                <h3>Book appointments online</h3>
                <p>
                  Choose a doctor, date, and available time
                  without visiting the hospital first.
                </p>
              </div>
            </article>

            <article>
              <div className="benefit-icon">⌚</div>

              <div>
                <h3>Track your queue</h3>
                <p>
                  View your queue number and consultation
                  progress from your phone or computer.
                </p>
              </div>
            </article>

            <article>
              <div className="benefit-icon">◷</div>

              <div>
                <h3>Plan your visit better</h3>
                <p>
                  See your estimated waiting and consultation
                  times before your turn.
                </p>
              </div>
            </article>
          </div>

          <div className="queue-preview-card">
            <div className="queue-preview-header">
              <div>
                <small>CURRENT QUEUE</small>
                <strong>#04</strong>
              </div>

              <span>Waiting</span>
            </div>

            <div className="queue-preview-doctor">
              <div>D</div>

              <section>
                <strong>Dr. Nimal Perera</strong>
                <p>Cardiology</p>
              </section>
            </div>

            <div className="queue-preview-time">
              <span>Estimated waiting time</span>
              <strong>18 minutes</strong>
            </div>
          </div>

          <div className="login-trust-row">
            <span>✓ Secure login</span>
            <span>✓ Private patient information</span>
            <span>✓ Available anytime</span>
          </div>
        </section>

        <section className="patient-login-card">
          <div className="login-brand-row">
            <div className="login-brand-icon">+</div>

            <div>
              <h2>Smart Hospital</h2>
              <p>Booking and Queue Prediction</p>
            </div>
          </div>

          <div className="login-heading-area">
            <h1>Patient Login</h1>

            <p>
              Sign in to manage appointments and track your
              hospital queue.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="patient-login-form"
          >
            <label htmlFor="email">Email address</label>

            <div className="login-input-wrapper">
              <span className="input-icon">✉</span>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="patient@example.com"
                disabled={loading}
                required
              />
            </div>

            <label htmlFor="password">Password</label>

            <div className="login-input-wrapper password-wrapper">
              <span className="input-icon">●</span>

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={loading}
                required
              />

              <button
                type="button"
                className="password-visibility-button"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                disabled={loading}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              type="submit"
              className="patient-login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Login
                  <span className="login-arrow">→</span>
                </>
              )}
            </button>
          </form>

          <p className="create-account-text">
            New patient?{" "}
            <Link to="/register">
              Create an account
            </Link>
          </p>

          <div className="login-divider">
            <span />
            <strong>OR</strong>
            <span />
          </div>

          <button
            type="button"
            className="admin-access-button"
            onClick={() => navigate("/admin-login")}
          >
            <span className="admin-shield">◆</span>

            <span className="admin-button-content">
              <strong>Login as Admin</strong>
              <small>
                For hospital administrators and staff
              </small>
            </span>

            <span className="admin-arrow">→</span>
          </button>

          <p className="login-support-text">
            Need help accessing your account?{" "}
            <a href="mailto:support@smarthospital.lk">
              Contact support
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}