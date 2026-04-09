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
    const { title, description, date, time, location, category, organizer } = req.body;
    const createdBy = req.userId || null;
    const result = await pool.query(
      'INSERT INTO events (title, description, date, time, location, category, organizer, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [title, description, date, time, location, category, organizer, createdBy]
    );
    res.status(201).json({ success: true, event: result.rows[0] });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// PUT update event
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { title, description, date, time, location, category, organizer } = req.body;

    const eventResult = await pool.query('SELECT created_by FROM events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    if (eventResult.rows[0].created_by !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorised to edit this event' });
    }

    const result = await pool.query(
      'UPDATE events SET title=$1, description=$2, date=$3, time=$4, location=$5, category=$6, organizer=$7 WHERE id=$8 RETURNING *',
      [title, description, date, time, location, category, organizer, id]
    );
    res.json({ success: true, event: result.rows[0] });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ success: false, error: 'Failed to update event' });
  }
};

// DELETE event
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const eventResult = await pool.query('SELECT created_by FROM events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    if (eventResult.rows[0].created_by !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorised to delete this event' });
    }

    await pool.query('DELETE FROM events WHERE id = $1', [id]);
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete event' });
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

// Bookmark event
exports.bookmarkEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    await pool.query(
      'INSERT INTO bookmarks (user_id, event_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, id]
    );
    res.json({ success: true, message: 'Event bookmarked' });
  } catch (error) {
    console.error('Bookmark error:', error);
    res.status(500).json({ error: 'Failed to bookmark event' });
  }
};

// Remove bookmark
exports.removeBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    await pool.query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND event_id = $2',
      [userId, id]
    );
    res.json({ success: true, message: 'Bookmark removed' });
  } catch (error) {
    console.error('Remove bookmark error:', error);
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
};

// Get all bookmarks
exports.getBookmarks = async (req, res) => {
  try {
    const userId = req.userId;
    const result = await pool.query(
      'SELECT e.* FROM events e JOIN bookmarks b ON e.id = b.event_id WHERE b.user_id = $1 ORDER BY b.created_at DESC',
      [userId]
    );
    res.json({ success: true, events: result.rows });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
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
      // No reminder record exists, return default
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

    // Check if reminder record exists
    const existing = await pool.query(
      'SELECT id FROM event_reminders WHERE event_id = $1 AND user_id = $2',
      [id, userId]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing reminder
      result = await pool.query(
        'UPDATE event_reminders SET reminder_enabled = $1, reminder_minutes_before = $2, updated_at = NOW() WHERE event_id = $3 AND user_id = $4 RETURNING *',
        [reminderEnabled, reminderMinutesBefore, id, userId]
      );
    } else {
      // Create new reminder record
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

// Disable all reminders for an event
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

