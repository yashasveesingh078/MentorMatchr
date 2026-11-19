import { useEffect, useState } from 'react';
import { Search, Mail, Copy, Check, UsersRound, CalendarDays, MapPin, FileText, SearchX } from 'lucide-react';
import { api, getUser } from '../api';
import PageHeader from '../components/PageHeader';
import { Loading, ErrorMessage, EmptyState } from '../components/Feedback';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function MyTeamsPage() {
  const user = getUser();
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [hackathon, setHackathon] = useState('all');
  const [copied, setCopied] = useState(''); // email that was just copied

  useEffect(() => {
    api('/faculty/my-teams')
      .then((data) => setTeams(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Hackathon names for the filter dropdown (each name once)
  const hackathonNames = [...new Set(teams.map((t) => t.hackathon_name))];

  // Apply the search box and the hackathon filter
  const text = search.trim().toLowerCase();
  const shownTeams = teams.filter((t) => {
    const matchesText =
      t.team_name.toLowerCase().includes(text) ||
      (t.problem_title || '').toLowerCase().includes(text);
    const matchesHackathon = hackathon === 'all' || t.hackathon_name === hackathon;
    return matchesText && matchesHackathon;
  });

  async function copyEmail(email) {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(email);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      setError('Could not copy. Please copy the email manually.');
    }
  }

  return (
    <div>
      <PageHeader
        title="My Teams"
        subtitle="Teams you are currently mentoring and how to contact them."
      />

      <ErrorMessage message={error} />

      {loading ? (
        <Loading text="Loading your teams..." />
      ) : teams.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={UsersRound}
            title="No teams assigned yet"
            text="When the coordinator assigns you a team, it will appear here."
          />
        </div>
      ) : (
        <>
          <div className="toolbar">
            <div className="input-icon toolbar-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team or problem"
              />
            </div>
            <select value={hackathon} onChange={(e) => setHackathon(e.target.value)} className="toolbar-select">
              <option value="all">All hackathons</option>
              {hackathonNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <span className="muted small toolbar-count">
              {shownTeams.length} of {teams.length} teams
            </span>
          </div>

          {shownTeams.length === 0 ? (
            <div className="card">
              <EmptyState icon={SearchX} title="No teams match your search" text="Try a different name or hackathon." />
            </div>
          ) : (
            <div className="team-grid">
              {shownTeams.map((t) => (
                <article key={t.team_id} className="team-card">
                  <div className="team-card-head">
                    <div>
                      <h3>{t.team_name}</h3>
                      <span className="muted small">{t.team_size} members</span>
                    </div>
                    <span className="badge badge-green">Active</span>
                  </div>

                  <div className="team-problem">
                    <FileText size={16} />
                    <div>
                      {t.problem_title ? (
                        <>
                          <div>{t.problem_title}</div>
                          <div className="muted small">
                            {t.ps_code} · {t.domain_name}
                          </div>
                        </>
                      ) : (
                        <span className="muted">Problem not selected yet</span>
                      )}
                    </div>
                  </div>

                  <dl className="details">
                    <div>
                      <dt><CalendarDays size={14} /> Hackathon</dt>
                      <dd>
                        {t.hackathon_name}
                        <div className="muted small">
                          {formatDate(t.start_date)} - {formatDate(t.end_date)}
                        </div>
                      </dd>
                    </div>
                    <div>
                      <dt><MapPin size={14} /> Venue</dt>
                      <dd>{t.venue || '-'}</dd>
                    </div>
                    <div>
                      <dt><UsersRound size={14} /> Mentor</dt>
                      <dd>
                        {user.name} (you)
                        <div className="muted small">
                          Since {formatDate(t.assigned_at)}
                          {t.match_score !== null && ' · ' + Number(t.match_score) + '% match'}
                        </div>
                      </dd>
                    </div>
                  </dl>

                  <div className="team-contact">
                    <span className="small">{t.contact_email}</span>
                    <div className="team-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => copyEmail(t.contact_email)}
                        aria-label="Copy email"
                      >
                        {copied === t.contact_email ? <Check size={16} /> : <Copy size={16} />}
                        {copied === t.contact_email ? 'Copied' : 'Copy'}
                      </button>
                      <a href={'mailto:' + t.contact_email} className="btn">
                        <Mail size={16} />
                        Email
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}