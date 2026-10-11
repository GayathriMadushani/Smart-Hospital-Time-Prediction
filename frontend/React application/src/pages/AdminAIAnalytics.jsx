
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./AdminAIAnalytics.css";

const API_URL = "http://127.0.0.1:8000";

function formatNumber(value, digits = 2) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toFixed(digits)
    : "N/A";
}

function ComparisonChart({ title, data, predictedKey, actualKey }) {
  return (
    <div className="ai-chart-card">
      <h3>{title}</h3>
      <p>Predicted vs actual duration in minutes</p>

      {data.length === 0 ? (
        <div className="ai-chart-empty">
          No completed consultations available yet.
        </div>
      ) : (
        <div className="ai-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="appointment" />
              <YAxis
                allowDecimals={false}
                label={{
                  value: "Minutes",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                formatter={(value) => [
                  `${formatNumber(value)} min`,
                ]}
              />
              <Legend />
              <Bar
                dataKey={predictedKey}
                name="Predicted"
                fill="#00866a"
                radius={[5, 5, 0, 0]}
              />
              <Bar
                dataKey={actualKey}
                name="Actual"
                fill="#2563eb"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function AdminAIAnalytics() {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const token = localStorage.getItem("admin_access_token");

      if (!token) {
        navigate("/admin-login");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [analyticsResponse, comparisonResponse] =
        await Promise.all([
          fetch(`${API_URL}/admin/analytics/ai`, {
            headers,
          }),
          fetch(`${API_URL}/admin/analytics/comparison`, {
            headers,
          }),
        ]);

      if (
        [401, 403].includes(analyticsResponse.status) ||
        [401, 403].includes(comparisonResponse.status)
      ) {
        throw new Error(
          "Admin session expired. Please log in again."
        );
      }

      if (!analyticsResponse.ok) {
        throw new Error("Unable to load AI model analytics.");
      }

      if (!comparisonResponse.ok) {
        throw new Error(
          "Unable to load prediction comparison data."
        );
      }

      const [analyticsData, comparisonData] =
        await Promise.all([
          analyticsResponse.json(),
          comparisonResponse.json(),
        ]);

      setAnalytics(analyticsData);
      setComparison(comparisonData);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const models = analytics
    ? [
        {
          title: "Waiting Time Prediction",
          data: analytics.waiting_time,
        },
        {
          title: "Consultation Time Prediction",
          data: analytics.consultation_time,
        },
      ]
    : [];

  const comparisons = comparison?.comparisons ?? [];

  const chartData = comparisons.map((item) => ({
    appointment: `#${item.appointment_id}`,
    predicted_waiting: Number(
      item.predicted_waiting_minutes ?? 0
    ),
    actual_waiting: Number(
      item.actual_waiting_minutes ?? 0
    ),
    predicted_consultation: Number(
      item.predicted_consultation_minutes ?? 0
    ),
    actual_consultation: Number(
      item.actual_consultation_minutes ?? 0
    ),
  }));

  // Calculate displayed errors from the completed records.
  const averageWaitingError = comparisons.length
    ? comparisons.reduce(
        (total, item) =>
          total +
          Math.abs(
            Number(item.predicted_waiting_minutes ?? 0) -
            Number(item.actual_waiting_minutes ?? 0)
          ),
        0
      ) / comparisons.length
    : 0;

  const averageConsultationError = comparisons.length
    ? comparisons.reduce(
        (total, item) =>
          total +
          Math.abs(
            Number(item.predicted_consultation_minutes ?? 0) -
            Number(item.actual_consultation_minutes ?? 0)
          ),
        0
      ) / comparisons.length
    : 0;

  return (
    <div className="ai-page">
      <div className="ai-header">
        <div>
          <span className="ai-eyebrow">
            SMART HOSPITAL AI
          </span>

          <h1>AI Prediction Analytics</h1>

          <p>
            Monitor machine learning model evaluation
            results for hospital queue predictions.
          </p>
        </div>

        <button
          className="ai-back-btn"
          onClick={() => navigate("/admin/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

      {loading && (
        <div className="ai-notice">
          Loading AI analytics...
        </div>
      )}

      {error && (
        <div className="ai-error">
          <p>{error}</p>
          <button onClick={() => loadAnalytics()}>
            Try Again
          </button>
        </div>
      )}

      {analytics && !loading && (
        <>
          <div className="ai-model-banner">
            <div>
              <span>Machine Learning Algorithm</span>
              <h2>{analytics.model_type}</h2>
              <p>
                Model evaluation metrics from the latest
                recorded training results.
              </p>
            </div>

            <span className="ai-model-badge">
              2 Prediction Models
            </span>
          </div>

          <div className="ai-model-grid">
            {models.map((model) => (
              <div
                className="ai-model-card"
                key={model.title}
              >
                <h2>{model.title}</h2>
                <p className="ai-card-description">
                  Evaluation performance
                </p>

                <div className="ai-metric-grid">
                  <div className="ai-metric">
                    <span>Mean Absolute Error</span>
                    <strong>
                      {formatNumber(model.data.mae)}
                    </strong>
                    <small>minutes</small>
                  </div>

                  <div className="ai-metric">
                    <span>Root Mean Squared Error</span>
                    <strong>
                      {formatNumber(model.data.rmse)}
                    </strong>
                    <small>minutes</small>
                  </div>
                </div>

                <div className="ai-r2-section">
                  <div className="ai-r2-label">
                    <span>R² Score</span>
                    <strong>
                      {formatNumber(model.data.r2, 4)}
                    </strong>
                  </div>

                  <div className="ai-progress-track">
                    <div
                      className="ai-progress-fill"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            Number(model.data.r2) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {comparison && (
            <>
              <div className="ai-comparison-section">
                <div className="ai-comparison-heading">
                  <div>
                    <h2>AI Prediction vs Actual Time</h2>
                    <p>
                      Compare model predictions with
                      completed hospital consultations.
                    </p>
                  </div>

                  <button
                    className="ai-refresh-btn"
                    onClick={() => loadAnalytics(true)}
                    disabled={refreshing}
                  >
                    {refreshing
                      ? "Refreshing..."
                      : "Refresh Data"}
                  </button>
                </div>

                <div className="ai-comparison-stats">
                  <div className="ai-comparison-stat">
                    <span>Completed Consultations</span>
                    <strong>{comparisons.length}</strong>
                  </div>

                  <div className="ai-comparison-stat">
                    <span>Average Waiting Error</span>
                    <strong>
                      {formatNumber(averageWaitingError)} min
                    </strong>
                  </div>

                  <div className="ai-comparison-stat">
                    <span>Average Consultation Error</span>
                    <strong>
                      {formatNumber(averageConsultationError)} min
                    </strong>
                  </div>
                </div>

                <div className="ai-comparison-table-wrapper">
                  <table className="ai-comparison-table">
                    <thead>
                      <tr>
                        <th>Appointment</th>
                        <th>Doctor</th>
                        <th>Date</th>
                        <th>Predicted Wait</th>
                        <th>Actual Wait</th>
                        <th>Wait Error</th>
                        <th>Predicted Consultation</th>
                        <th>Actual Consultation</th>
                        <th>Consultation Error</th>
                      </tr>
                    </thead>

                    <tbody>
                      {comparisons.length === 0 ? (
                        <tr>
                          <td colSpan="9">
                            No completed consultations yet.
                          </td>
                        </tr>
                      ) : (
                        comparisons.map((item) => {
                          const waitError = Math.abs(
                            Number(
                              item.predicted_waiting_minutes ?? 0
                            ) -
                            Number(
                              item.actual_waiting_minutes ?? 0
                            )
                          );

                          const consultationError = Math.abs(
                            Number(
                              item.predicted_consultation_minutes ?? 0
                            ) -
                            Number(
                              item.actual_consultation_minutes ?? 0
                            )
                          );

                          return (
                            <tr key={item.queue_id}>
                              <td>#{item.appointment_id}</td>
                              <td>{item.doctor_name}</td>
                              <td>{item.appointment_date}</td>
                              <td>
                                {formatNumber(
                                  item.predicted_waiting_minutes
                                )} min
                              </td>
                              <td>
                                {formatNumber(
                                  item.actual_waiting_minutes
                                )} min
                              </td>
                              <td>
                                {formatNumber(waitError)} min
                              </td>
                              <td>
                                {formatNumber(
                                  item.predicted_consultation_minutes
                                )} min
                              </td>
                              <td>
                                {formatNumber(
                                  item.actual_consultation_minutes
                                )} min
                              </td>
                              <td>
                                {formatNumber(consultationError)} min
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <p className="ai-comparison-note">
                  Predictions are recalculated using the
                  currently loaded AI models. Actual times
                  come from completed queue records.
                </p>
              </div>

              {/* NEW: Predicted vs Actual Charts */}
              <div className="ai-charts-section">
                <div className="ai-charts-heading">
                  <h2>AI Prediction Comparison Charts</h2>
                  <p>
                    Visual comparison of predicted and
                    actual hospital queue durations.
                  </p>
                </div>

                <div className="ai-charts-grid">
                  <ComparisonChart
                    title="Waiting Time Comparison"
                    data={chartData}
                    predictedKey="predicted_waiting"
                    actualKey="actual_waiting"
                  />

                  <ComparisonChart
                    title="Consultation Time Comparison"
                    data={chartData}
                    predictedKey="predicted_consultation"
                    actualKey="actual_consultation"
                  />
                </div>
              </div>
            </>
          )}

          <div className="ai-info-card">
            <h2>Understanding the Metrics</h2>

            <p>
              <strong>MAE:</strong> Average absolute
              difference between predicted and actual
              time. Lower values are better.
            </p>

            <p>
              <strong>RMSE:</strong> Measures prediction
              error, giving more weight to large errors.
              Lower values are better.
            </p>

            <p>
              <strong>R²:</strong> Measures how much
              variation in the target is explained by
              the model. Values closer to 1 generally
              indicate a better fit.
            </p>

            <p className="ai-note">
              Model evaluation metrics are loaded from
              the admin analytics API. Comparison
              results use completed hospital queue
              records and are not the same as the
              model's held-out test metrics.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
