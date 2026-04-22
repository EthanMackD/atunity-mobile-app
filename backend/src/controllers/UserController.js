const pool = require('../config/database');

exports.updateProfile = async (req, res) => {
  try {
    const { name, course, year } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      `UPDATE users
       SET name = $1, course = $2, year = $3
       WHERE id = $4
       RETURNING id, email, name, course, year, role, created_at`,
      [name, course || null, year || null, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

exports.updateTutorProfile = async (req, res) => {
  try {
    const { subjects, availability, experience, description, price } = req.body;

    if (!subjects || !availability || !experience || !description || !price) {
      return res.status(400).json({ error: 'All tutor profile fields are required' });
    }

    const result = await pool.query(
      `UPDATE users 
       SET subjects = $1, availability = $2, experience = $3, description = $4, price = $5 
       WHERE id = $6 
       RETURNING id, email, name, course, year, role, subjects, availability, experience, description, price, created_at`,
      [subjects, availability, experience, description, price, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Update tutor profile error:', error);
    res.status(500).json({ error: 'Failed to update tutor profile' });
  }
};

exports.getAllTutors = async (req, res) => {
  try {
    const { search } = req.query;
    let query;
    let params = [];

    if (search) {
      query = `
        SELECT id, name, course, year, subjects, availability, experience, description, price, completed_sessions
        FROM users
        WHERE role = 'tutor'
          AND (
            LOWER(name) LIKE $1 OR
            LOWER(subjects) LIKE $1 OR
            LOWER(course) LIKE $1 OR
            LOWER(description) LIKE $1
          )
        ORDER BY name ASC
      `;
      params = [`%${search.toLowerCase()}%`];
    } else {
      query = `
        SELECT id, name, course, year, subjects, availability, experience, description, price, completed_sessions
        FROM users
        WHERE role = 'tutor'
        ORDER BY name ASC
      `;
    }

    const result = await pool.query(query, params);
    res.json({ success: true, tutors: result.rows });
  } catch (error) {
    console.error('Get tutors error:', error);
    res.status(500).json({ error: 'Failed to fetch tutors' });
  }
};

exports.getTutorById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, name, email, course, year, role, subjects, availability, experience, description, price, created_at FROM users WHERE id = $1 AND role = 'tutor'",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    res.json({ success: true, tutor: result.rows[0] });
  } catch (error) {
    console.error('Get tutor by id error:', error);
    res.status(500).json({ error: 'Failed to fetch tutor' });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const blockerId = req.userId;
    const blockedId = parseInt(req.params.id);

    if (!blockedId) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (blockerId === blockedId) {
      return res.status(400).json({ error: 'You cannot block yourself' });
    }

    const userCheck = await pool.query(
      'SELECT id, name FROM users WHERE id = $1',
      [blockedId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const alreadyBlocked = await pool.query(
      'SELECT * FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2',
      [blockerId, blockedId]
    );

    if (alreadyBlocked.rows.length > 0) {
      return res.status(400).json({ error: 'User is already blocked' });
    }

    await pool.query(
      'INSERT INTO blocked_users (blocker_id, blocked_id) VALUES ($1, $2)',
      [blockerId, blockedId]
    );

    res.json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const blockerId = req.userId;
    const blockedId = parseInt(req.params.id);

    if (!blockedId) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const result = await pool.query(
      'DELETE FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2 RETURNING *',
      [blockerId, blockedId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blocked user record not found' });
    }

    res.json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
};

exports.getBlockStatus = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const otherUserId = parseInt(req.params.id);

    if (!otherUserId) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const iBlockedThem = await pool.query(
      'SELECT * FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2',
      [currentUserId, otherUserId]
    );

    const theyBlockedMe = await pool.query(
      'SELECT * FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2',
      [otherUserId, currentUserId]
    );

    res.json({
      success: true,
      isBlocked: iBlockedThem.rows.length > 0,
      blockedByThem: theyBlockedMe.rows.length > 0
    });
  } catch (error) {
    console.error('Get block status error:', error);
    res.status(500).json({ error: 'Failed to get block status' });
  }
};