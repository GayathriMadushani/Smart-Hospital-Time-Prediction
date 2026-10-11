import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import adminApi from "../api/adminApi";
import "./AdminDashboard.css";

const initialStatistics = {
  total_patients: 0,
  total_doctors: 0,
  appointments_today: 0,
  active_queue: 0,
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [statistics, setStatistics] =
    useState(initialStatistics);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAdminDashboard();
  }, []);

  function getApiError(error, fallbackMessage) {
    const detail = error.response?.data?.detail;

    if (Array.isArray(detail)) {
      return detail
        .map((item) => item.msg || "Validation error")
        .join(", ");
    }

    return detail || fallbackMessage;
  }

  async function loadAdminDashboard(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    const results = await Promise.allSettled([
      adminApi.get("/admin/auth/me"),
      adminApi.get("/admin/dashboard/statistics"),
    ]);

    const [profileResult, statisticsResult] = results;
    const failedSections = [];

    if (profileResult.status === "fulfilled") {
      setAdmin(profileResult.value.data);
    } else {
      failedSections.push("administrator profile");
    }

    if (statisticsResult.status === "fulfilled") {
      setStatistics({
        total_patients:
          statisticsResult.value.data.total_patients ?? 0,
        total_doctors:
          statisticsResult.value.data.total_doctors ?? 0,
        appointments_today:
          statisticsResult.value.data.appointments_today ?? 0,
        active_queue:
          statisticsResult.value.data.active_queue ?? 0,
      });
    } else {
      failedSections.push("dashboard statistics");
    }

    if (failedSections.length > 0) {
      const firstRejectedResult = results.find(
        (result) => result.status === "rejected"
      );

      setError(
        getApiError(
          firstRejectedResult?.reason,
          `Could not load ${failedSections.join(" and ")}.`
        )
      );
    }

    setLoading(false);
    setRefreshing(false);
  }

  function logout() {
    localStorage.removeItem("admin_access_token");

    navigate("/admin-login", {
      replace: true,
    });
  }

  function getAdminInitial() {
    return (
      admin?.name?.trim()?.charAt(0)?.toUpperCase() || "A"
    );
  }

  if (loading) {
    return (
      <main className="admin-dashboard-loading">
        <div className="admin-dashboard-spinner" />

        <p>Loading administration portal...</p>
      </main>
    );
  }

  return (
    <main className="admin-dashboard-page">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-logo">+</div>

          <div>
            <h1>Smart Hospital</h1>
            <p>Administration Portal</p>
          </div>
        </div>

        <nav className="admin-sidebar-navigation">
          <button
            type="button"
            className="admin-nav-active"
            onClick={() => navigate("/admin/dashboard")}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/doctors")}
          >
            <span>✚</span>
            Doctors
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/patients")}
          >
            <span>♙</span>
            Patients
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/admin/appointments")
            }
          >
            <span>▣</span>
            Appointments
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/queue")}
          >
            <span>#</span>
            Queue Management
          </button>
          <button
  type="button"
  onClick={() => navigate("/admin/analytics")}
>
  <span>◈</span>
  AI Analytics
</button>
        </nav>

        <button
          type="button"
          className="admin-sidebar-logout"
          onClick={logout}
        >
          Logout
        </button>
      </aside>

      <section className="admin-dashboard-content">
        <header className="admin-dashboard-header">
          <div>
            <span>ADMIN DASHBOARD</span>

            <h2>
              Welcome back,{" "}
              {admin?.name || "Administrator"}
            </h2>

            <p>
              Monitor hospital activity and manage daily
              operations.
            </p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-refresh-button"
              onClick={() => loadAdminDashboard(true)}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>

            <article className="admin-profile-summary">
              <div>{getAdminInitial()}</div>

              <section>
                <strong>
                  {admin?.name || "Administrator"}
                </strong>

                <span>{admin?.role || "Admin"}</span>
              </section>
            </article>
          </div>
        </header>

        {error && (
          <section className="admin-dashboard-error">
            <div>
              <strong>
                Unable to load some information
              </strong>

              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={() => loadAdminDashboard(true)}
              disabled={refreshing}
            >
              Try again
            </button>
          </section>
        )}

        <section className="admin-statistics-grid">
          <article>
            <div className="admin-stat-icon admin-stat-blue">
              ♙
            </div>

            <section>
              <span>Total Patients</span>

              <strong>
                {statistics.total_patients}
              </strong>

              <small>Registered accounts</small>
            </section>
          </article>

          <article>
            <div className="admin-stat-icon admin-stat-green">
              ✚
            </div>

            <section>
              <span>Total Doctors</span>

              <strong>
                {statistics.total_doctors}
              </strong>

              <small>Hospital specialists</small>
            </section>
          </article>

          <article>
            <div className="admin-stat-icon admin-stat-cyan">
              ▣
            </div>

            <section>
              <span>Appointments Today</span>

              <strong>
                {statistics.appointments_today}
              </strong>

              <small>Scheduled consultations</small>
            </section>
          </article>

          <article>
            <div className="admin-stat-icon admin-stat-navy">
              #
            </div>

            <section>
              <span>Active Queue</span>

              <strong>
                {statistics.active_queue}
              </strong>

              <small>Patients currently waiting</small>
            </section>
          </article>
        </section>

        <section className="admin-dashboard-grid">
          <article className="admin-quick-actions">
            <div className="admin-section-heading">
              <h3>Quick Actions</h3>

              <p>Access common administration tasks</p>
            </div>

            <div className="admin-action-list">
              <button
                type="button"
                onClick={() =>
                  navigate("/admin/doctors")
                }
              >
                <span>✚</span>

                <section>
                  <strong>Manage Doctors</strong>

                  <small>
                    Add, edit, and update doctor availability
                  </small>
                </section>

                <b>→</b>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/patients")
                }
              >
                <span>♙</span>

                <section>
                  <strong>Manage Patients</strong>

                  <small>
                    View registered patient information
                  </small>
                </section>

                <b>→</b>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/appointments")
                }
              >
                <span>▣</span>

                <section>
                  <strong>Manage Appointments</strong>

                  <small>
                    Review scheduled and completed bookings
                  </small>
                </section>

                <b>→</b>
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/queue")}
              >
                <span>#</span>

                <section>
                  <strong>Manage Queue</strong>

                  <small>
                    Check in patients and update consultations
                  </small>
                </section>

                                             <b>→</b>
              </button>

              {/* AI Analytics Quick Action */}
              <button
                type="button"
                onClick={() => navigate("/admin/analytics")}
              >
                <span>◈</span>

                <section>
                  <strong>AI Prediction Analytics</strong>

                  <small>
                    View waiting time and consultation time
                    prediction model performance
                  </small>
                </section>

                <b>→</b>
                     <b>→</b>
      </button>
    </div>
  </article>

          <article className="admin-profile-card">
            <div className="admin-section-heading">
              <h3>Administrator Profile</h3>

              <p>Current authorized account</p>
            </div>

            <div className="admin-profile-details">
              <div>
                <span>Administrator ID</span>

                <strong>
                  #{admin?.admin_id || "—"}
                </strong>
              </div>

              <div>
                <span>Name</span>

                <strong>
                  {admin?.name || "Not available"}
                </strong>
              </div>

              <div>
                <span>Email</span>

                <strong>
                  {admin?.email || "Not available"}
                </strong>
              </div>

              <div>
                <span>Role</span>

                <strong>
                  {admin?.role || "Not available"}
                </strong>
              </div>

              <div>
                <span>Status</span>

                <strong className="admin-active-status">
                  {admin?.is_active === false
                    ? "Disabled"
                    : "Active"}
                </strong>
              </div>
            </div>
          </article>
        </section>

        <section className="admin-dashboard-summary-banner">
          <div>
            <span>✓</span>
          </div>

          <section>
            <h3>Hospital operations overview</h3>

            <p>
              The statistics above are loaded directly from
              the Smart Hospital database.
            </p>
          </section>

          <button
            type="button"
            onClick={() => loadAdminDashboard(true)}
            disabled={refreshing}
          >
            {refreshing ? "Updating..." : "Update Overview"}
          </button>
        </section>
      </section>
    </main>
  );
}