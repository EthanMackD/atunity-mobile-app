const pool = require('../config/database');

exports.archiveConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.body;
    if (!otherUserId) {
      return res.status(400).json({ error: 'otherUserId is required' });
    }
    await pool.query(
      'INSERT INTO conversation_archives (user_id, other_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, otherUserId]
    );
    res.json({ success: true, message: 'Conversation archived' });
  } catch (error) {
    console.error('Archive error:', error);
    res.status(500).json({ error: 'Failed to archive conversation' });
  }
};

exports.unarchiveConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.body;
    await pool.query(
      'DELETE FROM conversation_archives WHERE user_id = $1 AND other_user_id = $2',
      [userId, otherUserId]
    );
    res.json({ success: true, message: 'Conversation unarchived' });
  } catch (error) {
    console.error('Unarchive error:', error);
    res.status(500).json({ error: 'Failed to unarchive conversation' });
  }
};

exports.getArchivedIds = async (req, res) => {
  try {
    const userId = req.userId;
    const result = await pool.query(
      'SELECT other_user_id FROM conversation_archives WHERE user_id = $1',
      [userId]
    );
    const ids = result.rows.map(function(r) { return r.other_user_id; });
    res.json({ success: true, archivedIds: ids });
  } catch (error) {
    console.error('Get archived error:', error);
    res.status(500).json({ error: 'Failed to fetch archived conversations' });
  }
};
