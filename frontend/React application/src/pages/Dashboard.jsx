import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [queueEntries, setQueueEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setPageError("");

    try {
      const [
        patientResponse,
        appointmentsResponse,
        queueResponse,
      ] = await Promise.all([
        api.get("/patients/me"),
        api.get("/appointments/me"),
        api.get("/queue/me"),
      ]);

      setPatient(patientResponse.data);
      setAppointments(appointmentsResponse.data);
      setQueueEntries(queueResponse.data);
    } catch (error) {
      setPageError(
        getApiError(
          error,
          "Could not load your dashboard information."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function getApiError(error, fallbackMessage) {
    const detail = error.response?.data?.detail;

    if (Array.isArray(detail)) {
      return detail
        .map((item) => item.msg || "Validation error")
        .join(", ");
    }

    return detail || fallbackMessage;
  }

  const pendingAppointments = useMemo(
    () =>
      appointments.filter((appointment) =>
        ["Pending", "Confirmed"].includes(
          appointment.status
        )
      ),
    [appointments]
  );

  const activeQueueEntries = useMemo(
    () =>
      queueEntries.filter((queueEntry) =>
        [
          "Waiting",
          "Checked In",
          "In Consultation",
        ].includes(queueEntry.status)
      ),
    [queueEntries]
  );

  const nextAppointment = useMemo(() => {
    const now = new Date();

    const upcoming = appointments
      .filter(
        (appointment) =>
          !["Cancelled", "Completed"].includes(
            appointment.status
          )
      )
      .map((appointment) => ({
        ...appointment,
        dateTime: new Date(
          `${appointment.appointment_date}T${appointment.appointment_time}`
        ),
      }))
      .filter(
        (appointment) =>
          !Number.isNaN(appointment.dateTime.getTime()) &&
          appointment.dateTime >= now
      )
      .sort(
        (firstAppointment, secondAppointment) =>
          firstAppointment.dateTime -
          secondAppointment.dateTime
      );

    return upcoming[0] || null;
  }, [appointments]);

  function formatDate(value) {
    if (!value) {
      return "Not available";
    }

    const dateValue = new Date(`${value}T00:00:00`);

    if (Number.isNaN(dateValue.getTime())) {
      return value;
    }

    return dateValue.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatTime(value) {
    if (!value) {
      return "Not available";
    }

    const [hours, minutes] = value.split(":");

    const dateValue = new Date();
    dateValue.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return dateValue.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getFirstName() {
    if (!patient?.name) {
      return "Patient";
    }

    return patient.name.trim().split(" ")[0];
  }

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="dashboard-loading-page">
          <div className="dashboard-loader" />

          <p>Loading your dashboard...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="patient-dashboard-page">
        <div className="dashboard-background-orb dashboard-orb-one" />
        <div className="dashboard-background-orb dashboard-orb-two" />

        <section className="dashboard-hero">
          <div className="dashboard-welcome">
            <span className="dashboard-label">
              PATIENT DASHBOARD
            </span>

            <h1>
              Welcome back,
              <span> {getFirstName()}</span>
            </h1>

            <p>
              Manage appointments, follow your queue, and
              plan your hospital visit from one place.
            </p>

            <div className="dashboard-hero-actions">
              <button
                type="button"
                className="dashboard-primary-action"
                onClick={() => navigate("/doctors")}
              >
                <span className="action-button-icon">+</span>
                Book Appointment
              </button>

              <button
                type="button"
                className="dashboard-secondary-action"
                onClick={() => navigate("/queue")}
              >
                View My Queue
                <span>→</span>
              </button>
            </div>
          </div>

          <article className="patient-profile-card">
            <div className="profile-card-header">
              <div className="patient-avatar">
                {patient?.name?.charAt(0)?.toUpperCase() ||
                  "P"}
              </div>

              <div>
                <h2>{patient?.name || "Patient"}</h2>
                <span className="profile-status">
                  <span />
                  Active account
                </span>
              </div>
            </div>

            <div className="profile-details">
              <div>
                <span>Patient ID</span>
                <strong>
                  #{patient?.patient_id || "—"}
                </strong>
              </div>

              <div>
                <span>Email</span>
                <strong>
                  {patient?.email || "Not provided"}
                </strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>
                  {patient?.phone || "Not provided"}
                </strong>
              </div>
            </div>
          </article>
        </section>

        {pageError && (
          <section className="dashboard-error-message">
            <span>!</span>

            <div>
              <strong>Unable to load some information</strong>
              <p>{pageError}</p>
            </div>

            <button
              type="button"
              onClick={loadDashboard}
            >
              Try again
            </button>
          </section>
        )}

        <section className="dashboard-statistics">
          <article className="statistic-card statistic-blue">
            <div className="statistic-icon">📅</div>

            <div>
              <span>Total Appointments</span>
              <strong>{appointments.length}</strong>
              <small>All your bookings</small>
            </div>
          </article>

          <article className="statistic-card statistic-green">
            <div className="statistic-icon">✓</div>

            <div>
              <span>Upcoming Appointments</span>
              <strong>
                {pendingAppointments.length}
              </strong>
              <small>Scheduled visits</small>
            </div>
          </article>

          <article className="statistic-card statistic-cyan">
            <div className="statistic-icon">#</div>

            <div>
              <span>Active Queue Entries</span>
              <strong>
                {activeQueueEntries.length}
              </strong>
              <small>Current queue activity</small>
            </div>
          </article>

          <article className="statistic-card statistic-navy">
            <div className="statistic-icon">●</div>

            <div>
              <span>Account Status</span>
              <strong className="active-status-text">
                Active
              </strong>
              <small>Patient account ready</small>
            </div>
          </article>
        </section>

        <section className="dashboard-main-grid">
          <article className="next-appointment-card">
            <div className="dashboard-card-heading">
              <div>
                <span className="card-heading-icon">◷</span>

                <div>
                  <h2>Next Appointment</h2>
                  <p>
                    Your nearest scheduled consultation
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/appointments")
                }
              >
                View all
              </button>
            </div>

            {nextAppointment ? (
              <div className="appointment-highlight">
                <div className="appointment-date-block">
                  <strong>
                    {new Date(
                      `${nextAppointment.appointment_date}T00:00:00`
                    ).getDate()}
                  </strong>

                  <span>
                    {new Date(
                      `${nextAppointment.appointment_date}T00:00:00`
                    )
                      .toLocaleDateString(undefined, {
                        month: "short",
                      })
                      .toUpperCase()}
                  </span>
                </div>

                <div className="appointment-information">
                  <span className="appointment-status-badge">
                    {nextAppointment.status}
                  </span>

                  <h3>
                    Appointment #
                    {nextAppointment.appointment_id}
                  </h3>

                  <div className="appointment-details-row">
                    <p>
                      <span>📅</span>
                      {formatDate(
                        nextAppointment.appointment_date
                      )}
                    </p>

                    <p>
                      <span>🕒</span>
                      {formatTime(
                        nextAppointment.appointment_time
                      )}
                    </p>
                  </div>

                  <p className="appointment-reason">
                    <strong>Reason:</strong>{" "}
                    {nextAppointment.reason ||
                      "Not provided"}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/appointments")
                    }
                  >
                    View Appointment
                    <span>→</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-appointment-state">
                <div className="empty-appointment-icon">
                  📅
                </div>

                <h3>No upcoming appointment</h3>

                <p>
                  Book a consultation with an available
                  doctor when you are ready.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/doctors")}
                >
                  Find a Doctor
                </button>
              </div>
            )}
          </article>

          <article className="quick-actions-card">
            <div className="dashboard-card-heading">
              <div>
                <span className="card-heading-icon">
                  ⚡
                </span>

                <div>
                  <h2>Quick Actions</h2>
                  <p>Access your most-used services</p>
                </div>
              </div>
            </div>

            <div className="quick-actions-grid">
              <button
                type="button"
                className="quick-action-item quick-action-primary"
                onClick={() => navigate("/doctors")}
              >
                <span className="quick-action-icon">
                  🩺
                </span>

                <span className="quick-action-content">
                  <strong>Find a Doctor</strong>
                  <small>
                    Search specialists and book a visit
                  </small>
                </span>

                <span className="quick-action-arrow">
                  →
                </span>
              </button>

              <button
                type="button"
                className="quick-action-item"
                onClick={() =>
                  navigate("/appointments")
                }
              >
                <span className="quick-action-icon">
                  📋
                </span>

                <span className="quick-action-content">
                  <strong>My Appointments</strong>
                  <small>
                    View, manage, or cancel bookings
                  </small>
                </span>

                <span className="quick-action-arrow">
                  →
                </span>
              </button>

              <button
                type="button"
                className="quick-action-item"
                onClick={() => navigate("/queue")}
              >
                <span className="quick-action-icon">
                  ⏱
                </span>

                <span className="quick-action-content">
                  <strong>My Queue</strong>
                  <small>
                    Track your position and waiting time
                  </small>
                </span>

                <span className="quick-action-arrow">
                  →
                </span>
              </button>
            </div>
          </article>
        </section>

        <section className="dashboard-benefit-banner">
          <div className="benefit-banner-icon">
            ✓
          </div>

          <div>
            <h2>Plan your hospital visit with confidence</h2>

            <p>
              Check your appointment information and queue
              status before travelling to the hospital.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/queue")}
          >
            Check Queue Status
            <span>→</span>
          </button>
        </section>
      </main>
    </>
  );
}