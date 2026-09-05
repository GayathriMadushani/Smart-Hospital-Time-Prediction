import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Home.css";


const services = [
  {
    icon: "📅",
    title: "Online Appointments",
    description:
      "Search doctors, check availability, and reserve your appointment online.",
  },
  {
    icon: "⏱️",
    title: "Live Queue Tracking",
    description:
      "Monitor your queue number and consultation progress from anywhere.",
  },
  {
    icon: "🤖",
    title: "AI Time Prediction",
    description:
      "Receive estimated waiting and consultation times using machine learning.",
  },
  {
    icon: "🩺",
    title: "Doctor Management",
    description:
      "View specialists, hospitals, consultation fees, and available schedules.",
  },
];

const departments = [
  {
    icon: "❤️",
    title: "Cardiology",
    description:
      "Advanced heart care and specialist cardiac consultations.",
  },
  {
    icon: "🧪",
    title: "Laboratory",
    description:
      "Reliable laboratory testing and diagnostic services.",
  },
  {
    icon: "🦷",
    title: "Dental Care",
    description:
      "Preventive and specialist dental healthcare services.",
  },
  {
    icon: "💊",
    title: "Pharmacy",
    description:
      "Convenient access to prescribed medicine and support.",
  },
];

const workflow = [
  {
    number: "01",
    title: "Create an account",
    description:
      "Register securely using your personal and contact information.",
  },
  {
    number: "02",
    title: "Select a doctor",
    description:
      "Search by specialization, hospital, schedule, or consultation fee.",
  },
  {
    number: "03",
    title: "Book an appointment",
    description:
      "Choose an available date and consultation time.",
  },
  {
    number: "04",
    title: "Track your queue",
    description:
      "Check in and receive AI-powered waiting-time predictions.",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function goToSection(sectionId) {
    setMenuOpen(false);

    document
      .getElementById(sectionId)
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }

  return (
    <div className="home-page">
      <header className="home-navbar">
        <button
          type="button"
          className="home-brand"
          onClick={() => goToSection("home")}
        >
          <span className="home-logo">+</span>

          <span className="home-brand-text">
            <strong>Smart Hospital</strong>
            <small>Booking and Queue Prediction</small>
          </span>
        </button>

        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <nav
          className={
            menuOpen
              ? "home-navigation home-navigation-open"
              : "home-navigation"
          }
        >
          <button
            type="button"
            onClick={() => goToSection("home")}
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => goToSection("services")}
          >
            Services
          </button>

          <button
            type="button"
            onClick={() => goToSection("workflow")}
          >
            How It Works
          </button>

          <button
            type="button"
            onClick={() => goToSection("facilities")}
          >
            Facilities
          </button>

          <button
            type="button"
            onClick={() => goToSection("contact")}
          >
            Contact
          </button>

          <button
            type="button"
            className="patient-login-button"
            onClick={() => navigate("/patient-login")}
          >
            Patient Login
          </button>

          <button
            type="button"
            className="admin-login-button"
            onClick={() => navigate("/admin-login")}
          >
            Admin Login
          </button>
        </nav>
      </header>

      <main>
        <section id="home" className="hero-section">
          <div className="hero-orb hero-orb-one" />
          <div className="hero-orb hero-orb-two" />
          <div className="hero-grid-pattern" />

          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              SMART DIGITAL HEALTHCARE
            </div>

            <h1>
              Easier hospital
              <span className="hero-title-dark">
                {" "}
                appointments.
              </span>

              <span className="hero-title-green">
                Smarter queue predictions.
              </span>
            </h1>

            <p className="hero-description">
              Book consultations, track your queue position,
              check in online, and receive AI-powered waiting
              and consultation-time estimates.
            </p>

            <div className="hero-actions">
              <button
                type="button"
                className="hero-primary-button"
                onClick={() => navigate("/patient-login")}
              >
                Book Appointment
                <span>→</span>
              </button>

              <button
                type="button"
                className="hero-secondary-button"
                onClick={() => goToSection("services")}
              >
                Explore Services
              </button>
            </div>

            <div className="hero-trust-row">
              <div className="trust-avatars">
                <span>P</span>
                <span>D</span>
                <span>S</span>
              </div>

              <div>
                <strong>One connected system</strong>
                <p>Patients, doctors and hospital staff</p>
              </div>
            </div>
          </div>

          <div className="hero-preview-area">
            <div className="preview-floating-card preview-small-card">
              <span className="small-card-icon">✓</span>

              <div>
                <strong>Appointment confirmed</strong>
                <p>Cardiology · 10:00 AM</p>
              </div>
            </div>

            <div className="dashboard-preview">
              <div className="preview-browser-bar">
                <div>
                  <span />
                  <span />
                  <span />
                </div>

                <small>Smart Hospital Queue</small>
              </div>

              <div className="preview-content">
                <div className="preview-heading">
                  <div>
                    <p>CURRENT QUEUE</p>
                    <h2>#04</h2>
                  </div>

                  <span className="waiting-status">
                    Waiting
                  </span>
                </div>

                <div className="preview-doctor">
                  <span className="doctor-avatar">D</span>

                  <div>
                    <strong>Dr. Nimal Perera</strong>
                    <p>Cardiology · Smart Hospital</p>
                  </div>
                </div>

                <div className="preview-progress">
                  <div className="progress-label">
                    <span>Queue progress</span>
                    <strong>65%</strong>
                  </div>

                  <div className="progress-track">
                    <div className="progress-value" />
                  </div>
                </div>

                <div className="ai-preview-card">
                  <div>
                    <span className="ai-label">
                      AI PREDICTION
                    </span>

                    <strong>18 minutes</strong>

                    <p>Estimated waiting time</p>
                  </div>

                  <span className="ai-icon">✦</span>
                </div>

                <div className="preview-time-grid">
                  <div>
                    <span>Estimated start</span>
                    <strong>10:18 AM</strong>
                  </div>

                  <div>
                    <span>Consultation</span>
                    <strong>15 minutes</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="preview-floating-card prediction-floating-card">
              <span className="prediction-mini-icon">AI</span>

              <div>
                <strong>Prediction updated</strong>
                <p>Based on live queue data</p>
              </div>
            </div>
          </div>
        </section>

        <section className="statistics-section">
          <article>
            <strong>24/7</strong>
            <span>Online booking access</span>
          </article>

          <article>
            <strong>AI</strong>
            <span>Waiting-time predictions</span>
          </article>

          <article>
            <strong>Live</strong>
            <span>Queue status tracking</span>
          </article>

          <article>
            <strong>Secure</strong>
            <span>Patient authentication</span>
          </article>
        </section>

        <section id="services" className="content-section">
          <div className="section-heading">
            <span>OUR SMART SERVICES</span>

            <h2>
              Everything you need for a better hospital
              experience
            </h2>

            <p>
              The platform connects appointment management,
              hospital queues, patient services and artificial
              intelligence.
            </p>
          </div>

          <div className="services-grid">
            {services.map((service, index) => (
              <article
                className="service-card"
                key={service.title}
              >
                <div className="service-number">
                  0{index + 1}
                </div>

                <div className="service-icon">
                  {service.icon}
                </div>

                <h3>{service.title}</h3>
                <p>{service.description}</p>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/patient-login")
                  }
                >
                  Learn more →
                </button>
              </article>
            ))}
          </div>
        </section>

        <section
          id="workflow"
          className="workflow-section"
        >
          <div className="workflow-heading">
            <span>HOW IT WORKS</span>

            <h2>
              From booking to consultation in four simple
              steps
            </h2>

            <p>
              A simple digital journey designed to reduce
              waiting and improve the patient experience.
            </p>
          </div>

          <div className="workflow-grid">
            {workflow.map((step, index) => (
              <article
                className="workflow-card"
                key={step.number}
              >
                <div className="workflow-number">
                  {step.number}
                </div>

                {index < workflow.length - 1 && (
                  <span className="workflow-line" />
                )}

                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="facilities"
          className="facilities-section"
        >
          <div className="section-heading">
            <span>DEPARTMENTS AND FACILITIES</span>

            <h2>Specialist care for every patient</h2>

            <p>
              Explore essential hospital departments and
              modern healthcare facilities.
            </p>
          </div>

          <div className="departments-grid">
            {departments.map((department) => (
              <article
                className="department-card"
                key={department.title}
              >
                <div className="department-icon">
                  {department.icon}
                </div>

                <div>
                  <h3>{department.title}</h3>
                  <p>{department.description}</p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/patient-login")
                    }
                  >
                    Find doctors
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="ai-feature-section">
          <div className="ai-feature-content">
            <span className="ai-feature-label">
              REAL-TIME QUEUE UPDATES
            </span>

            <h2>
              Know your estimated waiting time before your
              consultation
            </h2>

            <p>
             Our smart queue system helps you track your expected waiting time and consultation schedule, giving you a smoother and more convenient hospital experience.
            </p>

            <div className="ai-points">
              <div>
                <span>✓</span>
                Know how long you may need to wait
              </div>

              <div>
                <span>✓</span>
                 See your expected consultation time
              </div>

              <div>
                <span>✓</span>
                Receive live queue updates
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/patient-login")}
            >
              Book Your Consultation
            </button>
          </div>

          <div className="ai-visual">
            <div className="ai-circle ai-circle-one" />
            <div className="ai-circle ai-circle-two" />

            <div className="ai-main-card">
              <span className="ai-symbol">✦</span>

              <p>PREDICTED WAITING TIME</p>
              <h3>18.2 min</h3>

              <div className="ai-chart">
                <span style={{ height: "35%" }} />
                <span style={{ height: "52%" }} />
                <span style={{ height: "44%" }} />
                <span style={{ height: "70%" }} />
                <span style={{ height: "58%" }} />
                <span style={{ height: "86%" }} />
                <span style={{ height: "65%" }} />
              </div>

              <small>Prediction accuracy improves with data</small>
            </div>
          </div>
        </section>

        <section id="contact" className="contact-section">
          <div className="contact-heading">
            <span>CONTACT US</span>

            <h2>We are ready to help</h2>

            <p>
              Contact the hospital for appointments,
              healthcare information or technical support.
            </p>
          </div>

          <div className="contact-grid">
            <article>
              <span>📍</span>
              <h3>Hospital Address</h3>
              <p>
                Smart Hospital
                <br />
                Main Hospital Road
                <br />
                Sri Lanka
              </p>
            </article>

            <article>
              <span>☎️</span>
              <h3>Call Us</h3>
              <p>
                +94 11 234 5678
                <br />
                +94 77 123 4567
              </p>
            </article>

            <article>
              <span>✉️</span>
              <h3>Email</h3>
              <p>
                info@smarthospital.lk
                <br />
                support@smarthospital.lk
              </p>
            </article>

            <article>
              <span>🕒</span>
              <h3>Opening Hours</h3>
              <p>
                Monday–Friday: 8 AM–8 PM
                <br />
                Weekends: 8 AM–4 PM
              </p>
            </article>
          </div>
        </section>

        <section className="final-cta">
          <div>
            <span>GET STARTED TODAY</span>

            <h2>
              Your smarter hospital journey starts here
            </h2>

            <p>
              Create your patient account and book your next
              consultation online.
            </p>
          </div>

          <div className="final-cta-actions">
            <button
              type="button"
              onClick={() => navigate("/register")}
            >
              Create Patient Account
            </button>

            <button
              type="button"
              onClick={() => navigate("/patient-login")}
            >
              Patient Login
            </button>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="footer-brand">
          <span className="footer-logo">+</span>

          <div>
            <strong>Smart Hospital</strong>
            <p>Booking and Queue Prediction System</p>
          </div>
        </div>

        <div className="footer-links">
          <button
            type="button"
            onClick={() => goToSection("services")}
          >
            Services
          </button>

          <button
            type="button"
            onClick={() => goToSection("facilities")}
          >
            Facilities
          </button>

          <button
            type="button"
            onClick={() => goToSection("contact")}
          >
            Contact
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin-login")}
          >
            Staff Portal
          </button>
        </div>

        <p className="footer-copyright">
          © 2026 Smart Hospital. All rights reserved.
        </p>
      </footer>
    </div>
  );
}