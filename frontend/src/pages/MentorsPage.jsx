import { useEffect, useState } from 'react';
import { Search, Mail, Phone, Building2, SearchX, Users } from 'lucide-react';
import { api } from '../api';
import PageHeader from '../components/PageHeader';
import CapacityBar from '../components/CapacityBar';
import { initials } from '../utils';
import { Loading, ErrorMessage, EmptyState } from '../components/Feedback';

// One status for each mentor, used for the badge and the filter
function getStatus(m) {
  if (!m.is_available) return 'unavailable';
  if (m.is_full) return 'full';
  return 'available';
}

const statusBadge = {
  available: { text: 'Available', className: 'badge-green' },
  full: { text: 'Full', className: 'badge-orange' },
  unavailable: { text: 'Not available', className: 'badge-red' },
};

export default function MentorsPage() {
  const [mentors, setMentors] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('all');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    api('/coordinator/mentors')
      .then((data) => setMentors(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Domain names for the filter (each once, A-Z)
  const domains = [...new Set(mentors.map((m) => m.primary_domain).filter(Boolean))].sort();

  // Apply search + domain + status filters
  const text = search.trim().toLowerCase();
  const shownMentors = mentors.filter((m) => {
    const matchesText = m.full_name.toLowerCase().includes(text);
    const matchesDomain = domain === 'all' || m.primary_domain === domain;
    const matchesStatus = status === 'all' || getStatus(m) === status;
    return matchesText && matchesDomain && matchesStatus;
  });

  function clearFilters() {
    setSearch('');
    setDomain('all');
    setStatus('all');
  }

  return (
    <div>
      <PageHeader
        title="Mentors"
        subtitle="All faculty mentors, their skills and the teams they guide. Each mentor can take up to 3 teams."
      />

      <ErrorMessage message={error} />

      {loading ? (
        <Loading text="Loading mentors..." />
      ) : (
        <>
          <div className="toolbar">
            <div className="input-icon toolbar-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name"
              />
            </div>
            <select value={domain} onChange={(e) => setDomain(e.target.value)} className="toolbar-select">
              <option value="all">All domains</option>
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="toolbar-select">
              <option value="all">Any availability</option>
              <option value="available">Has free slots</option>
              <option value="full">Full (3 / 3)</option>
              <option value="unavailable">Not available</option>
            </select>
            <span className="muted small toolbar-count">
              {shownMentors.length} of {mentors.length} mentors
            </span>
          </div>

          {mentors.length === 0 ? (
            <div className="card">
              <EmptyState icon={Users} title="No faculty found" />
            </div>
          ) : shownMentors.length === 0 ? (
            <div className="card">
              <EmptyState icon={SearchX} title="No mentors match these filters" />
              <div style={{ textAlign: 'center', marginTop: -16 }}>
                <button className="btn-secondary" onClick={clearFilters}>Clear filters</button>
              </div>
            </div>
          ) : (
            <div className="mentor-grid">
              {shownMentors.map((m) => {
                const badge = statusBadge[getStatus(m)];
                return (
                  <article key={m.faculty_id} className={'mentor-card' + (m.is_available ? '' : ' mentor-card-off')}>
                    <div className="mentor-card-head">
                      <span className="avatar avatar-lg">{initials(m.full_name)}</span>
                      <div className="mentor-card-name">
                        <h3>{m.full_name}</h3>
                        <span className="muted small">{m.designation}</span>
                      </div>
                      <span className={'badge ' + badge.className}>{badge.text}</span>
                    </div>

                    <div className="mentor-meta">
                      <span><Building2 size={14} /> {m.department_name}</span>
                      {m.primary_domain && <span className="badge badge-blue">{m.primary_domain}</span>}
                    </div>

                    <div>
                      <div className="section-label">Skills</div>
                      <div className="chips">
                        {m.keywords ? (
                          m.keywords.split(', ').map((k) => <span key={k} className="chip">{k}</span>)
                        ) : (
                          <span className="muted small">No skills listed</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="section-label section-label-row">
                        Assigned teams
                        <CapacityBar used={m.active_teams} />
                      </div>
                      {m.teams.length === 0 ? (
                        <span className="muted small">No teams yet</span>
                      ) : (
                        <ul className="plain-list">
                          {m.teams.map((t) => (
                            <li key={t.team_id}>
                              {t.team_name}
                              <span className="muted small"> · {t.hackathon_name}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="mentor-contact">
                      <a href={'mailto:' + m.email}><Mail size={14} /> {m.email}</a>
                      {m.phone && <span><Phone size={14} /> {m.phone}</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}