import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, Link2, CircleDashed, UsersRound, CalendarDays, Search, ArrowRight,
} from 'lucide-react';
import { api, getUser } from '../api';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import CapacityBar, { MAX_TEAMS } from '../components/CapacityBar';
import { Loading, ErrorMessage, EmptyState } from '../components/Feedback';

// "Good morning" / "Good afternoon" / "Good evening"
function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const today = new Date().toLocaleDateString('en-IN', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

// One page, two versions: the role decides which one is shown
export default function DashboardPage() {
  const user = getUser();
  return user.role === 'coordinator' ? <CoordinatorDashboard user={user} /> : <FacultyDashboard user={user} />;
}

/* ---------------- Coordinator ---------------- */
function CoordinatorDashboard({ user }) {
  const [mentors, setMentors] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/coordinator/mentors')
      .then((data) => setMentors(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // All numbers below are calculated from the /coordinator/mentors response
  const available = mentors.filter((m) => m.is_available);
  const activeAssignments = mentors.reduce((total, m) => total + m.active_teams, 0);
  const fullMentors = available.filter((m) => m.is_full).length;
  const openSlots = available.reduce((total, m) => total + Math.max(MAX_TEAMS - m.active_teams, 0), 0);

  // Every ACTIVE team with its mentor's name
  const assignments = mentors
    .flatMap((m) => m.teams.map((t) => ({ ...t, mentor: m.full_name })))
    .sort((a, b) => a.team_name.localeCompare(b.team_name));

  // Available mentors with free slots, most free slots first
  const freeMentors = available
    .filter((m) => !m.is_full)
    .sort((a, b) => a.active_teams - b.active_teams || a.full_name.localeCompare(b.full_name));

  return (
    <div>
      <PageHeader title={greeting() + ', ' + user.name.split(' ')[0]} subtitle={today}>
        <Link to="/find-mentor" className="btn">
          <Search size={16} />
          Find a mentor
        </Link>
      </PageHeader>

      <ErrorMessage message={error} />

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="stats">
            <StatCard icon={Users} label="Total faculty" value={mentors.length} />
            <StatCard
              icon={UserCheck}
              label="Available faculty"
              value={available.length}
              note={mentors.length - available.length + ' not available'}
            />
            <StatCard icon={Link2} label="Active assignments" value={activeAssignments} note="Teams with a mentor" />
            <StatCard
              icon={CircleDashed}
              label="Open mentor slots"
              value={openSlots}
              note={fullMentors + ' mentor' + (fullMentors === 1 ? '' : 's') + ' full'}
            />
          </div>

          <div className="dashboard-grid">
            <section className="card">
              <div className="card-title">
                <h3>Current assignments</h3>
                <Link to="/mentors" className="link">
                  All mentors <ArrowRight size={14} />
                </Link>
              </div>

              {assignments.length === 0 ? (
                <EmptyState title="No assignments yet" text="Use Find Mentor to assign a mentor to a team." />
              ) : (
                <table className="compact">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>Mentor</th>
                      <th>Match</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => (
                      <tr key={a.team_id}>
                        <td>
                          {a.team_name}
                          <div className="muted small">{a.hackathon_name}</div>
                        </td>
                        <td>{a.mentor}</td>
                        <td>{a.match_score !== null ? Number(a.match_score) + '%' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="card">
              <div className="card-title">
                <h3>Mentors with free slots</h3>
                <span className="badge badge-green">{freeMentors.length} available</span>
              </div>

              {freeMentors.length === 0 ? (
                <EmptyState title="Every available mentor is full" />
              ) : (
                <ul className="mentor-list">
                  {freeMentors.map((m) => (
                    <li key={m.faculty_id}>
                      <div>
                        <div>{m.full_name}</div>
                        <div className="muted small">{m.primary_domain || m.department_name}</div>
                      </div>
                      <CapacityBar used={m.active_teams} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Faculty ---------------- */
function FacultyDashboard({ user }) {
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/faculty/my-teams')
      .then((data) => setTeams(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Each hackathon once, earliest first
  const hackathons = [];
  teams.forEach((t) => {
    if (!hackathons.some((h) => h.name === t.hackathon_name)) {
      hackathons.push({ name: t.hackathon_name, start: t.start_date, end: t.end_date, venue: t.venue });
    }
  });
  hackathons.sort((a, b) => new Date(a.start) - new Date(b.start));

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div>
      <PageHeader title={greeting() + ', ' + user.name} subtitle={today}>
        <Link to="/my-teams" className="btn">
          <UsersRound size={16} />
          View my teams
        </Link>
      </PageHeader>

      <ErrorMessage message={error} />

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="stats stats-3">
            <StatCard icon={UsersRound} label="Teams you mentor" value={teams.length} note={'Out of ' + MAX_TEAMS + ' allowed'} />
            <StatCard icon={CircleDashed} label="Free slots" value={Math.max(MAX_TEAMS - teams.length, 0)} />
            <StatCard icon={CalendarDays} label="Hackathons" value={hackathons.length} />
          </div>

          <div className="dashboard-grid">
            <section className="card">
              <div className="card-title">
                <h3>Your teams</h3>
                <CapacityBar used={teams.length} />
              </div>

              {teams.length === 0 ? (
                <EmptyState title="No teams yet" text="The coordinator has not assigned you a team." />
              ) : (
                <ul className="mentor-list">
                  {teams.map((t) => (
                    <li key={t.team_id}>
                      <div>
                        <div>{t.team_name}</div>
                        <div className="muted small">{t.problem_title || 'Problem not selected'}</div>
                      </div>
                      <a href={'mailto:' + t.contact_email} className="link small">Email team</a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card">
              <div className="card-title">
                <h3>Your hackathons</h3>
              </div>

              {hackathons.length === 0 ? (
                <EmptyState title="No hackathons" icon={CalendarDays} />
              ) : (
                <ul className="mentor-list">
                  {hackathons.map((h) => (
                    <li key={h.name}>
                      <div>
                        <div>{h.name}</div>
                        <div className="muted small">{h.venue}</div>
                      </div>
                      <span className="badge badge-blue">
                        {formatDate(h.start)} - {formatDate(h.end)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}