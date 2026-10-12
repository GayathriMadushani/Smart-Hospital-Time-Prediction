
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import adminApi from "../api/adminApi";
import "./AdminDoctors.css";

const emptyForm = {
  name: "",
  specialization: "",
  qualification: "",
  experience_years: 0,
  hospital: "",
  available_days: "",
  available_start_time: "",
  available_end_time: "",
  consultation_fee: "",
  average_consultation_minutes: 15,
};

function Icon({ name, size = 20 }) {
  const paths = {
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </>
    ),
    arrow: <path d="m15 18-6-6 6-6" />,
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        <path d="M10 11v5M14 11v5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    building: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M9 21v-5h6v5M8 8h2M14 8h2M8 12h2M14 12h2" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 11a8 8 0 0 0-14-5L4 8" />
        <path d="M4 4v4h4M4 13a8 8 0 0 0 14 5l2-2" />
        <path d="M16 16h4v4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || "Validation error").join(", ");
  }
  return fallback;
}

export default function AdminDoctors() {
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDoctors();
  }, []);

  async function loadDoctors() {
    setLoading(true);
    setError("");

    try {
      const response = await adminApi.get("/doctors");
      setDoctors(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not load doctors."));
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingDoctorId(null);
  }

  function editDoctor(doctor) {
    setEditingDoctorId(doctor.doctor_id);

    setForm({
      name: doctor.name || "",
      specialization: doctor.specialization || "",
      qualification: doctor.qualification || "",
      experience_years: doctor.experience_years ?? 0,
      hospital: doctor.hospital || "",
      available_days: doctor.available_days || "",
      available_start_time: doctor.available_start_time || "",
      available_end_time: doctor.available_end_time || "",
      consultation_fee: doctor.consultation_fee ?? "",
      average_consultation_minutes:
        doctor.average_consultation_minutes ?? 15,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveDoctor(event) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      experience_years: Number(form.experience_years),
      consultation_fee: Number(form.consultation_fee || 0),
      average_consultation_minutes: Number(
        form.average_consultation_minutes
      ),
      qualification: form.qualification || null,
      hospital: form.hospital || null,
      available_days: form.available_days || null,
      available_start_time: form.available_start_time || null,
      available_end_time: form.available_end_time || null,
    };

    try {
      if (editingDoctorId !== null) {
        await adminApi.put(`/doctors/${editingDoctorId}`, payload);
      } else {
        await adminApi.post("/doctors", payload);
      }

      await Swal.fire({
        title: editingDoctorId !== null
          ? "Doctor updated!"
          : "Doctor added!",
        text: "Doctor information saved successfully.",
        icon: "success",
        confirmButtonColor: "#087f64",
      });

      resetForm();
      await loadDoctors();
    } catch (requestError) {
      await Swal.fire({
        title: "Could not save doctor",
        text: getErrorMessage(
          requestError,
          "Please check the entered information."
        ),
        icon: "error",
        confirmButtonColor: "#087f64",
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteDoctor(doctor) {
    const confirmation = await Swal.fire({
      title: "Delete doctor?",
      text: `${doctor.name} will be permanently removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc4545",
      cancelButtonText: "Keep doctor",
    });

    if (!confirmation.isConfirmed) return;

    try {
      await adminApi.delete(`/doctors/${doctor.doctor_id}`);

      await Swal.fire({
        title: "Doctor deleted",
        text: "The doctor was removed successfully.",
        icon: "success",
        confirmButtonColor: "#087f64",
      });

      await loadDoctors();
    } catch (requestError) {
      await Swal.fire({
        title: "Could not delete doctor",
        text: getErrorMessage(
          requestError,
          "The doctor may have linked appointments."
        ),
        icon: "error",
        confirmButtonColor: "#087f64",
      });
    }
  }

  const filteredDoctors = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return doctors;

    return doctors.filter((doctor) =>
      [
        doctor.name,
        doctor.specialization,
        doctor.hospital,
        doctor.qualification,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      )
    );
  }, [doctors, search]);

  const specialties = new Set(
    doctors
      .map((doctor) => doctor.specialization)
      .filter(Boolean)
  ).size;

  const availableSchedules = doctors.filter(
    (doctor) =>
      doctor.available_days &&
      doctor.available_start_time &&
      doctor.available_end_time
  ).length;

  return (
    <main className="premium-doctors-page">
      {/* HERO HEADER */}

      <header className="premium-doctors-hero">
        <div className="premium-hero-top">
          <div className="premium-hero-brand">
            <span className="premium-brand-icon">✚</span>
            <span>SMART HOSPITAL / ADMINISTRATION</span>
          </div>

          <button
            type="button"
            className="premium-back-button"
            onClick={() => navigate("/admin/dashboard")}
          >
            <Icon name="arrow" size={17} />
            Dashboard
          </button>
        </div>

        <div className="premium-hero-main">
          <div>
            <span className="premium-hero-tag">
              MEDICAL STAFF MANAGEMENT
            </span>

            <h1>Doctor Management</h1>

            <p>
              Manage your medical specialists, consultation
              schedules, and hospital services in one place.
            </p>
          </div>

          <div className="premium-hero-decoration" aria-hidden="true">
            <span>✚</span>
          </div>
        </div>
      </header>

      {/* SUMMARY CARDS */}

      <section className="premium-doctor-stats">
        <article className="premium-stat-card premium-stat-green">
          <div className="premium-stat-icon">
            <Icon name="users" size={25} />
          </div>
          <div>
            <span>Total Doctors</span>
            <strong>{doctors.length}</strong>
            <small>Registered specialists</small>
          </div>
        </article>

        <article className="premium-stat-card premium-stat-blue">
          <div className="premium-stat-icon">
            <Icon name="check" size={25} />
          </div>
          <div>
            <span>Specializations</span>
            <strong>{specialties}</strong>
            <small>Medical disciplines</small>
          </div>
        </article>

        <article className="premium-stat-card premium-stat-purple">
          <div className="premium-stat-icon">
            <Icon name="clock" size={25} />
          </div>
          <div>
            <span>Configured Schedules</span>
            <strong>{availableSchedules}</strong>
            <small>Doctors with set hours</small>
          </div>
        </article>
      </section>

      {/* MAIN WORKSPACE */}

      <section className="premium-doctors-workspace">
        {/* DOCTOR FORM */}

        <form className="premium-doctor-form" onSubmit={saveDoctor}>
          <div className="premium-form-heading">
            <div className="premium-form-heading-icon">
              <Icon
                name={editingDoctorId !== null ? "edit" : "plus"}
                size={22}
              />
            </div>

            <div>
              <h2>
                {editingDoctorId !== null
                  ? "Edit Doctor"
                  : "Add New Doctor"}
              </h2>
              <p>
                {editingDoctorId !== null
                  ? "Update the specialist's details"
                  : "Create a medical staff profile"}
              </p>
            </div>
          </div>

          <div className="premium-form-body">
            <div className="premium-form-section-title">
              Personal Information
            </div>

            <label htmlFor="doctor-name">Doctor Name *</label>
            <input
              id="doctor-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Dr. Nimal Perera"
              required
            />

            <label htmlFor="doctor-specialization">
              Specialization *
            </label>
            <input
              id="doctor-specialization"
              name="specialization"
              value={form.specialization}
              onChange={handleChange}
              placeholder="e.g. Cardiologist"
              required
            />

            <label htmlFor="doctor-qualification">
              Qualification
            </label>
            <input
              id="doctor-qualification"
              name="qualification"
              value={form.qualification}
              onChange={handleChange}
              placeholder="e.g. MBBS, MD"
            />

            <label htmlFor="doctor-experience">
              Experience (Years)
            </label>
            <input
              id="doctor-experience"
              name="experience_years"
              type="number"
              min="0"
              value={form.experience_years}
              onChange={handleChange}
            />

            <div className="premium-form-section-title">
              Hospital & Availability
            </div>

            <label htmlFor="doctor-hospital">Hospital</label>
            <input
              id="doctor-hospital"
              name="hospital"
              value={form.hospital}
              onChange={handleChange}
              placeholder="Hospital name"
            />

            <label htmlFor="doctor-days">Available Days</label>
            <input
              id="doctor-days"
              name="available_days"
              value={form.available_days}
              onChange={handleChange}
              placeholder="Monday,Wednesday,Friday"
            />

            <div className="premium-time-grid">
              <div>
                <label htmlFor="doctor-start">Start Time</label>
                <input
                  id="doctor-start"
                  name="available_start_time"
                  type="time"
                  value={form.available_start_time}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="doctor-end">End Time</label>
                <input
                  id="doctor-end"
                  name="available_end_time"
                  type="time"
                  value={form.available_end_time}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="premium-form-section-title">
              Consultation Details
            </div>

            <label htmlFor="doctor-fee">
              Consultation Fee (Rs.)
            </label>
            <input
              id="doctor-fee"
              name="consultation_fee"
              type="number"
              min="0"
              step="0.01"
              value={form.consultation_fee}
              onChange={handleChange}
              placeholder="2500.00"
            />

            <label htmlFor="doctor-duration">
              Average Consultation (Minutes)
            </label>
            <input
              id="doctor-duration"
              name="average_consultation_minutes"
              type="number"
              min="1"
              value={form.average_consultation_minutes}
              onChange={handleChange}
            />

            <button
              type="submit"
              className="premium-save-button"
              disabled={saving}
            >
              <Icon
                name={editingDoctorId !== null ? "check" : "plus"}
                size={19}
              />
              {saving
                ? "Saving..."
                : editingDoctorId !== null
                ? "Update Doctor"
                : "Add Doctor"}
            </button>

            {editingDoctorId !== null && (
              <button
                type="button"
                className="premium-cancel-button"
                onClick={resetForm}
              >
                Cancel Editing
              </button>
            )}
          </div>
        </form>

        {/* DOCTOR DIRECTORY */}

        <section className="premium-doctor-directory">
          <div className="premium-directory-heading">
            <div>
              <span className="premium-section-eyebrow">
                STAFF DIRECTORY
              </span>
              <h2>Medical Specialists</h2>
              <p>
                {filteredDoctors.length} of {doctors.length} doctors
              </p>
            </div>

            <button
              type="button"
              className="premium-refresh-button"
              onClick={loadDoctors}
              disabled={loading}
            >
              <Icon name="refresh" size={17} />
              Refresh
            </button>
          </div>

          <div className="premium-search-field">
            <Icon name="search" size={19} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search doctors, specialties, hospitals..."
              aria-label="Search doctors"
            />
          </div>

          {error && (
            <div className="premium-doctors-error" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <div className="premium-directory-empty">
              Loading doctors...
            </div>
          ) : !error && filteredDoctors.length === 0 ? (
            <div className="premium-directory-empty">
              <span>⌕</span>
              <h3>No doctors found</h3>
              <p>Try a different search or add a new doctor.</p>
            </div>
          ) : !error ? (
            <div className="premium-doctor-cards">
              {filteredDoctors.map((doctor) => (
                <article
                  className="premium-doctor-card"
                  key={doctor.doctor_id}
                >
                  <div className="premium-doctor-card-top">
                    <div className="premium-doctor-avatar">
                      {String(doctor.name || "D")
                        .replace(/^Dr\.?\s*/i, "")
                        .charAt(0)
                        .toUpperCase() || "D"}
                    </div>

                    <div className="premium-doctor-identity">
                      <span className="premium-doctor-id">
                        DOCTOR #{doctor.doctor_id}
                      </span>
                      <h3>{doctor.name}</h3>
                      <span className="premium-specialty-badge">
                        {doctor.specialization}
                      </span>
                    </div>
                  </div>

                  <div className="premium-doctor-info">
                    <div className="premium-doctor-info-row">
                      <Icon name="building" size={17} />
                      <span>
                        {doctor.hospital || "Hospital not provided"}
                      </span>
                    </div>

                    <div className="premium-doctor-info-row">
                      <Icon name="users" size={17} />
                      <span>
                        {doctor.qualification || "Qualification not provided"}
                        {" · "}
                        {doctor.experience_years ?? 0} years experience
                      </span>
                    </div>

                    <div className="premium-doctor-info-row">
                      <Icon name="clock" size={17} />
                      <span>
                        {doctor.available_days || "Days not configured"}
                      </span>
                    </div>

                    <div className="premium-doctor-schedule">
                      {doctor.available_start_time &&
                      doctor.available_end_time
                        ? `${doctor.available_start_time} – ${doctor.available_end_time}`
                        : "Consultation time not configured"}
                    </div>
                  </div>

                  <div className="premium-doctor-card-footer">
                    <div className="premium-doctor-fee">
                      <small>Consultation Fee</small>
                      <strong>
                        Rs.{" "}
                        {Number(
                          doctor.consultation_fee || 0
                        ).toLocaleString("en-LK", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </strong>
                    </div>

                    <div className="premium-doctor-buttons">
                      <button
                        type="button"
                        className="premium-edit-button"
                        onClick={() => editDoctor(doctor)}
                      >
                        <Icon name="edit" size={16} />
                        Edit
                      </button>

                      <button
                        type="button"
                        className="premium-delete-button"
                        onClick={() => deleteDoctor(doctor)}
                      >
                        <Icon name="trash" size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
