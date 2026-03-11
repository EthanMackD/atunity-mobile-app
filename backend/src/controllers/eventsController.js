const pool = require('../config/database');

// GET all events
exports.getAllEvents = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY date ASC');
    res.json({ success: true, events: result.rows });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// GET single event
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ success: true, event: result.rows[0] });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

// POST create event
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, location, category, organizer } = req.body;
    const result = await pool.query(
      'INSERT INTO events (title, description, date, location, category, organizer) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, date, location, category, organizer]
    );
    res.status(201).json({ success: true, event: result.rows[0] });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// Mark attendance
exports.markAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await pool.query(
      'INSERT INTO event_attendees (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, userId]
    );
    res.json({ success: true, message: 'Attendance marked' });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

// GET attendees
exports.getAttendees = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT users.name FROM users JOIN event_attendees ON users.id = event_attendees.user_id WHERE event_attendees.event_id = $1',
      [id]
    );
    res.json({ success: true, attendees: result.rows });
  } catch (error) {
    console.error('Get attendees error:', error);
    res.status(500).json({ error: 'Failed to fetch attendees' });
  }
};