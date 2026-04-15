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
  const result = await pool.query(
    `SELECT u.id, u.name, u.course, u.year, u.subjects,
            u.availability, u.experience, u.description, u.price,
            COUNT(b.id) FILTER (WHERE b.status = 'completed') AS completed_sessions
     FROM users u
     LEFT JOIN bookings b ON b.tutor_id = u.id
     WHERE u.role = 'tutor'
     GROUP BY u.id, u.name, u.course, u.year, u.subjects,
              u.availability, u.experience, u.description, u.price
     ORDER BY u.name ASC`
  );
 
  return res.json({ success: true, tutors: result.rows });
} catch (error) {
  console.error('Get tutors error:', error);
  res.status(500).json({ error: 'Failed to fetch tutors' });
}
};

exports.getTutorById = async (req, res) => {
  try {
    const result = await pool.query(
  `SELECT u.id, u.name, u.course, u.subjects,
          u.availability, u.experience, u.description, u.price,
          COUNT(b.id) FILTER (WHERE b.status = 'completed') AS completed_sessions
   FROM users u
   LEFT JOIN bookings b ON b.tutor_id = u.id
   WHERE u.id = $1 AND u.role = 'tutor'
   GROUP BY u.id, u.name, u.course, u.subjects,
            u.availability, u.experience, u.description, u.price`,
  [id]
);

if (result.rows.length === 0) {
  return res.status(404).json({ success: false, message: 'Tutor not found' });
}

return res.json({ success: true, tutor: result.rows[0] });

  } catch (error) {
    console.error('Get tutor by id error:', error);
    res.status(500).json({ error: 'Failed to fetch tutor' });
  }
};