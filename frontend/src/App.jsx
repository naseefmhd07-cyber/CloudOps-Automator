import { useEffect, useState } from "react";
import "./index.css";

const API_BASE = "http://3.80.121.44/api";

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("access_token")
  );

  const [page, setPage] = useState(
    token ? "dashboard" : "login"
  );

  const [servers, setServers] = useState([]);

  const [dashboard, setDashboard] = useState({
    total_servers: 0,
    running: 0,
    stopped: 0,
    successful_deployments: 0,
    failed_deployments: 0,
  });

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
  });

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    setToken(null);
    setServers([]);
    setPage("login");
  }

  async function loadServers() {
    const currentToken =
      localStorage.getItem("access_token");

    if (!currentToken) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        API_BASE + "/servers/",
        {
          method: "GET",
          headers: {
            Authorization:
              "Bearer " + currentToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Failed to load servers"
        );
      }

      const data = await response.json();

      setServers(data.servers || []);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to load AWS EC2 instances."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboard() {
    const currentToken =
      localStorage.getItem("access_token");

    if (!currentToken) {
      return;
    }

    try {
      const response = await fetch(
        API_BASE + "/dashboard/",
        {
          method: "GET",
          headers: {
            Authorization:
              "Bearer " + currentToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Failed to load dashboard"
        );
      }

      const data = await response.json();

      setDashboard(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function refreshData() {
    await Promise.all([
      loadServers(),
      loadDashboard(),
    ]);
  }

  useEffect(() => {
    if (token) {
      refreshData();
    }
  }, [token]);

  async function handleLogin(e) {
    e.preventDefault();

    setError("");

    try {
      const response = await fetch(
        API_BASE + "/auth/login/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Invalid username or password"
        );
      }

      localStorage.setItem(
        "access_token",
        data.access
      );

      localStorage.setItem(
        "refresh_token",
        data.refresh
      );

      setToken(data.access);
      setPage("dashboard");

      setLoginData({
        username: "",
        password: "",
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();

    setError("");

    try {
      const response = await fetch(
        API_BASE + "/auth/register/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registerData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const firstError =
          data.username?.[0] ||
          data.email?.[0] ||
          data.password?.[0] ||
          "Registration failed";

        throw new Error(firstError);
      }

      setPage("login");

      setRegisterData({
        username: "",
        email: "",
        password: "",
      });

      setError(
        "Registration successful. Please login."
      );
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredServers = servers.filter(
    (server) => {
      const text = search.toLowerCase();

      return (
        (server.name || "")
          .toLowerCase()
          .includes(text) ||
        (server.id || "")
          .toLowerCase()
          .includes(text) ||
        (server.state || "")
          .toLowerCase()
          .includes(text) ||
        (server.type || "")
          .toLowerCase()
          .includes(text) ||
        (server.public_ip || "")
          .toLowerCase()
          .includes(text)
      );
    }
  );

  if (!token && page === "login") {
    return (
      <div className="auth-page">
        <div className="auth-card">

          <div className="auth-logo">
            ☁
          </div>

          <h1>CloudOps Automator</h1>

          <p className="auth-subtitle">
            AWS & DevOps Management Platform
          </p>

          <form onSubmit={handleLogin}>

            <div className="form-group">
              <label>Username</label>

              <input
                type="text"
                placeholder="Enter username"
                value={loginData.username}
                onChange={(e) =>
                  setLoginData({
                    ...loginData,
                    username:
                      e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({
                    ...loginData,
                    password:
                      e.target.value,
                  })
                }
                required
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="primary-button"
            >
              Login
            </button>

          </form>

          <div className="auth-switch">
            Don't have an account?

            <button
              type="button"
              onClick={() => {
                setError("");
                setPage("register");
              }}
            >
              Create account
            </button>
          </div>

        </div>
      </div>
    );
  }

  if (!token && page === "register") {
    return (
      <div className="auth-page">
        <div className="auth-card">

          <div className="auth-logo">
            ☁
          </div>

          <h1>Create Account</h1>

          <p className="auth-subtitle">
            Start managing your cloud infrastructure
          </p>

          <form onSubmit={handleRegister}>

            <div className="form-group">
              <label>Username</label>

              <input
                type="text"
                placeholder="Choose username"
                value={registerData.username}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    username:
                      e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>

              <input
                type="email"
                placeholder="Enter email"
                value={registerData.email}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    email:
                      e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Create password"
                value={registerData.password}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    password:
                      e.target.value,
                  })
                }
                required
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="primary-button"
            >
              Create Account
            </button>

          </form>

          <div className="auth-switch">
            Already have an account?

            <button
              type="button"
              onClick={() => {
                setError("");
                setPage("login");
              }}
            >
              Login
            </button>
          </div>

        </div>
      </div>
    );
  }

  const runningCount = servers.filter(
    (server) => server.state === "running"
  ).length;

  const stoppedCount = servers.filter(
    (server) => server.state === "stopped"
  ).length;

  const successful =
    dashboard.successful_deployments || 0;

  const failed =
    dashboard.failed_deployments || 0;

  const totalDeployments =
    successful + failed;

  return (
    <div className="app">

      <header className="header">

        <div className="brand">

          <div className="brand-icon">
            ☁
          </div>

          <div>
            <h1>
              CloudOps Automator
            </h1>

            <p>
              AWS & DevOps Platform
            </p>
          </div>

        </div>

        <div className="header-actions">

          <div className="connection-status">
            <span className="status-dot"></span>
            AWS Connected
          </div>

          <button
            className="refresh-button"
            onClick={refreshData}
            disabled={loading}
          >
            {loading
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </header>

      <main className="main">

        <section className="page-heading">

          <div>
            <h2>Dashboard</h2>

            <p>
              Monitor and manage your AWS infrastructure
            </p>
          </div>

        </section>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon blue">
              ☁
            </div>

            <div>
              <span>Total Servers</span>

              <strong>
                {dashboard.total_servers ||
                  servers.length}
              </strong>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon green">
              ●
            </div>

            <div>
              <span>Running</span>

              <strong>
                {dashboard.running ??
                  runningCount}
              </strong>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon orange">
              ■
            </div>

            <div>
              <span>Stopped</span>

              <strong>
                {dashboard.stopped ??
                  stoppedCount}
              </strong>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon purple">
              ⚡
            </div>

            <div>
              <span>Deployments</span>

              <strong>
                {totalDeployments}
              </strong>
            </div>

          </div>

        </section>

        <section className="section">

          <div className="section-header">

            <div>
              <h3>AWS EC2 Instances</h3>

              <p>
                Live instances from your AWS account
              </p>
            </div>

            <div className="server-count">
              {filteredServers.length} instances
            </div>

          </div>

          <div className="toolbar">

            <input
              className="search-input"
              type="text"
              placeholder="Search instances..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <button
              className="secondary-button"
              onClick={refreshData}
            >
              Refresh
            </button>

          </div>

          <div className="table-wrapper">

            <table className="server-table">

              <thead>
                <tr>
                  <th>Instance</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Public IP</th>
                  <th>Private IP</th>
                </tr>
              </thead>

              <tbody>

                {loading &&
                servers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="empty-state"
                    >
                      Loading AWS instances...
                    </td>
                  </tr>
                ) : filteredServers.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="empty-state"
                    >
                      No EC2 instances found.
                    </td>
                  </tr>
                ) : (
                  filteredServers.map(
                    (server) => (
                      <tr key={server.id}>

                        <td>
                          <div className="instance-info">

                            <div className="instance-icon">
                              EC2
                            </div>

                            <div>
                              <strong>
                                {server.name}
                              </strong>

                              <small>
                                {server.id}
                              </small>
                            </div>

                          </div>
                        </td>

                        <td>

                          <span
                            className={
                              "status-badge " +
                              (
                                server.state ===
                                "running"
                                  ? "running"
                                  : "stopped"
                              )
                            }
                          >
                            <span className="badge-dot"></span>

                            {server.state}
                          </span>

                        </td>

                        <td>
                          <span className="instance-type">
                            {server.type}
                          </span>
                        </td>

                        <td>
                          <code>
                            {server.public_ip ||
                              "No Public IP"}
                          </code>
                        </td>

                        <td>
                          <code>
                            {server.private_ip ||
                              "No Private IP"}
                          </code>
                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </section>

        <section className="section">

          <div className="section-header">

            <div>
              <h3>
                Deployment Overview
              </h3>

              <p>
                CI/CD deployment statistics
              </p>
            </div>

          </div>

          <div className="deployment-grid">

            <div className="deployment-card success">

              <div className="deployment-icon">
                ✓
              </div>

              <div>
                <span>Successful</span>

                <strong>
                  {successful}
                </strong>
              </div>

            </div>

            <div className="deployment-card failed">

              <div className="deployment-icon">
                !
              </div>

              <div>
                <span>Failed</span>

                <strong>
                  {failed}
                </strong>
              </div>

            </div>

            <div className="deployment-card total">

              <div className="deployment-icon">
                #
              </div>

              <div>
                <span>Total</span>

                <strong>
                  {totalDeployments}
                </strong>
              </div>

            </div>

          </div>

        </section>

      </main>

      <footer className="footer">

        <span>
          CloudOps Automator
        </span>

        <span>
          AWS & DevOps Management Platform
        </span>

      </footer>

    </div>
  );
}

export default App;