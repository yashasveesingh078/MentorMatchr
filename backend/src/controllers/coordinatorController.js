// Everything the coordinator can do: search mentors, assign a mentor, list mentors.
const pool = require('../config/db');

const MAX_TEAMS = 3; // a mentor can have at most 3 ACTIVE teams

// POST /api/coordinator/search
// body: { teamName, domain, keywords }   keywords = "Python, OpenCV"
async function searchMentors(req, res) {
  const { teamName, domain, keywords } = req.body;

  if (!teamName || !domain) {
    return res.status(400).json({ message: 'Team name and domain are required' });
  }

  // "Python, OpenCV ,  NLP" -> ['python', 'opencv', 'nlp']  (no duplicates)
  const keywordList = [
    ...new Set(
      (keywords || '')
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k !== '')
    ),
  ];

  try {
    // 1. Find the team
    const teamResult = await pool.query(
      `SELECT t.team_id, t.team_name, t.team_size, t.contact_email,
              h.hackathon_name, ps.title AS problem_title
       FROM team t
       JOIN hackathon h ON h.hackathon_id = t.hackathon_id
       LEFT JOIN team_problem_selection s ON s.team_id = t.team_id
       LEFT JOIN problem_statement ps ON ps.problem_id = s.problem_id
       WHERE LOWER(t.team_name) = LOWER($1)`,
      [teamName.trim()]
    );

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }
    if (teamResult.rows.length > 1) {
      return res.status(400).json({ message: 'More than one team has this name' });
    }
    const team = teamResult.rows[0];

    // The team's current (ACTIVE) mentor, if any
    const currentResult = await pool.query(
      `SELECT f.faculty_id, f.full_name
       FROM mentor_assignment ma
       JOIN faculty f ON f.faculty_id = ma.faculty_id
       WHERE ma.team_id = $1 AND ma.status = 'ACTIVE'`,
      [team.team_id]
    );
    team.current_mentor = currentResult.rows[0] || null;

    // 2. Find the domain
    const domainResult = await pool.query(
      'SELECT domain_id, domain_name FROM domain WHERE LOWER(domain_name) = LOWER($1)',
      [domain.trim()]
    );

    if (domainResult.rows.length === 0) {
      return res.status(404).json({ message: 'Domain not found' });
    }
    const domainRow = domainResult.rows[0];

    // 3. For every available faculty: domain match, keyword matches, active teams
    const mentorResult = await pool.query(
      `SELECT f.faculty_id, f.full_name, f.email, f.designation, d.department_name,

              (SELECT COUNT(*) FROM faculty_domain fd
               WHERE fd.faculty_id = f.faculty_id AND fd.domain_id = $1) AS domain_match,

              (SELECT COUNT(*) FROM faculty_keyword fk
               JOIN keyword k ON k.keyword_id = fk.keyword_id
               WHERE fk.faculty_id = f.faculty_id
                 AND LOWER(k.keyword_name) = ANY($2)) AS keyword_matches,

              (SELECT STRING_AGG(k.keyword_name, ', ') FROM faculty_keyword fk
               JOIN keyword k ON k.keyword_id = fk.keyword_id
               WHERE fk.faculty_id = f.faculty_id
                 AND LOWER(k.keyword_name) = ANY($2)) AS matched_keywords,

              (SELECT COUNT(*) FROM mentor_assignment ma
               WHERE ma.faculty_id = f.faculty_id AND ma.status = 'ACTIVE') AS active_teams,

              (SELECT COUNT(*) FROM mentor_assignment ma
               WHERE ma.faculty_id = f.faculty_id AND ma.team_id = $3) AS worked_with_team

       FROM faculty f
       JOIN department d ON d.department_id = f.department_id
       WHERE f.is_available = TRUE`,
      [domainRow.domain_id, keywordList, team.team_id]
    );

    // 4. Score = 40 for domain match + 10 for each matching keyword,
    //    shown as a percentage of the best possible score.
    const maxScore = 40 + 10 * keywordList.length;

    const mentors = mentorResult.rows
      .map((m) => {
        const domainMatch = Number(m.domain_match) > 0;
        const keywordMatches = Number(m.keyword_matches);
        const activeTeams = Number(m.active_teams);
        const points = (domainMatch ? 40 : 0) + 10 * keywordMatches;

        return {
          faculty_id: m.faculty_id,
          full_name: m.full_name,
          email: m.email,
          designation: m.designation,
          department_name: m.department_name,
          domain_match: domainMatch,
          keyword_matches: keywordMatches,
          matched_keywords: m.matched_keywords || '',
          active_teams: activeTeams,
          score: Math.round((points / maxScore) * 10000) / 100, // 2 decimals
          is_full: activeTeams >= MAX_TEAMS,
          worked_with_team: Number(m.worked_with_team) > 0,
        };
      })
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score || a.active_teams - b.active_teams);

    res.json({ team: team, domain: domainRow, keywords: keywordList, mentors: mentors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/coordinator/assign
// body: { teamId, facultyId, matchScore }
async function assignMentor(req, res) {
  const { teamId, facultyId, matchScore } = req.body;

  if (!teamId || !facultyId) {
    return res.status(400).json({ message: 'Team and mentor are required' });
  }

  // Use one client for the whole transaction
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Lock the faculty row so two coordinators cannot assign
    //    the same mentor at the same moment (FOR UPDATE)
    const facultyResult = await client.query(
      'SELECT faculty_id, full_name, is_available FROM faculty WHERE faculty_id = $1 FOR UPDATE',
      [facultyId]
    );
    if (facultyResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Mentor not found' });
    }
    const faculty = facultyResult.rows[0];

    if (!faculty.is_available) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: faculty.full_name + ' is not available' });
    }

    // 2. Check the mentor has less than 3 ACTIVE teams
    const loadResult = await client.query(
      "SELECT COUNT(*) AS active FROM mentor_assignment WHERE faculty_id = $1 AND status = 'ACTIVE'",
      [facultyId]
    );
    if (Number(loadResult.rows[0].active) >= MAX_TEAMS) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: faculty.full_name + ' already has ' + MAX_TEAMS + ' teams' });
    }

    // 3. Check the team exists and has selected a problem
    const teamResult = await client.query(
      `SELECT t.team_id, t.team_name, s.problem_id
       FROM team t
       LEFT JOIN team_problem_selection s ON s.team_id = t.team_id
       WHERE t.team_id = $1
       FOR UPDATE OF t`,
      [teamId]
    );
    if (teamResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Team not found' });
    }
    const team = teamResult.rows[0];

    if (team.problem_id === null) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: team.team_name + ' has not selected a problem yet' });
    }

    // 4. The same mentor cannot be recorded twice for the same team
    const oldResult = await client.query(
      'SELECT status FROM mentor_assignment WHERE team_id = $1 AND faculty_id = $2',
      [teamId, facultyId]
    );
    if (oldResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: faculty.full_name + ' was already assigned to this team (' + oldResult.rows[0].status + ')',
      });
    }

    // 5. If the team already has an ACTIVE mentor, mark it as REPLACED
    await client.query(
      "UPDATE mentor_assignment SET status = 'REPLACED' WHERE team_id = $1 AND status = 'ACTIVE'",
      [teamId]
    );

    // 6. Insert the new ACTIVE assignment
    const insertResult = await client.query(
      `INSERT INTO mentor_assignment (team_id, faculty_id, assigned_by, match_score, status)
       VALUES ($1, $2, $3, $4, 'ACTIVE')
       RETURNING assignment_id, assigned_at`,
      [teamId, facultyId, req.user.id, matchScore ?? null]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: faculty.full_name + ' assigned to ' + team.team_name,
      assignment: insertResult.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release(); // give the connection back to the pool
  }
}

// GET /api/coordinator/mentors
// Every mentor with department, primary domain, keywords and their ACTIVE teams
async function listMentors(req, res) {
  try {
    const facultyResult = await pool.query(
      `SELECT f.faculty_id, f.full_name, f.email, f.phone, f.designation, f.is_available,
              d.department_name,
              dom.domain_name AS primary_domain,
              (SELECT STRING_AGG(k.keyword_name, ', ' ORDER BY k.keyword_name)
               FROM faculty_keyword fk
               JOIN keyword k ON k.keyword_id = fk.keyword_id
               WHERE fk.faculty_id = f.faculty_id) AS keywords
       FROM faculty f
       JOIN department d ON d.department_id = f.department_id
       LEFT JOIN faculty_domain fd ON fd.faculty_id = f.faculty_id AND fd.is_primary = TRUE
       LEFT JOIN domain dom ON dom.domain_id = fd.domain_id
       ORDER BY f.full_name`
    );

    const teamResult = await pool.query(
      `SELECT ma.faculty_id, t.team_id, t.team_name, h.hackathon_name, ma.match_score
       FROM mentor_assignment ma
       JOIN team t ON t.team_id = ma.team_id
       JOIN hackathon h ON h.hackathon_id = t.hackathon_id
       WHERE ma.status = 'ACTIVE'
       ORDER BY t.team_name`
    );

    // Put each team under its mentor
    const mentors = facultyResult.rows.map((f) => {
      const teams = teamResult.rows.filter((t) => t.faculty_id === f.faculty_id);
      return {
        ...f,
        teams: teams,
        active_teams: teams.length,
        is_full: teams.length >= MAX_TEAMS,
      };
    });

    res.json(mentors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { searchMentors, assignMentor, listMentors };