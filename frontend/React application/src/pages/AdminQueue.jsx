
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import adminApi from "../api/adminApi";
import "./AdminQueue.css";
import Swal from "sweetalert2";
import "./AdminQueue.css";
import "./AdminManagementTheme.css";

export default function AdminQueue() {
  const navigate = useNavigate();

  const [queues, setQueues] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadQueues() {
    setLoading(true);
    setError("");

    try {
      const response = await adminApi.get("/queue");
      setQueues(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Unable to load queue records."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueues();
  }, []);

  async function updateQueue(queueId, action) {
    const actionLabels = {
      start: "Start consultation",
      complete: "Complete consultation",
    };

    const result = await Swal.fire({
  title:
    action === "start"
      ? "Start Consultation?"
      : "Complete Consultation?",

  text: `${actionLabels[action]} for queue #${queueId}?`,

  icon: action === "start" ? "question" : "warning",

  showCancelButton: true,

  confirmButtonText:
    action === "start" ? "Yes, Start" : "Yes, Complete",

  cancelButtonText: "Cancel",

  confirmButtonColor: "#00875a",
  cancelButtonColor: "#d33",

  reverseButtons: true,
});

if (!result.isConfirmed) {
  return;
}

    setBusyId(queueId);
    setError("");
    setMessage("");

    try {
      await adminApi.patch(`/queue/${queueId}/${action}`);
      await Swal.fire({
  title:
    action === "start"
      ? "Consultation Started!"
      : "Consultation Completed!",

  text: `Queue #${queueId} updated successfully.`,

  icon: "success",
  confirmButtonColor: "#00875a",
  confirmButtonText: "OK",
});
      await loadQueues();
    } catch (err) {
      setError(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Unable to update queue."
      );
    } finally {
      setBusyId(null);
    }
  }

  const filteredQueues = useMemo(() => {
    const query = search.trim().toLowerCase();

    return queues.filter((queue) => {
      const matchesSearch = [
        queue.queue_id,
        queue.appointment_id,
        queue.doctor_id,
        queue.queue_number,
        queue.queue_date,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );

      const matchesStatus =
        statusFilter === "All" ||
        queue.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [queues, search, statusFilter]);

  const today = new Date().toLocaleDateString("en-CA");

  return (
    <main className="admin-queue-page">
      <header className="admin-queue-header">
        <div>
          <span className="admin-queue-eyebrow">
            QUEUE MANAGEMENT
          </span>
          <h1>Manage Queue</h1>
          <p>
            Monitor arrivals, consultations, and waiting times.
          </p>
        </div>

        <button
          type="button"
          className="admin-queue-back"
          onClick={() => navigate("/admin/dashboard")}
        >
          Back to Dashboard
        </button>
      </header>

      <section className="admin-queue-stats">
        {[
          ["Total Queue Records", queues.length],
          ["Waiting", queues.filter((q) => q.status === "Waiting").length],
          ["Checked In", queues.filter((q) => q.status === "Checked In").length],
          ["In Consultation", queues.filter((q) => q.status === "In Consultation").length],
          ["Completed", queues.filter((q) => q.status === "Completed").length],
        ].map(([label, count]) => (
          <div className="admin-queue-stat" key={label}>
            <span>{label}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </section>

      <section className="admin-queue-card">
        <div className="admin-queue-toolbar">
          <div>
            <h2>Queue Records</h2>
            <p>
              Showing {filteredQueues.length} of {queues.length} entries
            </p>
          </div>

          <div className="admin-queue-actions">
            <input
              type="search"
              placeholder="Search queue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Waiting">Waiting</option>
              <option value="Checked In">Checked In</option>
              <option value="In Consultation">In Consultation</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <button type="button" onClick={loadQueues} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>

        {error && <div className="admin-queue-error">{error}</div>}
        {message && <div className="admin-queue-success">{message}</div>}

        {loading ? (
          <p className="admin-queue-message">Loading queue...</p>
        ) : filteredQueues.length === 0 ? (
          <p className="admin-queue-message">No matching queue entries.</p>
        ) : (
          <div className="admin-queue-table-wrapper">
            <table className="admin-queue-table">
              <thead>
                <tr>
                  <th>Queue ID</th>
                  <th>Appointment</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Number</th>
                  <th>Status</th>
                  <th>Check In</th>
                  <th>Started</th>
                  <th>Completed At</th>
                  <th>Wait (min)</th>
                  <th>Consultation (min)</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredQueues.map((queue) => {
                  const isToday = queue.queue_date === today;
                  const canStart =
                    queue.status === "Checked In" && isToday;
                  const canComplete =
                    queue.status === "In Consultation";

                  return (
                    <tr key={queue.queue_id}>
                      <td>#{queue.queue_id}</td>
                      <td>#{queue.appointment_id}</td>
                      <td>#{queue.doctor_id}</td>
                      <td>{queue.queue_date}</td>
                      <td>#{queue.queue_number}</td>
                      <td>
                        <span className="admin-queue-status">
                          {queue.status}
                        </span>
                      </td>
                      <td>{queue.check_in_time || "—"}</td>
                      <td>{queue.consultation_start_time || "—"}</td>
                      <td>{queue.consultation_end_time || "—"}</td>
                      <td>{queue.actual_waiting_minutes ?? "—"}</td>
                      <td>{queue.actual_consultation_minutes ?? "—"}</td>
                      <td>
                        <div className="admin-queue-row-actions">
                          {canStart && (
                            <button
                              type="button"
                              disabled={busyId !== null}
                              onClick={() => updateQueue(queue.queue_id, "start")}
                            >
                              Start
                            </button>
                          )}

                          {canComplete && (
                            <button
                              type="button"
                              disabled={busyId !== null}
                              onClick={() => updateQueue(queue.queue_id, "complete")}
                            >
                              Complete
                            </button>
                          )}

                          {!canStart && !canComplete && "—"}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
