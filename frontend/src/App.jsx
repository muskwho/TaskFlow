import { useEffect, useState } from "react"
import "./App.css"

const API_URL = "http://127.0.0.1:8000"

function App() {
  // =========================
  // AUTH STATE
  // =========================

  const [authMode, setAuthMode] = useState("login")

  const [authName, setAuthName] = useState("")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authError, setAuthError] = useState("")

  const [token, setToken] = useState(
    localStorage.getItem("token")
  )

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"))
    } catch {
      return null
    }
  })

  // =========================
  // UI STATE
  // =========================

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  )

  // =========================
  // TASK STATE
  // =========================

  const [tasks, setTasks] = useState([])

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [estimatedMinutes, setEstimatedMinutes] = useState("")
  const [deadline, setDeadline] = useState("")

  // =========================
  // AI STATE
  // =========================

  const [aiTask, setAiTask] = useState("")
  const [aiResult, setAiResult] = useState("")
  const [aiLoading, setAiLoading] = useState(false)

  const [availableHours, setAvailableHours] = useState("")
  const [planResult, setPlanResult] = useState("")
  const [planLoading, setPlanLoading] = useState(false)

  const [rescheduleResult, setRescheduleResult] = useState("")
  const [rescheduleLoading, setRescheduleLoading] = useState(false)

  // =========================
  // INSIGHTS
  // =========================

  const [insights, setInsights] = useState(null)

  // =========================
  // FOCUS MODE
  // =========================

  const [focusTask, setFocusTask] = useState(null)
  const [focusDuration, setFocusDuration] = useState(25)
  const [focusTime, setFocusTime] = useState(25 * 60)
  const [focusRunning, setFocusRunning] = useState(false)

  // =========================
  // THEME
  // =========================

  useEffect(() => {
    localStorage.setItem(
      "theme",
      darkMode ? "dark" : "light"
    )
  }, [darkMode])

  // =========================
  // DASHBOARD STATS
  // =========================

  const totalTasks = tasks.length

  const pendingTasks = tasks.filter(
    (task) => task.status !== "completed"
  ).length

  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length

  const completionRate =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100)

  // =========================
  // LOGOUT
  // =========================

  const logoutUser = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")

    setToken(null)
    setCurrentUser(null)
    setTasks([])
    setFocusTask(null)
    setFocusRunning(false)
    setMobileMenuOpen(false)
  }

  // =========================
  // LOGIN
  // =========================

  const loginUser = async () => {
    setAuthError("")

    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("Please enter your email and password.")
      return
    }

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: authEmail,
          password: authPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Login failed")
      }

      localStorage.setItem("token", data.access_token)

      const user = {
        id: data.user_id,
        name: data.name,
      }

      localStorage.setItem("user", JSON.stringify(user))

      setToken(data.access_token)
      setCurrentUser(user)

      setAuthEmail("")
      setAuthPassword("")
      setAuthError("")
    } catch (error) {
      setAuthError(error.message)
    }
  }

  // =========================
  // REGISTER
  // =========================

  const registerUser = async () => {
    setAuthError("")

    if (
      !authName.trim() ||
      !authEmail.trim() ||
      !authPassword.trim()
    ) {
      setAuthError("Please fill in all fields.")
      return
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          password: authPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || "Registration failed"
        )
      }

      setAuthMode("login")
      setAuthName("")
      setAuthEmail("")
      setAuthPassword("")

      setAuthError(
        "Account created successfully. Please login."
      )
    } catch (error) {
      setAuthError(error.message)
    }
  }

  // =========================
  // GET TASKS
  // =========================

  const fetchTasks = async () => {
    const savedToken = localStorage.getItem("token")

    if (!savedToken) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      })

      if (response.status === 401) {
        logoutUser()
        return
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        console.error("Unexpected task response:", data)
        setTasks([])
        return
      }

      setTasks(data)
    } catch (error) {
      console.error("Error fetching tasks:", error)
      setTasks([])
    }
  }

  // =========================
  // FETCH INSIGHTS
  // =========================

  const fetchInsights = async () => {
    const savedToken = localStorage.getItem("token")

    if (!savedToken) return

    try {
      const response = await fetch(
        `${API_URL}/productivity/insights`,
        {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        }
      )

      if (response.status === 401) {
        logoutUser()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        console.error("Failed to fetch insights:", data)
        return
      }

      setInsights(data)
    } catch (error) {
      console.error("Insights error:", error)
    }
  }

  useEffect(() => {
    if (token) {
      fetchTasks()
      fetchInsights()
    }
  }, [token])

  // =========================
  // FOCUS TIMER
  // =========================

  useEffect(() => {
    if (!focusRunning) return

    const timer = setInterval(() => {
      setFocusTime((previous) => {
        if (previous <= 1) {
          clearInterval(timer)
          setFocusRunning(false)
          return 0
        }

        return previous - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [focusRunning])

  const startFocus = (task, duration = focusDuration) => {
    setFocusTask(task)
    setFocusDuration(duration)
    setFocusTime(duration * 60)
    setFocusRunning(true)
  }

  const stopFocus = () => {
    setFocusRunning(false)
    setFocusTask(null)
  }

  const resetFocus = () => {
    setFocusRunning(false)
    setFocusTime(focusDuration * 60)
  }

  const formatFocusTime = () => {
    const minutes = Math.floor(focusTime / 60)
    const seconds = focusTime % 60

    return `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`
  }

  // =========================
  // CREATE TASK
  // =========================

  const createTask = async () => {
    const savedToken = localStorage.getItem("token")

    if (!savedToken) {
      return
    }

    if (!title.trim()) {
      alert("Please enter a task title.")
      return
    }

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${savedToken}`,
        },
        body: JSON.stringify({
          title: title,
          description: description || null,
          priority: priority,
          deadline: deadline
            ? new Date(deadline).toISOString()
            : null,
          estimated_minutes: estimatedMinutes
            ? Number(estimatedMinutes)
            : null,
        }),
      })

      if (response.status === 401) {
        logoutUser()
        return
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || "Could not create task")
      }

      setTitle("")
      setDescription("")
      setEstimatedMinutes("")
      setDeadline("")
      setPriority("medium")

      await fetchTasks()
      await fetchInsights()
    } catch (error) {
      console.error("Error creating task:", error)
      alert(error.message)
    }
  }

  // =========================
  // COMPLETE TASK
  // =========================

  const completeTask = async (taskId) => {
    const savedToken = localStorage.getItem("token")

    try {
      const response = await fetch(
        `${API_URL}/tasks/${taskId}/complete`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        }
      )

      if (response.status === 401) {
        logoutUser()
        return
      }

      if (!response.ok) {
        throw new Error("Could not complete task")
      }

      if (focusTask?.id === taskId) {
        setFocusTask(null)
        setFocusRunning(false)
      }

      await fetchTasks()
      await fetchInsights()
    } catch (error) {
      console.error("Error completing task:", error)
    }
  }

  // =========================
  // DELETE TASK
  // =========================

  const deleteTask = async (taskId) => {
    const savedToken = localStorage.getItem("token")

    try {
      const response = await fetch(
        `${API_URL}/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        }
      )

      if (response.status === 401) {
        logoutUser()
        return
      }

      if (!response.ok) {
        throw new Error("Could not delete task")
      }

      if (focusTask?.id === taskId) {
        setFocusTask(null)
        setFocusRunning(false)
      }

      await fetchTasks()
      await fetchInsights()
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  // =========================
  // AI TASK BREAKDOWN
  // =========================

  const breakdownTask = async () => {
    if (!aiTask.trim()) {
      return
    }

    setAiLoading(true)
    setAiResult("")

    try {
      const response = await fetch(
        `${API_URL}/ai/breakdown`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task: aiTask,
          }),
        }
      )

      if (response.status === 401) {
        logoutUser()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || "AI request failed"
        )
      }

      setAiResult(data.breakdown)
    } catch (error) {
      console.error("Error getting AI breakdown:", error)
      setAiResult(
        "Something went wrong. Please try again."
      )
    } finally {
      setAiLoading(false)
    }
  }

  // =========================
  // AI DAILY PLAN
  // =========================

  const createDailyPlan = async () => {
    if (!availableHours.trim()) {
      return
    }

    setPlanLoading(true)
    setPlanResult("")

    const taskText = tasks
      .filter((task) => task.status !== "completed")
      .map(
        (task) =>
          `${task.title} - ${
            task.estimated_minutes || 0
          } minutes - ${task.priority} priority`
      )
      .join("; ")

    try {
      const response = await fetch(
        `${API_URL}/ai/daily-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tasks: taskText,
            available_hours: Number(availableHours),
          }),
        }
      )

      if (response.status === 401) {
        logoutUser()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not create plan"
        )
      }

      setPlanResult(data.plan)
    } catch (error) {
      console.error("Error creating daily plan:", error)
      setPlanResult(
        "Something went wrong. Please try again."
      )
    } finally {
      setPlanLoading(false)
    }
  }

  // =========================
  // AI RESCHEDULING
  // =========================

  const rescheduleTasks = async () => {
    if (!availableHours.trim()) {
      return
    }

    setRescheduleLoading(true)
    setRescheduleResult("")

    const taskText = tasks
      .filter((task) => task.status !== "completed")
      .map(
        (task) =>
          `${task.title} - ${
            task.estimated_minutes || 0
          } minutes - ${task.priority} priority - ${
            task.deadline
              ? `deadline ${new Date(
                  task.deadline
                ).toLocaleString()}`
              : "no deadline"
          }`
      )
      .join("; ")

    try {
      const response = await fetch(
        `${API_URL}/ai/reschedule`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tasks: taskText,
            available_hours: Number(availableHours),
          }),
        }
      )

      if (response.status === 401) {
        logoutUser()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not reschedule tasks"
        )
      }

      setRescheduleResult(data.plan)
    } catch (error) {
      console.error("Error rescheduling tasks:", error)
      setRescheduleResult(
        "Something went wrong. Please try again."
      )
    } finally {
      setRescheduleLoading(false)
    }
  }

  // =========================
  // NAVIGATION
  // =========================

  const scrollToSection = (id) => {
    setMobileMenuOpen(false)

    const element = document.getElementById(id)

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  // =========================
  // LOGIN / REGISTER SCREEN
  // =========================

  if (!token) {
    return (
      <div className={`auth-page ${darkMode ? "dark-mode" : ""}`}>
        <div className="auth-background-shape shape-one"></div>
        <div className="auth-background-shape shape-two"></div>

        <button
          className="auth-theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle theme"
        >
          {darkMode ? "☀" : "☾"}
        </button>

        <div className="auth-container">
          <div className="auth-brand">
            <div className="brand-icon">✦</div>

            <div>
              <h1>TaskFlow</h1>
              <p>AI Productivity Copilot</p>
            </div>
          </div>

          <div className="auth-card">
            <div className="auth-card-header">
              <span className="auth-eyebrow">
                {authMode === "login"
                  ? "WELCOME BACK"
                  : "GET STARTED"}
              </span>

              <h2>
                {authMode === "login"
                  ? "Welcome back"
                  : "Create your account"}
              </h2>

              <p>
                {authMode === "login"
                  ? "Sign in to continue planning your day."
                  : "Start organizing your work with AI."}
              </p>
            </div>

            {authMode === "register" && (
              <div className="form-group">
                <label>Full name</label>

                <input
                  type="text"
                  placeholder="Enter your name"
                  value={authName}
                  onChange={(e) =>
                    setAuthName(e.target.value)
                  }
                />
              </div>
            )}

            <div className="form-group">
              <label>Email address</label>

              <input
                type="email"
                placeholder="you@example.com"
                value={authEmail}
                onChange={(e) =>
                  setAuthEmail(e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={authPassword}
                onChange={(e) =>
                  setAuthPassword(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    authMode === "login"
                      ? loginUser()
                      : registerUser()
                  }
                }}
              />
            </div>

            {authError && (
              <div
                className={
                  authError.includes("successfully")
                    ? "auth-success"
                    : "auth-error"
                }
              >
                {authError}
              </div>
            )}

            <button
              className="primary-auth-button"
              onClick={
                authMode === "login"
                  ? loginUser
                  : registerUser
              }
            >
              {authMode === "login"
                ? "Sign in"
                : "Create account"}

              <span>→</span>
            </button>

            <div className="auth-divider">
              <span>OR</span>
            </div>

            <p className="auth-switch-text">
              {authMode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}

              <button
                onClick={() => {
                  setAuthMode(
                    authMode === "login"
                      ? "register"
                      : "login"
                  )
                  setAuthError("")
                }}
              >
                {authMode === "login"
                  ? "Create one"
                  : "Sign in"}
              </button>
            </p>
          </div>

          <div className="auth-features">
            <div>
              <span>✦</span>
              AI-powered planning
            </div>

            <div>
              <span>✓</span>
              Smart task management
            </div>

            <div>
              <span>↗</span>
              Stay focused
            </div>
          </div>
        </div>
      </div>
    )
  }

  // =========================
  // MAIN DASHBOARD
  // =========================

  return (
    <div
      className={`app-shell ${
        darkMode ? "dark-mode" : ""
      } ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
    >
      {/* MOBILE OVERLAY */}

      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`sidebar ${
          mobileMenuOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-icon small">✦</div>

          <div className="sidebar-brand-text">
            <h2>TaskFlow</h2>
            <span>AI Copilot</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-label">WORKSPACE</p>

          <button
            className="nav-item active"
            onClick={() =>
              scrollToSection("dashboard")
            }
          >
            <span>⌂</span>
            <label>Dashboard</label>
          </button>

          <button
            className="nav-item"
            onClick={() =>
              scrollToSection("ai-planner")
            }
          >
            <span>✦</span>
            <label>AI Planner</label>
          </button>

          <button
            className="nav-item"
            onClick={() =>
              scrollToSection("create-task")
            }
          >
            <span>＋</span>
            <label>Create Task</label>
          </button>

          <button
            className="nav-item"
            onClick={() =>
              scrollToSection("my-tasks")
            }
          >
            <span>✓</span>
            <label>My Tasks</label>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-icon">✦</span>

            <div className="sidebar-tip-text">
              <strong>Stay productive</strong>
              <p>
                Let AI help you organize
                your workload.
              </p>
            </div>
          </div>

          <button
            className="sidebar-logout"
            onClick={logoutUser}
          >
            <span>↪</span>
            <label>Logout</label>
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <main className="main-content">
        {/* TOPBAR */}

        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-toggle-button"
              onClick={() => {
                if (window.innerWidth <= 800) {
                  setMobileMenuOpen(!mobileMenuOpen)
                } else {
                  setSidebarCollapsed(!sidebarCollapsed)
                }
              }}
              aria-label="Toggle sidebar"
            >
              {mobileMenuOpen ? "×" : "☰"}
            </button>

            <div className="topbar-title">
              <span>Workspace</span>
            </div>
          </div>

          <div className="topbar-user">
            <button
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
            >
              {darkMode ? "☀" : "☾"}
            </button>

            <div className="user-avatar">
              {currentUser?.name
                ?.charAt(0)
                .toUpperCase() || "U"}
            </div>

            <div className="user-info">
              <strong>
                {currentUser?.name || "User"}
              </strong>

              <span>Productivity mode</span>
            </div>

            <button
              className="topbar-logout"
              onClick={logoutUser}
            >
              Logout
            </button>
          </div>
        </header>

        {/* PAGE */}

        <div className="page-content">
          {/* HERO */}

          <section
            className="welcome-section"
            id="dashboard"
          >
            <div>
              <span className="section-eyebrow">
                YOUR WORKSPACE
              </span>

              <h1>
                Good to see you,{" "}
                <span>
                  {currentUser?.name?.split(" ")[0] ||
                    "there"}
                </span>{" "}
                👋
              </h1>

              <p>
                Plan smarter, focus better, and let AI
                handle the busy work.
              </p>
            </div>

            <div className="date-card">
              <span>Today</span>
              <strong>
                {new Date().toLocaleDateString(
                  "en-IN",
                  {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  }
                )}
              </strong>
            </div>
          </section>

          {/* STATS */}

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">
                ◫
              </div>

              <div>
                <span>Total tasks</span>
                <strong>{totalTasks}</strong>
              </div>

              <div className="stat-decoration">
                +
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">
                ◷
              </div>

              <div>
                <span>Pending</span>
                <strong>{pendingTasks}</strong>
              </div>

              <div className="stat-decoration">
                •
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                ✓
              </div>

              <div>
                <span>Completed</span>
                <strong>{completedTasks}</strong>
              </div>

              <div className="stat-decoration">
                ✓
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">
                ↗
              </div>

              <div>
                <span>Completion</span>
                <strong>
                  {completionRate}%
                </strong>
              </div>

              <div className="progress-ring">
                {completionRate}%
              </div>
            </div>
          </section>

          {/* PRODUCTIVITY INSIGHTS */}

          {insights && (
            <section className="insights-section">
              <div className="section-heading">
                <div>
                  <span className="section-eyebrow">
                    YOUR PRODUCTIVITY
                  </span>

                  <h2>Productivity Insights</h2>

                  <p>
                    Understand your progress and focus
                    on what matters next.
                  </p>
                </div>
              </div>

              <div className="insights-grid">
                <div className="insight-card">
                  <div className="insight-icon">✓</div>

                  <div>
                    <span>Completion Rate</span>
                    <strong>
                      {insights.completion_rate}%
                    </strong>
                  </div>
                </div>

                <div className="insight-card">
                  <div className="insight-icon">◷</div>

                  <div>
                    <span>Pending Work</span>

                    <strong>
                      {insights.pending_minutes} min
                    </strong>
                  </div>
                </div>

                <div className="insight-card">
                  <div className="insight-icon">!</div>

                  <div>
                    <span>High Priority</span>

                    <strong>
                      {insights.high_priority_pending}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="ai-insight-box">
                <div className="ai-insight-icon">✦</div>

                <div>
                  <span>AI PRODUCTIVITY INSIGHT</span>

                  <p>{insights.insight}</p>
                </div>
              </div>
            </section>
          )}

          {/* FOCUS MODE */}

          {focusTask && (
            <section className="focus-mode-section">
              <div className="focus-mode-card">
                <span className="section-eyebrow">
                  FOCUS MODE
                </span>

                <div className="focus-active-indicator">
                  <span></span>
                  {focusRunning
                    ? "Focus session active"
                    : "Focus session paused"}
                </div>

                <h2>{focusTask.title}</h2>

                <p>
                  Stay focused on one task at a time.
                </p>

                <div className="focus-duration-label">
                  Choose session length
                </div>

                <div className="focus-duration-options">
                  {[15, 25, 45, 60].map((minutes) => (
                    <button
                      key={minutes}
                      className={
                        focusDuration === minutes
                          ? "duration-button active"
                          : "duration-button"
                      }
                      onClick={() => {
                        setFocusRunning(false)
                        setFocusDuration(minutes)
                        setFocusTime(minutes * 60)
                      }}
                    >
                      {minutes} min
                    </button>
                  ))}
                </div>

                <div className="focus-timer">
                  {formatFocusTime()}
                </div>

                <div className="focus-controls">
                  <button
                    className="primary-button"
                    onClick={() =>
                      setFocusRunning(!focusRunning)
                    }
                  >
                    {focusRunning
                      ? "Ⅱ Pause"
                      : "▶ Start Focus"}
                  </button>

                  <button
                    className="secondary-button"
                    onClick={resetFocus}
                  >
                    ↻ Reset
                  </button>

                  <button
                    className="secondary-button"
                    onClick={stopFocus}
                  >
                    ← Exit
                  </button>
                </div>

                {focusTime === 0 && (
                  <div className="focus-complete-message">
                    ✦ Focus session complete! Great work.
                  </div>
                )}
              </div>
            </section>
          )}

          {/* AI SECTION */}

          <section
            className="ai-planner-section"
            id="ai-planner"
          >
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">
                  INTELLIGENT TOOLS
                </span>

                <h2>AI Productivity Studio</h2>

                <p>
                  Turn your workload into an organized,
                  actionable plan.
                </p>
              </div>

              <div className="ai-badge">
                <span>✦</span>
                Powered by AI
              </div>
            </div>

            <div className="ai-grid">
              {/* BREAKDOWN */}

              <div className="ai-card breakdown-card">
                <div className="ai-card-top">
                  <div className="ai-card-icon blue-icon">
                    ✦
                  </div>

                  <span className="ai-card-number">
                    01
                  </span>
                </div>

                <h3>Break Down a Task</h3>

                <p>
                  Turn a complex task into simple,
                  actionable steps.
                </p>

                <textarea
                  className="ai-textarea"
                  placeholder="e.g. Build an AI productivity planner..."
                  value={aiTask}
                  onChange={(e) =>
                    setAiTask(e.target.value)
                  }
                />

                <button
                  className="ai-action-button blue-button"
                  onClick={breakdownTask}
                  disabled={aiLoading}
                >
                  {aiLoading
                    ? "Working..."
                    : "Break down task"}

                  <span>→</span>
                </button>

                {aiResult && (
                  <div className="ai-result-box">
                    <div className="result-heading">
                      <span>✦</span>
                      AI Suggestions
                    </div>

                    <pre>{aiResult}</pre>
                  </div>
                )}
              </div>

              {/* DAILY PLAN */}

              <div className="ai-card planner-card">
                <div className="ai-card-top">
                  <div className="ai-card-icon purple-icon">
                    ◷
                  </div>

                  <span className="ai-card-number">
                    02
                  </span>
                </div>

                <h3>Plan My Day</h3>

                <p>
                  Create a realistic schedule based on
                  your available time.
                </p>

                <label className="ai-input-label">
                  Available hours today
                </label>

                <input
                  className="ai-number-input"
                  type="number"
                  min="1"
                  step="0.5"
                  placeholder="e.g. 4"
                  value={availableHours}
                  onChange={(e) =>
                    setAvailableHours(e.target.value)
                  }
                />

                <button
                  className="ai-action-button purple-button"
                  onClick={createDailyPlan}
                  disabled={planLoading}
                >
                  {planLoading
                    ? "Creating..."
                    : "Create my plan"}

                  <span>→</span>
                </button>

                {planResult && (
                  <div className="ai-result-box">
                    <div className="result-heading">
                      <span>◷</span>
                      Today's Plan
                    </div>

                    <pre>{planResult}</pre>
                  </div>
                )}
              </div>

              {/* RESCHEDULE */}

              <div className="ai-card reschedule-card">
                <div className="ai-card-top">
                  <div className="ai-card-icon green-icon">
                    ↻
                  </div>

                  <span className="ai-card-number">
                    03
                  </span>
                </div>

                <h3>Reschedule Tasks</h3>

                <p>
                  Reorganize unfinished work around
                  priorities and deadlines.
                </p>

                <div className="reschedule-info">
                  <div>
                    <span>Pending tasks</span>
                    <strong>{pendingTasks}</strong>
                  </div>

                  <div>
                    <span>Available time</span>

                    <strong>
                      {availableHours
                        ? `${availableHours}h`
                        : "—"}
                    </strong>
                  </div>
                </div>

                <button
                  className="ai-action-button green-button"
                  onClick={rescheduleTasks}
                  disabled={rescheduleLoading}
                >
                  {rescheduleLoading
                    ? "Rescheduling..."
                    : "Optimize schedule"}

                  <span>→</span>
                </button>

                {rescheduleResult && (
                  <div className="ai-result-box">
                    <div className="result-heading">
                      <span>↻</span>
                      Revised Plan
                    </div>

                    <pre>{rescheduleResult}</pre>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* CREATE TASK */}

          <section
            className="create-section"
            id="create-task"
          >
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">
                  TASK MANAGEMENT
                </span>

                <h2>Create a new task</h2>

                <p>
                  Add the details and let TaskFlow keep
                  everything organized.
                </p>
              </div>
            </div>

            <div className="create-task-card">
              <div className="create-form">
                <div className="form-group full-width">
                  <label>Task title</label>

                  <input
                    type="text"
                    placeholder="What do you need to accomplish?"
                    value={title}
                    onChange={(e) =>
                      setTitle(e.target.value)
                    }
                  />
                </div>

                <div className="form-group full-width">
                  <label>Description</label>

                  <textarea
                    placeholder="Add some context or notes..."
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Priority</label>

                    <select
                      value={priority}
                      onChange={(e) =>
                        setPriority(e.target.value)
                      }
                    >
                      <option value="low">
                        Low priority
                      </option>

                      <option value="medium">
                        Medium priority
                      </option>

                      <option value="high">
                        High priority
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Estimated time</label>

                    <input
                      type="number"
                      min="1"
                      placeholder="Minutes"
                      value={estimatedMinutes}
                      onChange={(e) =>
                        setEstimatedMinutes(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Deadline</label>

                    <input
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) =>
                        setDeadline(e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="create-form-footer">
                  <span>
                    ✦ You can edit or complete tasks
                    anytime.
                  </span>

                  <button
                    className="create-task-button"
                    onClick={createTask}
                  >
                    <span>＋</span>
                    Add task
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* TASKS */}

          <section
            className="tasks-section"
            id="my-tasks"
          >
            <div className="section-heading tasks-heading">
              <div>
                <span className="section-eyebrow">
                  YOUR WORK
                </span>

                <h2>My Tasks</h2>

                <p>
                  Keep track of everything you need to
                  get done.
                </p>
              </div>

              <div className="task-count">
                {totalTasks}{" "}
                {totalTasks === 1
                  ? "task"
                  : "tasks"}
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  ✓
                </div>

                <h3>No tasks yet</h3>

                <p>
                  Add your first task above and start
                  organizing your day.
                </p>

                <button
                  onClick={() =>
                    scrollToSection("create-task")
                  }
                >
                  Create your first task →
                </button>
              </div>
            ) : (
              <div className="tasks-grid">
                {tasks.map((task) => (
                  <div
                    className={`task-card-modern ${
                      task.status === "completed"
                        ? "task-completed"
                        : ""
                    }`}
                    key={task.id}
                  >
                    <div className="task-card-header">
                      <span
                        className={`priority-badge priority-${task.priority}`}
                      >
                        {task.priority}
                      </span>

                      <span
                        className={`status-badge ${
                          task.status === "completed"
                            ? "status-completed"
                            : "status-pending"
                        }`}
                      >
                        {task.status === "completed"
                          ? "✓ Completed"
                          : "● Pending"}
                      </span>
                    </div>

                    <h3>{task.title}</h3>

                    {task.description && (
                      <p className="task-description">
                        {task.description}
                      </p>
                    )}

                    <div className="task-details">
                      <div className="task-detail">
                        <span>◷</span>

                        <div>
                          <small>
                            Estimated time
                          </small>

                          <strong>
                            {task.estimated_minutes ||
                              0}{" "}
                            min
                          </strong>
                        </div>
                      </div>

                      <div className="task-detail">
                        <span>⌁</span>

                        <div>
                          <small>Deadline</small>

                          <strong>
                            {task.deadline
                              ? new Date(
                                  task.deadline
                                ).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                  }
                                )
                              : "No deadline"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="task-actions">
                      {task.status !== "completed" && (
                        <button
                          className="focus-button"
                          onClick={() =>
                            startFocus(task)
                          }
                        >
                          ▶ Focus
                        </button>
                      )}

                      {task.status !== "completed" && (
                        <button
                          className="complete-task-button"
                          onClick={() =>
                            completeTask(task.id)
                          }
                        >
                          ✓ Complete
                        </button>
                      )}

                      <button
                        className="delete-task-button"
                        onClick={() =>
                          deleteTask(task.id)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* FOOTER */}

          <footer className="app-footer">
            <div>
              <strong>✦ TaskFlow</strong>

              <span>
                AI Productivity Copilot
              </span>
            </div>

            <p>
              Plan smarter. Focus better. Get things
              done.
            </p>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App