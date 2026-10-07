import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const TOKEN_KEY = "access_token";

/* =========================
   ICONS
========================= */

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    server: (
      <>
        <rect x="3" y="4" width="18" height="7" rx="1.5" />
        <rect x="3" y="13" width="18" height="7" rx="1.5" />
        <path d="M7 7.5h.01M7 16.5h.01" />
        <path d="M11 7.5h7M11 16.5h7" />
      </>
    ),
    monitor: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <path d="m7 12 3-3 3 3 4-5" />
      </>
    ),
    deployment: (
      <>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
        <path d="M5 17v4M19 17v4" />
      </>
    ),
    alert: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10" />
        <path d="M3 5v5h5" />
        <path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14" />
        <path d="M21 19v-5h-5" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 19V5a2 2 0 0 0-2-2h-5" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    play: <path d="m9 6 10 6-10 6V6Z" />,
    stop: <rect x="7" y="7" width="10" height="10" rx="1" />,
    trash: (
      <>
        <path d="M4 7h16M10 11v6M14 11v6" />
        <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    check: <path d="m5 12 4 4L19 6" />,
    warning: (
      <>
        <path d="M12 3 22 20H2L12 3Z" />
        <path d="M12 9v5M12 17h.01" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),
    cloud: (
      <path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 8.5 4.5 4.5 0 0 0 7 18Z" />
    ),
    shield: (
      <>
        <path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    activity: <path d="M3 12h4l2-7 4 14 2-7h6" />,
    cpu: (
      <>
        <rect x="7" y="7" width="10" height="10" rx="1" />
        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
      </>
    ),
    network: (
      <>
        <rect x="9" y="3" width="6" height="5" rx="1" />
        <rect x="3" y="16" width="6" height="5" rx="1" />
        <rect x="15" y="16" width="6" height="5" rx="1" />
        <path d="M12 8v4M6 16v-2h12v2" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="5" rx="7" ry="3" />
        <path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
        <path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    terminal: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="m7 9 3 3-3 3M12 15h5" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  };

  return <svg {...common}>{icons[name] || icons.info}</svg>;
}

/* =========================
   HELPERS
========================= */

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function normalizeStatus(value) {
  return String(value || "unknown").toLowerCase();
}

function getServerStatus(server) {
  return normalizeStatus(server?.status || server?.state);
}

function getServerIp(server) {
  return server?.ip_address || server?.public_ip || "No Public IP";
}

function getServerType(server) {
  return (
    server?.instance_type ||
    server?.server_type ||
    server?.type ||
    "EC2"
  );
}

function getInstanceId(server) {
  return (
    server?.instance_id ||
    server?.ec2_instance_id ||
    server?.id
  );
}

function getStatusClass(status) {
  const value = normalizeStatus(status);

  if (
    ["running", "successful", "success", "active"].includes(value)
  ) {
    return "badge-success";
  }

  if (
    ["failed", "error", "critical"].includes(value)
  ) {
    return "badge-danger";
  }

  if (
    [
      "pending",
      "stopped",
      "warning",
      "starting",
      "stopping",
      "info",
    ].includes(value)
  ) {
    return value === "warning"
      ? "badge-warning"
      : "badge-stopped";
  }

  return "badge-neutral";
}

function getAlertIcon(type) {
  if (type === "deployment_failed") return "warning";
  if (type === "deployment_successful") return "check";
  if (type === "high_cpu") return "cpu";
  if (type === "server_stopped") return "server";
  return "info";
}

function StatusBadge({ status }) {
  return (
    <span className={`badge ${getStatusClass(status)}`}>
      <span className="badge-dot" />
      {String(status || "unknown").replaceAll("_", " ")}
    </span>
  );
}

/* =========================
   APP
========================= */

function DeploymentModal({ showDeploymentForm, setShowDeploymentForm, deploymentForm, setDeploymentForm, createDeployment }) {
    if (!showDeploymentForm) return null;

    return (
      <div className="modal-backdrop">
        <div className="modal">
          <div className="modal-header">
            <div>
              <h2 className="modal-title">
                Create deployment
              </h2>

              <p className="panel-subtitle">
                Create a new deployment record.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() =>
                setShowDeploymentForm(false)
              }
            >
              <Icon
                name="close"
                size={16}
              />
            </button>
          </div>

          <form
            onSubmit={createDeployment}
          >
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">
                    Application
                  </label>

                  <input
                    className="form-input"
                    value={
                      deploymentForm.application
                    }
                    onChange={(event) =>
                      setDeploymentForm({
                        ...deploymentForm,
                        application:
                          event.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Version
                  </label>

                  <input
                    className="form-input"
                    value={
                      deploymentForm.version
                    }
                    onChange={(event) =>
                      setDeploymentForm({
                        ...deploymentForm,
                        version:
                          event.target.value,
                      })
                    }
                    placeholder="v1.0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Server name
                  </label>

                  <input
                    className="form-input"
                    value={
                      deploymentForm.server_name
                    }
                    onChange={(event) =>
                      setDeploymentForm({
                        ...deploymentForm,
                        server_name:
                          event.target.value,
                      })
                    }
                    placeholder="EC2 server"
                  />
                </div>

                <div className="form-group full">
                  <label className="form-label">
                    EC2 Instance ID
                  </label>

                  <input
                    className="form-input"
                    value={
                      deploymentForm.ec2_instance_id
                    }
                    onChange={(event) =>
                      setDeploymentForm({
                        ...deploymentForm,
                        ec2_instance_id:
                          event.target.value,
                      })
                    }
                    placeholder="i-xxxxxxxxxxxxxxxxx"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  setShowDeploymentForm(
                    false
                  )
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
              >
                <Icon
                  name="deployment"
                  size={14}
                />
                Create deployment
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

export default function App() {
  const [token, setToken] = useState(() =>
    localStorage.getItem(TOKEN_KEY)
  );

  const [page, setPage] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [servers, setServers] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [monitoring, setMonitoring] = useState(null);

  const [loading, setLoading] = useState(false);
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [authMode, setAuthMode] = useState("login");

  const [search, setSearch] = useState("");
  const [deploymentSearch, setDeploymentSearch] = useState("");
  const [deploymentFilter, setDeploymentFilter] = useState("all");

  const [showDeploymentForm, setShowDeploymentForm] =
    useState(false);

  const [selectedDeployment, setSelectedDeployment] =
    useState(null);

  const [deploymentLogs, setDeploymentLogs] = useState("");

  const [deploymentForm, setDeploymentForm] = useState({
    application: "CloudOps Automator",
    version: "v1.0",
    server_name: "",
    ec2_instance_id: "",
  });

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    if (!token) return;

    loadAllData();
    loadAlerts();
  }, [token]);

  /* =========================
     API
  ========================= */

  async function apiFetch(endpoint, options = {}) {
    const headers = {
      ...(options.headers || {}),
    };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (storedToken) {
      headers.Authorization = `Bearer ${storedToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      throw new Error("Session expired. Please sign in again.");
    }

    if (!response.ok) {
      throw new Error(
        data?.detail ||
          data?.message ||
          data?.error ||
          "Something went wrong."
      );
    }

    return data;
  }

  async function loadAllData(showLoader = false) {
    if (showLoader) setLoading(true);

    try {
      const [serverData, dashboardData, deploymentData] =
        await Promise.all([
          apiFetch("/servers/"),
          apiFetch("/dashboard/"),
          apiFetch("/deployments/"),
        ]);

      setServers(
        Array.isArray(serverData)
          ? serverData
          : serverData?.servers ||
              serverData?.results ||
              []
      );

      setDashboard(dashboardData);

      setDeployments(
        Array.isArray(deploymentData)
          ? deploymentData
          : deploymentData?.deployments ||
              deploymentData?.results ||
              []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  async function loadAlerts() {
    try {
      const data = await apiFetch("/alerts/");

      setAlerts(
        Array.isArray(data)
          ? data
          : data?.alerts || data?.results || []
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function refreshData() {
    setError("");
    setMessage("");

    await loadAllData(true);
    await loadAlerts();

    setMessage("Workspace refreshed.");
  }

  /* =========================
     AUTH
  ========================= */

  async function login(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/auth/login/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginForm),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.detail ||
            result?.message ||
            result?.error ||
            "Invalid username or password."
        );
      }

      const accessToken =
        result.access || result.access_token;

      if (!accessToken) {
        throw new Error(
          "Login succeeded but no access token was returned."
        );
      }

      localStorage.setItem(TOKEN_KEY, accessToken);
      setToken(accessToken);
      setPage("dashboard");

      setLoginForm({
        username: "",
        password: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function register(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/auth/register/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registerForm),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            data?.error ||
            "Registration failed."
        );
      }

      setMessage(
        "Account created successfully. You can now sign in."
      );

      setAuthMode("login");

      setLoginForm({
        username: registerForm.username,
        password: "",
      });

      setRegisterForm({
        username: "",
        email: "",
        password: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);

    setToken(null);
    setServers([]);
    setDeployments([]);
    setAlerts([]);
    setDashboard(null);
    setMonitoring(null);
    setPage("dashboard");
  }

  /* =========================
     EC2
  ========================= */

  async function startServer(id) {
    setError("");
    setMessage("");

    try {
      await apiFetch(`/servers/${id}/start/`, {
        method: "POST",
      });

      setMessage("EC2 instance start request sent.");

      await loadAllData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function stopServer(id) {
    setError("");
    setMessage("");

    try {
      await apiFetch(`/servers/${id}/stop/`, {
        method: "POST",
      });

      setMessage("EC2 instance stop request sent.");

      await loadAllData();
      await loadAlerts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadMonitoring(instanceId) {
    if (!instanceId) return;

    setMonitoringLoading(true);
    setError("");

    try {
      const data = await apiFetch(
        `/monitoring/${instanceId}/`
      );

      setMonitoring(data);
      setPage("monitoring");
    } catch (err) {
      setError(err.message);
    } finally {
      setMonitoringLoading(false);
    }
  }

  /* =========================
     ALERTS
  ========================= */

  async function markAlertRead(id) {
    try {
      await apiFetch(`/alerts/${id}/read/`, {
        method: "PATCH",
      });

      await loadAlerts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function markAllAlertsRead() {
    try {
      const unread = alerts.filter(
        (alert) => !alert.is_read
      );

      for (const alert of unread) {
        await apiFetch(`/alerts/${alert.id}/read/`, {
          method: "PATCH",
        });
      }

      await loadAlerts();
      setMessage("All alerts marked as read.");
    } catch (err) {
      setError(err.message);
    }
  }

  /* =========================
     DEPLOYMENTS
  ========================= */

  async function createDeployment(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    try {
      const data = await apiFetch("/deployments/", {
        method: "POST",
        body: JSON.stringify(deploymentForm),
      });

      setDeployments((current) => [data, ...current]);
      setShowDeploymentForm(false);

      setDeploymentForm({
        application: "CloudOps Automator",
        version: "v1.0",
        server_name: "",
        ec2_instance_id: "",
      });

      setMessage("Deployment created and queued.");

      await loadAllData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteDeployment(id) {
    if (
      !window.confirm(
        "Delete this deployment record?"
      )
    ) {
      return;
    }

    try {
      await apiFetch(`/deployments/${id}/`, {
        method: "DELETE",
      });

      setDeployments((current) =>
        current.filter(
          (deployment) => deployment.id !== id
        )
      );

      setSelectedDeployment(null);
      setDeploymentLogs("");

      setMessage("Deployment deleted.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function viewDeploymentDetails(id) {
    try {
      const data = await apiFetch(
        `/deployments/${id}/`
      );

      setSelectedDeployment(data);
      setDeploymentLogs(data?.logs || "");
    } catch (err) {
      setError(err.message);
    }
  }

  /* =========================
     NAVIGATION
  ========================= */

  function navigate(nextPage) {
    setPage(nextPage);
    setMobileMenu(false);
    setError("");
    setMessage("");
  }

  /* =========================
     DATA
  ========================= */

  const unreadAlerts = alerts.filter(
    (alert) => !alert.is_read
  ).length;

  const filteredServers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return servers;

    return servers.filter((server) => {
      const text = [
        server?.name,
        server?.status,
        server?.state,
        server?.ip_address,
        server?.public_ip,
        server?.instance_type,
        server?.server_type,
        server?.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(value);
    });
  }, [servers, search]);

  const filteredDeployments = useMemo(() => {
    const value =
      deploymentSearch.trim().toLowerCase();

    return deployments.filter((deployment) => {
      const matchesSearch =
        !value ||
        [
          deployment?.application,
          deployment?.version,
          deployment?.server_name,
          deployment?.ec2_instance_id,
          deployment?.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(value);

      const matchesFilter =
        deploymentFilter === "all" ||
        normalizeStatus(deployment?.status) ===
          deploymentFilter;

      return matchesSearch && matchesFilter;
    });
  }, [
    deployments,
    deploymentSearch,
    deploymentFilter,
  ]);

  const stats = useMemo(() => {
    const running = servers.filter(
      (server) =>
        getServerStatus(server) === "running"
    ).length;

    const stopped = servers.filter(
      (server) =>
        getServerStatus(server) === "stopped"
    ).length;

    const successful = deployments.filter(
      (deployment) =>
        normalizeStatus(deployment.status) ===
        "successful"
    ).length;

    const failed = deployments.filter(
      (deployment) =>
        normalizeStatus(deployment.status) ===
        "failed"
    ).length;

    return {
      totalServers: servers.length,
      running,
      stopped,
      deployments: deployments.length,
      successful,
      failed,
    };
  }, [servers, deployments]);

  /* =========================
     AUTH SCREEN
  ========================= */

  if (!token) {
    return (
      <div className="auth-page">
        <section className="auth-info">
          <div className="auth-eyebrow">
            CLOUD OPERATIONS
          </div>

          <h1 className="auth-title">
            CloudOps
            <br />
            Automator
          </h1>

          <p className="auth-description">
            AWS & DevOps Management Platform.
            <br />
            Monitor infrastructure, manage EC2
            resources and organize deployments from
            one centralized workspace.
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-title">
                EC2 infrastructure management
              </div>
              <div className="auth-feature-text">
                View and control AWS compute resources.
              </div>
            </div>

            <div className="auth-feature">
              <div className="auth-feature-title">
                CloudWatch monitoring
              </div>
              <div className="auth-feature-text">
                Monitor infrastructure performance.
              </div>
            </div>

            <div className="auth-feature">
              <div className="auth-feature-title">
                Automated deployments
              </div>
              <div className="auth-feature-text">
                Manage application releases.
              </div>
            </div>

            <div className="auth-feature">
              <div className="auth-feature-title">
                Infrastructure alerts
              </div>
              <div className="auth-feature-text">
                Stay informed about cloud events.
              </div>
            </div>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2 className="auth-card-title">
                {authMode === "login"
                  ? "Sign in"
                  : "Create account"}
              </h2>

              <p className="auth-card-subtitle">
                {authMode === "login"
                  ? "Sign in to your secure cloud workspace."
                  : "Create an account to access CloudOps Automator."}
              </p>
            </div>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            {message && (
              <div className="form-success">
                {message}
              </div>
            )}

            {authMode === "login" ? (
              <form
                className="auth-form"
                onSubmit={login}
              >
                <div className="form-group">
                  <label className="form-label">
                    Username
                  </label>

                  <input
                    className="form-input"
                    type="text"
                    value={loginForm.username}
                    onChange={(event) =>
                      setLoginForm({
                        ...loginForm,
                        username:
                          event.target.value,
                      })
                    }
                    placeholder="Enter username"
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Password
                  </label>

                  <input
                    className="form-input"
                    type="password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm({
                        ...loginForm,
                        password:
                          event.target.value,
                      })
                    }
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <button
                  className="btn btn-primary auth-submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Signing in..."
                    : "Sign in"}
                </button>

                <div className="auth-switch">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setError("");
                      setMessage("");
                    }}
                  >
                    Create account
                  </button>
                </div>
              </form>
            ) : (
              <form
                className="auth-form"
                onSubmit={register}
              >
                <div className="form-group">
                  <label className="form-label">
                    Username
                  </label>

                  <input
                    className="form-input"
                    type="text"
                    value={registerForm.username}
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        username:
                          event.target.value,
                      })
                    }
                    placeholder="Choose username"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Email
                  </label>

                  <input
                    className="form-input"
                    type="email"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        email: event.target.value,
                      })
                    }
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Password
                  </label>

                  <input
                    className="form-input"
                    type="password"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        password:
                          event.target.value,
                      })
                    }
                    placeholder="Create password"
                    required
                  />
                </div>

                <button
                  className="btn btn-primary auth-submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Creating..."
                    : "Create account"}
                </button>

                <div className="auth-switch">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setError("");
                      setMessage("");
                    }}
                  >
                    Sign in
                  </button>
                </div>
              </form>
            )}

            <div className="auth-security">
              <Icon name="shield" size={15} />
              Secure cloud workspace
            </div>
          </div>
        </section>
      </div>
    );
  }

  /* =========================
     SIDEBAR
  ========================= */

  function Sidebar() {
    const items = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "dashboard",
      },
      {
        id: "servers",
        label: "EC2 Instances",
        icon: "server",
      },
      {
        id: "monitoring",
        label: "Monitoring",
        icon: "monitor",
      },
      {
        id: "deployments",
        label: "Deployments",
        icon: "deployment",
      },
      {
        id: "alerts",
        label: "Alerts",
        icon: "alert",
      },
    ];

    return (
      <aside
        className={`sidebar ${
          mobileMenu ? "open" : ""
        }`}
      >
        <div className="sidebar-header">
          <div className="logo-mark">
            <Icon name="cloud" size={19} />
          </div>

          <div>
            <div className="logo-text">
              CloudOps Automator
            </div>
            <div className="logo-subtitle">
              Cloud Management
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">
            Workspace
          </div>

          {items.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`nav-item ${
                page === item.id ? "active" : ""
              }`}
              onClick={() => navigate(item.id)}
            >
              <span className="nav-icon">
                <Icon
                  name={item.icon}
                  size={17}
                />
              </span>

              <span>{item.label}</span>

              {item.id === "alerts" &&
                unreadAlerts > 0 && (
                  <span
                    style={{
                      marginLeft: "auto",
                      minWidth: 20,
                      padding: "2px 6px",
                      borderRadius: 999,
                      background: "#2563eb",
                      color: "#fff",
                      fontSize: 10,
                      textAlign: "center",
                    }}
                  >
                    {unreadAlerts}
                  </span>
                )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-status">
            <span className="status-dot" />
            AWS infrastructure connected
          </div>

          <button
            type="button"
            className="nav-item"
            style={{ marginTop: 8 }}
            onClick={logout}
          >
            <span className="nav-icon">
              <Icon name="logout" size={17} />
            </span>
            Logout
          </button>
        </div>
      </aside>
    );
  }

  /* =========================
     TOPBAR
  ========================= */

  function Topbar() {
    const titles = {
      dashboard: [
        "Dashboard",
        "Infrastructure overview",
      ],
      servers: [
        "EC2 Instances",
        "Manage compute resources",
      ],
      monitoring: [
        "Monitoring",
        "CloudWatch infrastructure metrics",
      ],
      deployments: [
        "Deployments",
        "Manage application releases",
      ],
      alerts: [
        "Alerts",
        "Infrastructure notifications",
      ],
    };

    const current = titles[page] || titles.dashboard;

    return (
      <header className="topbar">
        <div className="topbar-left">
          <button
            type="button"
            className="btn btn-ghost mobile-menu-button"
            onClick={() => setMobileMenu(true)}
          >
            <Icon name="menu" size={20} />
          </button>

          <div>
            <h2 className="page-title">
              {current[0]}
            </h2>

            <p className="page-subtitle">
              {current[1]}
            </p>
          </div>
        </div>

        <div className="topbar-right">
          <div className="aws-status">
            <span className="status-dot" />
            AWS Connected
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={refreshData}
            disabled={loading}
          >
            <Icon name="refresh" size={14} />
            Refresh
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate("alerts")}
          >
            <Icon name="alert" size={15} />
            {unreadAlerts > 0
              ? `${unreadAlerts} alerts`
              : "Alerts"}
          </button>
        </div>
      </header>
    );
  }

  /* =========================
     PAGE HEADER
  ========================= */

  function PageHeader({
    eyebrow,
    title,
    description,
    action,
  }) {
    return (
      <div className="page-header">
        <div>
          {eyebrow && (
            <div
              style={{
                marginBottom: 7,
                color: "#60a5fa",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.1em",
              }}
            >
              {eyebrow}
            </div>
          )}

          <h1>{title}</h1>

          {description && <p>{description}</p>}
        </div>

        {action && (
          <div className="page-actions">
            {action}
          </div>
        )}
      </div>
    );
  }

  /* =========================
     STAT CARD
  ========================= */

  function StatCard({
    label,
    value,
    description,
    icon,
  }) {
    return (
      <div className="stat-card">
        <div className="stat-card-top">
          <span className="stat-label">
            {label}
          </span>

          <span className="stat-icon">
            <Icon name={icon} size={17} />
          </span>
        </div>

        <div className="stat-value">{value}</div>

        <div className="stat-description">
          {description}
        </div>
      </div>
    );
  }

  /* =========================
     DASHBOARD
  ========================= */

  function renderDashboard() {
    return (
      <div className="content">
        <PageHeader
          eyebrow="CLOUD OPERATIONS"
          title="Infrastructure at a glance."
          description="Monitor your AWS infrastructure and manage deployments from one centralized workspace."
          action={
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                navigate("deployments")
              }
            >
              <Icon name="plus" size={15} />
              New Deployment
            </button>
          }
        />

        {error && (
          <div className="form-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {message && (
          <div
            className="form-success"
            style={{ marginBottom: 16 }}
          >
            {message}
          </div>
        )}

        <div className="stats-grid">
          <StatCard
            label="Total Servers"
            value={stats.totalServers}
            description="EC2 infrastructure"
            icon="server"
          />

          <StatCard
            label="Running"
            value={stats.running}
            description="Currently active"
            icon="activity"
          />

          <StatCard
            label="Stopped"
            value={stats.stopped}
            description="Currently stopped"
            icon="stop"
          />

          <StatCard
            label="Deployments"
            value={stats.deployments}
            description="All deployments"
            icon="deployment"
          />
        </div>

        <div className="grid-2">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">
                  EC2 Instances
                </h2>

                <p className="panel-subtitle">
                  AWS compute infrastructure
                </p>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  navigate("servers")
                }
              >
                View all
                <Icon name="arrow" size={13} />
              </button>
            </div>

            {servers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Icon name="server" size={20} />
                </div>

                <h3>No EC2 instances found</h3>

                <p>
                  Connect your AWS environment to
                  view infrastructure.
                </p>
              </div>
            ) : (
              <div className="deployment-list">
                {servers.slice(0, 5).map((server) => {
                  const status =
                    getServerStatus(server);

                  return (
                    <div
                      className="deployment-item"
                      key={server.id}
                    >
                      <div className="deployment-main">
                        <div className="deployment-name">
                          {server.name ||
                            "Unnamed instance"}
                        </div>

                        <div className="deployment-meta">
                          {getServerType(server)}
                          {" • "}
                          {getServerIp(server)}
                        </div>
                      </div>

                      <StatusBadge
                        status={status}
                      />

                      {status === "running" && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            loadMonitoring(
                              getInstanceId(
                                server
                              )
                            )
                          }
                        >
                          Monitor
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">
                  Deployment Overview
                </h2>

                <p className="panel-subtitle">
                  CI/CD deployment health
                </p>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  navigate("deployments")
                }
              >
                Details
                <Icon name="arrow" size={13} />
              </button>
            </div>

            <div className="panel-body">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: 12,
                }}
              >
                <div className="metric-card">
                  <div className="metric-label">
                    Successful
                  </div>

                  <div
                    className="metric-value"
                    style={{
                      color: "#22c55e",
                    }}
                  >
                    {stats.successful}
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">
                    Failed
                  </div>

                  <div
                    className="metric-value"
                    style={{
                      color: "#ef4444",
                    }}
                  >
                    {stats.failed}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginBottom: 8,
                    color: "#94a3b8",
                    fontSize: 11,
                  }}
                >
                  <span>
                    Deployment health
                  </span>

                  <strong
                    style={{
                      color: "#f8fafc",
                    }}
                  >
                    {stats.deployments
                      ? Math.round(
                          (stats.successful /
                            stats.deployments) *
                            100
                        )
                      : 0}
                    %
                  </strong>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${
                        stats.deployments
                          ? (stats.successful /
                              stats.deployments) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {dashboard && (
          <section
            className="panel"
            style={{ marginTop: 18 }}
          >
            <div className="panel-body">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div className="stat-icon">
                  <Icon
                    name="cloud"
                    size={18}
                  />
                </div>

                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    AWS Infrastructure
                  </div>

                  <div
                    style={{
                      marginTop: 3,
                      color: "#94a3b8",
                      fontSize: 11,
                    }}
                  >
                    CloudOps Automator is connected
                    to your AWS environment.
                  </div>
                </div>

                <span
                  className="badge badge-success"
                  style={{
                    marginLeft: "auto",
                  }}
                >
                  <span className="badge-dot" />
                  Online
                </span>
              </div>
            </div>
          </section>
        )}
      </div>
    );
  }

  /* =========================
     SERVERS
  ========================= */

  function renderServersPage() {
    return (
      <div className="content">
        <PageHeader
          eyebrow="COMPUTE"
          title="EC2 Instances"
          description="View and control your AWS compute infrastructure."
        />

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              position: "relative",
              flex: 1,
              maxWidth: 420,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 11,
                top: 10,
                color: "#64748b",
              }}
            >
              <Icon name="search" size={16} />
            </div>

            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search instances..."
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: "#64748b",
              fontSize: 11,
            }}
          >
            {filteredServers.length} instance
            {filteredServers.length !== 1
              ? "s"
              : ""}
          </div>
        </div>

        <section className="panel">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Instance</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Public IP</th>
                  <th>Instance ID</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredServers.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <div className="empty-icon">
                          <Icon
                            name="server"
                            size={20}
                          />
                        </div>
                        <h3>
                          No instances found
                        </h3>
                        <p>
                          Try changing your search.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredServers.map((server) => {
                    const status =
                      getServerStatus(server);

                    return (
                      <tr key={server.id}>
                        <td>
                          <div className="instance-name">
                            {server.name ||
                              "Unnamed instance"}
                          </div>

                          <div className="instance-meta">
                            AWS EC2
                          </div>
                        </td>

                        <td>
                          {getServerType(server)}
                        </td>

                        <td>
                          <StatusBadge
                            status={status}
                          />
                        </td>

                        <td>
                          {getServerIp(server)}
                        </td>

                        <td>
                          <span
                            style={{
                              fontFamily:
                                "monospace",
                              color:
                                "#64748b",
                              fontSize: 11,
                            }}
                          >
                            {server.id || "—"}
                          </span>
                        </td>

                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: 7,
                            }}
                          >
                            {status ===
                              "running" ? (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() =>
                                    loadMonitoring(
                                      getInstanceId(
                                        server
                                      )
                                    )
                                  }
                                >
                                  <Icon
                                    name="monitor"
                                    size={13}
                                  />
                                  Monitor
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() =>
                                    stopServer(
                                      server.id
                                    )
                                  }
                                >
                                  <Icon
                                    name="stop"
                                    size={13}
                                  />
                                  Stop
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={() =>
                                  startServer(
                                    server.id
                                  )
                                }
                              >
                                <Icon
                                  name="play"
                                  size={13}
                                />
                                Start
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  /* =========================
     MONITORING
  ========================= */

  function MetricCard({
    title,
    value,
    unit,
    icon,
    timestamp,
  }) {
    const displayValue =
      value === undefined ||
      value === null
        ? "—"
        : typeof value === "number"
        ? Number(value).toFixed(2)
        : value;

    return (
      <div className="metric-card">
        <div className="metric-label">
          {title}
        </div>

        <div className="metric-value">
          {displayValue}

          {value !== undefined &&
            value !== null && (
              <small
                style={{
                  marginLeft: 5,
                  color: "#64748b",
                  fontSize: 10,
                }}
              >
                {unit}
              </small>
            )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginTop: 8,
            color: "#64748b",
            fontSize: 9,
          }}
        >
          <Icon name="calendar" size={11} />
          {timestamp
            ? formatDate(timestamp)
            : "No timestamp"}
        </div>
      </div>
    );
  }

  function renderMonitoringPage() {
    const metrics = monitoring?.metrics || {};

    return (
      <div className="content">
        <PageHeader
          eyebrow="OBSERVABILITY"
          title="Infrastructure Monitoring"
          description="Monitor CloudWatch metrics for your AWS infrastructure."
          action={
            monitoring && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  loadMonitoring(
                    monitoring.instance_id ||
                      monitoring.instanceId
                  )
                }
              >
                <Icon
                  name="refresh"
                  size={14}
                />
                Refresh metrics
              </button>
            )
          }
        />

        {!monitoring &&
          !monitoringLoading && (
            <section className="panel">
              <div className="empty-state">
                <div className="empty-icon">
                  <Icon
                    name="monitor"
                    size={22}
                  />
                </div>

                <h3>
                  Select an EC2 instance
                </h3>

                <p>
                  Choose an instance from the EC2
                  Instances page to view its
                  CloudWatch metrics.
                </p>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: 15 }}
                  onClick={() =>
                    navigate("servers")
                  }
                >
                  View EC2 Instances
                </button>
              </div>
            </section>
          )}

        {monitoringLoading && (
          <section className="panel">
            <div className="empty-state">
              <h3>
                Loading CloudWatch metrics...
              </h3>
            </div>
          </section>
        )}

        {monitoring &&
          !monitoringLoading && (
            <>
              <section
                className="panel"
                style={{ marginBottom: 18 }}
              >
                <div className="panel-body">
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: 20,
                    }}
                  >
                    <div>
                      <div className="stat-label">
                        MONITORED INSTANCE
                      </div>

                      <div
                        style={{
                          marginTop: 7,
                          fontSize: 15,
                          fontWeight: 700,
                        }}
                      >
                        {monitoring.name ||
                          monitoring.instance_name ||
                          monitoring.instance_id ||
                          "EC2 Instance"}
                      </div>
                    </div>

                    <div>
                      <div className="stat-label">
                        REGION
                      </div>

                      <div
                        style={{
                          marginTop: 7,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {monitoring.region ||
                          "AWS"}
                      </div>
                    </div>

                    <StatusBadge status="running" />
                  </div>
                </div>
              </section>

              <div className="metric-grid">
                <MetricCard
                  title="CPU Utilization"
                  value={
                    metrics.CPUUtilization
                      ?.value
                  }
                  unit="%"
                  icon="cpu"
                  timestamp={
                    metrics.CPUUtilization
                      ?.timestamp
                  }
                />

                <MetricCard
                  title="Network In"
                  value={
                    metrics.NetworkIn?.value
                  }
                  unit="bytes"
                  icon="network"
                  timestamp={
                    metrics.NetworkIn?.timestamp
                  }
                />

                <MetricCard
                  title="Network Out"
                  value={
                    metrics.NetworkOut?.value
                  }
                  unit="bytes"
                  icon="network"
                  timestamp={
                    metrics.NetworkOut
                      ?.timestamp
                  }
                />

                <MetricCard
                  title="EBS Read Ops"
                  value={
                    metrics.EBSReadOps?.value
                  }
                  unit="ops"
                  icon="database"
                  timestamp={
                    metrics.EBSReadOps
                      ?.timestamp
                  }
                />

                <MetricCard
                  title="EBS Write Ops"
                  value={
                    metrics.EBSWriteOps?.value
                  }
                  unit="ops"
                  icon="database"
                  timestamp={
                    metrics.EBSWriteOps
                      ?.timestamp
                  }
                />
              </div>
            </>
          )}
      </div>
    );
  }

  /* =========================
     DEPLOYMENTS
  ========================= */

  function renderDeploymentsPage() {
    return (
      <div className="content">
        <PageHeader
          eyebrow="CI/CD"
          title="Deployments"
          description="Create, monitor and review application deployments."
          action={
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                setShowDeploymentForm(true)
              }
            >
              <Icon name="plus" size={15} />
              New Deployment
            </button>
          }
        />

        <div className="stats-grid">
          <StatCard
            label="Successful"
            value={stats.successful}
            description="Completed successfully"
            icon="check"
          />

          <StatCard
            label="Failed"
            value={stats.failed}
            description="Failed deployments"
            icon="warning"
          />

          <StatCard
            label="Total"
            value={stats.deployments}
            description="All deployments"
            icon="deployment"
          />

          <StatCard
            label="Health"
            value={
              stats.deployments
                ? `${Math.round(
                    (stats.successful /
                      stats.deployments) *
                      100
                  )}%`
                : "0%"
            }
            description="Deployment success rate"
            icon="activity"
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <input
            className="form-input"
            style={{ maxWidth: 420 }}
            value={deploymentSearch}
            onChange={(event) =>
              setDeploymentSearch(
                event.target.value
              )
            }
            placeholder="Search deployments..."
          />

          <select
            className="form-select"
            style={{ width: 160 }}
            value={deploymentFilter}
            onChange={(event) =>
              setDeploymentFilter(
                event.target.value
              )
            }
          >
            <option value="all">
              All statuses
            </option>
            <option value="pending">
              Pending
            </option>
            <option value="running">
              Running
            </option>
            <option value="successful">
              Successful
            </option>
            <option value="failed">
              Failed
            </option>
          </select>
        </div>

        <section className="panel">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Version</th>
                  <th>Server</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDeployments.length ===
                0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <div className="empty-icon">
                          <Icon
                            name="deployment"
                            size={20}
                          />
                        </div>

                        <h3>
                          No deployments found
                        </h3>

                        <p>
                          Create your first
                          deployment to get
                          started.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDeployments.map(
                    (deployment) => (
                      <tr
                        key={deployment.id}
                      >
                        <td>
                          <div className="instance-name">
                            {deployment.application ||
                              "Application"}
                          </div>

                          <div className="instance-meta">
                            Deployment #
                            {deployment.id}
                          </div>
                        </td>

                        <td>
                          {deployment.version ||
                            "—"}
                        </td>

                        <td>
                          {deployment.server_name ||
                            "—"}
                        </td>

                        <td>
                          <StatusBadge
                            status={
                              deployment.status
                            }
                          />
                        </td>

                        <td>
                          {formatDate(
                            deployment.created_at
                          )}
                        </td>

                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: 7,
                            }}
                          >
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() =>
                                viewDeploymentDetails(
                                  deployment.id
                                )
                              }
                            >
                              <Icon
                                name="eye"
                                size={13}
                              />
                              View
                            </button>

                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() =>
                                deleteDeployment(
                                  deployment.id
                                )
                              }
                            >
                              <Icon
                                name="trash"
                                size={13}
                              />
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
        </section>
      </div>
    );
  }

  /* =========================
     ALERTS
  ========================= */

  function renderAlertsPage() {
    return (
      <div className="content">
        <PageHeader
          eyebrow="OPERATIONS"
          title="Infrastructure Alerts"
          description="Stay informed about deployments, servers and resource health."
          action={
            unreadAlerts > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={
                  markAllAlertsRead
                }
              >
                <Icon
                  name="check"
                  size={14}
                />
                Mark all read
              </button>
            )
          }
        />

        <div className="stats-grid">
          <StatCard
            label="All Alerts"
            value={alerts.length}
            description="Total notifications"
            icon="alert"
          />

          <StatCard
            label="Unread"
            value={unreadAlerts}
            description="Require attention"
            icon="warning"
          />

          <StatCard
            label="Read"
            value={
              alerts.length - unreadAlerts
            }
            description="Reviewed alerts"
            icon="check"
          />

          <StatCard
            label="Status"
            value={
              unreadAlerts === 0
                ? "Clear"
                : "Attention"
            }
            description="Current alert state"
            icon="activity"
          />
        </div>

        <section className="panel">
          {alerts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Icon
                  name="check"
                  size={21}
                />
              </div>

              <h3>No alerts</h3>

              <p>
                Your infrastructure is currently
                clear.
              </p>
            </div>
          ) : (
            <div className="deployment-list">
              {alerts.map((alert) => (
                <div
                  className="deployment-item"
                  key={alert.id}
                  style={{
                    background: alert.is_read
                      ? "transparent"
                      : "#172235",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <div className="stat-icon">
                      <Icon
                        name={getAlertIcon(
                          alert.alert_type
                        )}
                        size={16}
                      />
                    </div>

                    <div className="deployment-main">
                      <div className="deployment-name">
                        {alert.title}
                      </div>

                      <div
                        className="deployment-meta"
                        style={{
                          whiteSpace:
                            "normal",
                        }}
                      >
                        {alert.message}
                      </div>

                      <div className="deployment-meta">
                        {alert.server_name ||
                          "Infrastructure"}
                        {" • "}
                        {formatDate(
                          alert.created_at
                        )}
                      </div>
                    </div>
                  </div>

                  <StatusBadge
                    status={
                      alert.severity || "info"
                    }
                  />

                  {!alert.is_read && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        markAlertRead(
                          alert.id
                        )
                      }
                    >
                      <Icon
                        name="check"
                        size={13}
                      />
                      Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  /* =========================
     DEPLOYMENT CREATE MODAL
  ========================= */

  function DeploymentDetailsModal() {
    if (!selectedDeployment) return null;

    return (
      <div className="modal-backdrop">
        <div
          className="modal"
          style={{ maxWidth: 760 }}
        >
          <div className="modal-header">
            <div>
              <h2 className="modal-title">
                {selectedDeployment.application ||
                  "Deployment details"}
              </h2>

              <p className="panel-subtitle">
                Deployment #
                {selectedDeployment.id}
              </p>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSelectedDeployment(null);
                setDeploymentLogs("");
              }}
            >
              <Icon
                name="close"
                size={16}
              />
            </button>
          </div>

          <div className="modal-body">
            <div className="metric-grid">
              <div className="metric-card">
                <div className="metric-label">
                  Version
                </div>
                <div
                  className="metric-value"
                  style={{ fontSize: 14 }}
                >
                  {selectedDeployment.version ||
                    "—"}
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-label">
                  Server
                </div>
                <div
                  className="metric-value"
                  style={{ fontSize: 14 }}
                >
                  {selectedDeployment.server_name ||
                    "—"}
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-label">
                  Status
                </div>

                <div style={{ marginTop: 10 }}>
                  <StatusBadge
                    status={
                      selectedDeployment.status
                    }
                  />
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-label">
                  Created
                </div>

                <div
                  style={{
                    marginTop: 10,
                    color: "#f8fafc",
                    fontSize: 11,
                  }}
                >
                  {formatDate(
                    selectedDeployment.created_at
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <div
                className="metric-label"
                style={{ marginBottom: 8 }}
              >
                DEPLOYMENT LOGS
              </div>

              <pre
                style={{
                  minHeight: 220,
                  maxHeight: 400,
                  overflow: "auto",
                  margin: 0,
                  padding: 15,
                  border:
                    "1px solid #334155",
                  borderRadius: 8,
                  background: "#0f172a",
                  color: "#cbd5e1",
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 11,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {deploymentLogs ||
                  "No deployment logs available."}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     MAIN APP
  ========================= */

  return (
    <div className="app-shell">
      {mobileMenu && (
        <div
          className="mobile-overlay"
          onClick={() =>
            setMobileMenu(false)
          }
        />
      )}

      <Sidebar />

      <main className="main-content">
        <Topbar />

        {error && (
          <div
            style={{
              margin: "16px 30px 0",
            }}
            className="form-error"
          >
            {error}

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{
                float: "right",
                marginTop: -7,
              }}
              onClick={() => setError("")}
            >
              <Icon
                name="close"
                size={13}
              />
            </button>
          </div>
        )}

        {message && (
          <div
            style={{
              margin: "16px 30px 0",
            }}
            className="form-success"
          >
            {message}

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{
                float: "right",
                marginTop: -7,
              }}
              onClick={() => setMessage("")}
            >
              <Icon
                name="close"
                size={13}
              />
            </button>
          </div>
        )}

        {page === "dashboard" &&
          renderDashboard()}

        {page === "servers" &&
          renderServersPage()}

        {page === "monitoring" &&
          renderMonitoringPage()}

        {page === "deployments" &&
          renderDeploymentsPage()}

        {page === "alerts" &&
          renderAlertsPage()}
      </main>

      <DeploymentModal showDeploymentForm={showDeploymentForm} setShowDeploymentForm={setShowDeploymentForm} deploymentForm={deploymentForm} setDeploymentForm={setDeploymentForm} createDeployment={createDeployment} />
      <DeploymentDetailsModal />
    </div>
  );
}