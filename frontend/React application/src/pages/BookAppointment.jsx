import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import api from "../api/api";
import Navbar from "../components/Navbar";

function getLocalToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60_000);
  return localDate.toISOString().split("T")[0];
}

function normalizeTime(value) {
  return value ? value.slice(0, 5) : undefined;
}

function formatApiError(error, fallback) {
  const detail = error.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  return detail || fallback;
}

export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [form, setForm] = useState({
    appointment_date: "",
    appointment_time: "",
    reason: "",
  });
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDoctor() {
      setLoadingDoctor(true);
      setPageError("");

      try {
        const response = await api.get(`/doctors/${doctorId}`);

        if (active) {
          setDoctor(response.data);
        }
      } catch (error) {
        if (active) {
          setPageError(
            formatApiError(error, "Could not load doctor details.")
          );
        }
      } finally {
        if (active) {
          setLoadingDoctor(false);
        }
      }
    }

    loadDoctor();

    return () => {
      active = false;
    };
  }, [doctorId]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!doctor) {
      return;
    }

    const confirmation = await Swal.fire({
      title: "Confirm appointment?",
      text: `${doctor.name} on ${form.appointment_date} at ${form.appointment_time}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, book appointment",
      cancelButtonText: "Review details",
      confirmButtonColor: "#087f5b",
      cancelButtonColor: "#687386",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setSubmitting(true);

    Swal.fire({
      title: "Booking appointment...",
      text: "Please wait while we create your booking.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await api.post("/appointments", {
        doctor_id: Number(doctorId),
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        reason: form.reason.trim() || null,
      });

      await Swal.fire({
        title: "Appointment booked",
        html: `
          <p>Your appointment was created successfully.</p>
          <p><strong>Appointment ID:</strong> ${response.data.appointment_id}</p>
          <p><strong>Status:</strong> ${response.data.status}</p>
        `,
        icon: "success",
        confirmButtonText: "View my appointments",
        confirmButtonColor: "#087f5b",
      });

      navigate("/appointments");
    } catch (error) {
      await Swal.fire({
        title: "Booking failed",
        text: formatApiError(error, "Could not book appointment."),
        icon: "error",
        confirmButtonText: "Close",
        confirmButtonColor: "#c92a2a",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingDoctor) {
    return (
      <>
        <Navbar />
        <main style={styles.loadingPage}>
          <p>Loading doctor details...</p>
        </main>
      </>
    );
  }

  if (pageError || !doctor) {
    return (
      <>
        <Navbar />
        <main style={styles.loadingPage}>
          <section style={styles.errorCard}>
            <h2>Unable to load doctor</h2>
            <p>{pageError || "Doctor not found."}</p>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => navigate("/doctors")}
            >
              Back to Doctors
            </button>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.card}>
          <button
            type="button"
            style={styles.backButton}
            onClick={() => navigate("/doctors")}
          >
            ← Back to Doctors
          </button>

          <h1 style={styles.title}>Book Appointment</h1>

          <div style={styles.doctorBox}>
            <div style={styles.doctorHeader}>
              <div style={styles.doctorAvatar}>
                {doctor.name?.charAt(0) || "D"}
              </div>

              <div>
                <h2 style={styles.doctorName}>{doctor.name}</h2>
                <p style={styles.specialization}>
                  {doctor.specialization}
                </p>
              </div>
            </div>

            <div style={styles.doctorDetails}>
              <p>
                <strong>Hospital:</strong>{" "}
                {doctor.hospital || "Not provided"}
              </p>
              <p>
                <strong>Available days:</strong>{" "}
                {doctor.available_days || "Not configured"}
              </p>
              <p>
                <strong>Available time:</strong>{" "}
                {doctor.available_start_time && doctor.available_end_time
                  ? `${doctor.available_start_time} - ${doctor.available_end_time}`
                  : "Not configured"}
              </p>
              <p>
                <strong>Consultation fee:</strong> Rs.{" "}
                {doctor.consultation_fee}
              </p>
              <p>
                <strong>Average consultation duration:</strong>{" "}
                {doctor.average_consultation_minutes} minutes
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label} htmlFor="appointment_date">
              Appointment date
            </label>
            <input
              id="appointment_date"
              name="appointment_date"
              type="date"
              min={getLocalToday()}
              value={form.appointment_date}
              onChange={handleChange}
              required
              style={styles.input}
            />

            <label style={styles.label} htmlFor="appointment_time">
              Appointment time
            </label>
            <input
              id="appointment_time"
              name="appointment_time"
              type="time"
              min={normalizeTime(doctor.available_start_time)}
              max={normalizeTime(doctor.available_end_time)}
              value={form.appointment_time}
              onChange={handleChange}
              required
              style={styles.input}
            />

            <label style={styles.label} htmlFor="reason">
              Reason for consultation
            </label>
            <textarea
              id="reason"
              name="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="Describe the reason for your consultation"
              rows="4"
              maxLength="500"
              style={styles.textarea}
            />

            <div style={styles.reasonFooter}>
              <span>Optional</span>
              <span>{form.reason.length}/500</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.primaryButton,
                opacity: submitting ? 0.65 : 1,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Booking..." : "Confirm Appointment"}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}

const styles = {
  page: {
    minHeight: "calc(100vh - 76px)",
    padding: "40px 20px",
    background: "#f4f7fb",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },
  loadingPage: {
    minHeight: "calc(100vh - 76px)",
    display: "grid",
    placeItems: "center",
    padding: "40px 20px",
    background: "#f4f7fb",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "700px",
    margin: "0 auto",
    padding: "30px",
    background: "#ffffff",
    borderRadius: "18px",
    boxShadow: "0 12px 35px rgba(30, 65, 100, 0.12)",
  },
  errorCard: {
    width: "100%",
    maxWidth: "480px",
    padding: "28px",
    textAlign: "center",
    borderRadius: "16px",
    background: "#ffffff",
    boxShadow: "0 12px 35px rgba(30, 65, 100, 0.12)",
  },
  backButton: {
    marginBottom: "20px",
    padding: "10px 14px",
    border: "1px solid #ccd5df",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#172033",
    fontWeight: 600,
    cursor: "pointer",
  },
  title: { marginTop: 0, fontSize: "32px" },
  doctorBox: {
    marginBottom: "25px",
    padding: "20px",
    borderRadius: "12px",
    background: "#eefaf6",
  },
  doctorHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "16px",
  },
  doctorAvatar: {
    width: "52px",
    height: "52px",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: "#087f5b",
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: 700,
  },
  doctorName: { margin: 0 },
  specialization: {
    margin: "5px 0 0",
    color: "#087f5b",
    fontWeight: 700,
  },
  doctorDetails: { lineHeight: 1.55 },
  form: { display: "flex", flexDirection: "column" },
  label: { marginBottom: "8px", fontWeight: 700 },
  input: {
    marginBottom: "18px",
    padding: "12px 14px",
    border: "1px solid #ccd5df",
    borderRadius: "9px",
    fontSize: "16px",
  },
  textarea: {
    padding: "12px 14px",
    border: "1px solid #ccd5df",
    borderRadius: "9px",
    resize: "vertical",
    fontSize: "16px",
  },
  reasonFooter: {
    display: "flex",
    justifyContent: "space-between",
    margin: "6px 0 18px",
    color: "#687386",
    fontSize: "13px",
  },
  primaryButton: {
    padding: "13px",
    border: "none",
    borderRadius: "9px",
    background: "#087f5b",
    color: "#ffffff",
    fontWeight: 700,
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
};
