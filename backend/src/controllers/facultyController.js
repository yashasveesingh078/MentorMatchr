// What a faculty member can see: only their own ACTIVE teams.
const pool = require('../config/db');

// GET /api/faculty/my-teams
async function myTeams(req, res) {
  try {
    const result = await pool.query(
      `SELECT t.team_id, t.team_name, t.team_size, t.contact_email,
              h.hackathon_name, h.start_date, h.end_date, h.venue,
              ps.ps_code, ps.title AS problem_title, dom.domain_name,
              ma.assigned_at, ma.match_score
       FROM mentor_assignment ma
       JOIN team t ON t.team_id = ma.team_id
       JOIN hackathon h ON h.hackathon_id = t.hackathon_id
       LEFT JOIN team_problem_selection s ON s.team_id = t.team_id
       LEFT JOIN problem_statement ps ON ps.problem_id = s.problem_id
       LEFT JOIN domain dom ON dom.domain_id = ps.domain_id
       WHERE ma.faculty_id = $1 AND ma.status = 'ACTIVE'
       ORDER BY t.team_name`,
      [req.user.id] // id comes from the login token, not from the request
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { myTeams };
