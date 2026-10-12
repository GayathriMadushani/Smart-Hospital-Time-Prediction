
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import adminApi from "../api/adminApi";
import "./AdminPatients.css";
import "./AdminPatients.css";
import "./AdminManagementTheme.css";

export default function AdminPatients() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPatients() {
    setLoading(true);
    setError("");

    try {
      const response = await adminApi.get("/patients");
      setPatients(response.data);
    } catch (err) {
      setError(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Unable to load patients."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return patients.filter((patient) =>
      [
        patient.name,
        patient.email,
        patient.phone,
        String(patient.patient_id),
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [patients, search]);

  return (
    <main className="admin-patients-page">
      <header className="admin-patients-header">
        <div>
          <span className="admin-patients-eyebrow">
            PATIENT MANAGEMENT
          </span>

          <h1>Manage Patients</h1>

          <p>
            View and search registered hospital patients.
          </p>
        </div>

        <button
          type="button"
          className="admin-patients-back"
          onClick={() => navigate("/admin/dashboard")}
        >
          Back to Dashboard
        </button>
      </header>

      <section className="admin-patients-summary">
        <div className="admin-patients-summary-icon">
          ♙
        </div>

        <div>
          <p>Total Registered Patients</p>
          <strong>{patients.length}</strong>
        </div>
      </section>

      <section className="admin-patients-card">
        <div className="admin-patients-toolbar">
          <div>
            <h2>Registered Patients</h2>
            <p>
              {filteredPatients.length} of {patients.length} records
            </p>
          </div>

          <div className="admin-patients-actions">
            <input
              type="search"
              className="admin-patients-search"
              placeholder="Search patients..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <button
              type="button"
              className="admin-patients-refresh"
              onClick={loadPatients}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div className="admin-patients-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="admin-patients-message">
            Loading patients...
          </div>
        ) : !error && filteredPatients.length === 0 ? (
          <div className="admin-patients-message">
            No matching patients found.
          </div>
        ) : !error ? (
          <div className="admin-patients-table-wrapper">
            <table className="admin-patients-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Phone</th>
                  <th>Email</th>
                </tr>
              </thead>

              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.patient_id}>
                    <td className="admin-patients-id">
                      #{patient.patient_id}
                    </td>

                    <td className="admin-patients-name">
                      {patient.name}
                    </td>

                    <td>{patient.age}</td>
                    <td>{patient.gender}</td>
                    <td>{patient.phone}</td>

                    <td className="admin-patients-email">
                      {patient.email}
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
