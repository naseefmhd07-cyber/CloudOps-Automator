import { useEffect, useState } from "react";
import "./index.css";

const API_BASE_URL = "http://127.0.0.1:8000/api";
const API_URL = API_BASE_URL + "/servers/";

function App() {
  const [token, setToken] = useState(localStorage.getItem("access_token"));

  const [isLogin, setIsLogin] = useState(true);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [servers, setServers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingServer, setEditingServer] = useState(null);

  const [serverName, setServerName] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [serverStatus, setServerStatus] = useState("running");
  const [serverType, setServerType] = useState("Application");

  useEffect(function () {
    if (token) {
      loadServers();
    }
  }, [token]);

  async function login(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        API_BASE_URL + "/auth/login/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Invalid username or password.");
      }

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      setToken(data.access);
      setMessage("Login successful.");

      setPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function register(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    if (password !== password2) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        API_BASE_URL + "/auth/register/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            email: email,
            password: password,
            password2: password2,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.username) {
          throw new Error(data.username[0]);
        }

        if (data.password) {
          throw new Error(data.password[0]);
        }

        throw new Error("Registration failed.");
      }

      setMessage("Registration successful. Please login.");

      setIsLogin(true);
      setPassword("");
      setPassword2("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    setToken(null);
    setServers([]);
    setMessage("");
    setError("");
  }

  async function loadServers() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      if (response.status === 401) {
        logout();
        throw new Error("Session expired. Please login again.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to load servers.");
      }

      setServers(data.servers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setServerName("");
    setIpAddress("");
    setServerStatus("running");
    setServerType("Application");
    setEditingServer(null);
    setShowForm(false);
  }

  function startAddServer() {
    setMessage("");
    setError("");

    setServerName("");
    setIpAddress("");
    setServerStatus("running");
    setServerType("Application");

    setEditingServer(null);
    setShowForm(true);
  }

  function startEditServer(server) {
    setMessage("");
    setError("");

    setServerName(server.name);
    setIpAddress(server.ip_address);
    setServerStatus(server.status);
    setServerType(server.server_type);

    setEditingServer(server);
    setShowForm(true);
  }

  async function saveServer(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    const serverData = {
      name: serverName,
      ip_address: ipAddress,
      status: serverStatus,
      server_type: serverType,
    };

    try {
      let response;

      if (editingServer) {
        response = await fetch(
          API_URL + editingServer.id + "/",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token,
            },
            body: JSON.stringify(serverData),
          }
        );
      } else {
        response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify(serverData),
        });
      }

      if (response.status === 401) {
        logout();
        throw new Error("Session expired. Please login again.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Unable to save server.");
      }

      if (editingServer) {
        setMessage("Server updated successfully.");
      } else {
        setMessage("Server created successfully.");
      }

      resetForm();
      await loadServers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteServer(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this server?"
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        API_URL + id + "/",
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      if (response.status === 401) {
        logout();
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) {
        throw new Error("Failed to delete server.");
      }

      setMessage("Server deleted successfully.");

      await loadServers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredServers = servers.filter(function (server) {
    const text =
      server.name +
      " " +
      server.ip_address +
      " " +
      server.server_type +
      " " +
      server.status;

    return text.toLowerCase().includes(search.toLowerCase());
  });

  const totalServers = servers.length;

  const runningServers = servers.filter(function (server) {
    return server.status === "running";
  }).length;

  const stoppedServers = servers.filter(function (server) {
    return server.status === "stopped";
  }).length;

  const successfulDeployments = 5;
  const failedDeployments = 1;

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1>CloudOps Automator</h1>
            <p>AWS & DevOps Management Platform</p>
          </div>

          <div className="auth-tabs">
            <button
              className={isLogin ? "active" : ""}
              onClick={function () {
                setIsLogin(true);
                setError("");
                setMessage("");
              }}
            >
              Login
            </button>

            <button
              className={!isLogin ? "active" : ""}
              onClick={function () {
                setIsLogin(false);
                setError("");
                setMessage("");
              }}
            >
              Register
            </button>
          </div>

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {isLogin ? (
            <form onSubmit={login}>
              <div className="form-group">
                <label>Username</label>

                <input
                  type="text"
                  value={username}
                  onChange={function (event) {
                    setUsername(event.target.value);
                  }}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>

                <input
                  type="password"
                  value={password}
                  onChange={function (event) {
                    setPassword(event.target.value);
                  }}
                  placeholder="Enter password"
                  required
                />
              </div>

              <button
                className="primary-button full-width"
                type="submit"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          ) : (
            <form onSubmit={register}>
              <div className="form-group">
                <label>Username</label>

                <input
                  type="text"
                  value={username}
                  onChange={function (event) {
                    setUsername(event.target.value);
                  }}
                  placeholder="Choose username"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>

                <input
                  type="email"
                  value={email}
                  onChange={function (event) {
                    setEmail(event.target.value);
                  }}
                  placeholder="Enter email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>

                <input
                  type="password"
                  value={password}
                  onChange={function (event) {
                    setPassword(event.target.value);
                  }}
                  placeholder="Minimum 8 characters"
                  minLength="8"
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>

                <input
                  type="password"
                  value={password2}
                  onChange={function (event) {
                    setPassword2(event.target.value);
                  }}
                  placeholder="Confirm password"
                  required
                />
              </div>

              <button
                className="primary-button full-width"
                type="submit"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="top-header">
        <div>
          <h1>CloudOps Automator</h1>
          <p>AWS & DevOps Management Platform</p>
        </div>

        <button
          className="logout-button"
          onClick={logout}
        >
          Logout
        </button>
      </header>

      <main className="container">
        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>Dashboard</h2>
              <p>Cloud infrastructure overview</p>
            </div>

            <button
              className="primary-button"
              onClick={loadServers}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">☁️</div>
              <div>
                <h3>Total Servers</h3>
                <strong>{totalServers}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🟢</div>
              <div>
                <h3>Running</h3>
                <strong>{runningServers}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🔴</div>
              <div>
                <h3>Stopped</h3>
                <strong>{stoppedServers}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🚀</div>
              <div>
                <h3>Deployments</h3>
                <strong>
                  {successfulDeployments + failedDeployments}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section className="servers-section">
          <div className="section-heading">
            <div>
              <h2>Servers</h2>
              <p>Manage your infrastructure</p>
            </div>

            <button
              className="primary-button"
              onClick={startAddServer}
            >
              + Add Server
            </button>
          </div>

          <div className="toolbar">
            <input
              className="search-input"
              type="text"
              placeholder="Search servers..."
              value={search}
              onChange={function (event) {
                setSearch(event.target.value);
              }}
            />
          </div>

          {showForm && (
            <div className="server-form-card">
              <div className="section-heading">
                <div>
                  <h2>
                    {editingServer
                      ? "Edit Server"
                      : "Add New Server"}
                  </h2>
                </div>
              </div>

              <form onSubmit={saveServer}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Server Name</label>

                    <input
                      type="text"
                      value={serverName}
                      onChange={function (event) {
                        setServerName(event.target.value);
                      }}
                      placeholder="Example: Web Server"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>IP Address</label>

                    <input
                      type="text"
                      value={ipAddress}
                      onChange={function (event) {
                        setIpAddress(event.target.value);
                      }}
                      placeholder="192.168.1.10"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>

                    <select
                      value={serverStatus}
                      onChange={function (event) {
                        setServerStatus(event.target.value);
                      }}
                    >
                      <option value="running">
                        Running
                      </option>

                      <option value="stopped">
                        Stopped
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Server Type</label>

                    <select
                      value={serverType}
                      onChange={function (event) {
                        setServerType(event.target.value);
                      }}
                    >
                      <option value="Web">
                        Web
                      </option>

                      <option value="Database">
                        Database
                      </option>

                      <option value="Application">
                        Application
                      </option>

                      <option value="Load Balancer">
                        Load Balancer
                      </option>
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={loading}
                  >
                    {editingServer
                      ? "Update Server"
                      : "Create Server"}
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="table-container">
            <table className="server-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>IP Address</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredServers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="empty-state"
                    >
                      No servers found.
                    </td>
                  </tr>
                ) : (
                  filteredServers.map(function (server) {
                    return (
                      <tr key={server.id}>
                        <td>#{server.id}</td>

                        <td>
                          <strong>{server.name}</strong>
                        </td>

                        <td>
                          {server.ip_address}
                        </td>

                        <td>
                          {server.server_type}
                        </td>

                        <td>
                          <span
                            className={
                              server.status === "running"
                                ? "status-badge running"
                                : "status-badge stopped"
                            }
                          >
                            {server.status}
                          </span>
                        </td>

                        <td>
                          {new Date(
                            server.created_at
                          ).toLocaleDateString()}
                        </td>

                        <td>
                          <div className="action-buttons">
                            <button
                              className="edit-button"
                              onClick={function () {
                                startEditServer(server);
                              }}
                            >
                              Edit
                            </button>

                            <button
                              className="delete-button"
                              onClick={function () {
                                deleteServer(server.id);
                              }}
                            >
                              Delete
                            </button>
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

        <section className="deployment-section">
          <div className="section-heading">
            <div>
              <h2>Deployment Status</h2>
              <p>CI/CD deployment overview</p>
            </div>
          </div>

          <div className="deployment-grid">
            <div className="deployment-card">
              <span>Successful Deployments</span>
              <strong>{successfulDeployments}</strong>
            </div>

            <div className="deployment-card">
              <span>Failed Deployments</span>
              <strong>{failedDeployments}</strong>
            </div>

            <div className="deployment-card">
              <span>System Status</span>
              <strong>Healthy</strong>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>
          CloudOps Automator • AWS & DevOps Management Platform
        </p>
      </footer>
    </div>
  );
}

export default App;