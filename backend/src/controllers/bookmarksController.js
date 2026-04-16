const pool = require('../config/database');
 
exports.toggleBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
 
    const existing = await pool.query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND event_id = $2',
      [userId, id]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'DELETE FROM bookmarks WHERE user_id = $1 AND event_id = $2',
        [userId, id]
      );
      res.json({ success: true, bookmarked: false });
    } else {
      await pool.query(
        'INSERT INTO bookmarks (user_id, event_id) VALUES ($1, $2)',
        [userId, id]
      );
      res.json({ success: true, bookmarked: true });
    }
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
};
 
exports.getMyBookmarks = async (req, res) => {
  try {
    const userId = req.userId;
    const result = await pool.query(
      'SELECT e.*, COUNT(ea.id) AS attendee_count FROM bookmarks b ' +
      'JOIN events e ON b.event_id = e.id ' +
      'LEFT JOIN event_attendees ea ON e.id = ea.event_id ' +
      'WHERE b.user_id = $1 GROUP BY e.id ORDER BY e.date ASC',
      [userId]
    );
    res.json({ success: true, events: result.rows });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
};
 
exports.checkBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const result = await pool.query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND event_id = $2',
      [userId, id]
    );
    res.json({ success: true, bookmarked: result.rows.length > 0 });
  } catch (error) {
    console.error('Check bookmark error:', error);
    res.status(500).json({ error: 'Failed to check bookmark' });
  }
};
