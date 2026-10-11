
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import adminApi from "../api/adminApi";
import "./AdminAppointments.css";

export default function AdminAppointments() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAppointments() {
    setLoading(true);
    setError("");

    try {
      const response = await adminApi.get("/appointments");
      setAppointments(response.data);
    } catch (err) {
      setError(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Unable to load appointments."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchesSearch = [
        appointment.appointment_id,
        appointment.patient_id,
        appointment.doctor_id,
        appointment.reason,
        appointment.appointment_date,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );

      const matchesStatus =
        statusFilter === "All" ||
        appointment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  function getStatusClass(status) {
    const value = String(status || "").toLowerCase();

    if (value === "completed") return "completed";
    if (value === "cancelled") return "cancelled";
    if (value === "confirmed") return "confirmed";

    return "pending";
  }

  return (
    <main className="admin-appointments-page">
      <header className="admin-appointments-header">
        <div>
          <span className="admin-appointments-eyebrow">
            APPOINTMENT MANAGEMENT
          </span>

          <h1>Manage Appointments</h1>

          <p>
            View patient bookings and monitor appointment status.
          </p>
        </div>

        <button
          type="button"
          className="admin-appointments-back"
          onClick={() => navigate("/admin/dashboard")}
        >
          Back to Dashboard
        </button>
      </header>

      <section className="admin-appointments-stats">
        <div className="admin-appointments-stat">
          <span>Total Appointments</span>
          <strong>{appointments.length}</strong>
        </div>

        <div className="admin-appointments-stat">
          <span>Pending</span>
          <strong>
            {appointments.filter((a) => a.status === "Pending").length}
          </strong>
        </div>

        <div className="admin-appointments-stat">
          <span>Completed</span>
          <strong>
            {appointments.filter((a) => a.status === "Completed").length}
          </strong>
        </div>

        <div className="admin-appointments-stat">
          <span>Cancelled</span>
          <strong>
            {appointments.filter((a) => a.status === "Cancelled").length}
          </strong>
        </div>
      </section>

      <section className="admin-appointments-card">
        <div className="admin-appointments-toolbar">
          <div>
            <h2>Appointment Records</h2>
            <p>
              Showing {filteredAppointments.length} of{" "}
              {appointments.length} appointments
            </p>
          </div>

          <div className="admin-appointments-actions">
            <input
              type="search"
              placeholder="Search appointments..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <button
              type="button"
              onClick={loadAppointments}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div className="admin-appointments-error">
            {error}
          </div>
        )}

        {loading ? (
          <p className="admin-appointments-message">
            Loading appointments...
          </p>
        ) : !error && filteredAppointments.length === 0 ? (
          <p className="admin-appointments-message">
            No matching appointments found.
          </p>
        ) : !error ? (
          <div className="admin-appointments-table-wrapper">
            <table className="admin-appointments-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient ID</th>
                  <th>Doctor ID</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.appointment_id}>
                    <td>#{appointment.appointment_id}</td>
                    <td>#{appointment.patient_id}</td>
                    <td>#{appointment.doctor_id}</td>
                    <td>{appointment.appointment_date}</td>
                    <td>{appointment.appointment_time}</td>
                    <td>{appointment.reason || "Not provided"}</td>
                    <td>
                      <span
                        className={`admin-appointment-status ${getStatusClass(
                          appointment.status
                        )}`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}
