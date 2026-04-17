const pool = require('../config/database');

exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.userId;
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Receiver and message content are required' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'You cannot message yourself' });
    }

    const blockCheck = await pool.query(
      `SELECT * FROM blocked_users
       WHERE (blocker_id = $1 AND blocked_id = $2)
       OR (blocker_id = $2 AND blocked_id = $1)`,
      [senderId, receiverId]
    );

    if (blockCheck.rows.length > 0) {
      return res.status(403).json({
        error: 'Message cannot be sent because one of the users has blocked the other'
      });
    }

    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
      [senderId, receiverId, content]
    );

    res.status(201).json({ success: true, message: result.rows[0] });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      `SELECT DISTINCT ON (other_user_id) *
       FROM (
         SELECT 
           m.*,
           CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END AS other_user_id,
           CASE WHEN m.sender_id = $1 THEN u2.name ELSE u1.name END AS other_user_name,
           CASE WHEN m.sender_id = $1 THEN u2.email ELSE u1.email END AS other_user_email,
           EXISTS (
             SELECT 1
             FROM blocked_users b
             WHERE b.blocker_id = $1
             AND b.blocked_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
           ) AS is_blocked,
           EXISTS (
             SELECT 1
             FROM blocked_users b
             WHERE b.blocker_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
             AND b.blocked_id = $1
           ) AS blocked_by_them
         FROM messages m
         JOIN users u1 ON m.sender_id = u1.id
         JOIN users u2 ON m.receiver_id = u2.id
         WHERE m.sender_id = $1 OR m.receiver_id = $1
         ORDER BY m.created_at DESC
       ) sub
       ORDER BY other_user_id, created_at DESC`,
      [userId]
    );

    res.json({ success: true, conversations: result.rows });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const otherUserId = parseInt(req.params.id);

    const result = await pool.query(
      `SELECT m.*, u.name AS sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC`,
      [userId, otherUserId]
    );

    await pool.query(
      'UPDATE messages SET is_read = TRUE WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE',
      [otherUserId, userId]
    );

    const iBlockedThem = await pool.query(
      'SELECT * FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2',
      [userId, otherUserId]
    );

    const theyBlockedMe = await pool.query(
      'SELECT * FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2',
      [otherUserId, userId]
    );

    res.json({
      success: true,
      messages: result.rows,
      isBlocked: iBlockedThem.rows.length > 0,
      blockedByThem: theyBlockedMe.rows.length > 0
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      'SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = FALSE',
      [userId]
    );

    res.json({ success: true, count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};