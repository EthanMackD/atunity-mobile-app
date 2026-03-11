import { useState } from "react";
import EventsPage from "./pages/EventsPage";
import "./App.css";

function HomePage({ onNavigate }) {
  return (
    <div className="home">
      <div className="hero">
        <h1>ATUnity</h1>
        <p>Your ATU Galway campus companion</p>
        <div className="nav-cards">
          <div className="card" onClick={() => onNavigate("events")}>
            <span className="icon">📅</span>
            <h2>Events</h2>
            <p>See what's happening on campus</p>
          </div>
          <div className="card coming-soon">
            <span className="icon">🗺️</span>
            <h2>Campus Map</h2>
            <p>Coming soon</p>
          </div>
          <div className="card coming-soon">
            <span className="icon">👤</span>
            <h2>Profile</h2>
            <p>Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("home");

  return (
    <div className="app">
      <nav className="navbar">
        <span className="logo" onClick={() => setPage("home")}>ATUnity</span>
        <div className="nav-links">
          <button onClick={() => setPage("home")} className={page === "home" ? "active" : ""}>Home</button>
          <button onClick={() => setPage("events")} className={page === "events" ? "active" : ""}>Events</button>
        </div>
      </nav>

      {page === "home" && <HomePage onNavigate={setPage} />}
      {page === "events" && <EventsPage />}
    </div>
  );
}