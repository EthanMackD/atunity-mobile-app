const pool = require('../config/database');

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
      query = "SELECT id, name, course, year, subjects, availability, experience, description, price FROM users WHERE role = 'tutor' AND (LOWER(name) LIKE $1 OR LOWER(subjects) LIKE $1 OR LOWER(course) LIKE $1 OR LOWER(description) LIKE $1) ORDER BY name ASC";
      params = [`%${search.toLowerCase()}%`];
    } else {
      query = "SELECT id, name, course, year, subjects, availability, experience, description, price FROM users WHERE role = 'tutor' ORDER BY name ASC";
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