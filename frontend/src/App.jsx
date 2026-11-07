import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

// Keep the API URL in frontend/.env as VITE_API_URL if your backend moves.
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");
const TOKEN_KEY = "eventops_token";
const USER_KEY = "eventops_user";

const CATEGORIES = [
  "Technology",
  "Design",
  "Networking",
  "Business",
  "Education",
  "Entertainment",
  "Other",
];

const eventStyles = {
  technology: { color: "violet", icon: "✳" },
  design: { color: "orange", icon: "✦" },
  networking: { color: "green", icon: "↗" },
  business: { color: "blue", icon: "◈" },
  education: { color: "violet", icon: "⌘" },
  entertainment: { color: "orange", icon: "✺" },
};

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error(
      "Cannot connect to the EventOps server. Please try again later.",
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status}).`);
  }

  return data;
}

async function fetchEvents() {
  const data = await apiRequest("/api/events");

  if (!data.success || !Array.isArray(data.events)) {
    throw new Error("The server returned an unexpected events response.");
  }

  return data.events;
}

function formatDate(value, options = {}) {
  if (!value) return "Date to be announced";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date to be announced";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  });
}

function toLocalDateTimeInput(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function getEventStyle(category) {
  const key = String(category || "").toLowerCase();
  return eventStyles[key] || { color: "violet", icon: "✦" };
}

function Brand({ onClick }) {
  return (
    <button
      className="brand"
      type="button"
      onClick={onClick}
      aria-label="EventOps home"
    >
      <span className="brand-mark">E</span>
      <span>
        event<span className="brand-accent">ops</span>
      </span>
    </button>
  );
}

function EventCard({ event, index, onOpen }) {
  const style = getEventStyle(event.category);
  const available = Number(event.availableSeats ?? 0);
  const soldOut = event.isSoldOut === true || available <= 0;
  const lowSeats = !soldOut && available <= 5;

  return (
    <article className="event-card">
      <button
        className={`event-art event-art-${style.color}`}
        type="button"
        onClick={() => onOpen(event)}
        aria-label={`Open ${event.title}`}
      >
        <span className="event-category">{event.category || "Event"}</span>
        <span className="event-art-symbol">{style.icon}</span>
        <span className="event-art-index">
          EVENT / {String(index + 1).padStart(2, "0")}
        </span>
      </button>

      <div className="event-details">
        <span className="event-date">{formatDate(event.date)}</span>
        <h3>{event.title}</h3>
        <p className="event-venue">
          ⌖ {event.venue || "Venue to be announced"}
        </p>

        <div className="event-card-footer">
          <span
            className={`event-availability ${
              soldOut
                ? "availability-sold-out"
                : lowSeats
                  ? "availability-low"
                  : "availability-open"
            }`}
          >
            {soldOut
              ? "Sold out"
              : lowSeats
                ? `Only ${available} seats left`
                : `${available} seats available`}
          </span>

          <button
            className="event-arrow"
            type="button"
            onClick={() => onOpen(event)}
            aria-label={`View ${event.title}`}
          >
            ↗
          </button>
        </div>
      </div>
    </article>
  );
}

function AuthView({ mode, onModeChange, onSuccess, onBack }) {
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      let data;

      if (isRegister) {
        data = await apiRequest("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            fullName: name.trim(),
            email: emailOrPhone.trim().toLowerCase(),
            phone: phone.trim(),
            password,
          }),
        });

        // Registration endpoints may not issue a token, so sign in after registering.
        if (!data.token) {
          data = await apiRequest("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
              email: emailOrPhone.trim().toLowerCase(),
              password,
            }),
          });
        }
      } else {
        data = await apiRequest("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: emailOrPhone.trim().toLowerCase(),
            password,
          }),
        });
      }

      if (!data.token) {
        throw new Error(
          "The server did not return a login token. Check the backend login response.",
        );
      }

      localStorage.setItem(TOKEN_KEY, data.token);

      const authenticatedUser = data.user || data.currentUser || data;

      localStorage.setItem(USER_KEY, JSON.stringify(authenticatedUser));
      onSuccess(authenticatedUser);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="auth-story">
        <span className="section-kicker">YOUR NEXT CHAPTER STARTS HERE</span>

        <h1>
          {isRegister
            ? "Make room for new experiences."
            : "Welcome back to your people."}
        </h1>

        <p>Discover events, meet your community, and make every seat count.</p>

        <div className="auth-art" aria-hidden="true">
          <span>E</span>
          <i>✦</i>
          <b>↗</b>
        </div>
      </div>

      <form className="panel auth-panel" onSubmit={handleSubmit}>
        <button
          className="text-button back-link"
          type="button"
          onClick={onBack}
        >
          ← Back to events
        </button>

        <span className="section-kicker">
          {isRegister ? "JOIN EVENTOPS" : "SIGN IN"}
        </span>

        <h2>{isRegister ? "Create your account" : "Good to see you again."}</h2>

        <p className="muted">
          {isRegister
            ? "A few details and you're in."
            : "Sign in to book events and manage your activity."}
        </p>

        {isRegister && (
          <label>
            Full name
            <input
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              placeholder="Your name"
            />
          </label>
        )}

        <label>
          {isRegister ? "Email address" : "Email or phone number"}
          <input
            autoComplete="username"
            type={isRegister ? "email" : "text"}
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            required
            placeholder={isRegister ? "you@example.com" : "Email or phone"}
          />
        </label>

        {isRegister && (
          <label>
            Phone number
            <input
              autoComplete="tel"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="Your phone number"
            />
          </label>
        )}

        <label>
          Password
          <input
            autoComplete={isRegister ? "new-password" : "current-password"}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder={isRegister ? "At least 6 characters" : "Your password"}
          />
        </label>

        {error && (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        )}

        <button
          className="primary-button full-width"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Please wait..."
            : isRegister
              ? "Create account ↗"
              : "Sign in ↗"}
        </button>

        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "New to EventOps?"}{" "}
          <button
            className="text-button"
            type="button"
            onClick={() => onModeChange(isRegister ? "login" : "register")}
          >
            {isRegister ? "Sign in" : "Create account"}
          </button>
        </p>
      </form>
    </section>
  );
}

function EventForm({ initialEvent, onSave, onCancel, busy }) {
  const [form, setForm] = useState({
    title: initialEvent?.title || "",
    description: initialEvent?.description || "",
    category: initialEvent?.category || "Technology",
    venue: initialEvent?.venue || "",
    date: initialEvent?.date ? toLocalDateTimeInput(initialEvent.date) : "",
    totalSeats: initialEvent?.totalSeats ?? 30,
  });

  const [error, setError] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    setError("");

    if (new Date(form.date).getTime() <= Date.now()) {
      setError("Choose a future date and time for the event.");
      return;
    }

    if (Number(form.totalSeats) < 1) {
      setError("Total seats must be at least 1.");
      return;
    }

    onSave({
      ...form,
      date: new Date(form.date).toISOString(),
      totalSeats: Number(form.totalSeats),
    });
  }

  return (
    <form className="panel event-form" onSubmit={submit}>
      <div className="form-heading">
        <div>
          <span className="section-kicker">
            {initialEvent ? "UPDATE DETAILS" : "NEW EXPERIENCE"}
          </span>
          <h2>{initialEvent ? "Edit event" : "Create an event"}</h2>
        </div>

        <button
          type="button"
          className="icon-button"
          onClick={onCancel}
          aria-label="Close form"
        >
          ×
        </button>
      </div>

      <label>
        Event title
        <input
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          required
          maxLength={100}
          placeholder="e.g. Product Builders Meetup"
        />
      </label>

      <label>
        Description
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          required
          rows={4}
          maxLength={2000}
          placeholder="What should people know about this event?"
        />
      </label>

      <div className="form-grid">
        <label>
          Category
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
          >
            {CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>

        <label>
          Total seats
          <input
            type="number"
            min="1"
            max="100000"
            value={form.totalSeats}
            onChange={(e) => update("totalSeats", e.target.value)}
            required
          />
        </label>
      </div>

      <label>
        Venue
        <input
          value={form.venue}
          onChange={(e) => update("venue", e.target.value)}
          required
          placeholder="Venue, city"
        />
      </label>

      <label>
        Date and time
        <input
          type="datetime-local"
          value={form.date}
          onChange={(e) => update("date", e.target.value)}
          required
        />
      </label>

      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>

        <button className="primary-button" type="submit" disabled={busy}>
          {busy
            ? "Saving..."
            : initialEvent
              ? "Save changes ↗"
              : "Publish event ↗"}
        </button>
      </div>
    </form>
  );
}

function App() {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState("home");
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(getStoredUser);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [sort, setSort] = useState("date");
  const [myBookings, setMyBookings] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalSeats: 0,
    availableSeats: 0,
  });
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Frontend role visibility. The backend still enforces actual authorization.
  const isOrganizer = user?.role === "organizer";

  const flash = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 4000);
  }, []);

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    setEventsError("");

    try {
      const eventData = await fetchEvents();
      setEvents(eventData);
    } catch (error) {
      setEventsError(error.message || "Unable to load events.");
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadInitialEvents() {
      try {
        const eventData = await fetchEvents();

        if (isActive) {
          setEvents(eventData);
        }
      } catch (error) {
        if (isActive) {
          setEventsError(error.message || "Unable to load events.");
        }
      } finally {
        if (isActive) {
          setLoadingEvents(false);
        }
      }
    }

    loadInitialEvents();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...events]
      .filter(
        (event) =>
          categoryFilter === "All categories" ||
          String(event.category).toLowerCase() === categoryFilter.toLowerCase(),
      )
      .filter(
        (event) =>
          !query ||
          [event.title, event.category, event.venue, event.description].some(
            (value) =>
              String(value || "")
                .toLowerCase()
                .includes(query),
          ),
      )
      .sort((a, b) =>
        sort === "title"
          ? String(a.title).localeCompare(String(b.title))
          : sort === "seats"
            ? Number(b.availableSeats || 0) - Number(a.availableSeats || 0)
            : new Date(a.date) - new Date(b.date),
      );
  }, [events, search, categoryFilter, sort]);

  async function handleAuthSuccess(authenticatedUser) {
    setUser(authenticatedUser);
    setView("home");
    flash("You're signed in. Welcome to EventOps!");
    await loadEvents();
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setUser(null);
    setMyBookings([]);
    setMyEvents([]);
    setShowEventForm(false);
    setEditingEvent(null);
    setView("home");

    flash("You've been signed out.");
  }

  async function openDashboard() {
    if (!getToken()) {
      setAuthMode("login");
      setView("auth");
      return;
    }

    // Do not let attendee or admin accounts open the organizer workspace.
    if (!isOrganizer) {
      setView("home");
      setShowEventForm(false);
      setEditingEvent(null);
      flash("Organizer access is available only to organizer accounts.");
      return;
    }

    setView("dashboard");
    setDashboardLoading(true);
    setDashboardError("");

    try {
      const [eventsData, statsData] = await Promise.all([
        apiRequest("/api/events/my-events"),
        apiRequest("/api/events/stats"),
      ]);

      setMyEvents(eventsData.events || []);
      setStats({
        totalEvents: statsData.totalEvents || 0,
        totalSeats: statsData.totalSeats || 0,
        availableSeats: statsData.availableSeats || 0,
      });
    } catch (error) {
      setDashboardError(error.message || "Unable to load organizer dashboard.");
    } finally {
      setDashboardLoading(false);
    }
  }

  async function openBookings() {
    if (!getToken()) {
      setAuthMode("login");
      setView("auth");
      return;
    }

    setView("bookings");
    setDashboardLoading(true);
    setDashboardError("");

    try {
      const data = await apiRequest("/api/bookings/my-bookings");
      setMyBookings(data.bookings || []);
    } catch (error) {
      setDashboardError(error.message || "Unable to load your bookings.");
    } finally {
      setDashboardLoading(false);
    }
  }

  async function bookSelectedEvent() {
    if (!selectedEvent) return;

    if (!getToken()) {
      setAuthMode("login");
      setView("auth");
      flash("Please sign in before booking an event.");
      return;
    }

    setActionBusy(true);

    try {
      const data = await apiRequest("/api/bookings", {
        method: "POST",
        body: JSON.stringify({ eventId: selectedEvent._id }),
      });

      flash(data.message || "Booking request completed.");

      await loadEvents();

      const refreshed = await apiRequest(`/api/events/${selectedEvent._id}`);
      setSelectedEvent(refreshed.event || refreshed);
    } catch (error) {
      flash(error.message || "Booking failed.");
    } finally {
      setActionBusy(false);
    }
  }

  async function cancelBooking(booking) {
    if (!window.confirm("Cancel this booking?")) return;

    setActionBusy(true);

    try {
      const bookingId = booking._id || booking.id;

      const data = await apiRequest(`/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
      });

      flash(data.message || "Booking cancelled.");

      await openBookings();
      await loadEvents();
    } catch (error) {
      flash(error.message || "Unable to cancel this booking.");
    } finally {
      setActionBusy(false);
    }
  }

  async function saveEvent(formData) {
    // Defense in depth: don't even send an organizer write request from an attendee UI.
    if (!isOrganizer || !getToken()) {
      flash("Only organizer accounts can create or update events.");
      setShowEventForm(false);
      setEditingEvent(null);
      setView("home");
      return;
    }

    setSavingEvent(true);

    try {
      const path = editingEvent
        ? `/api/events/${editingEvent._id}`
        : "/api/events";

      const data = await apiRequest(path, {
        method: editingEvent ? "PUT" : "POST",
        body: JSON.stringify(formData),
      });

      flash(
        data.message || (editingEvent ? "Event updated." : "Event created."),
      );

      setShowEventForm(false);
      setEditingEvent(null);

      await openDashboard();
      await loadEvents();
    } catch (error) {
      flash(error.message || "Unable to save the event.");
    } finally {
      setSavingEvent(false);
    }
  }

  async function deleteEvent(event) {
    if (!isOrganizer || !getToken()) {
      flash("Only organizer accounts can delete events.");
      return;
    }

    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) {
      return;
    }

    setActionBusy(true);

    try {
      const data = await apiRequest(`/api/events/${event._id}`, {
        method: "DELETE",
      });

      flash(data.message || "Event deleted.");

      await openDashboard();
      await loadEvents();
    } catch (error) {
      flash(error.message || "Unable to delete the event.");
    } finally {
      setActionBusy(false);
    }
  }

  function goHome() {
    setView("home");
    setSelectedEvent(null);
    setShowEventForm(false);
    setEditingEvent(null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEvent(event) {
    setSelectedEvent(event);
    setView("details");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const categories = useMemo(
    () => [
      "All categories",
      ...new Set(events.map((event) => event.category).filter(Boolean)),
    ],
    [events],
  );

  return (
    <div className="app-shell">
      <header className="navbar">
        <Brand onClick={goHome} />

        <nav className="nav-links" aria-label="Main navigation">
          <button
            className={view === "home" ? "nav-active" : ""}
            onClick={goHome}
          >
            Discover
          </button>

          <button
            onClick={() => {
              goHome();
              document
                .getElementById("events")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Explore Events
          </button>

          <button
            onClick={() => {
              goHome();
              document
                .getElementById("about")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            About
          </button>
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <button
                className="login-button"
                type="button"
                onClick={openBookings}
              >
                My bookings
              </button>

              {/* Organizer navigation is rendered only for organizer accounts. */}
              {isOrganizer && (
                <button
                  className="primary-button nav-cta"
                  type="button"
                  onClick={openDashboard}
                >
                  Organizer hub ↗
                </button>
              )}

              <button className="login-button" type="button" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                className="login-button"
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setView("auth");
                }}
              >
                Log in
              </button>

              <button
                className="primary-button nav-cta"
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setView("auth");
                }}
              >
                Get Started <span>↗</span>
              </button>
            </>
          )}
        </div>
      </header>

      <main id="home">
        {view === "auth" && (
          <AuthView
            mode={authMode}
            onModeChange={setAuthMode}
            onSuccess={handleAuthSuccess}
            onBack={goHome}
          />
        )}

        {view === "details" && selectedEvent && (
          <section className="events-section detail-section">
            <button
              className="secondary-button back-link"
              type="button"
              onClick={() => setView("home")}
            >
              ← Back to events
            </button>

            <div className="detail-layout">
              <div>
                <div
                  className={`detail-art event-art-${getEventStyle(selectedEvent.category).color}`}
                >
                  <span className="event-category">
                    {selectedEvent.category}
                  </span>

                  <span className="detail-art-symbol">
                    {getEventStyle(selectedEvent.category).icon}
                  </span>

                  <span className="event-art-index">EVENT / FEATURED</span>
                </div>

                <div className="detail-copy">
                  <span className="section-kicker">THE EXPERIENCE</span>
                  <h1>{selectedEvent.title}</h1>
                  <p>
                    {selectedEvent.description ||
                      "An opportunity to connect with people, discover new ideas, and experience something memorable."}
                  </p>
                </div>
              </div>

              <aside className="panel booking-panel">
                <span className="section-kicker">EVENT DETAILS</span>
                <h2>Make it a date.</h2>

                <div className="detail-fact">
                  <span>Date</span>
                  <strong>
                    {formatDate(selectedEvent.date, { month: "long" })}
                  </strong>
                </div>

                <div className="detail-fact">
                  <span>Venue</span>
                  <strong>{selectedEvent.venue || "To be announced"}</strong>
                </div>

                <div className="detail-fact">
                  <span>Organizer</span>
                  <strong>
                    {selectedEvent.organizerName ||
                      selectedEvent.organizer?.fullName ||
                      "Event organizer"}
                  </strong>
                </div>

                <div className="detail-fact">
                  <span>Seats available</span>
                  <strong>
                    {selectedEvent.availableSeats ?? 0} /{" "}
                    {selectedEvent.totalSeats ?? "—"}
                  </strong>
                </div>

                <button
                  className="primary-button full-width"
                  type="button"
                  onClick={bookSelectedEvent}
                  disabled={
                    actionBusy ||
                    selectedEvent.isSoldOut ||
                    Number(selectedEvent.availableSeats) <= 0
                  }
                >
                  {actionBusy
                    ? "Working..."
                    : Number(selectedEvent.availableSeats) <= 0
                      ? "Sold out"
                      : "Book this event ↗"}
                </button>

                <p className="fine-print">
                  Booking availability is confirmed by the server.
                </p>
              </aside>
            </div>
          </section>
        )}

        {view === "home" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="status-dot" /> YOUR NEXT GREAT EXPERIENCE
                  STARTS HERE
                </div>

                <h1>
                  Find your people.
                  <br />
                  <span>Find your event.</span>
                </h1>

                <p className="hero-description">
                  Discover experiences that inspire you, connect you with your
                  community, and turn ordinary days into something memorable.
                </p>

                <div className="hero-actions">
                  <button
                    className="primary-button hero-cta"
                    onClick={() =>
                      document
                        .getElementById("events")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Explore events <span>↗</span>
                  </button>

                  <button
                    className="secondary-button"
                    onClick={() =>
                      document
                        .getElementById("about")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    How it works <span>→</span>
                  </button>
                </div>

                <div className="social-proof">
                  <div className="avatar-stack" aria-label="Community members">
                    <span>R</span>
                    <span>A</span>
                    <span>M</span>
                    <span>S</span>
                  </div>

                  <div>
                    <strong>Built for curious minds</strong>
                    <p>Discover. Connect. Experience.</p>
                  </div>
                </div>
              </div>

              <div
                className="hero-visual"
                aria-label="Event discovery illustration"
              >
                <div className="visual-orbit orbit-one" />
                <div className="visual-orbit orbit-two" />

                <div className="floating-tag tag-top">
                  <span className="tag-icon">✦</span>
                  <div>
                    <strong>Find your spark</strong>
                    <small>Something new awaits</small>
                  </div>
                </div>

                <div className="hero-art">
                  <div className="art-glow" />
                  <div className="art-circle circle-back" />
                  <div className="art-circle circle-front">
                    <span className="art-symbol">E</span>
                  </div>
                  <span className="art-star star-one">✦</span>
                  <span className="art-star star-two">✳</span>
                  <span className="art-star star-three">✦</span>

                  <div className="art-caption">
                    <span>01 / DISCOVER</span>
                    <span>THE POSSIBILITIES</span>
                  </div>
                </div>

                <div className="floating-tag tag-bottom">
                  <span className="online-indicator" />
                  <div>
                    <strong>Your next chapter</strong>
                    <small>Starts with showing up.</small>
                  </div>
                  <span className="tag-arrow">↗</span>
                </div>
              </div>
            </section>

            <section className="stats-strip" aria-label="EventOps highlights">
              <div>
                <strong>Discover</strong>
                <span>Experiences worth your time</span>
              </div>
              <div>
                <strong>Connect</strong>
                <span>People who share your interests</span>
              </div>
              <div>
                <strong>Experience</strong>
                <span>Moments beyond the everyday</span>
              </div>
            </section>

            <section className="events-section" id="events">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">CURATED FOR YOU</span>
                  <h2>Something worth showing up for.</h2>
                  <p>Explore experiences designed to bring people together.</p>
                </div>

                <span className="live-count">
                  {events.length} live{" "}
                  {events.length === 1 ? "event" : "events"}
                </span>
              </div>

              <div className="event-toolbar">
                <label className="search-box">
                  <span>⌕</span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search title, category or venue..."
                    aria-label="Search events"
                  />
                </label>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  aria-label="Filter category"
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sort events"
                >
                  <option value="date">Soonest first</option>
                  <option value="title">Title A–Z</option>
                  <option value="seats">Most seats</option>
                </select>

                <button
                  className="secondary-button refresh-button"
                  onClick={loadEvents}
                  disabled={loadingEvents}
                >
                  {loadingEvents ? "Refreshing..." : "↻ Refresh"}
                </button>
              </div>

              {loadingEvents && (
                <div className="state-card">
                  <span className="spinner" />
                  <strong>Discovering events...</strong>
                  <p>Finding the next experience for you.</p>
                </div>
              )}

              {!loadingEvents && eventsError && (
                <div className="state-card state-error">
                  <strong>We couldn't load events.</strong>
                  <p>{eventsError}</p>
                  <button className="secondary-button" onClick={loadEvents}>
                    Try again
                  </button>
                </div>
              )}

              {!loadingEvents &&
                !eventsError &&
                filteredEvents.length === 0 && (
                  <div className="state-card">
                    <strong>
                      {events.length
                        ? "No matching events"
                        : "The calendar is waiting."}
                    </strong>

                    <p>
                      {events.length
                        ? "Try another search or category."
                        : "No upcoming events yet. Check back soon!"}
                    </p>

                    {(search || categoryFilter !== "All categories") && (
                      <button
                        className="secondary-button"
                        onClick={() => {
                          setSearch("");
                          setCategoryFilter("All categories");
                        }}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}

              {!loadingEvents && !eventsError && filteredEvents.length > 0 && (
                <div className="event-grid">
                  {filteredEvents.map((event, index) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      index={index}
                      onOpen={openEvent}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="closing-banner" id="about">
              <div>
                <span className="section-kicker">
                  YOUR PEOPLE ARE OUT THERE
                </span>
                <h2>Make room for something new.</h2>
                <p>Your next memorable experience is one discovery away.</p>
              </div>

              <button
                className="primary-button"
                onClick={() =>
                  document
                    .getElementById("events")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Find your next event <span>↗</span>
              </button>
            </section>
          </>
        )}

        {view === "bookings" && (
          <section className="events-section dashboard-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">YOUR ACTIVITY</span>
                <h2>My bookings</h2>
                <p>Keep your upcoming plans in one place.</p>
              </div>

              <button className="secondary-button" onClick={goHome}>
                ← Discover events
              </button>
            </div>

            {dashboardLoading && (
              <div className="state-card">
                <span className="spinner" />
                <strong>Loading bookings...</strong>
              </div>
            )}

            {!dashboardLoading && dashboardError && (
              <div className="notice notice-error">{dashboardError}</div>
            )}

            {!dashboardLoading &&
              !dashboardError &&
              myBookings.length === 0 && (
                <div className="state-card">
                  <strong>No bookings found yet.</strong>
                  <p>When you book an event, it will appear here.</p>
                  <button className="primary-button" onClick={goHome}>
                    Explore events ↗
                  </button>
                </div>
              )}

            {!dashboardLoading && !dashboardError && myBookings.length > 0 && (
              <div className="stack-list">
                {myBookings.map((booking) => {
                  const event = booking.event || booking.eventId || {};
                  const status =
                    booking.bookingStatus || booking.status || "Confirmed";

                  return (
                    <article className="list-card" key={booking._id}>
                      <div>
                        <span
                          className={`booking-status ${
                            status === "Cancelled"
                              ? "booking-status-cancelled"
                              : "booking-status-confirmed"
                          }`}
                        >
                          {status}
                        </span>

                        <h3>
                          {event.title || booking.eventTitle || "Event booking"}
                        </h3>

                        <p>
                          {event.venue || booking.venue || "Venue unavailable"}{" "}
                          · {formatDate(event.date || booking.eventDate)}
                        </p>

                        <small>Booking ID: {booking._id}</small>
                      </div>

                      {status === "Confirmed" && (
                        <button
                          className="danger-button"
                          onClick={() => cancelBooking(booking)}
                          disabled={actionBusy}
                        >
                          Cancel booking
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Only organizer accounts can render the organizer workspace. */}
        {view === "dashboard" && isOrganizer && (
          <section className="events-section dashboard-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">ORGANIZER WORKSPACE</span>
                <h2>Your events, in one place.</h2>
                <p>Create, update and manage events you organize.</p>
              </div>

              <button
                className="primary-button"
                onClick={() => {
                  setEditingEvent(null);
                  setShowEventForm(true);
                }}
              >
                ＋ Create event
              </button>
            </div>

            {dashboardLoading && (
              <div className="state-card">
                <span className="spinner" />
                <strong>Loading organizer hub...</strong>
              </div>
            )}

            {!dashboardLoading && dashboardError && (
              <div className="state-card state-error">
                <strong>Organizer data couldn't load.</strong>
                <p>{dashboardError}</p>
                <button className="secondary-button" onClick={openDashboard}>
                  Try again
                </button>
              </div>
            )}

            {!dashboardLoading && !dashboardError && (
              <div className="stat-cards">
                <div className="panel">
                  <span>Total events</span>
                  <strong>{stats.totalEvents}</strong>
                </div>

                <div className="panel">
                  <span>Total capacity</span>
                  <strong>{stats.totalSeats}</strong>
                </div>

                <div className="panel">
                  <span>Seats available</span>
                  <strong>{stats.availableSeats}</strong>
                </div>
              </div>
            )}

            {showEventForm && (
              <EventForm
                initialEvent={editingEvent}
                onSave={saveEvent}
                onCancel={() => {
                  setShowEventForm(false);
                  setEditingEvent(null);
                }}
                busy={savingEvent}
              />
            )}

            {!dashboardLoading &&
              !dashboardError &&
              !showEventForm &&
              myEvents.length === 0 && (
                <div className="state-card">
                  <strong>Your organizer journey starts here.</strong>
                  <p>You haven't created an event yet.</p>

                  <button
                    className="primary-button"
                    onClick={() => setShowEventForm(true)}
                  >
                    Create your first event ↗
                  </button>
                </div>
              )}

            {!dashboardLoading && !dashboardError && myEvents.length > 0 && (
              <div className="stack-list">
                {myEvents.map((event) => (
                  <article className="list-card" key={event._id}>
                    <div>
                      <span className="section-kicker">{event.category}</span>

                      <h3>{event.title}</h3>

                      <p>
                        {event.venue} · {formatDate(event.date)}
                      </p>

                      <small>
                        {event.availableSeats} of {event.totalSeats} seats
                        available
                      </small>
                    </div>

                    <div className="list-actions">
                      <button
                        className="secondary-button"
                        onClick={() => {
                          setEditingEvent(event);
                          setShowEventForm(true);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="danger-button"
                        onClick={() => deleteEvent(event)}
                        disabled={actionBusy}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Defensive fallback if a non-organizer somehow reaches this view. */}
        {view === "dashboard" && !isOrganizer && (
          <section className="events-section dashboard-section">
            <div className="state-card">
              <strong>Organizer access required.</strong>
              <p>This workspace is available only to organizer accounts.</p>
              <button className="primary-button" onClick={goHome}>
                Back to Discover ↗
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <Brand onClick={goHome} />
        <p>Built for experiences that bring us together.</p>
        <span>© {new Date().getFullYear()} EventOps</span>
      </footer>

      {toast && (
        <div className="toast" role="status">
          {toast}
          <button
            type="button"
            onClick={() => setToast("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
