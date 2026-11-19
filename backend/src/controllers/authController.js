// Login for coordinator and faculty.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// POST /api/auth/login
// body: { email, password, role }   role = 'coordinator' or 'faculty'
async function login(req, res) {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password and role are required' });
  }

  let sql;
  if (role === 'coordinator') {
    sql = `SELECT coordinator_id AS id, full_name, email, password_hash
           FROM coordinator
           WHERE LOWER(email) = LOWER($1)`;
  } else if (role === 'faculty') {
    sql = `SELECT faculty_id AS id, full_name, email, password_hash
           FROM faculty
           WHERE LOWER(email) = LOWER($1)`;
  } else {
    return res.status(400).json({ message: 'Role must be coordinator or faculty' });
  }

  try {
    const result = await pool.query(sql, [email.trim()]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Compare the typed password with the bcrypt hash stored in the database
    const isMatch = user.password_hash && (await bcrypt.compare(password, user.password_hash));
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create a token that the frontend sends with every request
    const token = jwt.sign(
      { id: user.id, role: role, name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token: token,
      user: { id: user.id, name: user.full_name, email: user.email, role: role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { login };
