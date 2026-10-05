import { useEffect, useState } from "react";

const API_BASE = "/api";

function App() {
  const [token, setToken] = useState(() =>
    localStorage.getItem("access_token")
  );

  const [page, setPage] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("cloudops-theme") === "dark";
  });

  const [servers, setServers] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [deployments, setDeployments] = useState([]);

  // ============================================================
  // ALERTS STATE
  // ============================================================

  const [alerts, setAlerts] = useState([]);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // ============================================================
  // EC2 MONITORING STATE
  // ============================================================

  const [monitoring, setMonitoring] = useState({});
  const [monitoringLoading, setMonitoringLoading] = useState({});
  const [selectedMonitoringServer, setSelectedMonitoringServer] =
    useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchServer, setSearchServer] = useState("");
  const [searchDeployment, setSearchDeployment] = useState("");

  const [deploymentForm, setDeploymentForm] = useState({
    application: "",
    version: "",
    server_name: "",
    ec2_instance_id: "",
  });

  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [deploymentDetailsLoading, setDeploymentDetailsLoading] =
    useState(false);

  const [authMode, setAuthMode] = useState("login");

  const [authForm, setAuthForm] = useState({
    username: "",
    password: "",
    email: "",
  });

  // ============================================================
  // THEME
  // ============================================================

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);

    localStorage.setItem(
      "cloudops-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  // ============================================================
  // LOAD DATA AFTER LOGIN
  // ============================================================

  useEffect(() => {
    if (token) {
      loadAllData();
      loadAlerts();
    }
  }, [token]);

  // ============================================================
  // API HELPER
  // ============================================================

  async function apiFetch(endpoint, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType =
      response.headers.get("content-type") || "";

    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("access_token");
        setToken(null);
      }

      const message =
        typeof data === "object"
          ? data.detail ||
            data.message ||
            data.error ||
            "Request failed."
          : data || "Request failed.";

      throw new Error(message);
    }

    return data;
  }

  // ============================================================
  // LOAD DASHBOARD DATA
  // ============================================================

  async function loadAllData() {
    setLoading(true);
    setError("");

    try {
      const [
        serverData,
        dashboardData,
        deploymentData,
      ] = await Promise.all([
        apiFetch("/servers/"),
        apiFetch("/dashboard/"),
        apiFetch("/deployments/"),
      ]);

      const liveServers = Array.isArray(serverData)
        ? serverData
        : Array.isArray(serverData?.servers)
        ? serverData.servers
        : [];

      setServers(liveServers);
      setDashboard(dashboardData);

      const deploymentList = Array.isArray(deploymentData)
        ? deploymentData
        : Array.isArray(deploymentData?.deployments)
        ? deploymentData.deployments
        : [];

      setDeployments(deploymentList);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // ALERTS
  // ============================================================

  async function loadAlerts() {
    if (!token) {
      return;
    }

    setAlertsLoading(true);

    try {
      const data = await apiFetch("/alerts/");

      const alertList = Array.isArray(data)
        ? data
        : Array.isArray(data?.alerts)
        ? data.alerts
        : [];

      setAlerts(alertList);

      const count =
        typeof data?.unread_count === "number"
          ? data.unread_count
          : alertList.filter(
              (alert) => !alert.is_read
            ).length;

      setUnreadAlertCount(count);
    } catch (err) {
      console.error("Unable to load alerts:", err);
    } finally {
      setAlertsLoading(false);
    }
  }

  async function markAlertRead(id) {
    try {
      setError("");

      await apiFetch(`/alerts/${id}/read/`, {
        method: "PATCH",
      });

      setAlerts((previous) =>
        previous.map((alert) =>
          alert.id === id
            ? {
                ...alert,
                is_read: true,
              }
            : alert
        )
      );

      setUnreadAlertCount((previous) =>
        Math.max(0, previous - 1)
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  async function markAllAlertsRead() {
    const unreadAlerts = alerts.filter(
      (alert) => !alert.is_read
    );

    if (unreadAlerts.length === 0) {
      return;
    }

    try {
      setError("");

      await Promise.all(
        unreadAlerts.map((alert) =>
          apiFetch(
            `/alerts/${alert.id}/read/`,
            {
              method: "PATCH",
            }
          )
        )
      );

      setAlerts((previous) =>
        previous.map((alert) => ({
          ...alert,
          is_read: true,
        }))
      );

      setUnreadAlertCount(0);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  function getAlertSeverityClass(severity) {
    switch (
      String(severity || "").toLowerCase()
    ) {
      case "critical":
        return "alert-critical";

      case "warning":
        return "alert-warning";

      case "info":
        return "alert-info";

      default:
        return "alert-info";
    }
  }

  function getAlertIcon(severity) {
    switch (
      String(severity || "").toLowerCase()
    ) {
      case "critical":
        return "🔴";

      case "warning":
        return "🟠";

      case "info":
        return "🔵";

      default:
        return "🔵";
    }
  }

  function renderAlertsPage() {
    return (
      <>
        <section className="page-heading-row">
          <div>
            <p className="eyebrow">
              CLOUD OPERATIONS
            </p>

            <h2>
              Alerts & Notifications
            </h2>

            <p>
              Monitor important infrastructure,
              deployment and system events.
            </p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">
                ALERT CENTER
              </p>

              <h3>
                System Alerts
              </h3>

              <span className="panel-count">
                {unreadAlertCount} unread
              </span>
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                className="secondary-button"
                type="button"
                onClick={loadAlerts}
                disabled={alertsLoading}
              >
                {alertsLoading
                  ? "Loading..."
                  : "↻ Refresh Alerts"}
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={markAllAlertsRead}
                disabled={
                  alertsLoading ||
                  unreadAlertCount === 0
                }
              >
                ✓ Mark All Read
              </button>
            </div>
          </div>

          {alertsLoading ? (
            <div
              className="loading-state"
              style={{
                padding: "40px 12px",
              }}
            >
              Loading alerts...
            </div>
          ) : alerts.length === 0 ? (
            <div
              className="empty-state"
              style={{
                padding: "50px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "42px",
                  marginBottom: "12px",
                }}
              >
                🔔
              </div>

              <strong>
                No alerts
              </strong>

              <p>
                Your CloudOps Automator system
                currently has no alerts.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`alert-card ${
                    alert.is_read
                      ? "alert-card-read"
                      : "alert-card-unread"
                  }`}
                  style={{
                    border:
                      "1px solid var(--border-color, #e5e7eb)",
                    borderRadius: "12px",
                    padding: "16px",
                    background:
                      alert.is_read
                        ? "var(--card-bg, #ffffff)"
                        : "var(--surface-bg, #f8fafc)",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent:
                      "space-between",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "14px",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "20px",
                        flexShrink: 0,
                      }}
                    >
                      {getAlertIcon(
                        alert.severity
                      )}
                    </div>

                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <strong>
                          {alert.title}
                        </strong>

                        <span
                          className={`alert-severity ${getAlertSeverityClass(
                            alert.severity
                          )}`}
                          style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            textTransform:
                              "uppercase",
                            padding:
                              "4px 8px",
                            borderRadius:
                              "999px",
                          }}
                        >
                          {alert.severity ||
                            "info"}
                        </span>

                        {!alert.is_read && (
                          <span
                            style={{
                              width: "7px",
                              height: "7px",
                              borderRadius:
                                "50%",
                              background:
                                "#2563eb",
                              display:
                                "inline-block",
                            }}
                            title="Unread"
                          />
                        )}
                      </div>

                      <p
                        style={{
                          margin:
                            "8px 0 10px",
                          lineHeight:
                            "1.5",
                        }}
                      >
                        {alert.message}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          gap: "14px",
                          flexWrap: "wrap",
                          fontSize: "12px",
                          opacity: 0.7,
                        }}
                      >
                        {alert.server_name && (
                          <span>
                            Server:{" "}
                            <strong>
                              {
                                alert.server_name
                              }
                            </strong>
                          </span>
                        )}

                        {alert.ec2_instance_id && (
                          <span>
                            EC2:{" "}
                            <strong>
                              {
                                alert.ec2_instance_id
                              }
                            </strong>
                          </span>
                        )}

                        <span>
                          {formatDate(
                            alert.created_at
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!alert.is_read && (
                    <button
                      className="details-button"
                      type="button"
                      onClick={() =>
                        markAlertRead(
                          alert.id
                        )
                      }
                    >
                      ✓ Mark Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  // ============================================================
  // LOGIN
  // ============================================================

  async function handleLogin(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/auth/login/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: authForm.username,
            password: authForm.password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail ||
            result.message ||
            result.error ||
            "Login failed."
        );
      }

      const accessToken =
        result.access || result.access_token;

      if (!accessToken) {
        throw new Error(
          "Login succeeded but no access token was returned."
        );
      }

      localStorage.setItem(
        "access_token",
        accessToken
      );

      setToken(accessToken);

      setAuthForm({
        username: "",
        password: "",
        email: "",
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // REGISTER
  // ============================================================

  async function handleRegister(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/auth/register/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: authForm.username,
            password: authForm.password,
            email: authForm.email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            data.error ||
            "Registration failed."
        );
      }

      setAuthMode("login");

      setError(
        "Registration successful. Please log in."
      );

      setAuthForm({
        username: "",
        password: "",
        email: "",
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  function logout() {
    localStorage.removeItem("access_token");

    setToken(null);
    setServers([]);
    setDashboard(null);
    setDeployments([]);
    setAlerts([]);
    setUnreadAlertCount(0);
    setSelectedDeployment(null);
    setSelectedMonitoringServer(null);
    setMonitoring({});
    setPage("dashboard");
  }

  // ============================================================
  // EC2 START / STOP
  // ============================================================

  async function startServer(id) {
    try {
      setError("");

      await apiFetch(`/servers/${id}/start/`, {
        method: "POST",
      });

      await loadAllData();
      await loadAlerts();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  async function stopServer(id) {
    try {
      setError("");

      await apiFetch(`/servers/${id}/stop/`, {
        method: "POST",
      });

      await loadAllData();
      await loadAlerts();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  // ============================================================
  // EC2 CLOUDWATCH MONITORING
  // ============================================================

  async function loadMonitoring(instanceId) {
    if (!instanceId) {
      return;
    }

    setMonitoringLoading((previous) => ({
      ...previous,
      [instanceId]: true,
    }));

    setError("");

    try {
      const data = await apiFetch(
        `/monitoring/${instanceId}/`
      );

      setMonitoring((previous) => ({
        ...previous,
        [instanceId]: data,
      }));

      setSelectedMonitoringServer(instanceId);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setMonitoringLoading((previous) => ({
        ...previous,
        [instanceId]: false,
      }));
    }
  }

  function formatMetricValue(metricName, value) {
    if (value === null || value === undefined) {
      return "No data";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
      return String(value);
    }

    if (metricName === "CPUUtilization") {
      return `${number.toFixed(2)}%`;
    }

    if (
      metricName === "NetworkIn" ||
      metricName === "NetworkOut"
    ) {
      if (number >= 1024 * 1024 * 1024) {
        return `${(
          number /
          (1024 * 1024 * 1024)
        ).toFixed(2)} GB`;
      }

      if (number >= 1024 * 1024) {
        return `${(
          number /
          (1024 * 1024)
        ).toFixed(2)} MB`;
      }

      if (number >= 1024) {
        return `${(
          number / 1024
        ).toFixed(2)} KB`;
      }

      return `${number.toFixed(0)} B`;
    }

    return number.toFixed(2);
  }

  function getMonitoringMetric(
    instanceId,
    metricName
  ) {
    const data = monitoring[instanceId];

    return data?.metrics?.[metricName] || null;
  }

  function getMonitoringTimestamp(instanceId) {
    const data = monitoring[instanceId];

    if (!data?.metrics) {
      return null;
    }

    const timestamps = Object.values(
      data.metrics
    )
      .filter(
        (metric) =>
          metric &&
          metric.timestamp
      )
      .map(
        (metric) =>
          new Date(metric.timestamp)
      );

    if (timestamps.length === 0) {
      return null;
    }

    return new Date(
      Math.max(
        ...timestamps.map((date) =>
          date.getTime()
        )
      )
    );
  }

  function renderMonitoringPanel(instanceId) {
    const server = servers.find(
      (item) => item.id === instanceId
    );

    const data = monitoring[instanceId];

    const isLoading =
      monitoringLoading[instanceId];

    const cpu = getMonitoringMetric(
      instanceId,
      "CPUUtilization"
    );

    const networkIn = getMonitoringMetric(
      instanceId,
      "NetworkIn"
    );

    const networkOut = getMonitoringMetric(
      instanceId,
      "NetworkOut"
    );

    const ebsRead = getMonitoringMetric(
      instanceId,
      "EBSReadOps"
    );

    const ebsWrite = getMonitoringMetric(
      instanceId,
      "EBSWriteOps"
    );

    const timestamp =
      getMonitoringTimestamp(instanceId);

    if (!server) {
      return null;
    }

    return (
      <section
        className="panel"
        style={{ marginTop: "24px" }}
      >
        <div className="panel-header">
          <div>
            <p className="eyebrow">
              AMAZON CLOUDWATCH
            </p>

            <h3>
              EC2 Monitoring
            </h3>

            <span className="panel-count">
              {server.name} ·{" "}
              {server.id}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                loadMonitoring(
                  instanceId
                )
              }
              disabled={isLoading}
            >
              {isLoading
                ? "Loading..."
                : "↻ Refresh Metrics"}
            </button>

            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                setSelectedMonitoringServer(
                  null
                )
              }
            >
              Close
            </button>
          </div>
        </div>

        {!data && !isLoading ? (
          <div
            className="empty-state"
            style={{
              padding: "32px 12px",
            }}
          >
            <strong>
              Monitoring data not loaded
            </strong>

            <p>
              Click "Refresh Metrics" to
              retrieve CloudWatch data.
            </p>
          </div>
        ) : isLoading ? (
          <div
            className="loading-state"
            style={{
              padding: "32px 12px",
            }}
          >
            Loading CloudWatch metrics...
          </div>
        ) : (
          <>
            <div
              className="stats-grid"
              style={{
                marginTop: "20px",
              }}
            >
              <div className="stat-card">
                <div className="stat-card-top">
                  <span>
                    CPU Utilization
                  </span>

                  <span className="stat-icon blue">
                    %
                  </span>
                </div>

                <strong>
                  {formatMetricValue(
                    "CPUUtilization",
                    cpu?.value
                  )}
                </strong>

                <small>
                  5-minute average
                </small>
              </div>

              <div className="stat-card">
                <div className="stat-card-top">
                  <span>
                    Network In
                  </span>

                  <span className="stat-icon green">
                    ↓
                  </span>
                </div>

                <strong>
                  {formatMetricValue(
                    "NetworkIn",
                    networkIn?.value
                  )}
                </strong>

                <small>
                  Average datapoint
                </small>
              </div>

              <div className="stat-card">
                <div className="stat-card-top">
                  <span>
                    Network Out
                  </span>

                  <span className="stat-icon purple">
                    ↑
                  </span>
                </div>

                <strong>
                  {formatMetricValue(
                    "NetworkOut",
                    networkOut?.value
                  )}
                </strong>

                <small>
                  Average datapoint
                </small>
              </div>

              <div className="stat-card">
                <div className="stat-card-top">
                  <span>
                    EBS Read Ops
                  </span>

                  <span className="stat-icon orange">
                    R
                  </span>
                </div>

                <strong>
                  {formatMetricValue(
                    "EBSReadOps",
                    ebsRead?.value
                  )}
                </strong>

                <small>
                  Average operations
                </small>
              </div>

              <div className="stat-card">
                <div className="stat-card-top">
                  <span>
                    EBS Write Ops
                  </span>

                  <span className="stat-icon blue">
                    W
                  </span>
                </div>

                <strong>
                  {formatMetricValue(
                    "EBSWriteOps",
                    ebsWrite?.value
                  )}
                </strong>

                <small>
                  Average operations
                </small>
              </div>
            </div>

            <div
              style={{
                marginTop: "20px",
                padding: "14px 16px",
                borderRadius: "10px",
                border:
                  "1px solid var(--border-color, #e5e7eb)",
                fontSize: "13px",
                display: "flex",
                justifyContent:
                  "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <span>
                <strong>
                  Region:
                </strong>{" "}
                {data?.region ||
                  "us-east-1"}
              </span>

              <span>
                <strong>
                  Latest datapoint:
                </strong>{" "}
                {timestamp
                  ? formatDate(
                      timestamp
                    )
                  : "No timestamp available"}
              </span>
            </div>
          </>
        )}
      </section>
    );
  }

  // ============================================================
  // DEPLOYMENTS
  // ============================================================

  async function createDeployment(event) {
    event.preventDefault();

    if (
      !deploymentForm.application ||
      !deploymentForm.version
    ) {
      setError(
        "Application and version are required."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiFetch("/deployments/", {
        method: "POST",
        body: JSON.stringify(deploymentForm),
      });

      setDeploymentForm({
        application: "",
        version: "",
        server_name: "",
        ec2_instance_id: "",
      });

      await loadAllData();
      await loadAlerts();

      setPage("deployments");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteDeployment(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this deployment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await apiFetch(`/deployments/${id}/`, {
        method: "DELETE",
      });

      if (selectedDeployment?.id === id) {
        setSelectedDeployment(null);
      }

      await loadAllData();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  async function viewDeploymentDetails(id) {
    setDeploymentDetailsLoading(true);
    setError("");

    try {
      const data = await apiFetch(
        `/deployments/${id}/`
      );

      setSelectedDeployment(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setDeploymentDetailsLoading(false);
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }

  function getStatusClass(status) {
    switch (
      String(status || "").toLowerCase()
    ) {
      case "running":
        return "status-running";

      case "successful":
      case "running-success":
        return "status-success";

      case "failed":
        return "status-failed";

      case "stopped":
        return "status-stopped";

      case "pending":
        return "status-pending";

      default:
        return "status-default";
    }
  }

  function getServerStatus(server) {
    return String(
      server?.status ||
        server?.state ||
        ""
    ).toLowerCase();
  }

  const filteredServers = servers.filter((server) => {
    const search = searchServer.toLowerCase();

    return (
      String(server.name || "")
        .toLowerCase()
        .includes(search) ||
      String(
        server.ip_address ||
          server.public_ip ||
          ""
      )
        .toLowerCase()
        .includes(search) ||
      String(
        server.server_type ||
          server.type ||
          ""
      )
        .toLowerCase()
        .includes(search) ||
      String(
        server.status ||
          server.state ||
          ""
      )
        .toLowerCase()
        .includes(search)
    );
  });

  const filteredDeployments = deployments.filter(
    (deployment) => {
      const search =
        searchDeployment.toLowerCase();

      return (
        String(deployment.application || "")
          .toLowerCase()
          .includes(search) ||
        String(deployment.version || "")
          .toLowerCase()
          .includes(search) ||
        String(deployment.server_name || "")
          .toLowerCase()
          .includes(search) ||
        String(deployment.status || "")
          .toLowerCase()
          .includes(search)
      );
    }
  );

  const totalServers = servers.length;

  const runningServers = servers.filter(
    (server) =>
      getServerStatus(server) === "running"
  ).length;

  const stoppedServers = servers.filter(
    (server) =>
      getServerStatus(server) === "stopped"
  ).length;

  const totalDeployments = deployments.length;

  const successfulDeployments =
    deployments.filter(
      (deployment) =>
        String(deployment.status).toLowerCase() ===
        "successful"
    ).length;

  const failedDeployments =
    deployments.filter(
      (deployment) =>
        String(deployment.status).toLowerCase() ===
        "failed"
    ).length;

  // ============================================================
  // AUTH SCREEN
  // ============================================================

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-brand">
            <div className="brand-mark">
              ☁
            </div>

            <div>
              <h1>CloudOps Automator</h1>

              <p>
                AWS & DevOps Management Platform
              </p>
            </div>
          </div>

          <div className="auth-card">
            <div className="auth-card-header">
              <h2>
                {authMode === "login"
                  ? "Welcome back"
                  : "Create your account"}
              </h2>

              <p>
                {authMode === "login"
                  ? "Sign in to manage your cloud infrastructure."
                  : "Create an account to access CloudOps Automator."}
              </p>
            </div>

            {error && (
              <div className="alert-message">
                {error}
              </div>
            )}

            <form
              onSubmit={
                authMode === "login"
                  ? handleLogin
                  : handleRegister
              }
              className="auth-form"
            >
              <label>
                Username

                <input
                  type="text"
                  value={authForm.username}
                  onChange={(event) =>
                    setAuthForm({
                      ...authForm,
                      username:
                        event.target.value,
                    })
                  }
                  placeholder="Enter username"
                  required
                />
              </label>

              {authMode === "register" && (
                <label>
                  Email

                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(event) =>
                      setAuthForm({
                        ...authForm,
                        email:
                          event.target.value,
                      })
                    }
                    placeholder="Enter email"
                    required
                  />
                </label>
              )}

              <label>
                Password

                <input
                  type="password"
                  value={authForm.password}
                  onChange={(event) =>
                    setAuthForm({
                      ...authForm,
                      password:
                        event.target.value,
                    })
                  }
                  placeholder="Enter password"
                  required
                />
              </label>

              <button
                className="primary-button auth-submit"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : authMode === "login"
                  ? "Sign In"
                  : "Create Account"}
              </button>
            </form>

            <button
              className="auth-switch"
              type="button"
              onClick={() => {
                setError("");

                setAuthMode(
                  authMode === "login"
                    ? "register"
                    : "login"
                );
              }}
            >
              {authMode === "login"
                ? "Don't have an account? Create one"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN APPLICATION
  // ============================================================

  return (
    <div className="app-shell">
      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() =>
            setMobileMenuOpen(false)
          }
        />
      )}

      <aside
        className={`sidebar ${
          mobileMenuOpen
            ? "sidebar-open"
            : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-mark small">
            ☁
          </div>

          <div>
            <strong>CloudOps</strong>
            <span>Automator</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={
              page === "dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setPage("dashboard");
              setMobileMenuOpen(false);
            }}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className={
              page === "servers"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setPage("servers");
              setMobileMenuOpen(false);
            }}
          >
            <span>▣</span>
            EC2 Instances
          </button>

          <button
            className={
              page === "monitoring"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setPage("monitoring");
              setMobileMenuOpen(false);
            }}
          >
            <span>◒</span>
            Monitoring
          </button>

          <button
            className={
              page === "deployments"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setPage("deployments");
              setMobileMenuOpen(false);
            }}
          >
            <span>⇄</span>
            Deployments
          </button>

          <button
            className={
              page === "alerts"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setPage("alerts");
              setMobileMenuOpen(false);
              loadAlerts();
            }}
            type="button"
          >
            <span>🔔</span>

            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                width: "100%",
                gap: "8px",
              }}
            >
              <span>
                Alerts
              </span>

              {unreadAlertCount > 0 && (
                <span
                  style={{
                    minWidth: "20px",
                    height: "20px",
                    padding:
                      "0 6px",
                    borderRadius:
                      "999px",
                    background:
                      "#ef4444",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: "700",
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                  }}
                >
                  {unreadAlertCount >
                  99
                    ? "99+"
                    : unreadAlertCount}
                </span>
              )}
            </span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button
            className="theme-toggle"
            onClick={() =>
              setDarkMode(
                (prev) => !prev
              )
            }
            type="button"
          >
            <span>
              {darkMode
                ? "☀️"
                : "🌙"}
            </span>

            <span>
              {darkMode
                ? "Light Mode"
                : "Dark Mode"}
            </span>
          </button>

          <div className="connection-status">
            <span className="online-dot" />

            <div>
              <strong>
                AWS Connected
              </strong>

              <small>
                Infrastructure online
              </small>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={logout}
            type="button"
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-button"
              onClick={() =>
                setMobileMenuOpen(
                  (prev) => !prev
                )
              }
              type="button"
            >
              ☰
            </button>

            <div>
              <div className="breadcrumb">
                CloudOps Automator /{" "}
                <strong>
                  {page === "dashboard"
                    ? "Dashboard"
                    : page === "servers"
                    ? "EC2 Instances"
                    : page === "monitoring"
                    ? "Monitoring"
                    : page === "deployments"
                    ? "Deployments"
                    : "Alerts"}
                </strong>
              </div>

              <h1>
                {page === "dashboard"
                  ? "Infrastructure Overview"
                  : page === "servers"
                  ? "EC2 Instances"
                  : page === "monitoring"
                  ? "AWS Monitoring"
                  : page === "deployments"
                  ? "Deployment Center"
                  : "Alerts & Notifications"}
              </h1>
            </div>
          </div>

          <div className="topbar-actions">
            <button
              className="icon-button"
              onClick={() =>
                setDarkMode(
                  (prev) => !prev
                )
              }
              title={
                darkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              type="button"
            >
              {darkMode
                ? "☀"
                : "☾"}
            </button>

            {unreadAlertCount > 0 && (
              <button
                className="icon-button"
                onClick={() => {
                  setPage("alerts");
                  loadAlerts();
                }}
                title="View alerts"
                type="button"
                style={{
                  position: "relative",
                }}
              >
                🔔

                <span
                  style={{
                    position:
                      "absolute",
                    top: "-4px",
                    right: "-4px",
                    minWidth: "17px",
                    height: "17px",
                    padding:
                      "0 4px",
                    borderRadius:
                      "999px",
                    background:
                      "#ef4444",
                    color:
                      "#ffffff",
                    fontSize:
                      "9px",
                    fontWeight:
                      "700",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                  }}
                >
                  {unreadAlertCount >
                  99
                    ? "99+"
                    : unreadAlertCount}
                </span>
              </button>
            )}

            <button
              className="refresh-button"
              onClick={() => {
                loadAllData();
                loadAlerts();
              }}
              disabled={
                loading ||
                alertsLoading
              }
              type="button"
            >
              ↻ <span>Refresh</span>
            </button>
          </div>
        </header>

        <div className="content-area">
          {error && (
            <div className="global-alert">
              <span>⚠</span>

              <span>{error}</span>

              <button
                onClick={() =>
                  setError("")
                }
                type="button"
              >
                ×
              </button>
            </div>
          )}

          {/* ================================================== */}
          {/* DASHBOARD                                         */}
          {/* ================================================== */}

          {page === "dashboard" && (
            <>
              <section className="welcome-row">
                <div>
                  <p className="eyebrow">
                    CLOUD OPERATIONS
                  </p>

                  <h2>
                    Good to see you.
                  </h2>

                  <p>
                    Monitor your AWS
                    infrastructure and
                    manage deployments
                    from one place.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() =>
                    setPage(
                      "deployments"
                    )
                  }
                >
                  + New Deployment
                </button>
              </section>

              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-top">
                    <span>
                      Total Servers
                    </span>

                    <span className="stat-icon blue">
                      ▣
                    </span>
                  </div>

                  <strong>
                    {totalServers}
                  </strong>

                  <small>
                    EC2 infrastructure
                  </small>
                </div>

                <div className="stat-card">
                  <div className="stat-card-top">
                    <span>
                      Running
                    </span>

                    <span className="stat-icon green">
                      ●
                    </span>
                  </div>

                  <strong>
                    {runningServers}
                  </strong>

                  <small>
                    Currently active
                  </small>
                </div>

                <div className="stat-card">
                  <div className="stat-card-top">
                    <span>
                      Stopped
                    </span>

                    <span className="stat-icon orange">
                      ■
                    </span>
                  </div>

                  <strong>
                    {stoppedServers}
                  </strong>

                  <small>
                    Currently stopped
                  </small>
                </div>

                <div className="stat-card">
                  <div className="stat-card-top">
                    <span>
                      Deployments
                    </span>

                    <span className="stat-icon purple">
                      ⇄
                    </span>
                  </div>

                  <strong>
                    {totalDeployments}
                  </strong>

                  <small>
                    All deployments
                  </small>
                </div>
              </section>

              <section className="dashboard-grid">
                <div className="panel large-panel">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">
                        COMPUTE
                      </p>

                      <h3>
                        EC2 Instances
                      </h3>
                    </div>

                    <button
                      className="text-button"
                      onClick={() =>
                        setPage(
                          "servers"
                        )
                      }
                    >
                      View all →
                    </button>
                  </div>

                  <div className="instance-list">
                    {servers.length === 0 ? (
                      <div className="empty-state">
                        No EC2 instances found.
                      </div>
                    ) : (
                      servers
                        .slice(0, 5)
                        .map(
                          (server) => (
                            <div
                              className="instance-row"
                              key={
                                server.id
                              }
                            >
                              <div className="instance-main">
                                <div className="instance-icon">
                                  EC2
                                </div>

                                <div>
                                  <strong>
                                    {
                                      server.name
                                    }
                                  </strong>

                                  <small>
                                    {server.server_type ||
                                      server.type ||
                                      "EC2 Instance"}
                                  </small>
                                </div>
                              </div>

                              <div className="instance-meta">
                                <span
                                  className={`status-badge ${getStatusClass(
                                    server.status ||
                                      server.state
                                  )}`}
                                >
                                  <span />

                                  {server.status ||
                                    server.state}
                                </span>

                                <span className="instance-ip">
                                  {server.ip_address ||
                                    server.public_ip ||
                                    "No public IP"}
                                </span>

                                {getServerStatus(
                                  server
                                ) ===
                                  "running" && (
                                  <button
                                    className="details-button"
                                    type="button"
                                    onClick={() =>
                                      loadMonitoring(
                                        server.id
                                      )
                                    }
                                    disabled={
                                      monitoringLoading[
                                        server.id
                                      ]
                                    }
                                  >
                                    {monitoringLoading[
                                      server.id
                                    ]
                                      ? "Loading..."
                                      : "Monitor"}
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        )
                    )}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">
                        CI/CD
                      </p>

                      <h3>
                        Deployment Overview
                      </h3>
                    </div>
                  </div>

                  <div className="deployment-summary">
                    <div>
                      <span>
                        Successful
                      </span>

                      <strong className="success-text">
                        {
                          successfulDeployments
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Failed
                      </span>

                      <strong className="failed-text">
                        {
                          failedDeployments
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Total
                      </span>

                      <strong>
                        {
                          totalDeployments
                        }
                      </strong>
                    </div>
                  </div>

                  <button
                    className="secondary-button full-width"
                    onClick={() =>
                      setPage(
                        "deployments"
                      )
                    }
                  >
                    Open Deployment Center
                  </button>
                </div>
              </section>

              {selectedMonitoringServer &&
                renderMonitoringPanel(
                  selectedMonitoringServer
                )}
            </>
          )}

          {/* ================================================== */}
          {/* EC2 SERVERS                                       */}
          {/* ================================================== */}

          {page === "servers" && (
            <>
              <section className="page-heading-row">
                <div>
                  <p className="eyebrow">
                    AWS COMPUTE
                  </p>

                  <h2>
                    EC2 Instances
                  </h2>

                  <p>
                    View, monitor and
                    control your connected
                    AWS instances.
                  </p>
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h3>
                      Instances
                    </h3>

                    <span className="panel-count">
                      {
                        filteredServers.length
                      }{" "}
                      instances
                    </span>
                  </div>

                  <div className="search-box">
                    <span>⌕</span>

                    <input
                      value={
                        searchServer
                      }
                      onChange={(
                        event
                      ) =>
                        setSearchServer(
                          event.target
                            .value
                        )
                      }
                      placeholder="Search instances..."
                    />
                  </div>
                </div>

                <div className="responsive-table">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          Instance
                        </th>

                        <th>
                          Type
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          IP Address
                        </th>

                        <th>
                          Server Type
                        </th>

                        <th>
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredServers.length ===
                      0 ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="table-empty"
                          >
                            No instances
                            found.
                          </td>
                        </tr>
                      ) : (
                        filteredServers.map(
                          (server) => (
                            <tr
                              key={
                                server.id
                              }
                            >
                              <td>
                                <div className="table-instance">
                                  <div className="instance-icon">
                                    EC2
                                  </div>

                                  <div>
                                    <strong>
                                      {
                                        server.name
                                      }
                                    </strong>

                                    <small>
                                      ID{" "}
                                      #
                                      {
                                        server.id
                                      }
                                    </small>
                                  </div>
                                </div>
                              </td>

                              <td>
                                {server.instance_type ||
                                  server.type ||
                                  "—"}
                              </td>

                              <td>
                                <span
                                  className={`status-badge ${getStatusClass(
                                    server.status ||
                                      server.state
                                  )}`}
                                >
                                  <span />

                                  {server.status ||
                                    server.state}
                                </span>
                              </td>

                              <td>
                                {server.ip_address ||
                                  server.public_ip ||
                                  "—"}
                              </td>

                              <td>
                                {server.server_type ||
                                  "—"}
                              </td>

                              <td>
                                <div
                                  className="table-actions"
                                  style={{
                                    flexWrap:
                                      "wrap",
                                  }}
                                >
                                  {getServerStatus(
                                    server
                                  ) ===
                                  "running" ? (
                                    <>
                                      <button
                                        className="danger-outline-button"
                                        onClick={() =>
                                          stopServer(
                                            server.id
                                          )
                                        }
                                      >
                                        Stop
                                      </button>

                                      <button
                                        className="details-button"
                                        onClick={() =>
                                          loadMonitoring(
                                            server.id
                                          )
                                        }
                                        disabled={
                                          monitoringLoading[
                                            server.id
                                          ]
                                        }
                                      >
                                        {monitoringLoading[
                                          server.id
                                        ]
                                          ? "Loading..."
                                          : "Monitor"}
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      className="success-outline-button"
                                      onClick={() =>
                                        startServer(
                                          server.id
                                        )
                                      }
                                    >
                                      Start
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {selectedMonitoringServer &&
                renderMonitoringPanel(
                  selectedMonitoringServer
                )}
            </>
          )}

          {/* ================================================== */}
          {/* MONITORING                                        */}
          {/* ================================================== */}

          {page === "monitoring" && (
            <>
              <section className="page-heading-row">
                <div>
                  <p className="eyebrow">
                    AMAZON CLOUDWATCH
                  </p>

                  <h2>
                    AWS Monitoring
                  </h2>

                  <p>
                    Monitor CPU, network and
                    EBS activity for your
                    EC2 instances.
                  </p>
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h3>
                      Select EC2 Instance
                    </h3>

                    <span className="panel-count">
                      {
                        servers.filter(
                          (server) =>
                            getServerStatus(
                              server
                            ) ===
                            "running"
                        ).length
                      }{" "}
                      running instances
                    </span>
                  </div>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={loadAllData}
                    disabled={loading}
                  >
                    ↻ Refresh Instances
                  </button>
                </div>

                <div className="instance-list">
                  {servers.length === 0 ? (
                    <div className="empty-state">
                      No EC2 instances found.
                    </div>
                  ) : (
                    servers.map(
                      (server) => (
                        <div
                          className="instance-row"
                          key={
                            server.id
                          }
                        >
                          <div className="instance-main">
                            <div className="instance-icon">
                              EC2
                            </div>

                            <div>
                              <strong>
                                {
                                  server.name
                                }
                              </strong>

                              <small>
                                {
                                  server.id
                                }
                              </small>
                            </div>
                          </div>

                          <div className="instance-meta">
                            <span
                              className={`status-badge ${getStatusClass(
                                server.status ||
                                  server.state
                              )}`}
                            >
                              <span />

                              {server.status ||
                                server.state}
                            </span>

                            <button
                              className="details-button"
                              type="button"
                              disabled={
                                getServerStatus(
                                  server
                                ) !==
                                  "running" ||
                                monitoringLoading[
                                  server.id
                                ]
                              }
                              onClick={() =>
                                loadMonitoring(
                                  server.id
                                )
                              }
                            >
                              {monitoringLoading[
                                server.id
                              ]
                                ? "Loading..."
                                : "View Metrics"}
                            </button>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </section>

              {selectedMonitoringServer &&
                renderMonitoringPanel(
                  selectedMonitoringServer
                )}
            </>
          )}

          {/* ================================================== */}
          {/* DEPLOYMENTS                                       */}
          {/* ================================================== */}

          {page === "deployments" && (
            <>
              <section className="page-heading-row">
                <div>
                  <p className="eyebrow">
                    CI/CD PIPELINE
                  </p>

                  <h2>
                    Deployment Center
                  </h2>

                  <p>
                    Create, monitor and
                    inspect your
                    application
                    deployments.
                  </p>
                </div>
              </section>

              <section className="deployment-layout">
                <div className="panel deployment-create-panel">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">
                        NEW RELEASE
                      </p>

                      <h3>
                        Create Deployment
                      </h3>
                    </div>
                  </div>

                  <form
                    className="deployment-form"
                    onSubmit={
                      createDeployment
                    }
                  >
                    <label>
                      Application

                      <input
                        value={
                          deploymentForm.application
                        }
                        onChange={(
                          event
                        ) =>
                          setDeploymentForm(
                            {
                              ...deploymentForm,
                              application:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        placeholder="CloudOps Automator"
                        required
                      />
                    </label>

                    <label>
                      Version

                      <input
                        value={
                          deploymentForm.version
                        }
                        onChange={(
                          event
                        ) =>
                          setDeploymentForm(
                            {
                              ...deploymentForm,
                              version:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        placeholder="v1.0.0"
                        required
                      />
                    </label>

                    <label>
                      Server Name

                      <input
                        value={
                          deploymentForm.server_name
                        }
                        onChange={(
                          event
                        ) =>
                          setDeploymentForm(
                            {
                              ...deploymentForm,
                              server_name:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        placeholder="Production Server"
                      />
                    </label>

                    <label>
                      EC2 Instance ID

                      <input
                        value={
                          deploymentForm.ec2_instance_id
                        }
                        onChange={(
                          event
                        ) =>
                          setDeploymentForm(
                            {
                              ...deploymentForm,
                              ec2_instance_id:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        placeholder="i-0123456789abcdef"
                      />
                    </label>

                    <button
                      className="primary-button full-width"
                      type="submit"
                      disabled={loading}
                    >
                      {loading
                        ? "Starting Deployment..."
                        : "Start Deployment →"}
                    </button>
                  </form>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">
                        ACTIVITY
                      </p>

                      <h3>
                        Deployment History
                      </h3>
                    </div>

                    <div className="search-box">
                      <span>⌕</span>

                      <input
                        value={
                          searchDeployment
                        }
                        onChange={(
                          event
                        ) =>
                          setSearchDeployment(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Search..."
                      />
                    </div>
                  </div>

                  <div className="responsive-table">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>

                          <th>
                            Application
                          </th>

                          <th>
                            Version
                          </th>

                          <th>
                            Server
                          </th>

                          <th>
                            Status
                          </th>

                          <th>
                            Created
                          </th>

                          <th>
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredDeployments.length ===
                        0 ? (
                          <tr>
                            <td
                              colSpan="7"
                              className="table-empty"
                            >
                              No deployments
                              found.
                            </td>
                          </tr>
                        ) : (
                          filteredDeployments.map(
                            (
                              deployment
                            ) => (
                              <tr
                                key={
                                  deployment.id
                                }
                              >
                                <td>
                                  #
                                  {
                                    deployment.id
                                  }
                                </td>

                                <td>
                                  <strong>
                                    {
                                      deployment.application
                                    }
                                  </strong>
                                </td>

                                <td>
                                  {
                                    deployment.version
                                  }
                                </td>

                                <td>
                                  {
                                    deployment.server_name ||
                                    "—"
                                  }
                                </td>

                                <td>
                                  <span
                                    className={`status-badge ${getStatusClass(
                                      deployment.status
                                    )}`}
                                  >
                                    <span />

                                    {
                                      deployment.status
                                    }
                                  </span>
                                </td>

                                <td>
                                  {formatDate(
                                    deployment.created_at
                                  )}
                                </td>

                                <td>
                                  <div className="table-actions">
                                    <button
                                      className="details-button"
                                      onClick={() =>
                                        viewDeploymentDetails(
                                          deployment.id
                                        )
                                      }
                                    >
                                      View Details
                                    </button>

                                    <button
                                      className="delete-button"
                                      onClick={() =>
                                        deleteDeployment(
                                          deployment.id
                                        )
                                      }
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {selectedDeployment && (
                <section className="panel deployment-details-panel">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">
                        DEPLOYMENT #
                        {
                          selectedDeployment.id
                        }
                      </p>

                      <h3>
                        Deployment Details
                      </h3>
                    </div>

                    <button
                      className="secondary-button"
                      onClick={() =>
                        setSelectedDeployment(
                          null
                        )
                      }
                    >
                      Close
                    </button>
                  </div>

                  {deploymentDetailsLoading ? (
                    <div className="loading-state">
                      Loading deployment
                      details...
                    </div>
                  ) : (
                    <>
                      <div className="details-grid">
                        <div className="detail-item">
                          <span>
                            Application
                          </span>

                          <strong>
                            {
                              selectedDeployment.application ||
                              "—"
                            }
                          </strong>
                        </div>

                        <div className="detail-item">
                          <span>
                            Version
                          </span>

                          <strong>
                            {
                              selectedDeployment.version ||
                              "—"
                            }
                          </strong>
                        </div>

                        <div className="detail-item">
                          <span>
                            Server
                          </span>

                          <strong>
                            {
                              selectedDeployment.server_name ||
                              "—"
                            }
                          </strong>
                        </div>

                        <div className="detail-item">
                          <span>
                            EC2 ID
                          </span>

                          <strong>
                            {
                              selectedDeployment.ec2_instance_id ||
                              "—"
                            }
                          </strong>
                        </div>

                        <div className="detail-item">
                          <span>
                            Status
                          </span>

                          <span
                            className={`status-badge ${getStatusClass(
                              selectedDeployment.status
                            )}`}
                          >
                            <span />

                            {
                              selectedDeployment.status
                            }
                          </span>
                        </div>

                        <div className="detail-item">
                          <span>
                            Created
                          </span>

                          <strong>
                            {formatDate(
                              selectedDeployment.created_at
                            )}
                          </strong>
                        </div>

                        <div className="detail-item">
                          <span>
                            Started
                          </span>

                          <strong>
                            {formatDate(
                              selectedDeployment.started_at
                            )}
                          </strong>
                        </div>

                        <div className="detail-item">
                          <span>
                            Completed
                          </span>

                          <strong>
                            {formatDate(
                              selectedDeployment.completed_at
                            )}
                          </strong>
                        </div>
                      </div>

                      <div className="logs-section">
                        <div className="logs-header">
                          <div>
                            <p className="eyebrow">
                              EXECUTION OUTPUT
                            </p>

                            <h4>
                              Deployment Logs
                            </h4>
                          </div>
                        </div>

                        <pre className="deployment-logs">
                          {selectedDeployment.logs ||
                            "No deployment logs available."}
                        </pre>
                      </div>
                    </>
                  )}
                </section>
              )}
            </>
          )}

          {/* ================================================== */}
          {/* ALERTS                                             */}
          {/* ================================================== */}

          {page === "alerts" &&
            renderAlertsPage()}
        </div>
      </main>
    </div>
  );
}

export default App;