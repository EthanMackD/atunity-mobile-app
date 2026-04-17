const pool = require('../config/database');

exports.postMessage = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.userId;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    var attendeeCheck = await pool.query(
      'SELECT id FROM event_attendees WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    if (attendeeCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You must RSVP to this event to participate in the chat' });
    }

    var result = await pool.query(
      'INSERT INTO event_messages (event_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [eventId, userId, content]
    );

    var userResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    var message = result.rows[0];
    message.user_name = userResult.rows[0].name;

    res.status(201).json({ success: true, message: message });
  } catch (error) {
    console.error('Post event message error:', error);
    res.status(500).json({ error: 'Failed to post message' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { eventId } = req.params;

    var result = await pool.query(
      'SELECT em.*, u.name AS user_name FROM event_messages em ' +
      'JOIN users u ON em.user_id = u.id ' +
      'WHERE em.event_id = $1 ORDER BY em.created_at ASC',
      [eventId]
    );

    res.json({ success: true, messages: result.rows });
  } catch (error) {
    console.error('Get event messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};