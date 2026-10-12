import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import adminApi from "../api/adminApi";
import "./AdminDoctors.css";
import "./AdminDoctors.css";
import "./AdminManagementTheme.css";

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

export default function AdminDoctors() {
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingDoctorId, setEditingDoctorId] =
    useState(null);
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
      setDoctors(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Could not load doctors."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
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
      available_start_time:
        doctor.available_start_time || "",
      available_end_time:
        doctor.available_end_time || "",
      consultation_fee: doctor.consultation_fee || "",
      average_consultation_minutes:
        doctor.average_consultation_minutes ?? 15,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
      available_start_time:
        form.available_start_time || null,
      available_end_time:
        form.available_end_time || null,
    };

    try {
      if (editingDoctorId) {
        await adminApi.put(
          `/doctors/${editingDoctorId}`,
          payload
        );

        await Swal.fire({
          title: "Doctor updated",
          text: "Doctor information was updated successfully.",
          icon: "success",
          confirmButtonColor: "#087f5b",
        });
      } else {
        await adminApi.post("/doctors", payload);

        await Swal.fire({
          title: "Doctor added",
          text: "The new doctor was created successfully.",
          icon: "success",
          confirmButtonColor: "#087f5b",
        });
      }

      resetForm();
      await loadDoctors();
    } catch (requestError) {
      await Swal.fire({
        title: "Could not save doctor",
        text:
          requestError.response?.data?.detail ||
          "Please check the entered information.",
        icon: "error",
        confirmButtonColor: "#c92a2a",
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
      confirmButtonColor: "#c92a2a",
      cancelButtonText: "Keep doctor",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      await adminApi.delete(
        `/doctors/${doctor.doctor_id}`
      );

      await Swal.fire({
        title: "Doctor deleted",
        text: "The doctor was removed successfully.",
        icon: "success",
        confirmButtonColor: "#087f5b",
      });

      await loadDoctors();
    } catch (requestError) {
      await Swal.fire({
        title: "Could not delete doctor",
        text:
          requestError.response?.data?.detail ||
          "The doctor may have linked appointments.",
        icon: "error",
        confirmButtonColor: "#c92a2a",
      });
    }
  }

  const filteredDoctors = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return doctors;
    }

    return doctors.filter((doctor) =>
      [
        doctor.name,
        doctor.specialization,
        doctor.hospital,
        doctor.qualification,
      ]
        .filter(Boolean)
        .some((value) =>
          value.toLowerCase().includes(query)
        )
    );
  }, [doctors, search]);

  return (
    <main className="admin-doctors-page">
      <header className="admin-doctors-header">
        <div>
          <span>DOCTOR MANAGEMENT</span>
          <h1>Manage Doctors</h1>
          <p>
            Add doctors, edit schedules, and manage specialist
            information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/dashboard")}
        >
          Back to Dashboard
        </button>
      </header>

      <section className="admin-doctors-layout">
        <form
          className="admin-doctor-form"
          onSubmit={saveDoctor}
        >
          <h2>
            {editingDoctorId
              ? "Edit Doctor"
              : "Add New Doctor"}
          </h2>

          <label>Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <label>Specialization</label>
          <input
            name="specialization"
            value={form.specialization}
            onChange={handleChange}
            required
          />

          <label>Qualification</label>
          <input
            name="qualification"
            value={form.qualification}
            onChange={handleChange}
          />

          <label>Experience years</label>
          <input
            name="experience_years"
            type="number"
            min="0"
            value={form.experience_years}
            onChange={handleChange}
          />

          <label>Hospital</label>
          <input
            name="hospital"
            value={form.hospital}
            onChange={handleChange}
          />

          <label>Available days</label>
          <input
            name="available_days"
            value={form.available_days}
            onChange={handleChange}
            placeholder="Monday,Wednesday,Friday"
          />

          <div className="admin-doctor-time-grid">
            <div>
              <label>Start time</label>
              <input
                name="available_start_time"
                type="time"
                value={form.available_start_time}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>End time</label>
              <input
                name="available_end_time"
                type="time"
                value={form.available_end_time}
                onChange={handleChange}
              />
            </div>
          </div>

          <label>Consultation fee</label>
          <input
            name="consultation_fee"
            type="number"
            min="0"
            step="0.01"
            value={form.consultation_fee}
            onChange={handleChange}
          />

          <label>Average consultation minutes</label>
          <input
            name="average_consultation_minutes"
            type="number"
            min="1"
            value={form.average_consultation_minutes}
            onChange={handleChange}
          />

          <button
            type="submit"
            className="admin-doctor-save"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingDoctorId
              ? "Update Doctor"
              : "Add Doctor"}
          </button>

          {editingDoctorId && (
            <button
              type="button"
              className="admin-doctor-cancel-edit"
              onClick={resetForm}
            >
              Cancel Editing
            </button>
          )}
        </form>

        <section className="admin-doctors-list-section">
          <div className="admin-doctors-toolbar">
            <div>
              <h2>Doctors</h2>
              <p>{doctors.length} doctor records</p>
            </div>

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search doctors..."
            />
          </div>

          {error && (
            <div className="admin-doctors-error">
              {error}
            </div>
          )}

          {loading && <p>Loading doctors...</p>}

          {!loading && filteredDoctors.length === 0 && (
            <div className="admin-doctors-empty">
              No matching doctors found.
            </div>
          )}

          <div className="admin-doctors-table-wrapper">
            <table className="admin-doctors-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Hospital</th>
                  <th>Fee</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor.doctor_id}>
                    <td>
                      <strong>{doctor.name}</strong>
                      <span>#{doctor.doctor_id}</span>
                    </td>

                    <td>{doctor.specialization}</td>

                    <td>
                      {doctor.hospital || "Not provided"}
                    </td>

                    <td>
                      Rs. {Number(
                        doctor.consultation_fee
                      ).toFixed(2)}
                    </td>

                    <td>
                      <span>
                        {doctor.available_days ||
                          "Not configured"}
                      </span>
                      <small>
                        {doctor.available_start_time &&
                        doctor.available_end_time
                          ? `${doctor.available_start_time} - ${doctor.available_end_time}`
                          : "Time not configured"}
                      </small>
                    </td>

                    <td>
                      <div className="admin-doctor-actions">
                        <button
                          type="button"
                          onClick={() => editDoctor(doctor)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteDoctor(doctor)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}