import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

import api from "../api/api";

export default function Doctors() {
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [specialization, setSpecialization] = useState("");
  const [hospital, setHospital] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadDoctors() {
    setLoading(true);
    setMessage("");

    try {
      const response = await api.get("/doctors", {
        params: {
          specialization: specialization || undefined,
          hospital: hospital || undefined,
        },
      });

      setDoctors(response.data);
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Could not load doctors."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    loadDoctors();
  }

  return (
    <>
  <Navbar />
    
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Available Doctors</h1>
          <p style={styles.subtitle}>
            Search doctors and book an appointment.
          </p>
        </div>

        <button
          style={styles.secondaryButton}
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

      <form style={styles.searchForm} onSubmit={handleSearch}>
        <input
          type="text"
          value={specialization}
          onChange={(event) =>
            setSpecialization(event.target.value)
          }
          placeholder="Specialization, e.g. Cardiology"
          style={styles.input}
        />

        <input
          type="text"
          value={hospital}
          onChange={(event) =>
            setHospital(event.target.value)
          }
          placeholder="Hospital"
          style={styles.input}
        />

        <button type="submit" style={styles.primaryButton}>
          Search
        </button>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => {
            setSpecialization("");
            setHospital("");

            setTimeout(() => {
              loadDoctors();
            }, 0);
          }}
        >
          Clear
        </button>
      </form>

      {loading && <p>Loading doctors...</p>}

      {message && (
        <p style={styles.errorMessage}>{message}</p>
      )}

      {!loading && doctors.length === 0 && (
        <p>No doctors found.</p>
      )}

      <section style={styles.grid}>
        {doctors.map((doctor) => (
          <article
            key={doctor.doctor_id}
            style={styles.card}
          >
            <div style={styles.doctorAvatar}>
              {doctor.name.charAt(0)}
            </div>

            <h2 style={styles.doctorName}>
              {doctor.name}
            </h2>

            <p style={styles.specialization}>
              {doctor.specialization}
            </p>

            <div style={styles.details}>
              <p>
                <strong>Qualification:</strong>{" "}
                {doctor.qualification || "Not provided"}
              </p>

              <p>
                <strong>Experience:</strong>{" "}
                {doctor.experience_years} years
              </p>

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
                {doctor.available_start_time &&
                doctor.available_end_time
                  ? `${doctor.available_start_time} - ${doctor.available_end_time}`
                  : "Not configured"}
              </p>

              <p>
                <strong>Consultation fee:</strong>{" "}
                Rs. {doctor.consultation_fee}
              </p>

              <p>
                <strong>Average consultation:</strong>{" "}
                {doctor.average_consultation_minutes} minutes
              </p>
            </div>

            <button
              style={styles.primaryButton}
              onClick={() =>
                navigate(`/book/${doctor.doctor_id}`)
              }
            >
              Book Appointment
            </button>
          </article>
        ))}
      </section>
    </main>

</>

  );
}

const styles = {
  page: {
    minHeight: "100vh",
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
  title: {
    margin: 0,
    fontSize: "36px",
  },
  subtitle: {
    marginTop: "8px",
    color: "#687386",
  },
  searchForm: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "28px",
    padding: "20px",
    background: "#ffffff",
    borderRadius: "14px",
    boxShadow: "0 8px 25px rgba(30, 65, 100, 0.08)",
  },
  input: {
    flex: "1 1 220px",
    padding: "12px 14px",
    border: "1px solid #ccd5df",
    borderRadius: "9px",
    fontSize: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  card: {
    padding: "24px",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(30, 65, 100, 0.1)",
  },
  doctorAvatar: {
    width: "54px",
    height: "54px",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: "#087f5b",
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: 700,
  },
  doctorName: {
    marginBottom: "4px",
  },
  specialization: {
    marginTop: 0,
    color: "#087f5b",
    fontWeight: 700,
  },
  details: {
    margin: "20px 0",
    lineHeight: 1.55,
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
  errorMessage: {
    padding: "12px",
    background: "#fff1f1",
    color: "#c92a2a",
    borderRadius: "8px",
  },
};