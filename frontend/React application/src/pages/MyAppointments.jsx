import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import api from "../api/api";
import Navbar from "../components/Navbar";

function getApiMessage(error, fallback) {
  const detail = error.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  return detail || fallback;
}

export default function MyAppointments() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadAppointments() {
    setLoading(true);
    setMessage("");

    try {
      const response = await api.get("/appointments/me");
      const appointmentData = response.data;

      setAppointments(appointmentData);

      const doctorIds = [
        ...new Set(
          appointmentData.map((appointment) => appointment.doctor_id)
        ),
      ];

      const doctorResponses = await Promise.allSettled(
        doctorIds.map((doctorId) => api.get(`/doctors/${doctorId}`))
      );

      const doctorMap = {};

      doctorResponses.forEach((result) => {
        if (result.status === "fulfilled") {
          const doctor = result.value.data;
          doctorMap[doctor.doctor_id] = doctor;
        }
      });

      setDoctors(doctorMap);
    } catch (error) {
      setMessage(
        getApiMessage(error, "Could not load appointments.")
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  async function cancelAppointment(appointmentId) {
    const result = await Swal.fire({
      title: "Cancel appointment?",
      text: "This appointment and its queue entry will be cancelled.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel it",
      cancelButtonText: "Keep appointment",
      confirmButtonColor: "#c92a2a",
      cancelButtonColor: "#687386",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    Swal.fire({
      title: "Cancelling...",
      text: "Please wait.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await api.patch(`/appointments/${appointmentId}/cancel`);
      await loadAppointments();

      await Swal.fire({
        title: "Appointment cancelled",
        text: "Your appointment was cancelled successfully.",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#087f5b",
      });
    } catch (error) {
      await Swal.fire({
        title: "Cancellation failed",
        text: getApiMessage(
          error,
          "Could not cancel the appointment."
        ),
        icon: "error",
        confirmButtonText: "Close",
        confirmButtonColor: "#c92a2a",
      });
    }
  }

  function getStatusStyle(status) {
    if (status === "Cancelled") {
      return { background: "#ffe3e3", color: "#c92a2a" };
    }

    if (status === "Completed") {
      return { background: "#e6fcf5", color: "#087f5b" };
    }

    if (status === "Confirmed") {
      return { background: "#e7f5ff", color: "#1864ab" };
    }

    return { background: "#fff3bf", color: "#8a5d00" };
  }

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Appointments</h1>
            <p style={styles.subtitle}>
              View and manage your hospital bookings.
            </p>
          </div>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>

        {message && <p style={styles.message}>{message}</p>}
        {loading && <p>Loading appointments...</p>}

        {!loading && appointments.length === 0 && (
          <section style={styles.emptyCard}>
            <h2>No appointments found</h2>
            <p style={styles.mutedText}>
              Book an appointment with an available doctor.
            </p>
            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => navigate("/doctors")}
            >
              Find a Doctor
            </button>
          </section>
        )}

        <section style={styles.grid}>
          {appointments.map((appointment) => {
            const doctor = doctors[appointment.doctor_id];
            const statusStyle = getStatusStyle(appointment.status);

            return (
              <article
                key={appointment.appointment_id}
                style={styles.card}
              >
                <div style={styles.cardHeader}>
                  <div>
                    <p style={styles.smallLabel}>APPOINTMENT</p>
                    <h2 style={styles.appointmentTitle}>
                      #{appointment.appointment_id}
                    </h2>
                  </div>

                  <span style={{ ...styles.status, ...statusStyle }}>
                    {appointment.status}
                  </span>
                </div>

                <div style={styles.doctorSection}>
                  <div style={styles.doctorAvatar}>
                    {doctor?.name?.charAt(0) || "D"}
                  </div>

                  <div>
                    <h3 style={styles.doctorName}>
                      {doctor?.name ||
                        `Doctor ${appointment.doctor_id}`}
                    </h3>
                    <p style={styles.specialization}>
                      {doctor?.specialization ||
                        "Specialization unavailable"}
                    </p>
                  </div>
                </div>

                <div style={styles.details}>
                  <p>
                    <strong>Hospital:</strong>{" "}
                    {doctor?.hospital || "Not provided"}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {appointment.appointment_date}
                  </p>
                  <p>
                    <strong>Time:</strong>{" "}
                    {appointment.appointment_time}
                  </p>
                  <p>
                    <strong>Reason:</strong>{" "}
                    {appointment.reason || "Not provided"}
                  </p>
                  <p>
                    <strong>Consultation fee:</strong>{" "}
                    {doctor
                      ? `Rs. ${doctor.consultation_fee}`
                      : "Not available"}
                  </p>
                </div>

                <div style={styles.actions}>
                  <button
                    type="button"
                    style={styles.queueButton}
                    onClick={() => navigate("/queue")}
                  >
                    View Queue
                  </button>

                  {appointment.status !== "Cancelled" &&
                    appointment.status !== "Completed" && (
                      <button
                        type="button"
                        style={styles.cancelButton}
                        onClick={() =>
                          cancelAppointment(
                            appointment.appointment_id
                          )
                        }
                      >
                        Cancel Appointment
                      </button>
                    )}
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </>
  );
}

const styles = {
  page: {
    minHeight: "calc(100vh - 76px)",
    padding: "40px",
    background: "#f4f7fb",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "28px",
  },
  title: { margin: 0, fontSize: "36px" },
  subtitle: { marginTop: "8px", color: "#687386" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },
  card: {
    padding: "24px",
    borderRadius: "16px",
    background: "#ffffff",
    boxShadow: "0 10px 30px rgba(30, 65, 100, 0.1)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  smallLabel: {
    margin: 0,
    color: "#687386",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "1px",
  },
  appointmentTitle: { margin: "5px 0 0", fontSize: "30px" },
  status: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: "14px",
  },
  doctorSection: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    margin: "22px 0",
    padding: "16px",
    borderRadius: "12px",
    background: "#eefaf6",
  },
  doctorAvatar: {
    width: "48px",
    height: "48px",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: "#087f5b",
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: 700,
  },
  doctorName: { margin: 0 },
  specialization: {
    margin: "5px 0 0",
    color: "#087f5b",
    fontWeight: 700,
  },
  details: { lineHeight: 1.6 },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "18px",
  },
  primaryButton: {
    padding: "11px 16px",
    border: "none",
    borderRadius: "9px",
    background: "#087f5b",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "11px 16px",
    border: "1px solid #ccd5df",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#172033",
    fontWeight: 600,
    cursor: "pointer",
  },
  queueButton: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "8px",
    background: "#087f5b",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  cancelButton: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "8px",
    background: "#c92a2a",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  message: {
    marginBottom: "20px",
    padding: "12px",
    borderRadius: "8px",
    background: "#e8fff3",
    color: "#087f5b",
  },
  emptyCard: {
    padding: "30px",
    textAlign: "center",
    borderRadius: "16px",
    background: "#ffffff",
    boxShadow: "0 10px 30px rgba(30, 65, 100, 0.08)",
  },
  mutedText: { color: "#687386" },
};
