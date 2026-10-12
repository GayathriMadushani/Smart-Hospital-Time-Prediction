
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import adminApi from "../api/adminApi";
import "./AdminDashboard.css";

// =====================================================
// Initial dashboard statistics
// =====================================================

const initialStatistics = {
  total_patients: 0,
  total_doctors: 0,
  appointments_today: 0,
  active_queue: 0,
};

// =====================================================
// Navigation links
// =====================================================

const navigationItems = [
  {
    label: "Dashboard",
    icon: "▦",
    path: "/admin/dashboard",
  },
  {
    label: "Doctors",
    icon: "✚",
    path: "/admin/doctors",
  },
  {
    label: "Patients",
    icon: "♙",
    path: "/admin/patients",
  },
  {
    label: "Appointments",
    icon: "▣",
    path: "/admin/appointments",
  },
  {
    label: "Queue Management",
    icon: "#",
    path: "/admin/queue",
  },
  {
    label: "AI Analytics",
    icon: "◈",
    path: "/admin/analytics",
  },
];

// =====================================================
// Dashboard quick actions
// =====================================================

const quickActions = [
  {
    title: "Manage Doctors",
    description: "Add, edit, and update doctor availability",
    icon: "✚",
    path: "/admin/doctors",
  },
  {
    title: "Manage Patients",
    description: "View registered patient information",
    icon: "♙",
    path: "/admin/patients",
  },
  {
    title: "Manage Appointments",
    description: "Review scheduled and completed bookings",
    icon: "▣",
    path: "/admin/appointments",
  },
  {
    title: "Manage Queue",
    description: "Check in patients and update consultations",
    icon: "#",
    path: "/admin/queue",
  },
  {
    title: "AI Prediction Analytics",
    description:
      "View waiting time and consultation time prediction model performance",
    icon: "◈",
    path: "/admin/analytics",
  },
];

// =====================================================
// Error message helper
// =====================================================

function getApiError(error, fallbackMessage) {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item.msg || "Validation error")
      .join(", ");
  }

  if (typeof detail === "string") {
    return detail;
  }

  return fallbackMessage;
}

// =====================================================
// Main Admin Dashboard
// =====================================================

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);

  const [statistics, setStatistics] = useState(
    initialStatistics
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ===================================================
  // Load dashboard data
  // ===================================================

  const loadAdminDashboard = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
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
          const data = statisticsResult.value.data;

          setStatistics({
            total_patients: data.total_patients ?? 0,
            total_doctors: data.total_doctors ?? 0,
            appointments_today:
              data.appointments_today ?? 0,
            active_queue: data.active_queue ?? 0,
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
              `Could not load ${failedSections.join(
                " and "
              )}.`
            )
          );
        }
      } catch (err) {
        setError(
          getApiError(
            err,
            "Unable to load dashboard information."
          )
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadAdminDashboard();
  }, [loadAdminDashboard]);

  // ===================================================
  // Logout
  // ===================================================

  function logout() {
    localStorage.removeItem("admin_access_token");

    navigate("/admin-login", {
      replace: true,
    });
  }

  // ===================================================
  // Administrator information
  // ===================================================

  const adminName = admin?.name || "Administrator";

  const adminInitial =
    adminName.trim().charAt(0).toUpperCase() || "A";

  // ===================================================
  // Statistics cards
  // ===================================================

  const statisticCards = [
    {
      title: "Total Patients",
      value: statistics.total_patients,
      description: "Registered accounts",
      icon: "♙",
      colorClass: "admin-stat-blue",
    },
    {
      title: "Total Doctors",
      value: statistics.total_doctors,
      description: "Hospital specialists",
      icon: "✚",
      colorClass: "admin-stat-green",
    },
    {
      title: "Appointments Today",
      value: statistics.appointments_today,
      description: "Scheduled consultations",
      icon: "▣",
      colorClass: "admin-stat-cyan",
    },
    {
      title: "Active Queue",
      value: statistics.active_queue,
      description: "Patients currently waiting",
      icon: "#",
      colorClass: "admin-stat-navy",
    },
  ];

  // ===================================================
  // Loading screen
  // ===================================================

  if (loading) {
    return (
      <main className="admin-dashboard-loading">
        <div
          className="admin-dashboard-spinner"
          role="status"
          aria-label="Loading dashboard"
        />

        <p>Loading administration portal...</p>
      </main>
    );
  }

  // ===================================================
  // Dashboard interface
  // ===================================================

  return (
    <main className="admin-dashboard-page">
      {/* ===============================================
          SIDEBAR
          =============================================== */}

      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div
            className="admin-sidebar-logo"
            aria-hidden="true"
          >
            +
          </div>

          <div>
            <h1>Smart Hospital</h1>
            <p>Administration Portal</p>
          </div>
        </div>

        {/* Navigation */}

        <nav
          className="admin-sidebar-navigation"
          aria-label="Admin navigation"
        >
          {navigationItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className={
                item.path === "/admin/dashboard"
                  ? "admin-nav-active"
                  : ""
              }
              onClick={() => navigate(item.path)}
              aria-current={
                item.path === "/admin/dashboard"
                  ? "page"
                  : undefined
              }
            >
              <span aria-hidden="true">
                {item.icon}
              </span>

              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}

        <button
          type="button"
          className="admin-sidebar-logout"
          onClick={logout}
        >
          Logout
        </button>
      </aside>

      {/* ===============================================
          MAIN DASHBOARD CONTENT
          =============================================== */}

      <section className="admin-dashboard-content">
        {/* =============================================
            WELCOME HEADER
            ============================================= */}

        <header className="admin-dashboard-header">
          <div>
            <span>ADMIN DASHBOARD</span>

            <h2>Welcome back, {adminName}</h2>

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
              {refreshing
                ? "Refreshing..."
                : "Refresh Data"}
            </button>

            <article className="admin-profile-summary">
              <div aria-hidden="true">
                {adminInitial}
              </div>

              <section>
                <strong>{adminName}</strong>

                <span>
                  {admin?.role || "Admin"}
                </span>
              </section>
            </article>
          </div>
        </header>

        {/* =============================================
            ERROR MESSAGE
            ============================================= */}

        {error && (
          <section
            className="admin-dashboard-error"
            role="alert"
          >
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
              Try Again
            </button>
          </section>
        )}

        {/* =============================================
            STATISTICS CARDS
            ============================================= */}

        <section
          className="admin-statistics-grid"
          aria-label="Hospital statistics"
        >
          {statisticCards.map((card) => (
            <article key={card.title}>
              <div
                className={`admin-stat-icon ${card.colorClass}`}
                aria-hidden="true"
              >
                {card.icon}
              </div>

              <section>
                <span>{card.title}</span>

                <strong>{card.value}</strong>

                <small>{card.description}</small>
              </section>
            </article>
          ))}
        </section>

        {/* =============================================
            QUICK ACTIONS AND ADMIN PROFILE
            ============================================= */}

        <section className="admin-dashboard-grid">
          {/* QUICK ACTIONS */}

          <article className="admin-quick-actions">
            <div className="admin-section-heading">
              <h3>Quick Actions</h3>

              <p>
                Access common administration tasks
              </p>
            </div>

            <div className="admin-action-list">
              {quickActions.map((action) => (
                <button
                  key={action.path}
                  type="button"
                  onClick={() =>
                    navigate(action.path)
                  }
                >
                  <span aria-hidden="true">
                    {action.icon}
                  </span>

                  <section>
                    <strong>
                      {action.title}
                    </strong>

                    <small>
                      {action.description}
                    </small>
                  </section>

                  <b aria-hidden="true">→</b>
                </button>
              ))}
            </div>
          </article>

          {/* ADMINISTRATOR PROFILE */}

          <article className="admin-profile-card">
            <div className="admin-section-heading">
              <h3>Administrator Profile</h3>

              <p>Current authorized account</p>
            </div>

            <div className="admin-profile-details">
              <div>
                <span>Administrator ID</span>

                <strong>
                  {admin?.admin_id != null
                    ? `#${admin.admin_id}`
                    : "—"}
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

                <strong
                  className={
                    admin?.is_active === false
                      ? ""
                      : "admin-active-status"
                  }
                >
                  {admin?.is_active === false
                    ? "Disabled"
                    : admin?.is_active === true
                    ? "Active"
                    : "Not available"}
                </strong>
              </div>
            </div>
          </article>
        </section>

        {/* =============================================
            HOSPITAL OVERVIEW BANNER
            ============================================= */}

        <section className="admin-dashboard-summary-banner">
          <div aria-hidden="true">
            <span>✓</span>
          </div>

          <section>
            <h3>Hospital Operations Overview</h3>

            <p>
              The statistics above are loaded directly
              from the Smart Hospital database.
            </p>
          </section>

          <button
            type="button"
            onClick={() => loadAdminDashboard(true)}
            disabled={refreshing}
          >
            {refreshing
              ? "Updating..."
              : "Update Overview"}
          </button>
        </section>
      </section>
    </main>
  );
}
