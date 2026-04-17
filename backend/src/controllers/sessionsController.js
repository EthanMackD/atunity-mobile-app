const pool = require('../config/database');

exports.bookSession = async (req, res) => {
  try {
    const { tutorId, subject, date, time, durationMinutes, notes } = req.body;
    const studentId = req.userId;
    if (!tutorId || !subject || !date || !time) {
      return res.status(400).json({ error: 'Tutor, subject, date, and time are required' });
    }
    if (tutorId === studentId) {
      return res.status(400).json({ error: 'You cannot book a session with yourself' });
    }
    const result = await pool.query(
      'INSERT INTO tutoring_sessions (tutor_id, student_id, subject, date, time, duration_minutes, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [tutorId, studentId, subject, date, time, durationMinutes || 60, notes || null]
    );
    res.status(201).json({ success: true, session: result.rows[0] });
  } catch (error) {
    console.error('Book session error:', error);
    res.status(500).json({ error: 'Failed to book session' });
  }
};

exports.getMySessions = async (req, res) => {
  try {
    const userId = req.userId;
    const result = await pool.query(
      'SELECT ts.*, tutor.name AS tutor_name, tutor.email AS tutor_email, student.name AS student_name, student.email AS student_email FROM tutoring_sessions ts JOIN users tutor ON ts.tutor_id = tutor.id JOIN users student ON ts.student_id = student.id WHERE ts.tutor_id = $1 OR ts.student_id = $1 ORDER BY ts.date ASC, ts.time ASC',
      [userId]
    );
    const now = new Date();
    const upcoming = [];
    const past = [];
    const cancelled = [];
    for (var i = 0; i < result.rows.length; i++) {
      var s = result.rows[i];
      if (s.status === 'cancelled') {
        cancelled.push(s);
      } else if (new Date(s.date) < now || s.status === 'completed') {
        past.push(s);
      } else {
        upcoming.push(s);
      }
    }
    res.json({ success: true, upcoming: upcoming, past: past, cancelled: cancelled });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

exports.cancelSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const sessionCheck = await pool.query('SELECT * FROM tutoring_sessions WHERE id = $1', [id]);
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    var session = sessionCheck.rows[0];
    if (session.tutor_id !== userId && session.student_id !== userId) {
      return res.status(403).json({ error: 'You can only cancel your own sessions' });
    }
    if (session.status === 'cancelled') {
      return res.status(400).json({ error: 'Session is already cancelled' });
    }
    const result = await pool.query(
      'UPDATE tutoring_sessions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['cancelled', id]
    );
    res.json({ success: true, session: result.rows[0], message: 'Session cancelled successfully' });
  } catch (error) {
    console.error('Cancel session error:', error);
    res.status(500).json({ error: 'Failed to cancel session' });
  }
};

exports.rescheduleSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time } = req.body;
    const userId = req.userId;
    if (!date || !time) {
      return res.status(400).json({ error: 'New date and time are required' });
    }
    const sessionCheck = await pool.query('SELECT * FROM tutoring_sessions WHERE id = $1', [id]);
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    var session = sessionCheck.rows[0];
    if (session.tutor_id !== userId && session.student_id !== userId) {
      return res.status(403).json({ error: 'You can only reschedule your own sessions' });
    }
    if (session.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot reschedule a cancelled session' });
    }
    const result = await pool.query(
      'UPDATE tutoring_sessions SET date = $1, time = $2, status = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [date, time, 'confirmed', id]
    );
    res.json({ success: true, session: result.rows[0], message: 'Session rescheduled successfully' });
  } catch (error) {
    console.error('Reschedule session error:', error);
    res.status(500).json({ error: 'Failed to reschedule session' });
  }
};