// =============================================================================
// MentorMatchr: Filter & Matching Workspace
// Filters mentors by keywords, domains, and expertise with explainable rankings
// =============================================================================

let selectedKeywords = new Set();
let debounceTimer = null;

const FALLBACK_DOMAINS = [
  { domain_id: 1, domain_name: 'AI & Machine Learning' },
  { domain_id: 2, domain_name: 'Web & Full Stack' },
  { domain_id: 3, domain_name: 'Cybersecurity & Blockchain' },
  { domain_id: 4, domain_name: 'IoT & Embedded Systems' },
  { domain_id: 5, domain_name: 'Data Science & Analytics' },
  { domain_id: 6, domain_name: 'Cloud & Distributed Systems' }
];

const FALLBACK_EXPERTISE = [
  { expertise_id: 1, expertise_name: 'Deep Learning & Neural Networks' },
  { expertise_id: 2, expertise_name: 'Natural Language Processing' },
  { expertise_id: 3, expertise_name: 'Computer Vision & Medical Imaging' },
  { expertise_id: 4, expertise_name: 'Full-Stack Web Architecture' },
  { expertise_id: 5, expertise_name: 'Blockchain & Smart Contracts' },
  { expertise_id: 6, expertise_name: 'Embedded Systems & Sensor Networks' }
];

const FALLBACK_FACULTY_LIST = [
  {
    faculty_id: 1,
    full_name: 'Dr. Arun Sharma',
    designation: 'Professor',
    department_name: 'Computer Science & Engineering',
    email: 'arun.sharma@inst.edu',
    max_teams: 2,
    active_teams: 1,
    remaining_capacity: 1,
    is_available: 1,
    compatibility_score: 86.7,
    domains: [
      { domain_name: 'AI & Machine Learning', is_primary: 1 },
      { domain_name: 'Data Science', is_primary: 0 }
    ],
    expertise: [{ expertise_name: 'Deep Learning & Neural Networks', years_of_experience: 8 }],
    keywords: ['Transformers', 'PyTorch', 'Medical Imaging', 'DICOM', 'Python']
  },
  {
    faculty_id: 2,
    full_name: 'Dr. Sanjay Bhattacharya',
    designation: 'Associate Professor',
    department_name: 'Biomedical Engineering',
    email: 'sanjay.b@inst.edu',
    max_teams: 2,
    active_teams: 0,
    remaining_capacity: 2,
    is_available: 1,
    compatibility_score: 73.3,
    domains: [
      { domain_name: 'AI & Machine Learning', is_primary: 0 },
      { domain_name: 'Healthcare Tech', is_primary: 1 }
    ],
    expertise: [{ expertise_name: 'Computer Vision & Medical Imaging', years_of_experience: 7 }],
    keywords: ['Medical Imaging', 'DICOM', 'Bio-Signals', 'Python']
  },
  {
    faculty_id: 3,
    full_name: 'Dr. Rajesh Verma',
    designation: 'Associate Professor',
    department_name: 'Computer Science & Engineering',
    email: 'rajesh.verma@inst.edu',
    max_teams: 2,
    active_teams: 1,
    remaining_capacity: 1,
    is_available: 1,
    compatibility_score: 82.5,
    domains: [
      { domain_name: 'Cybersecurity & Blockchain', is_primary: 1 }
    ],
    expertise: [{ expertise_name: 'Blockchain & Smart Contracts', years_of_experience: 6 }],
    keywords: ['Solidity', 'Ethereum', 'Smart Contracts', 'Cryptography']
  },
  {
    faculty_id: 4,
    full_name: 'Dr. Karthik Iyer',
    designation: 'Assistant Professor',
    department_name: 'Information Technology',
    email: 'karthik.iyer@inst.edu',
    max_teams: 2,
    active_teams: 0,
    remaining_capacity: 2,
    is_available: 1,
    compatibility_score: 60.0,
    domains: [
      { domain_name: 'Web & Full Stack', is_primary: 1 }
    ],
    expertise: [{ expertise_name: 'Full-Stack Web Architecture', years_of_experience: 5 }],
    keywords: ['React', 'Node.js', 'PostgreSQL', 'Cloud Infrastructure']
  }
];

export function initFilterWorkspace() {
  const keywordInput = document.getElementById('keywordInput');
  const domainSelect = document.getElementById('domainSelect');
  const expertiseSelect = document.getElementById('expertiseSelect');
  const minExpSelect = document.getElementById('minExpSelect');
  const availOnlyCheck = document.getElementById('availOnlyCheck');
  const btnReset = document.getElementById('btnResetFilters');
  const keywordChips = document.querySelectorAll('.chip-keyword');

  // Populate Domain and Expertise dropdowns
  loadFilterOptions();

  // Keyword input event (with debounce)
  keywordInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      syncInputToChips();
      triggerFilterSearch();
    }, 280);
  });

  // Preset keyword chip clicks
  keywordChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const kw = chip.getAttribute('data-kw');
      if (selectedKeywords.has(kw)) {
        selectedKeywords.delete(kw);
        chip.classList.remove('selected');
      } else {
        selectedKeywords.add(kw);
        chip.classList.add('selected');
      }
      syncChipsToInput();
      triggerFilterSearch();
    });
  });

  // Domain change
  domainSelect.addEventListener('change', triggerFilterSearch);

  // Expertise change
  expertiseSelect.addEventListener('change', triggerFilterSearch);

  // Min Experience change
  minExpSelect.addEventListener('change', triggerFilterSearch);

  // Availability toggle change
  availOnlyCheck.addEventListener('change', triggerFilterSearch);

  // Reset filters
  btnReset.addEventListener('click', () => {
    keywordInput.value = '';
    selectedKeywords.clear();
    keywordChips.forEach(c => c.classList.remove('selected'));
    domainSelect.value = '';
    expertiseSelect.value = '';
    minExpSelect.value = '0';
    availOnlyCheck.checked = true;
    triggerFilterSearch();
  });

  // Initial load
  triggerFilterSearch();
}

async function loadFilterOptions() {
  const domainSelect = document.getElementById('domainSelect');
  const expSelect = document.getElementById('expertiseSelect');

  try {
    const [domainsRes, expRes] = await Promise.all([
      fetch('/api/domains'),
      fetch('/api/expertise-areas')
    ]);

    if (domainsRes.ok && expRes.ok) {
      const domainsData = await domainsRes.json();
      const expData = await expRes.json();

      if (domainsData.success && domainSelect) {
        domainsData.domains.forEach(d => {
          const opt = document.createElement('option');
          opt.value = d.domain_id;
          opt.textContent = d.domain_name;
          domainSelect.appendChild(opt);
        });
      }

      if (expData.success && expSelect) {
        expData.expertise.forEach(e => {
          const opt = document.createElement('option');
          opt.value = e.expertise_id;
          opt.textContent = e.expertise_name;
          expSelect.appendChild(opt);
        });
      }
      return;
    }
    throw new Error('Using fallback filter options');
  } catch (err) {
    if (domainSelect) {
      FALLBACK_DOMAINS.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.domain_id;
        opt.textContent = d.domain_name;
        domainSelect.appendChild(opt);
      });
    }
    if (expSelect) {
      FALLBACK_EXPERTISE.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.expertise_id;
        opt.textContent = e.expertise_name;
        expSelect.appendChild(opt);
      });
    }
  }
}

function syncChipsToInput() {
  const input = document.getElementById('keywordInput');
  input.value = Array.from(selectedKeywords).join(', ');
}

function syncInputToChips() {
  const input = document.getElementById('keywordInput');
  const tokens = input.value.split(',').map(s => s.trim().replace(/^#/, '')).filter(Boolean);
  selectedKeywords = new Set(tokens);

  document.querySelectorAll('.chip-keyword').forEach(chip => {
    const kw = chip.getAttribute('data-kw');
    if (selectedKeywords.has(kw)) {
      chip.classList.add('selected');
    } else {
      chip.classList.remove('selected');
    }
  });
}

export async function triggerFilterSearch() {
  const domainSelect = document.getElementById('domainSelect');
  const expertiseSelect = document.getElementById('expertiseSelect');
  const minExpSelect = document.getElementById('minExpSelect');
  const availOnlyCheck = document.getElementById('availOnlyCheck');
  const resultsCountEl = document.getElementById('resultsCount');
  const gridEl = document.getElementById('facultyResultsGrid');

  const domainId = domainSelect.value ? Number(domainSelect.value) : null;
  const expertiseId = expertiseSelect.value ? Number(expertiseSelect.value) : null;
  const minExperience = Number(minExpSelect.value) || 0;
  const availableOnly = availOnlyCheck.checked;
  const keywordNames = Array.from(selectedKeywords);

  gridEl.innerHTML = '<div style="padding: 30px; color: var(--text-tertiary); font-size: 14px;">Searching faculty database...</div>';

  try {
    const res = await fetch('/api/match/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domainId,
        expertiseId,
        minExperience,
        availableOnly,
        keywordNames
      })
    });

    if (res.ok) {
      const data = await res.json();
      const faculty = data.recommendations || [];

      resultsCountEl.textContent = `Showing ${faculty.length} faculty ${faculty.length === 1 ? 'mentor' : 'mentors'}`;

      if (faculty.length === 0) {
        gridEl.innerHTML = `
          <div style="grid-column: 1 / -1; background: #FFFFFF; border: 1px dashed var(--border-medium); border-radius: 14px; padding: 48px; text-align: center;">
            <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 8px; color: var(--text-primary);">No Mentors Match This Search</h4>
            <p style="font-size: 13.5px; color: var(--text-secondary); max-width: 440px; margin: 0 auto 16px;">
              Try clearing some keywords or switching domains to broaden the relational search.
            </p>
            <button class="btn-secondary" onclick="document.getElementById('btnResetFilters').click()">Reset Filters</button>
          </div>
        `;
        return;
      }

      gridEl.innerHTML = faculty.map((f, idx) => renderFacultyCard(f, keywordNames, idx)).join('');
      return;
    }
    throw new Error('API offline');
  } catch (err) {
    // Standalone fallback: Filter mock list
    let filtered = FALLBACK_FACULTY_LIST;
    if (availableOnly) {
      filtered = filtered.filter(f => f.remaining_capacity > 0);
    }
    resultsCountEl.textContent = `Showing ${filtered.length} faculty ${filtered.length === 1 ? 'mentor' : 'mentors'}`;
    gridEl.innerHTML = filtered.map((f, idx) => renderFacultyCard(f, keywordNames, idx)).join('');
  }
}

function renderFacultyCard(f, activeKeywords, index = 0) {
  const cleanActiveKeywords = activeKeywords.map(k => k.toLowerCase().trim());
  const workloadPercent = Math.min(100, Math.round((f.active_teams / f.max_teams) * 100));
  const isFull = f.remaining_capacity <= 0;
  const animDelay = Math.min(index * 0.04, 0.35);

  // Format expertise areas
  const expertiseStr = f.expertise && f.expertise.length > 0
    ? f.expertise.map(e => `${e.expertise_name} (${e.years_of_experience} yrs)`).join(' &bull; ')
    : 'General Academic Mentorship';

  return `
    <div class="mentor-card" style="animation-delay: ${animDelay}s;">
      <div>
        <div class="mentor-card-top">
          <div class="mentor-profile-info">
            <h4 class="mentor-name">${f.full_name}</h4>
            <div class="mentor-sub-info">${f.designation} &bull; ${f.department_name}</div>
          </div>
          <div class="mentor-score-pill">
            <span class="score-badge">${f.compatibility_score}%</span>
            <span class="score-caption">Match</span>
          </div>
        </div>

        <!-- Domain badges -->
        <div class="mentor-domains-wrap">
          ${f.domains.map(d => `
            <span class="${d.is_primary ? 'domain-pill-primary' : 'domain-pill-secondary'}">
              ${d.domain_name}${d.is_primary ? ' (Primary)' : ''}
            </span>
          `).join('')}
        </div>

        <!-- Areas of Expertise -->
        <div class="mentor-expertise-row">
          <span style="font-weight: 600; color: var(--text-primary);">Expertise:</span>
          <span>${expertiseStr}</span>
        </div>

        <!-- Technical Keywords with match highlighting -->
        <div class="mentor-keywords-list">
          ${f.keywords.map(kw => {
            const isMatched = cleanActiveKeywords.includes(kw.toLowerCase());
            return `<span class="kw-badge ${isMatched ? 'matched' : ''}">#${kw}</span>`;
          }).join('')}
        </div>
      </div>

      <div class="mentor-card-footer">
        <div class="workload-indicator">
          <span class="workload-text">${f.active_teams}/${f.max_teams} Teams (${f.remaining_capacity} free)</span>
          <div class="workload-bar-wrap">
            <div class="workload-bar-fill" style="width: ${workloadPercent}%;"></div>
          </div>
        </div>

        <button
          class="btn-card-assign"
          ${isFull || !f.is_available ? 'disabled' : ''}
          onclick="openAssignModal(${f.faculty_id}, '${escapeHtml(f.full_name)}', ${f.compatibility_score})"
        >
          ${isFull ? 'Capacity Full' : 'Assign to Team &rarr;'}
        </button>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
