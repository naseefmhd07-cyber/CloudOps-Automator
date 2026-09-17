import { useEffect, useState } from "react";
import "./index.css";

const API_BASE = "/api";

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("access_token")
  );

  const [page, setPage] = useState(
    token ? "dashboard" : "login"
  );

  const [servers, setServers] = useState([]);
  const [deployments, setDeployments] = useState([]);

  const [dashboard, setDashboard] = useState({
    total_servers: 0,
    running: 0,
    stopped: 0,
    successful_deployments: 0,
    failed_deployments: 0,
  });

  const [search, setSearch] = useState("");
  const [deploymentSearch, setDeploymentSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [deploymentLoading, setDeploymentLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });

  const [deploymentData, setDeploymentData] = useState({
    ec2_instance_id: "",
    server_name: "",
    application: "",
    version: "",
  });

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    setToken(null);
    setServers([]);
    setDeployments([]);
    setPage("login");
  }

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  async function apiRequest(endpoint, options = {}) {
    const currentToken =
      localStorage.getItem("access_token");

    const response = await fetch(
      API_BASE + endpoint,
      {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(currentToken
            ? {
                Authorization:
                  "Bearer " + currentToken,
              }
            : {}),
          ...(options.headers || {}),
        },
      }
    );

    if (response.status === 401) {
      logout();
      throw new Error("Session expired. Please login again.");
    }

    const contentType =
      response.headers.get("content-type") || "";

    let data = {};

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      let message = "Request failed.";

      if (data?.detail) {
        message = data.detail;
      } else if (data?.error) {
        message = data.error;
      } else if (typeof data === "string" && data) {
        message = data;
      }

      throw new Error(message);
    }

    return data;
  }

  async function loadServers() {
    if (!localStorage.getItem("access_token")) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/servers/");

      setServers(data.servers || []);
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          "Unable to load AWS EC2 instances."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboard() {
    if (!localStorage.getItem("access_token")) {
      return;
    }

    try {
      const data =
        await apiRequest("/dashboard/");

      const serverData = data.servers || {};
      const deploymentData =
        data.deployments || {};

      setDashboard({
        total_servers:
          serverData.total || 0,

        running:
          serverData.running || 0,

        stopped:
          serverData.stopped || 0,

        successful_deployments:
          deploymentData.successful || 0,

        failed_deployments:
          deploymentData.failed || 0,
      });
    } catch (err) {
      console.error(err);

      if (
        !err.message.includes("Session expired")
      ) {
        setError(
          err.message ||
            "Unable to load dashboard."
        );
      }
    }
  }

  async function loadDeployments() {
    if (!localStorage.getItem("access_token")) {
      return;
    }

    try {
      setDeploymentLoading(true);

      const data =
        await apiRequest("/deployments/");

      setDeployments(
        data.deployments || []
      );
    } catch (err) {
      console.error(err);

      if (
        !err.message.includes("Session expired")
      ) {
        setError(
          err.message ||
            "Unable to load deployments."
        );
      }
    } finally {
      setDeploymentLoading(false);
    }
  }

  async function refreshData() {
    clearMessages();

    await Promise.all([
      loadServers(),
      loadDashboard(),
      loadDeployments(),
    ]);
  }

  useEffect(() => {
    if (!token) {
      return;
    }

    loadServers();
    loadDashboard();
    loadDeployments();
  }, [token]);

  async function handleLogin(e) {
    e.preventDefault();

    clearMessages();

    if (
      !loginData.username ||
      !loginData.password
    ) {
      setError(
        "Please enter username and password."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        API_BASE + "/auth/login/",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(loginData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Invalid username or password."
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

      setLoginData({
        username: "",
        password: "",
      });

      setPage("dashboard");
      setSuccess("Login successful.");
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();

    clearMessages();

    if (
      !registerData.username ||
      !registerData.email ||
      !registerData.password ||
      !registerData.password2
    ) {
      setError(
        "Please fill all registration fields."
      );
      return;
    }

    if (
      registerData.password !==
      registerData.password2
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        API_BASE + "/auth/register/",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            registerData
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        let message =
          "Registration failed.";

        if (data.username) {
          message = data.username.join(" ");
        } else if (data.email) {
          message = data.email.join(" ");
        } else if (data.password) {
          message = data.password.join(" ");
        }

        throw new Error(message);
      }

      setRegisterData({
        username: "",
        email: "",
        password: "",
        password2: "",
      });

      setPage("login");

      setSuccess(
        "Registration successful. Please login."
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to register."
      );
    } finally {
      setLoading(false);
    }
  }

  async function startServer(instanceId) {
    clearMessages();

    try {
      await apiRequest(
        `/servers/${instanceId}/start/`,
        {
          method: "POST",
        }
      );

      setSuccess(
        "EC2 start request sent successfully."
      );

      setTimeout(() => {
        loadServers();
        loadDashboard();
      }, 2000);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to start EC2 instance."
      );
    }
  }

  async function stopServer(instanceId) {
    clearMessages();

    try {
      await apiRequest(
        `/servers/${instanceId}/stop/`,
        {
          method: "POST",
        }
      );

      setSuccess(
        "EC2 stop request sent successfully."
      );

      setTimeout(() => {
        loadServers();
        loadDashboard();
      }, 2000);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to stop EC2 instance."
      );
    }
  }

  async function createDeployment(e) {
    e.preventDefault();

    clearMessages();

    if (
      !deploymentData.ec2_instance_id ||
      !deploymentData.server_name ||
      !deploymentData.application ||
      !deploymentData.version
    ) {
      setError(
        "Please fill all deployment fields."
      );
      return;
    }

    try {
      setDeploymentLoading(true);

      const data =
        await apiRequest(
          "/deployments/",
          {
            method: "POST",
            body: JSON.stringify(
              deploymentData
            ),
          }
        );

      setSuccess(
        data.message ||
          "Deployment created successfully."
      );

      setDeploymentData({
        ec2_instance_id: "",
        server_name: "",
        application: "",
        version: "",
      });

      await loadDeployments();
      await loadDashboard();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Deployment failed."
      );
    } finally {
      setDeploymentLoading(false);
    }
  }

  async function deleteDeployment(id) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this deployment?"
      );

    if (!confirmed) {
      return;
    }

    clearMessages();

    try {
      await apiRequest(
        `/deployments/${id}/`,
        {
          method: "DELETE",
        }
      );

      setSuccess(
        "Deployment deleted successfully."
      );

      await loadDeployments();
      await loadDashboard();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to delete deployment."
      );
    }
  }

  const filteredServers =
    servers.filter((server) => {
      const query =
        search.toLowerCase();

      return (
        String(
          server.name || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          server.id || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          server.public_ip || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          server.private_ip || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          server.server_type || ""
        )
          .toLowerCase()
          .includes(query)
      );
    });

  const filteredDeployments =
    deployments.filter(
      (deployment) => {
        const query =
          deploymentSearch.toLowerCase();

        return (
          String(
            deployment.application || ""
          )
            .toLowerCase()
            .includes(query) ||
          String(
            deployment.version || ""
          )
            .toLowerCase()
            .includes(query) ||
          String(
            deployment.server_name || ""
          )
            .toLowerCase()
            .includes(query) ||
          String(
            deployment.ec2_instance_id || ""
          )
            .toLowerCase()
            .includes(query) ||
          String(
            deployment.status || ""
          )
            .toLowerCase()
            .includes(query)
        );
      }
    );

  const runningCount =
    servers.filter(
      (server) =>
        server.status === "running"
    ).length;

  const stoppedCount =
    servers.filter(
      (server) =>
        server.status === "stopped"
    ).length;

  const successful =
    dashboard.successful_deployments || 0;

  const failed =
    dashboard.failed_deployments || 0;

  const totalDeployments =
    deployments.length ||
    successful + failed;

  if (!token && page === "login") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              ☁️
            </div>

            <h1>
              CloudOps Automator
            </h1>

            <p>
              AWS & DevOps Management
              Platform
            </p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <div className="auth-tabs">
            <button
              className="active"
              type="button"
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => {
                clearMessages();
                setPage("register");
              }}
            >
              Register
            </button>
          </div>

          <form
            onSubmit={handleLogin}
            className="auth-form"
          >
            <label>
              Username
              <input
                type="text"
                value={
                  loginData.username
                }
                onChange={(e) =>
                  setLoginData({
                    ...loginData,
                    username:
                      e.target.value,
                  })
                }
                placeholder="Enter username"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={
                  loginData.password
                }
                onChange={(e) =>
                  setLoginData({
                    ...loginData,
                    password:
                      e.target.value,
                  })
                }
                placeholder="Enter password"
              />
            </label>

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (
    !token &&
    page === "register"
  ) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              ☁️
            </div>

            <h1>
              Create Account
            </h1>

            <p>
              CloudOps Automator
            </p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <div className="auth-tabs">
            <button
              type="button"
              onClick={() => {
                clearMessages();
                setPage("login");
              }}
            >
              Login
            </button>

            <button
              className="active"
              type="button"
            >
              Register
            </button>
          </div>

          <form
            onSubmit={handleRegister}
            className="auth-form"
          >
            <label>
              Username
              <input
                type="text"
                value={
                  registerData.username
                }
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    username:
                      e.target.value,
                  })
                }
                placeholder="Choose username"
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={
                  registerData.email
                }
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    email:
                      e.target.value,
                  })
                }
                placeholder="Enter email"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={
                  registerData.password
                }
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    password:
                      e.target.value,
                  })
                }
                placeholder="Minimum 8 characters"
              />
            </label>

            <label>
              Confirm Password
              <input
                type="password"
                value={
                  registerData.password2
                }
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    password2:
                      e.target.value,
                  })
                }
                placeholder="Confirm password"
              />
            </label>

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Creating..."
                : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">

      <header className="top-header">

        <div>
          <h1>
            CloudOps Automator
          </h1>

          <p>
            AWS & DevOps Management
            Platform
          </p>
        </div>

        <div className="header-actions">

          <button
            className={
              page === "dashboard"
                ? "primary-button"
                : "secondary-button"
            }
            onClick={() => {
              clearMessages();
              setPage("dashboard");
            }}
          >
            Dashboard
          </button>

          <button
            className={
              page === "deployments"
                ? "primary-button"
                : "secondary-button"
            }
            onClick={() => {
              clearMessages();
              setPage("deployments");
              loadDeployments();
            }}
          >
            Deployments
          </button>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </header>

      <main className="container">

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        {page === "dashboard" && (
          <>

            <section className="dashboard-section">

              <div className="section-heading">

                <div>
                  <h2>
                    Dashboard
                  </h2>

                  <p>
                    Monitor your AWS
                    infrastructure
                  </p>
                </div>

                <button
                  className="secondary-button"
                  onClick={refreshData}
                  disabled={loading}
                >
                  {loading
                    ? "Refreshing..."
                    : "↻ Refresh"}
                </button>

              </div>

              <div className="stats-grid">

                <div className="stat-card">
                  <div className="stat-icon">
                    ☁️
                  </div>

                  <div>
                    <h3>
                      Total Servers
                    </h3>

                    <strong>
                      {dashboard.total_servers ||
                        servers.length}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    ✓
                  </div>

                  <div>
                    <h3>
                      Running
                    </h3>

                    <strong>
                      {dashboard.running ||
                        runningCount}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    ⏸
                  </div>

                  <div>
                    <h3>
                      Stopped
                    </h3>

                    <strong>
                      {dashboard.stopped ??
                        stoppedCount}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    🚀
                  </div>

                  <div>
                    <h3>
                      Deployments
                    </h3>

                    <strong>
                      {totalDeployments}
                    </strong>
                  </div>
                </div>

              </div>

            </section>

            <section className="servers-section">

              <div className="section-heading">

                <div>
                  <h2>
                    AWS EC2 Instances
                  </h2>

                  <p>
                    Live instances from
                    your AWS account
                  </p>
                </div>

                <input
                  className="search-input"
                  type="text"
                  placeholder="Search servers..."
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                />

              </div>

              <div className="table-container">

                <table>

                  <thead>
                    <tr>
                      <th>
                        Instance
                      </th>

                      <th>
                        State
                      </th>

                      <th>
                        Type
                      </th>

                      <th>
                        Public IP
                      </th>

                      <th>
                        Private IP
                      </th>

                      <th>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredServers.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="empty-state"
                        >
                          {loading
                            ? "Loading EC2 instances..."
                            : "No EC2 instances found."}
                        </td>
                      </tr>
                    )}

                    {filteredServers.map(
                      (server) => (
                        <tr
                          key={
                            server.id
                          }
                        >

                          <td>
                            <strong>
                              {server.name ||
                                "Unnamed"}
                            </strong>

                            <small>
                              {server.id}
                            </small>
                          </td>

                          <td>
                            <span
                              className={
                                server.status ===
                                "running"
                                  ? "status-badge running"
                                  : "status-badge stopped"
                              }
                            >
                              {server.status ||
                                "unknown"}
                            </span>
                          </td>

                          <td>
                            <span className="instance-type">
                              {server.server_type ||
                                "Unknown"}
                            </span>
                          </td>

                          <td>
                            <code>
                              {server.public_ip || "No Public IP"}
                            </code>
                          </td>

                          <td>
                            <code>
                              {server.private_ip || "No Private IP"}
                            </code>
                          </td>

                          <td>

                            <div className="action-buttons">

                              {server.status ===
                                "running" ? (
                                <button
                                  className="delete-button"
                                  onClick={() =>
                                    stopServer(
                                      server.id
                                    )
                                  }
                                >
                                  Stop
                                </button>
                              ) : (
                                <button
                                  className="edit-button"
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
                    )}

                  </tbody>

                </table>

              </div>

            </section>

            <section className="deployment-section">

              <div className="section-heading">

                <div>
                  <h2>
                    Deployment Overview
                  </h2>

                  <p>
                    CI/CD deployment
                    statistics
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => {
                    clearMessages();
                    setPage(
                      "deployments"
                    );
                    loadDeployments();
                  }}
                >
                  Manage Deployments
                </button>

              </div>

              <div className="deployment-grid">

                <div className="deployment-card success">

                  <div className="deployment-icon">
                    ✓
                  </div>

                  <div>
                    <span>
                      Successful
                    </span>

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
                    <span>
                      Failed
                    </span>

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
                    <span>
                      Total
                    </span>

                    <strong>
                      {totalDeployments}
                    </strong>
                  </div>

                </div>

              </div>

            </section>

          </>
        )}

        {page === "deployments" && (
          <>

            <section className="deployment-section">

              <div className="section-heading">

                <div>
                  <h2>
                    Deployments
                  </h2>

                  <p>
                    Create and monitor
                    application deployments
                  </p>
                </div>

                <div className="header-actions">

                  <button
                    className="secondary-button"
                    onClick={loadDeployments}
                    disabled={
                      deploymentLoading
                    }
                  >
                    {deploymentLoading
                      ? "Refreshing..."
                      : "↻ Refresh"}
                  </button>

                  <button
                    className="primary-button"
                    onClick={() => {
                      document
                        .getElementById(
                          "deployment-form"
                        )
                        ?.scrollIntoView({
                          behavior:
                            "smooth",
                        });
                    }}
                  >
                    + New Deployment
                  </button>

                </div>

              </div>

              <div className="stats-grid">

                <div className="stat-card">
                  <div className="stat-icon">
                    🚀
                  </div>

                  <div>
                    <h3>
                      Total
                    </h3>

                    <strong>
                      {totalDeployments}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    ✓
                  </div>

                  <div>
                    <h3>
                      Successful
                    </h3>

                    <strong>
                      {successful}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    !
                  </div>

                  <div>
                    <h3>
                      Failed
                    </h3>

                    <strong>
                      {failed}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    ⏱
                  </div>

                  <div>
                    <h3>
                      Pending
                    </h3>

                    <strong>
                      {
                        deployments.filter(
                          (item) =>
                            item.status ===
                              "pending" ||
                            item.status ===
                              "running"
                        ).length
                      }
                    </strong>
                  </div>
                </div>

              </div>

            </section>

            <section
              id="deployment-form"
              className="deployment-section"
            >

              <div className="section-heading">

                <div>
                  <h2>
                    Create Deployment
                  </h2>

                  <p>
                    Start a deployment
                    process
                  </p>
                </div>

              </div>

              <div className="form-card">

                <form
                  onSubmit={
                    createDeployment
                  }
                >

                  <div className="form-grid">

                    <label>
                      EC2 Instance ID

                      <input
                        type="text"
                        value={
                          deploymentData.ec2_instance_id
                        }
                        onChange={(e) =>
                          setDeploymentData(
                            {
                              ...deploymentData,
                              ec2_instance_id:
                                e.target
                                  .value,
                            }
                          )
                        }
                        placeholder="i-xxxxxxxxxxxxxxxxx"
                      />
                    </label>

                    <label>
                      Server Name

                      <input
                        type="text"
                        value={
                          deploymentData.server_name
                        }
                        onChange={(e) =>
                          setDeploymentData(
                            {
                              ...deploymentData,
                              server_name:
                                e.target
                                  .value,
                            }
                          )
                        }
                        placeholder="Production Server"
                      />
                    </label>

                    <label>
                      Application

                      <input
                        type="text"
                        value={
                          deploymentData.application
                        }
                        onChange={(e) =>
                          setDeploymentData(
                            {
                              ...deploymentData,
                              application:
                                e.target
                                  .value,
                            }
                          )
                        }
                        placeholder="CloudOps Automator"
                      />
                    </label>

                    <label>
                      Version

                      <input
                        type="text"
                        value={
                          deploymentData.version
                        }
                        onChange={(e) =>
                          setDeploymentData(
                            {
                              ...deploymentData,
                              version:
                                e.target
                                  .value,
                            }
                          )
                        }
                        placeholder="v1.0.0"
                      />
                    </label>

                  </div>

                  <div className="form-actions">

                    <button
                      type="submit"
                      className="primary-button"
                      disabled={
                        deploymentLoading
                      }
                    >
                      {deploymentLoading
                        ? "Deploying..."
                        : "🚀 Start Deployment"}
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        setDeploymentData(
                          {
                            ec2_instance_id:
                              "",
                            server_name:
                              "",
                            application:
                              "",
                            version:
                              "",
                          }
                        )
                      }
                    >
                      Clear
                    </button>

                  </div>

                </form>

              </div>

            </section>

            <section className="deployment-section">

              <div className="section-heading">

                <div>
                  <h2>
                    Deployment History
                  </h2>

                  <p>
                    Recent deployment
                    activity
                  </p>
                </div>

                <input
                  className="search-input"
                  type="text"
                  placeholder="Search deployments..."
                  value={
                    deploymentSearch
                  }
                  onChange={(e) =>
                    setDeploymentSearch(
                      e.target.value
                    )
                  }
                />

              </div>

              <div className="table-container">

                <table>

                  <thead>
                    <tr>
                      <th>
                        ID
                      </th>

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
                      0 && (
                      <tr>
                        <td
                          colSpan="7"
                          className="empty-state"
                        >
                          {deploymentLoading
                            ? "Loading deployments..."
                            : "No deployments found."}
                        </td>
                      </tr>
                    )}

                    {filteredDeployments.map(
                      (deployment) => (
                        <tr
                          key={
                            deployment.id
                          }
                        >

                          <td>
                            <strong>
                              #
                              {
                                deployment.id
                              }
                            </strong>
                          </td>

                          <td>
                            <strong>
                              {
                                deployment.application
                              }
                            </strong>
                          </td>

                          <td>
                            <code>
                              {
                                deployment.version
                              }
                            </code>
                          </td>

                          <td>
                            <strong>
                              {
                                deployment.server_name ||
                                "Unknown"
                              }
                            </strong>

                            <small>
                              {
                                deployment.ec2_instance_id ||
                                "No instance ID"
                              }
                            </small>
                          </td>

                          <td>

                            <span
                              className={
                                "status-badge " +
                                (deployment.status ===
                                "successful"
                                  ? "running"
                                  : deployment.status ===
                                      "failed"
                                    ? "stopped"
                                    : "")
                              }
                            >
                              {
                                deployment.status
                              }
                            </span>

                          </td>

                          <td>
                            {deployment.created_at
                              ? new Date(
                                  deployment.created_at
                                ).toLocaleString()
                              : "—"}
                          </td>

                          <td>

                            <div className="action-buttons">

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
                    )}

                  </tbody>

                </table>

              </div>

            </section>

          </>
        )}

      </main>

      <footer className="footer">

        <span>
          CloudOps Automator
        </span>

        <span>
          AWS & DevOps Management
          Platform
        </span>

      </footer>

    </div>
  );
}

export default App;
