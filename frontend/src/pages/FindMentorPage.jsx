import { useCallback, useState } from 'react';
import {
  Search, LoaderCircle, UsersRound, FileText, Mail, Check, X, TriangleAlert, UserRound, SearchX,
} from 'lucide-react';
import { api } from '../api';
import PageHeader from '../components/PageHeader';
import CapacityBar from '../components/CapacityBar';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { ErrorMessage, EmptyState } from '../components/Feedback';

// "Python, OpenCV ,python" -> ['Python', 'OpenCV']  (same idea as the backend)
function splitKeywords(text) {
  const seen = new Set();
  const list = [];
  text.split(',').forEach((k) => {
    const word = k.trim();
    if (word && !seen.has(word.toLowerCase())) {
      seen.add(word.toLowerCase());
      list.push(word);
    }
  });
  return list;
}

export default function FindMentorPage() {
  // Form inputs
  const [teamName, setTeamName] = useState('');
  const [domain, setDomain] = useState('');
  const [keywords, setKeywords] = useState('');

  // Results
  const [result, setResult] = useState(null);       // { team, domain, mentors }
  const [searchedKeywords, setSearchedKeywords] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Assign flow
  const [selected, setSelected] = useState(null);   // mentor waiting for confirmation
  const [assigning, setAssigning] = useState(false);
  const [toast, setToast] = useState('');
  const closeToast = useCallback(() => setToast(''), []);

  async function runSearch() {
    setError('');
    setLoading(true);
    try {
      const data = await api('/coordinator/search', 'POST', { teamName, domain, keywords });
      setResult(data);
      setSearchedKeywords(splitKeywords(keywords));
    } catch (err) {
      setResult(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    if (!teamName.trim() || !domain.trim()) {
      setError('Please enter a team name and a domain');
      return;
    }
    runSearch();
  }

  async function confirmAssign() {
    setAssigning(true);
    try {
      const data = await api('/coordinator/assign', 'POST', {
        teamId: result.team.team_id,
        facultyId: selected.faculty_id,
        matchScore: selected.score,
      });
      setToast(data.message);
      setSelected(null);
      runSearch(); // refresh so the current mentor and team counts update
    } catch (err) {
      setSelected(null);
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  }

  const team = result?.team;
  const noProblem = team && !team.problem_title; // backend will refuse to assign

  return (
    <div>
      <PageHeader
        title="Find Mentor"
        subtitle="Enter a team, a domain and keywords. Mentors are ranked by how well their domain and skills match."
      />

      {/* ---------- Search form ---------- */}
      <form className="card finder-form" onSubmit={handleSearch} noValidate>
        <div>
          <label htmlFor="team">Team name</label>
          <input id="team" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. Code Crafters" />
        </div>
        <div>
          <label htmlFor="domain">Domain</label>
          <input id="domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="e.g. Cybersecurity" />
        </div>
        <div>
          <label htmlFor="keywords">Keywords</label>
          <input
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g. Python, Networking"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? <LoaderCircle size={16} className="spinner" /> : <Search size={16} />}
          {loading ? 'Searching...' : 'Search'}
        </button>
        <p className="hint finder-hint">
          Separate keywords with commas. Score = 40 points for the domain + 10 for each keyword, shown as a percentage.
        </p>
      </form>

      <ErrorMessage message={error} />

      {/* ---------- Results ---------- */}
      {result && (
        <>
          <div className="finder-summary">
            <section className="card">
              <div className="section-label">Selected team</div>
              <div className="summary-team">
                <span className="stat-icon"><UsersRound size={18} /></span>
                <div>
                  <h3>{team.team_name}</h3>
                  <span className="muted small">{team.hackathon_name} · {team.team_size} members</span>
                </div>
              </div>
              <dl className="details">
                <div>
                  <dt><FileText size={14} /> Problem</dt>
                  <dd>{team.problem_title || <span className="muted">Not selected yet</span>}</dd>
                </div>
                <div>
                  <dt><UserRound size={14} /> Mentor</dt>
                  <dd>
                    {team.current_mentor
                      ? team.current_mentor.full_name
                      : <span className="muted">No mentor yet</span>}
                  </dd>
                </div>
                <div>
                  <dt><Mail size={14} /> Contact</dt>
                  <dd><a href={'mailto:' + team.contact_email}>{team.contact_email}</a></dd>
                </div>
              </dl>
            </section>

            <section className="card">
              <div className="section-label">Searching for</div>
              <div className="criteria">
                <span className="muted small">Domain</span>
                <div className="chips">
                  <span className="badge badge-blue">{result.domain.domain_name}</span>
                </div>
                <span className="muted small">Keywords</span>
                <div className="chips">
                  {searchedKeywords.length === 0
                    ? <span className="muted small">None</span>
                    : searchedKeywords.map((k) => <span key={k} className="chip">{k}</span>)}
                </div>
              </div>
            </section>
          </div>

          {noProblem && (
            <div className="alert alert-warning">
              <TriangleAlert size={16} />
              {team.team_name} has not selected a problem statement yet, so a mentor cannot be assigned.
            </div>
          )}

          <div className="card-title">
            <h3>Recommended mentors</h3>
            <span className="muted small">{result.mentors.length} found · highest score first</span>
          </div>

          {result.mentors.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={SearchX}
                title="No matching mentors"
                text="No available mentor has this domain or any of these keywords."
              />
            </div>
          ) : (
            <div className="results">
              {result.mentors.map((m, index) => {
                const isCurrent = team.current_mentor?.faculty_id === m.faculty_id;
                const matched = m.matched_keywords.toLowerCase().split(', ');

                // Why the button is disabled (or not)
                let action = 'Assign';
                if (isCurrent) action = 'Current mentor';
                else if (m.is_full) action = 'Full';
                else if (m.worked_with_team) action = 'Assigned before';
                const disabled = action !== 'Assign' || noProblem;

                return (
                  <article key={m.faculty_id} className={'result-row' + (m.is_full ? ' result-full' : '')}>
                    <div className="rank">{index + 1}</div>

                    <div className="result-mentor">
                      <strong>{m.full_name}</strong>
                      <span className="muted small">{m.designation} · {m.department_name}</span>
                    </div>

                    <div className="result-score">
                      <div className="score-bar">
                        <div style={{ width: m.score + '%' }} />
                      </div>
                      <strong>{m.score}%</strong>
                    </div>

                    <div className="result-match">
                      <span className={'match ' + (m.domain_match ? 'match-yes' : 'match-no')}>
                        {m.domain_match ? <Check size={14} /> : <X size={14} />}
                        Domain
                      </span>
                      {searchedKeywords.map((k) => {
                        const yes = matched.includes(k.toLowerCase());
                        return (
                          <span key={k} className={'match ' + (yes ? 'match-yes' : 'match-no')}>
                            {yes ? <Check size={14} /> : <X size={14} />}
                            {k}
                          </span>
                        );
                      })}
                    </div>

                    <div className="result-capacity">
                      <CapacityBar used={m.active_teams} />
                    </div>

                    <div className="result-action">
                      <button
                        className={disabled ? '' : 'btn-assign'}
                        disabled={disabled}
                        onClick={() => setSelected(m)}
                      >
                        {action}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ---------- Confirmation pop-up ---------- */}
      {selected && (
        <ConfirmDialog
          title="Assign mentor?"
          confirmText="Assign mentor"
          busy={assigning}
          onConfirm={confirmAssign}
          onCancel={() => setSelected(null)}
        >
          <p>
            Assign <strong>{selected.full_name}</strong> to <strong>{team.team_name}</strong> with a
            match score of <strong>{selected.score}%</strong>?
          </p>
          {team.current_mentor && (
            <p className="muted">
              {team.current_mentor.full_name} is the current mentor and will be marked as replaced.
            </p>
          )}
          <p className="muted small">
            {selected.full_name} will have {selected.active_teams + 1} of 3 teams after this.
          </p>
        </ConfirmDialog>
      )}

      <Toast message={toast} onClose={closeToast} />
    </div>
  );
}