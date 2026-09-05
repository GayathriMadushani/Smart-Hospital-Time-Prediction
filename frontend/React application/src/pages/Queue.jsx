import { useEffect, useMemo, useState } from "react";
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

export default function Queue() {
  const navigate = useNavigate();

  const [queueEntries, setQueueEntries] = useState([]);
  const [doctors, setDoctors] = useState({});
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("Active");


  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    setLoading(true);
    setMessage("");

    try {
      const response = await api.get("/queue/me");
      const queueData = response.data;

      setQueueEntries(queueData);

      const doctorIds = [
        ...new Set(
          queueData.map((queueEntry) => queueEntry.doctor_id)
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

      const activeQueueEntries = queueData.filter(
        (queueEntry) =>
          !["Cancelled", "Completed"].includes(queueEntry.status)
      );

      const predictionResponses = await Promise.allSettled(
        activeQueueEntries.map((queueEntry) =>
          api.get(`/predictions/queue/${queueEntry.queue_id}`)
        )
      );

      const predictionMap = {};

      predictionResponses.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const queueId = activeQueueEntries[index].queue_id;
          predictionMap[queueId] = result.value.data;
        }
      });

      setPredictions(predictionMap);
    } catch (error) {
      setMessage(
        getApiMessage(error, "Could not load queue information.")
      );
    } finally {
      setLoading(false);
    }
  }

  async function checkIn(queueId) {
    const result = await Swal.fire({
      title: "Check in now?",
      text: "Confirm that you have arrived at the hospital.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, check in",
      cancelButtonText: "Not yet",
      confirmButtonColor: "#1864ab",
      cancelButtonColor: "#687386",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    Swal.fire({
      title: "Checking in...",
      text: "Please wait.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await api.patch(`/queue/${queueId}/check-in`);
      await loadQueue();

      await Swal.fire({
        title: "Check-in successful",
        text: "You have joined the active consultation queue.",
        icon: "success",
        confirmButtonText: "View queue",
        confirmButtonColor: "#087f5b",
      });
    } catch (error) {
      await Swal.fire({
        title: "Check-in failed",
        text: getApiMessage(
          error,
          "You could not check in for this appointment."
        ),
        icon: "error",
        confirmButtonText: "Close",
        confirmButtonColor: "#c92a2a",
      });
    }
  }

  const filteredQueueEntries = useMemo(() => {
    return queueEntries.filter((queueEntry) => {
      if (filter === "Active") {
        return ["Waiting", "Checked In", "In Consultation"].includes(
          queueEntry.status
        );
      }

      if (filter === "Completed") {
        return queueEntry.status === "Completed";
      }

      if (filter === "Cancelled") {
        return queueEntry.status === "Cancelled";
      }

      return true;
    });
  }, [filter, queueEntries]);

  function formatDateTime(value) {
    return value ? new Date(value).toLocaleString() : "Not available";
  }

  function getStatusStyle(status) {
    if (status === "Completed") {
      return { background: "#e6fcf5", color: "#087f5b" };
    }

    if (status === "Cancelled") {
      return { background: "#ffe3e3", color: "#c92a2a" };
    }

    if (status === "In Consultation") {
      return { background: "#e7f5ff", color: "#1864ab" };
    }

    if (status === "Checked In") {
      return { background: "#fff3bf", color: "#8a5d00" };
    }

    return { background: "#f1f3f5", color: "#495057" };
  }

  function shouldShowPrediction(queueEntry) {
    return !["Cancelled", "Completed"].includes(queueEntry.status);
  }

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Queue</h1>
            <p style={styles.subtitle}>
              Track your queue position and AI time predictions.
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
        {loading && <p>Loading queue information...</p>}

        {!loading && queueEntries.length === 0 && (
          <section style={styles.emptyCard}>
            <h2>No queue entries found</h2>
            <p>Book an appointment to receive a queue number.</p>
            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => navigate("/doctors")}
            >
              Find a Doctor
            </button>
          </section>
        )}

        {!loading && queueEntries.length > 0 && (
          <div style={styles.filters}>
            {["Active", "All", "Completed", "Cancelled"].map(
              (filterName) => (
                <button
                  key={filterName}
                  type="button"
                  onClick={() => setFilter(filterName)}
                  style={{
                    ...styles.filterButton,
                    ...(filter === filterName
                      ? styles.activeFilterButton
                      : {}),
                  }}
                >
                  {filterName}
                </button>
              )
            )}
          </div>
        )}

        {!loading &&
          queueEntries.length > 0 &&
          filteredQueueEntries.length === 0 && (
            <section style={styles.emptyCard}>
              <h2>No {filter.toLowerCase()} queue entries</h2>
            </section>
          )}

        <section style={styles.grid}>
          {filteredQueueEntries.map((queueEntry) => {
            const doctor = doctors[queueEntry.doctor_id];
            const prediction = predictions[queueEntry.queue_id];
            const statusStyle = getStatusStyle(queueEntry.status);

            return (
              <article key={queueEntry.queue_id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <p style={styles.smallLabel}>QUEUE NUMBER</p>
                    <h2 style={styles.queueNumber}>
                      #{queueEntry.queue_number}
                    </h2>
                  </div>

                  <span style={{ ...styles.status, ...statusStyle }}>
                    {queueEntry.status}
                  </span>
                </div>

                <div style={styles.doctorSection}>
                  <div style={styles.doctorAvatar}>
                    {doctor?.name?.charAt(0) || "D"}
                  </div>

                  <div>
                    <h3 style={styles.doctorName}>
                      {doctor?.name ||
                        `Doctor ${queueEntry.doctor_id}`}
                    </h3>
                    <p style={styles.specialization}>
                      {doctor?.specialization ||
                        "Specialization unavailable"}
                    </p>
                  </div>
                </div>

                <div style={styles.details}>
                  <p>
                    <strong>Queue ID:</strong> {queueEntry.queue_id}
                  </p>
                  <p>
                    <strong>Appointment ID:</strong>{" "}
                    {queueEntry.appointment_id}
                  </p>
                  <p>
                    <strong>Hospital:</strong>{" "}
                    {doctor?.hospital || "Not provided"}
                  </p>
                  <p>
                    <strong>Queue date:</strong>{" "}
                    {queueEntry.queue_date}
                  </p>
                  <p>
                    <strong>Check-in time:</strong>{" "}
                    {formatDateTime(queueEntry.check_in_time)}
                  </p>
                  <p>
                    <strong>Consultation start:</strong>{" "}
                    {formatDateTime(
                      queueEntry.consultation_start_time
                    )}
                  </p>
                  <p>
                    <strong>Consultation end:</strong>{" "}
                    {formatDateTime(queueEntry.consultation_end_time)}
                  </p>
                  <p>
                    <strong>Actual waiting:</strong>{" "}
                    {queueEntry.actual_waiting_minutes != null
                      ? `${queueEntry.actual_waiting_minutes} minutes`
                      : "Not available"}
                  </p>
                  <p>
                    <strong>Actual consultation:</strong>{" "}
                    {queueEntry.actual_consultation_minutes != null
                      ? `${queueEntry.actual_consultation_minutes} minutes`
                      : "Not available"}
                  </p>
                </div>

                {queueEntry.status === "Waiting" && (
                  <button
                    type="button"
                    style={styles.checkInButton}
                    onClick={() => checkIn(queueEntry.queue_id)}
                  >
                    Check In
                  </button>
                )}

                {shouldShowPrediction(queueEntry) && (
                  <section style={styles.predictionBox}>
                    <h3 style={styles.predictionTitle}>
                      AI Prediction
                    </h3>

                    {!prediction && (
                      <p>Prediction is not available.</p>
                    )}

                    {prediction && (
                      <>
                        <p>
                          <strong>Estimated waiting:</strong>{" "}
                          {prediction.estimated_waiting_minutes} minutes
                        </p>
                        <p>
                          <strong>Estimated consultation:</strong>{" "}
                          {
                            prediction.estimated_consultation_minutes
                          }{" "}
                          minutes
                        </p>
                        <p>
                          <strong>Estimated start:</strong>{" "}
                          {formatDateTime(
                            prediction.estimated_consultation_start
                          )}
                        </p>
                        <p>
                          <strong>Estimated end:</strong>{" "}
                          {formatDateTime(
                            prediction.estimated_consultation_end
                          )}
                        </p>
                      </>
                    )}
                  </section>
                )}

                {queueEntry.status === "Completed" && (
                  <p style={styles.completedMessage}>
                    This consultation is completed.
                  </p>
                )}

                {queueEntry.status === "Cancelled" && (
                  <p style={styles.cancelledMessage}>
                    This queue entry was cancelled.
                  </p>
                )}
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
  filters: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "24px",
  },
  filterButton: {
    padding: "10px 16px",
    border: "1px solid #ccd5df",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#172033",
    fontWeight: 700,
    cursor: "pointer",
  },
  activeFilterButton: {
    borderColor: "#087f5b",
    background: "#087f5b",
    color: "#ffffff",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "22px",
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
  },
  smallLabel: {
    margin: 0,
    color: "#687386",
    fontSize: "13px",
    fontWeight: 700,
  },
  queueNumber: {
    margin: "6px 0 0",
    fontSize: "42px",
    color: "#087f5b",
  },
  status: {
    padding: "7px 12px",
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
  details: { marginTop: "22px", lineHeight: 1.6 },
  predictionBox: {
    marginTop: "22px",
    padding: "18px",
    borderRadius: "12px",
    background: "#eefaf6",
  },
  predictionTitle: { marginTop: 0, color: "#087f5b" },
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
    fontWeight: 600,
    cursor: "pointer",
  },
  checkInButton: {
    width: "100%",
    marginTop: "16px",
    padding: "12px",
    border: "none",
    borderRadius: "9px",
    background: "#1864ab",
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
  completedMessage: {
    marginTop: "18px",
    padding: "12px",
    borderRadius: "8px",
    background: "#e6fcf5",
    color: "#087f5b",
    fontWeight: 700,
  },
  cancelledMessage: {
    marginTop: "18px",
    padding: "12px",
    borderRadius: "8px",
    background: "#ffe3e3",
    color: "#c92a2a",
    fontWeight: 700,
  },
  emptyCard: {
    padding: "30px",
    textAlign: "center",
    borderRadius: "16px",
    background: "#ffffff",
  },
};
