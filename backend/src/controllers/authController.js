const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const pool = require('../config/database');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${process.env.APP_URL}/api/auth/verify/${token}`;
  await transporter.sendMail({
    from: `"ATUnity" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your ATUnity account',
    html: `
      <h2>Welcome to ATUnity!</h2>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verifyUrl}" style="background:#065A82;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};

exports.register = async (req, res) => {
  try {
    const { email, password, name, course, year, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Email, password, name and role are required' });
    }

    if (!email.endsWith('@atu.ie') && !email.endsWith('@gmit.ie')) {
      return res.status(400).json({ error: 'Only ATU/GMIT email addresses are allowed' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, course, year, role, verification_token) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, name, course, year, role, created_at',
      [email, passwordHash, name, course || null, year || null, role, verificationToken]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    res.status(201).json({ success: true, token, user, emailSent: true });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    delete user.password_hash;

    res.json({ success: true, token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, course, year, role, subjects, availability, experience, description, price, profile_picture, email_verified, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const result = await pool.query('SELECT id, password_hash FROM users WHERE id = $1', [req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(oldPassword, result.rows[0].password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Old password is incorrect' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, req.userId]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { preferred_meeting_location } = req.body;
    const result = await pool.query(
      'UPDATE users SET preferred_meeting_location = $1 WHERE id = $2 RETURNING id, email, name, course, year, role, created_at, preferred_meeting_location, profile_picture',
      [preferred_meeting_location, req.userId]
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

exports.uploadProfilePicture = async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }
    const result = await pool.query(
      'UPDATE users SET profile_picture = $1 WHERE id = $2 RETURNING id, email, name, course, year, role, created_at, preferred_meeting_location, profile_picture',
      [imageBase64, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Upload picture error:', error);
    res.status(500).json({ error: 'Failed to upload picture' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const result = await pool.query(
      'UPDATE users SET email_verified = TRUE, verification_token = NULL WHERE verification_token = $1 RETURNING id, email, name',
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(400).send('<h2>Invalid or expired verification link.</h2>');
    }
    res.send(`
      <html>
        <body style="font-family:sans-serif;text-align:center;padding:60px;">
          <h2 style="color:#065A82;">Email Verified!</h2>
          <p>Your ATUnity account is now verified. You can close this page and log in.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).send('<h2>Something went wrong. Please try again.</h2>');
  }
};
