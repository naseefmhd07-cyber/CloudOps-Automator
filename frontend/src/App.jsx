import { useEffect, useState } from "react";

const API_BASE = "/api";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [page, setPage] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("cloudops-theme") === "dark";
  });

  const [servers, setServers] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [deployments, setDeployments] = useState([]);

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

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("cloudops-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

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

    const contentType = response.headers.get("content-type") || "";
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

  async function loadAllData() {
    setLoading(true);
    setError("");

    try {
      const [serverData, dashboardData, deploymentData] =
        await Promise.all([
          apiFetch("/servers/"),
          apiFetch("/dashboard/"),
          apiFetch("/deployments/"),
        ]);

      setServers(Array.isArray(serverData) ? serverData : []);
      setDashboard(dashboardData);
      setDeployments(
        Array.isArray(deploymentData) ? deploymentData : []
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await fetch(`${API_BASE}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: authForm.username,
          password: authForm.password,
        }),
      });

      const result = await data.json();

      if (!data.ok) {
        throw new Error(
          result.detail ||
            result.message ||
            result.error ||
            "Login failed."
        );
      }

      const accessToken = result.access || result.access_token;

      if (!accessToken) {
        throw new Error("Login succeeded but no access token was returned.");
      }

      localStorage.setItem("access_token", accessToken);
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

  async function handleRegister(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/auth/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: authForm.username,
          password: authForm.password,
          email: authForm.email,
        }),
      });

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
      setError("Registration successful. Please log in.");
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

  function logout() {
    localStorage.removeItem("access_token");
    setToken(null);
    setServers([]);
    setDashboard(null);
    setDeployments([]);
    setSelectedDeployment(null);
    setPage("dashboard");
  }

  async function startServer(id) {
    try {
      setError("");

      await apiFetch(`/servers/${id}/start/`, {
        method: "POST",
      });

      await loadAllData();
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
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  async function createDeployment(event) {
    event.preventDefault();

    if (!deploymentForm.application || !deploymentForm.version) {
      setError("Application and version are required.");
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

    if (!confirmed) return;

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
      const data = await apiFetch(`/deployments/${id}/`);
      setSelectedDeployment(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setDeploymentDetailsLoading(false);
    }
  }

  function formatDate(value) {
    if (!value) return "—";

    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }

  function getStatusClass(status) {
    switch (String(status || "").toLowerCase()) {
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
    return String(server.status || "").toLowerCase();
  }

  const filteredServers = servers.filter((server) => {
    const search = searchServer.toLowerCase();

    return (
      String(server.name || "").toLowerCase().includes(search) ||
      String(server.ip_address || "").toLowerCase().includes(search) ||
      String(server.server_type || "").toLowerCase().includes(search) ||
      String(server.status || "").toLowerCase().includes(search)
    );
  });

  const filteredDeployments = deployments.filter((deployment) => {
    const search = searchDeployment.toLowerCase();

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
  });

  const totalServers =
    dashboard?.total_servers ??
    dashboard?.servers?.total ??
    servers.length;

  const runningServers =
    dashboard?.running_servers ??
    dashboard?.servers?.running ??
    servers.filter(
      (server) => getServerStatus(server) === "running"
    ).length;

  const stoppedServers =
    dashboard?.stopped_servers ??
    dashboard?.servers?.stopped ??
    servers.filter(
      (server) => getServerStatus(server) === "stopped"
    ).length;

  const totalDeployments =
    dashboard?.total_deployments ?? deployments.length;

  const successfulDeployments =
    dashboard?.successful_deployments ??
    deployments.filter(
      (deployment) => deployment.status === "successful"
    ).length;

  const failedDeployments =
    dashboard?.failed_deployments ??
    deployments.filter(
      (deployment) => deployment.status === "failed"
    ).length;

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-brand">
            <div className="brand-mark">☁</div>
            <div>
              <h1>CloudOps Automator</h1>
              <p>AWS & DevOps Management Platform</p>
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
                      username: event.target.value,
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
                        email: event.target.value,
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
                      password: event.target.value,
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
                  authMode === "login" ? "register" : "login"
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

  return (
    <div className="app-shell">
      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${
          mobileMenuOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-mark small">☁</div>

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
        </nav>

        <div className="sidebar-bottom">
          <button
            className="theme-toggle"
            onClick={() => setDarkMode((prev) => !prev)}
            type="button"
          >
            <span>{darkMode ? "☀️" : "🌙"}</span>
            <span>
              {darkMode ? "Light Mode" : "Dark Mode"}
            </span>
          </button>

          <div className="connection-status">
            <span className="online-dot" />
            <div>
              <strong>AWS Connected</strong>
              <small>Infrastructure online</small>
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
                setMobileMenuOpen((prev) => !prev)
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
                    : "Deployments"}
                </strong>
              </div>

              <h1>
                {page === "dashboard"
                  ? "Infrastructure Overview"
                  : page === "servers"
                  ? "EC2 Instances"
                  : "Deployment Center"}
              </h1>
            </div>
          </div>

          <div className="topbar-actions">
            <button
              className="icon-button"
              onClick={() => setDarkMode((prev) => !prev)}
              title={
                darkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              type="button"
            >
              {darkMode ? "☀" : "☾"}
            </button>

            <button
              className="refresh-button"
              onClick={loadAllData}
              disabled={loading}
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
                onClick={() => setError("")}
                type="button"
              >
                ×
              </button>
            </div>
          )}

          {page === "dashboard" && (
            <>
              <section className="welcome-row">
                <div>
                  <p className="eyebrow">CLOUD OPERATIONS</p>
                  <h2>Good to see you.</h2>
                  <p>
                    Monitor your AWS infrastructure and manage
                    deployments from one place.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => setPage("deployments")}
                >
                  + New Deployment
                </button>
              </section>

              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-top">
                    <span>Total Servers</span>
                    <span className="stat-icon blue">▣</span>
                  </div>

                  <strong>{totalServers}</strong>
                  <small>EC2 infrastructure</small>
                </div>

                <div className="stat-card">
                  <div className="stat-card-top">
                    <span>Running</span>
                    <span className="stat-icon green">●</span>
                  </div>

                  <strong>{runningServers}</strong>
                  <small>Currently active</small>
                </div>

                <div className="stat-card">
                  <div className="stat-card-top">
                    <span>Stopped</span>
                    <span className="stat-icon orange">■</span>
                  </div>

                  <strong>{stoppedServers}</strong>
                  <small>Currently stopped</small>
                </div>

                <div className="stat-card">
                  <div className="stat-card-top">
                    <span>Deployments</span>
                    <span className="stat-icon purple">⇄</span>
                  </div>

                  <strong>{totalDeployments}</strong>
                  <small>All deployments</small>
                </div>
              </section>

              <section className="dashboard-grid">
                <div className="panel large-panel">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">COMPUTE</p>
                      <h3>EC2 Instances</h3>
                    </div>

                    <button
                      className="text-button"
                      onClick={() => setPage("servers")}
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
                      servers.slice(0, 5).map((server) => (
                        <div
                          className="instance-row"
                          key={server.id}
                        >
                          <div className="instance-main">
                            <div className="instance-icon">
                              EC2
                            </div>

                            <div>
                              <strong>{server.name}</strong>
                              <small>
                                {server.server_type ||
                                  "EC2 Instance"}
                              </small>
                            </div>
                          </div>

                          <div className="instance-meta">
                            <span
                              className={`status-badge ${getStatusClass(
                                server.status
                              )}`}
                            >
                              <span />
                              {server.status}
                            </span>

                            <span className="instance-ip">
                              {server.ip_address || "No public IP"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">CI/CD</p>
                      <h3>Deployment Overview</h3>
                    </div>
                  </div>

                  <div className="deployment-summary">
                    <div>
                      <span>Successful</span>
                      <strong className="success-text">
                        {successfulDeployments}
                      </strong>
                    </div>

                    <div>
                      <span>Failed</span>
                      <strong className="failed-text">
                        {failedDeployments}
                      </strong>
                    </div>

                    <div>
                      <span>Total</span>
                      <strong>{totalDeployments}</strong>
                    </div>
                  </div>

                  <button
                    className="secondary-button full-width"
                    onClick={() => setPage("deployments")}
                  >
                    Open Deployment Center
                  </button>
                </div>
              </section>
            </>
          )}

          {page === "servers" && (
            <>
              <section className="page-heading-row">
                <div>
                  <p className="eyebrow">AWS COMPUTE</p>
                  <h2>EC2 Instances</h2>
                  <p>
                    View and control your connected AWS
                    instances.
                  </p>
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Instances</h3>
                    <span className="panel-count">
                      {filteredServers.length} instances
                    </span>
                  </div>

                  <div className="search-box">
                    <span>⌕</span>

                    <input
                      value={searchServer}
                      onChange={(event) =>
                        setSearchServer(event.target.value)
                      }
                      placeholder="Search instances..."
                    />
                  </div>
                </div>

                <div className="responsive-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Instance</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>IP Address</th>
                        <th>Server Type</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredServers.length === 0 ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="table-empty"
                          >
                            No instances found.
                          </td>
                        </tr>
                      ) : (
                        filteredServers.map((server) => (
                          <tr key={server.id}>
                            <td>
                              <div className="table-instance">
                                <div className="instance-icon">
                                  EC2
                                </div>

                                <div>
                                  <strong>
                                    {server.name}
                                  </strong>
                                  <small>
                                    ID #{server.id}
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
                                  server.status
                                )}`}
                              >
                                <span />
                                {server.status}
                              </span>
                            </td>

                            <td>
                              {server.ip_address || "—"}
                            </td>

                            <td>
                              {server.server_type || "—"}
                            </td>

                            <td>
                              {getServerStatus(server) ===
                              "running" ? (
                                <button
                                  className="danger-outline-button"
                                  onClick={() =>
                                    stopServer(server.id)
                                  }
                                >
                                  Stop
                                </button>
                              ) : (
                                <button
                                  className="success-outline-button"
                                  onClick={() =>
                                    startServer(server.id)
                                  }
                                >
                                  Start
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {page === "deployments" && (
            <>
              <section className="page-heading-row">
                <div>
                  <p className="eyebrow">CI/CD PIPELINE</p>
                  <h2>Deployment Center</h2>
                  <p>
                    Create, monitor and inspect your application
                    deployments.
                  </p>
                </div>
              </section>

              <section className="deployment-layout">
                <div className="panel deployment-create-panel">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">NEW RELEASE</p>
                      <h3>Create Deployment</h3>
                    </div>
                  </div>

                  <form
                    className="deployment-form"
                    onSubmit={createDeployment}
                  >
                    <label>
                      Application
                      <input
                        value={deploymentForm.application}
                        onChange={(event) =>
                          setDeploymentForm({
                            ...deploymentForm,
                            application:
                              event.target.value,
                          })
                        }
                        placeholder="CloudOps Automator"
                        required
                      />
                    </label>

                    <label>
                      Version
                      <input
                        value={deploymentForm.version}
                        onChange={(event) =>
                          setDeploymentForm({
                            ...deploymentForm,
                            version: event.target.value,
                          })
                        }
                        placeholder="v1.0.0"
                        required
                      />
                    </label>

                    <label>
                      Server Name
                      <input
                        value={deploymentForm.server_name}
                        onChange={(event) =>
                          setDeploymentForm({
                            ...deploymentForm,
                            server_name:
                              event.target.value,
                          })
                        }
                        placeholder="Production Server"
                      />
                    </label>

                    <label>
                      EC2 Instance ID
                      <input
                        value={deploymentForm.ec2_instance_id}
                        onChange={(event) =>
                          setDeploymentForm({
                            ...deploymentForm,
                            ec2_instance_id:
                              event.target.value,
                          })
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
                      <p className="eyebrow">ACTIVITY</p>
                      <h3>Deployment History</h3>
                    </div>

                    <div className="search-box">
                      <span>⌕</span>

                      <input
                        value={searchDeployment}
                        onChange={(event) =>
                          setSearchDeployment(
                            event.target.value
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
                          <th>Application</th>
                          <th>Version</th>
                          <th>Server</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredDeployments.length === 0 ? (
                          <tr>
                            <td
                              colSpan="7"
                              className="table-empty"
                            >
                              No deployments found.
                            </td>
                          </tr>
                        ) : (
                          filteredDeployments.map(
                            (deployment) => (
                              <tr key={deployment.id}>
                                <td>
                                  #{deployment.id}
                                </td>

                                <td>
                                  <strong>
                                    {deployment.application}
                                  </strong>
                                </td>

                                <td>
                                  {deployment.version}
                                </td>

                                <td>
                                  {deployment.server_name ||
                                    "—"}
                                </td>

                                <td>
                                  <span
                                    className={`status-badge ${getStatusClass(
                                      deployment.status
                                    )}`}
                                  >
                                    <span />
                                    {deployment.status}
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
                        DEPLOYMENT #{selectedDeployment.id}
                      </p>

                      <h3>Deployment Details</h3>
                    </div>

                    <button
                      className="secondary-button"
                      onClick={() =>
                        setSelectedDeployment(null)
                      }
                    >
                      Close
                    </button>
                  </div>

                  {deploymentDetailsLoading ? (
                    <div className="loading-state">
                      Loading deployment details...
                    </div>
                  ) : (
                    <>
                      <div className="details-grid">
                        <div className="detail-item">
                          <span>Application</span>
                          <strong>
                            {selectedDeployment.application ||
                              "—"}
                          </strong>
                        </div>

                        <div className="detail-item">
                          <span>Version</span>
                          <strong>
                            {selectedDeployment.version || "—"}
                          </strong>
                        </div>

                        <div className="detail-item">
                          <span>Server</span>
                          <strong>
                            {selectedDeployment.server_name ||
                              "—"}
                          </strong>
                        </div>

                        <div className="detail-item">
                          <span>EC2 ID</span>
                          <strong>
                            {selectedDeployment.ec2_instance_id ||
                              "—"}
                          </strong>
                        </div>

                        <div className="detail-item">
                          <span>Status</span>

                          <span
                            className={`status-badge ${getStatusClass(
                              selectedDeployment.status
                            )}`}
                          >
                            <span />
                            {selectedDeployment.status}
                          </span>
                        </div>

                        <div className="detail-item">
                          <span>Created</span>
                          <strong>
                            {formatDate(
                              selectedDeployment.created_at
                            )}
                          </strong>
                        </div>

                        <div className="detail-item">
                          <span>Started</span>
                          <strong>
                            {formatDate(
                              selectedDeployment.started_at
                            )}
                          </strong>
                        </div>

                        <div className="detail-item">
                          <span>Completed</span>
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
                            <h4>Deployment Logs</h4>
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
        </div>
      </main>
    </div>
  );
}

export default App;