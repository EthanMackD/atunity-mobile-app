import { useState, useEffect } from "react";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", date: "", location: "", category: "", organizer: ""
  });

  useEffect(() => {
    fetch("http://localhost:5000/api/events")
      .then(res => res.json())
      .then(data => {
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.date) return alert("Title and date are required!");
    const res = await fetch("http://localhost:5000/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.success) {
      setEvents([...events, data.event]);
      setForm({ title: "", description: "", date: "", location: "", category: "", organizer: "" });
      setShowForm(false);
    }
  };

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>Campus Events</h1>
        <button className="add-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Event"}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h2>Add New Event</h2>
          <input placeholder="Event title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <input placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          <input placeholder="Category (e.g. Sports, Society)" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          <input placeholder="Organizer name" value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })} />
          <button className="submit-btn" onClick={handleSubmit}>Post Event</button>
        </div>
      )}

      {loading && <p className="status">Loading events...</p>}
      {!loading && events.length === 0 && (
        <p className="status">No events yet — be the first to add one!</p>
      )}

      <div className="events-list">
        {events.map(event => (
          <div className="event-card" key={event.id}>
            <div className="event-top">
              <h2>{event.title}</h2>
              {event.category && <span className="tag">{event.category}</span>}
            </div>
            <p className="event-desc">{event.description}</p>
            <div className="event-meta">
              <span>📅 {new Date(event.date).toLocaleDateString()}</span>
              {event.location && <span>📍 {event.location}</span>}
              {event.organizer && <span>👤 {event.organizer}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}