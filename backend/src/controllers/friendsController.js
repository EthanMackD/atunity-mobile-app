const pool = require('../config/database');

exports.sendRequest = async (req, res) => {
  try {
    const requesterId = req.userId;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required' });
    }

    if (requesterId === receiverId) {
      return res.status(400).json({ error: 'You cannot add yourself as a friend' });
    }

    var existing = await pool.query(
      'SELECT * FROM friends WHERE (requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1)',
      [requesterId, receiverId]
    );

    if (existing.rows.length > 0) {
      var friendship = existing.rows[0];
      if (friendship.status === 'accepted') {
        return res.status(400).json({ error: 'You are already friends' });
      }
      if (friendship.status === 'pending') {
        return res.status(400).json({ error: 'Friend request already pending' });
      }
    }

    var result = await pool.query(
      'INSERT INTO friends (requester_id, receiver_id) VALUES ($1, $2) RETURNING *',
      [requesterId, receiverId]
    );

    res.status(201).json({ success: true, friendship: result.rows[0], message: 'Friend request sent' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    var requestCheck = await pool.query(
      'SELECT * FROM friends WHERE id = $1 AND receiver_id = $2 AND status = $3',
      [id, userId, 'pending']
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    var result = await pool.query(
      'UPDATE friends SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['accepted', id]
    );

    res.json({ success: true, friendship: result.rows[0], message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
};

exports.declineRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    var requestCheck = await pool.query(
      'SELECT * FROM friends WHERE id = $1 AND receiver_id = $2 AND status = $3',
      [id, userId, 'pending']
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    await pool.query('DELETE FROM friends WHERE id = $1', [id]);

    res.json({ success: true, message: 'Friend request declined' });
  } catch (error) {
    console.error('Decline friend request error:', error);
    res.status(500).json({ error: 'Failed to decline friend request' });
  }
};

exports.getMyFriends = async (req, res) => {
  try {
    const userId = req.userId;

    var result = await pool.query(
      'SELECT f.id AS friendship_id, f.status, f.created_at, ' +
      'CASE WHEN f.requester_id = $1 THEN u2.id ELSE u1.id END AS friend_id, ' +
      'CASE WHEN f.requester_id = $1 THEN u2.name ELSE u1.name END AS friend_name, ' +
      'CASE WHEN f.requester_id = $1 THEN u2.email ELSE u1.email END AS friend_email, ' +
      'CASE WHEN f.requester_id = $1 THEN u2.course ELSE u1.course END AS friend_course ' +
      'FROM friends f ' +
      'JOIN users u1 ON f.requester_id = u1.id ' +
      'JOIN users u2 ON f.receiver_id = u2.id ' +
      'WHERE (f.requester_id = $1 OR f.receiver_id = $1) AND f.status = $2 ' +
      'ORDER BY f.created_at DESC',
      [userId, 'accepted']
    );

    res.json({ success: true, friends: result.rows });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const userId = req.userId;

    var result = await pool.query(
      'SELECT f.id AS friendship_id, f.created_at, u.id AS requester_id, u.name AS requester_name, u.email AS requester_email, u.course AS requester_course ' +
      'FROM friends f ' +
      'JOIN users u ON f.requester_id = u.id ' +
      'WHERE f.receiver_id = $1 AND f.status = $2 ' +
      'ORDER BY f.created_at DESC',
      [userId, 'pending']
    );

    res.json({ success: true, requests: result.rows });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
};

exports.checkFriendship = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    var result = await pool.query(
      'SELECT * FROM friends WHERE (requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1)',
      [userId, id]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, status: 'none' });
    }

    res.json({ success: true, status: result.rows[0].status, friendshipId: result.rows[0].id });
  } catch (error) {
    console.error('Check friendship error:', error);
    res.status(500).json({ error: 'Failed to check friendship' });
  }
};