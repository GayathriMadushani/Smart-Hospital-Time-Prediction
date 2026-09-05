import { NavLink, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("access_token");
    navigate("/");
  }

  function getLinkStyle({ isActive }) {
    return {
      ...styles.link,
      background: isActive ? "#e8fff3" : "transparent",
      color: isActive ? "#087f5b" : "#172033",
    };
  }

  return (
    <header style={styles.navbar}>
      <div
        style={styles.brand}
        onClick={() => navigate("/dashboard")}
      >
        <div style={styles.logo}>+</div>

        <div>
          <h2 style={styles.brandTitle}>Smart Hospital</h2>
          <p style={styles.brandSubtitle}>
            Booking and Queue Prediction
          </p>
        </div>
      </div>

      <nav style={styles.links}>
        <NavLink to="/dashboard" style={getLinkStyle}>
          Dashboard
        </NavLink>

        <NavLink to="/doctors" style={getLinkStyle}>
          Doctors
        </NavLink>

        <NavLink to="/appointments" style={getLinkStyle}>
          My Appointments
        </NavLink>

        <NavLink to="/queue" style={getLinkStyle}>
          My Queue
        </NavLink>

        <button style={styles.logoutButton} onClick={logout}>
          Logout
        </button>
      </nav>
    </header>
  );
}

const styles = {
  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    minHeight: "76px",
    padding: "14px 36px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    boxShadow: "0 4px 18px rgba(30, 65, 100, 0.06)",
    fontFamily: "Arial, sans-serif",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
  },
  logo: {
    width: "44px",
    height: "44px",
    display: "grid",
    placeItems: "center",
    borderRadius: "12px",
    background: "#087f5b",
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: 700,
  },
  brandTitle: {
    margin: 0,
    color: "#172033",
    fontSize: "20px",
  },
  brandSubtitle: {
    margin: "3px 0 0",
    color: "#687386",
    fontSize: "12px",
  },
  links: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
  },
  link: {
    padding: "10px 13px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: 700,
  },
  logoutButton: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "8px",
    background: "#c92a2a",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
};