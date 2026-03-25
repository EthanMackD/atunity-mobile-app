const pool = require('../config/database');

// GET all events
exports.getAllEvents = async (req, res) => {
  try {
    const { search } = req.query;
    let query;
    let params = [];
 
    if (search) {
      query = 'SELECT e.*, COUNT(ea.id) AS attendee_count FROM events e ' +
        'LEFT JOIN event_attendees ea ON e.id = ea.event_id ' +
        'WHERE LOWER(e.title) LIKE $1 OR LOWER(e.description) LIKE $1 ' +
        'OR LOWER(e.location) LIKE $1 OR LOWER(e.organizer) LIKE $1 ' +
        'GROUP BY e.id ORDER BY e.date ASC';
      params = [`%${search.toLowerCase()}%`];
    } else {
      query = 'SELECT e.*, COUNT(ea.id) AS attendee_count FROM events e ' +
        'LEFT JOIN event_attendees ea ON e.id = ea.event_id ' +
        'GROUP BY e.id ORDER BY e.date ASC';
    }
 
    const result = await pool.query(query, params);
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
    const eventResult = await pool.query(
      'SELECT e.*, COUNT(ea.id) AS attendee_count FROM events e ' +
      'LEFT JOIN event_attendees ea ON e.id = ea.event_id ' +
      'WHERE e.id = $1 GROUP BY e.id',
      [id]
    );
 
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
 
    res.json({ success: true, event: eventResult.rows[0] });
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
    const userId = req.userId;
 
    // Check if already attending
    const existing = await pool.query(
      'SELECT id FROM event_attendees WHERE event_id = $1 AND user_id = $2',
      [id, userId]
    );
 
    if (existing.rows.length > 0) {
      // Remove attendance (toggle off)
      await pool.query(
        'DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2',
        [id, userId]
      );
    } else {
      // Add attendance (toggle on)
      await pool.query(
        'INSERT INTO event_attendees (event_id, user_id) VALUES ($1, $2)',
        [id, userId]
      );
    }
 
    // Get updated count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM event_attendees WHERE event_id = $1',
      [id]
    );
 
    res.json({
      success: true,
      attending: existing.rows.length === 0,
      attendeeCount: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};
 
// Get attendance
exports.getAttendees = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT u.id, u.name, u.course FROM event_attendees ea ' +
      'JOIN users u ON ea.user_id = u.id WHERE ea.event_id = $1',
      [id]
    );
 
    res.json({
      success: true,
      attendees: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get attendees error:', error);
    res.status(500).json({ error: 'Failed to fetch attendees' });
  }
};

// Get reminder status for an event
exports.getReminderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await pool.query(
      'SELECT id, reminder_enabled, reminder_minutes_before FROM event_reminders WHERE event_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        reminderExists: false,
        reminderEnabled: false,
        reminderMinutesBefore: 60
      });
    }

    res.json({
      success: true,
      reminderExists: true,
      reminderEnabled: result.rows[0].reminder_enabled,
      reminderMinutesBefore: result.rows[0].reminder_minutes_before
    });
  } catch (error) {
    console.error('Get reminder status error:', error);
    res.status(500).json({ error: 'Failed to fetch reminder status' });
  }
};

// Toggle reminder for an event
exports.toggleReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { reminderEnabled, reminderMinutesBefore = 60 } = req.body;

    const existing = await pool.query(
      'SELECT id FROM event_reminders WHERE event_id = $1 AND user_id = $2',
      [id, userId]
    );

    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        'UPDATE event_reminders SET reminder_enabled = $1, reminder_minutes_before = $2, updated_at = NOW() WHERE event_id = $3 AND user_id = $4 RETURNING *',
        [reminderEnabled, reminderMinutesBefore, id, userId]
      );
    } else {
      result = await pool.query(
        'INSERT INTO event_reminders (event_id, user_id, reminder_enabled, reminder_minutes_before) VALUES ($1, $2, $3, $4) RETURNING *',
        [id, userId, reminderEnabled, reminderMinutesBefore]
      );
    }

    res.json({
      success: true,
      reminder: {
        reminderEnabled: result.rows[0].reminder_enabled,
        reminderMinutesBefore: result.rows[0].reminder_minutes_before
      }
    });
  } catch (error) {
    console.error('Toggle reminder error:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
};

// Disable reminder for an event
exports.disableReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    await pool.query(
      'UPDATE event_reminders SET reminder_enabled = FALSE WHERE event_id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ success: true, message: 'Reminder disabled' });
  } catch (error) {
    console.error('Disable reminder error:', error);
    res.status(500).json({ error: 'Failed to disable reminder' });
  }
};
