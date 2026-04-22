const pool = require('../config/database');

exports.fileReport = async (req, res) => {
  try {
    const reporterId = req.userId;
    const { reportedUserId, reason } = req.body;
    if (!reportedUserId) {
      return res.status(400).json({ error: 'Reported user is required' });
    }
    if (reporterId === parseInt(reportedUserId)) {
      return res.status(400).json({ error: 'You cannot report yourself' });
    }
    await pool.query(
      'INSERT INTO reports (reporter_id, reported_user_id, reason) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [reporterId, reportedUserId, reason || null]
    );
    res.status(201).json({ success: true, message: 'Report submitted' });
  } catch (error) {
    console.error('File report error:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

exports.checkReport = async (req, res) => {
  try {
    const reporterId = req.userId;
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id FROM reports WHERE reporter_id = $1 AND reported_user_id = $2',
      [reporterId, id]
    );
    res.json({ success: true, hasReported: result.rows.length > 0 });
  } catch (error) {
    console.error('Check report error:', error);
    res.status(500).json({ error: 'Failed to check report' });
  }
};
