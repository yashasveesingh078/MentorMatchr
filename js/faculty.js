// =============================================================================
// MentorMatchr: Faculty Portal Controller
// Tailored for faculty mentors: capacity tracking, assigned teams & review remarks
// =============================================================================

let activeFacultyId = 1;

const FALLBACK_FACULTY_DATA = {
  faculty: {
    faculty_id: 1,
    full_name: 'Dr. Arun Sharma',
    designation: 'Professor',
    department_name: 'Computer Science & Engineering',
    email: 'arun.sharma@inst.edu',
    max_teams: 2,
    is_available: 1,
    active_teams: 1,
    remaining_capacity: 1
  },
  assignedTeams: [
    {
      team_id: 1,
      team_name: 'CareSync AI',
      team_size: 3,
      contact_email: 'lead@caresync.ai',
      ps_code: 'PS-04',
      problem_title: 'Automated Medical Imaging Diagnostics Using Transformer Ensembles',
      domain_name: 'AI & Machine Learning',
      match_score: 86.7,
      status: 'ACTIVE',
      assigned_at: new Date().toISOString()
    }
  ],
  incomingRequests: [
    {
      request_id: 2,
      team_name: 'CareSync AI',
      milestone_title: 'Model Validation Defense Preparation',
      description: 'Preparing 5-minute presentation deck and live prototype walkthrough. Need mentor feedback on clinician explainability metrics.',
      status: 'PENDING',
      mentor_notes: null
    },
    {
      request_id: 1,
      team_name: 'CareSync AI',
      milestone_title: 'Architecture Review & Attention Map Interpretation',
      description: 'Submitted multi-head attention pipeline for DICOM slices. Need guidance on reducing inference latency on T4 GPUs without sacrificing slice segmentation accuracy.',
      status: 'COMPLETED',
      mentor_notes: 'Reviewed architecture. Switch to mixed precision (FP16) with TensorRT optimization for 2.4x latency reduction while preserving dice coefficients.'
    }
  ],
  profile: {
    domains: [
      { domain_name: 'AI & Machine Learning', is_primary: 1 },
      { domain_name: 'Data Science', is_primary: 0 }
    ],
    expertise: [
      { expertise_name: 'Deep Learning & Neural Networks', years_of_experience: 8 },
      { expertise_name: 'Computer Vision & Medical Imaging', years_of_experience: 6 }
    ],
    keywords: ['Transformers', 'PyTorch', 'Medical Imaging', 'DICOM', 'Python']
  }
};

export async function loadFacultyPortal(facultyId = 1) {
  activeFacultyId = facultyId;
  const container = document.getElementById('facultyPortalContent');
  if (!container) return;

  container.innerHTML = '<div style="padding: 40px; color: var(--text-tertiary); font-size: 14px;">Loading faculty dashboard...</div>';

  try {
    const res = await fetch(`/api/faculty/dashboard?facultyId=${facultyId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        const { faculty, assignedTeams, incomingRequests, profile } = data.data;
        renderFacultyView(faculty, assignedTeams, incomingRequests, profile);
        return;
      }
    }
    throw new Error('API offline');
  } catch (err) {
    // Graceful fallback for standalone frontend
    const { faculty, assignedTeams, incomingRequests, profile } = FALLBACK_FACULTY_DATA;
    renderFacultyView(faculty, assignedTeams, incomingRequests, profile);
  }
}

function renderFacultyView(faculty, assignedTeams, incomingRequests, profile) {
  const container = document.getElementById('facultyPortalContent');
  const isAvail = faculty.is_available;
  const workloadPercent = Math.min(100, Math.round((faculty.active_teams / faculty.max_teams) * 100));

  // Header Banner with Availability Toggle
  const headerHtml = `
    <div class="portal-page-header">
      <div class="container portal-header-inner">
        <div class="portal-title-block">
          <div class="hero-tag-pill" style="margin-bottom: 12px;">
            <span class="hero-tag-dot"></span>
            <span>Faculty Mentor Dashboard &bull; CodeFest 2026</span>
          </div>
          <h1>${faculty.full_name}</h1>
          <p>${faculty.designation} &bull; Department of ${faculty.department_name}</p>
        </div>

        <div class="faculty-status-banner">
          <div>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-tertiary);">Mentoring Capacity</div>
            <div style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-top: 2px;">
              ${faculty.active_teams} of ${faculty.max_teams} Teams (${faculty.remaining_capacity} free)
            </div>
          </div>

          <button
            class="availability-toggle-btn ${isAvail ? 'available' : ''}"
            onclick="toggleFacultyAvailability(${faculty.faculty_id}, ${!isAvail})"
            title="Click to toggle availability"
          >
            ${isAvail ? 'Status: Available' : 'Status: Busy / Paused'}
          </button>
        </div>
      </div>
    </div>
  `;

  const pendingCount = incomingRequests.filter(r => r.status === 'PENDING').length;

  // In-Page Segmented Tab Strip (Keeps Top Navbar Royal & Uncluttered)
  const subnavHtml = `
    <div class="portal-subnav-strip">
      <div class="container subnav-tabs-container">
        <div class="subnav-tabs" id="facultySubnavTabs">
          <button class="subnav-tab-btn active" data-tab="all">
            <span class="subnav-tab-dot"></span>
            <span>Dashboard Overview</span>
          </button>
          <button class="subnav-tab-btn" data-tab="teams">
            <span>Allocated Teams</span>
            <span class="tab-tag">${assignedTeams.length} Active</span>
          </button>
          <button class="subnav-tab-btn" data-tab="requests">
            <span>Student Review Tickets</span>
            <span class="tab-tag ${pendingCount > 0 ? 'badge-amber' : ''}">${pendingCount} Pending</span>
          </button>
          <button class="subnav-tab-btn" data-tab="taxonomy">
            <span>My Taxonomy &amp; Keywords</span>
            <span class="tab-tag">${profile.keywords.length} Tags</span>
          </button>
        </div>
      </div>
    </div>
  `;

  // Left Column: Assigned Teams & Student Review Requests
  const leftColHtml = `
    <div class="faculty-col-left">
      <!-- My Allocated Teams -->
      <div class="portal-card" id="facultyTeamsSection">
        <div class="portal-card-header">
          <div class="portal-card-title">
            <span>My Allocated Hackathon Teams</span>
          </div>
          <span class="sim-capacity-badge">${assignedTeams.length} Active ${assignedTeams.length === 1 ? 'Team' : 'Teams'}</span>
        </div>

        ${assignedTeams && assignedTeams.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${assignedTeams.map(t => {
              const dateStr = new Date(t.assigned_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
              return `
                <div class="sim-faculty-card" style="margin-bottom: 0;">
                  <div class="sim-faculty-card-header">
                    <span class="sim-faculty-name" style="font-size: 16px;">Team ${t.team_name}</span>
                    <span class="status-pill-active">&#9679; ${t.status}</span>
                  </div>
                  <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin: 6px 0 2px;">
                    ${t.ps_code}: ${t.problem_title}
                  </div>
                  <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
                    Domain: ${t.domain_name} &bull; ${t.team_size} Members &bull; ${t.contact_email}
                  </div>
                  <div class="sim-card-bottom">
                    <div class="sim-score-group">
                      <span class="sim-score-value" style="font-size: 18px;">${t.match_score}%</span>
                      <span class="sim-score-label">Algorithm Compatibility</span>
                    </div>
                    <span style="font-size: 11px; color: var(--text-tertiary);">Assigned: ${dateStr}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div style="background: #FAF8F5; border: 1px dashed var(--border-medium); border-radius: 12px; padding: 28px; text-align: center;">
            <p style="font-size: 13.5px; color: var(--text-secondary);">
              You currently have zero active team assignments. New teams will be matched based on your technical keywords.
            </p>
          </div>
        `}
      </div>

      <!-- Incoming Student Guidance & Review Requests -->
      <div class="portal-card" id="facultyRequestsSection">
        <div class="portal-card-header">
          <div class="portal-card-title">
            <span>Student Guidance &amp; Milestone Check-ins</span>
          </div>
          <span style="font-size: 12px; color: var(--text-tertiary);">
            ${pendingCount} Pending Review
          </span>
        </div>

        ${incomingRequests && incomingRequests.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${incomingRequests.map(r => `
              <div class="request-item">
                <div class="request-item-header">
                  <div>
                    <span class="request-title">${r.milestone_title}</span>
                    <span style="font-size: 12px; color: var(--text-secondary); margin-left: 6px;">(Team ${r.team_name})</span>
                  </div>
                  <span class="${r.status === 'COMPLETED' ? 'status-pill-active' : 'status-pill-replaced'}">
                    ${r.status}
                  </span>
                </div>
                <div class="request-body">${r.description}</div>
                ${r.mentor_notes ? `
                  <div class="request-notes-box">
                    <strong>Your Remarks:</strong> ${r.mentor_notes}
                  </div>
                ` : `
                  <button class="btn-primary" style="font-size: 12px; padding: 6px 14px; border-radius: var(--radius-sm); margin-top: 6px;" onclick="openResolveModal(${r.request_id}, '${escapeHtml(r.team_name)}', '${escapeHtml(r.milestone_title)}')">
                    Evaluate &amp; Add Mentor Remarks &rarr;
                  </button>
                `}
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="background: #FAF8F5; border: 1px dashed var(--border-medium); border-radius: 12px; padding: 28px; text-align: center;">
            <p style="font-size: 13.5px; color: var(--text-secondary);">
              No student guidance requests pending. Your assigned teams will log check-ins here.
            </p>
          </div>
        `}
      </div>
    </div>
  `;

  // Right Column: Technical Taxonomy & Expertise Profile
  const rightColHtml = `
    <div class="faculty-col-right">
      <div class="portal-card" id="facultyTaxonomySection" style="box-shadow: var(--shadow-subtle);">
        <div class="portal-card-header">
          <div class="portal-card-title">
            <span>My Relational Expertise Taxonomy</span>
          </div>
          <span class="brand-portal-pill">BCNF STORED</span>
        </div>

        <!-- Domains -->
        <div style="margin-bottom: 20px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-tertiary); margin-bottom: 8px;">
            Associated Technical Domains
          </div>
          <div class="mentor-domains-wrap">
            ${profile.domains.map(d => `
              <span class="${d.is_primary ? 'domain-pill-primary' : 'domain-pill-secondary'}">
                ${d.domain_name}${d.is_primary ? ' (Primary Domain)' : ''}
              </span>
            `).join('')}
          </div>
        </div>

        <!-- Areas of Expertise & Experience -->
        <div style="margin-bottom: 20px; padding-top: 14px; border-top: 1px solid #F5F1E8;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-tertiary); margin-bottom: 8px;">
            Verified Areas of Expertise
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${profile.expertise.map(e => `
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px; background: #FAF8F5; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-light);">
                <span style="font-weight: 600; color: var(--text-primary);">${e.expertise_name}</span>
                <span style="color: var(--text-secondary); font-size: 12px;">${e.years_of_experience} Years Exp</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Technical Keywords Tagged -->
        <div style="padding-top: 14px; border-top: 1px solid #F5F1E8;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-tertiary); margin-bottom: 8px;">
            Technical Keywords for Matching Engine
          </div>
          <div class="sim-tags-cluster">
            ${profile.keywords.map(k => `<span class="badge-tag highlight">#${k}</span>`).join('')}
          </div>
        </div>
      </div>

      <!-- Quick Switcher for Testing Other Faculty Profiles -->
      <div class="portal-card" id="facultySwitcherSection">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-tertiary); margin-bottom: 10px;">
          View As Another Faculty Mentor
        </div>
        <div class="demo-buttons-wrap">
          <button class="btn-demo-quick" onclick="loadFacultyPortal(1)">
            <strong>Dr. Arun Sharma</strong> <span>(AI &amp; Computer Vision)</span>
          </button>
          <button class="btn-demo-quick" onclick="loadFacultyPortal(2)">
            <strong>Dr. Sanjay Bhattacharya</strong> <span>(Biomedical Engineering)</span>
          </button>
          <button class="btn-demo-quick" onclick="loadFacultyPortal(4)">
            <strong>Dr. Karthik Iyer</strong> <span>(Web &amp; Cloud Systems)</span>
          </button>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = `
    ${headerHtml}
    ${subnavHtml}
    <div class="container student-grid tab-pane-transition" id="facultyMainGrid">
      ${leftColHtml}
      ${rightColHtml}
    </div>
  `;

  // Wire up In-Page Segmented Tab Switching
  initFacultyTabs();
}

function initFacultyTabs() {
  const tabs = document.querySelectorAll('#facultySubnavTabs .subnav-tab-btn');
  const teamsCard = document.getElementById('facultyTeamsSection');
  const requestsCard = document.getElementById('facultyRequestsSection');
  const taxonomyCard = document.getElementById('facultyTaxonomySection');
  const switcherCard = document.getElementById('facultySwitcherSection');
  const grid = document.getElementById('facultyMainGrid');
  const leftCol = document.querySelector('.faculty-col-left');
  const rightCol = document.querySelector('.faculty-col-right');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.getAttribute('data-tab');

      // Re-trigger subtle entrance animation
      if (grid) {
        grid.classList.remove('tab-pane-transition');
        void grid.offsetWidth; // force reflow
        grid.classList.add('tab-pane-transition');
      }

      if (target === 'all') {
        if (grid) grid.style.gridTemplateColumns = '1.2fr 0.8fr';
        if (leftCol) leftCol.style.display = 'block';
        if (rightCol) rightCol.style.display = 'block';
        if (teamsCard) teamsCard.style.display = 'block';
        if (requestsCard) requestsCard.style.display = 'block';
        if (taxonomyCard) taxonomyCard.style.display = 'block';
        if (switcherCard) switcherCard.style.display = 'block';
      } else if (target === 'teams') {
        if (grid) grid.style.gridTemplateColumns = '1fr';
        if (leftCol) leftCol.style.display = 'block';
        if (rightCol) rightCol.style.display = 'none';
        if (teamsCard) teamsCard.style.display = 'block';
        if (requestsCard) requestsCard.style.display = 'none';
      } else if (target === 'requests') {
        if (grid) grid.style.gridTemplateColumns = '1fr';
        if (leftCol) leftCol.style.display = 'block';
        if (rightCol) rightCol.style.display = 'none';
        if (teamsCard) teamsCard.style.display = 'none';
        if (requestsCard) requestsCard.style.display = 'block';
      } else if (target === 'taxonomy') {
        if (grid) grid.style.gridTemplateColumns = '1fr';
        if (leftCol) leftCol.style.display = 'none';
        if (rightCol) rightCol.style.display = 'block';
        if (taxonomyCard) taxonomyCard.style.display = 'block';
        if (switcherCard) switcherCard.style.display = 'block';
      }
    });
  });
}

// Toggle Availability Handler
window.toggleFacultyAvailability = async function(facultyId, newStatus) {
  try {
    const res = await fetch('/api/faculty/availability', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facultyId, isAvailable: newStatus })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        if (window.showToast) window.showToast(data.message);
        loadFacultyPortal(facultyId);
        return;
      }
    }
    throw new Error('Offline toggle');
  } catch (err) {
    FALLBACK_FACULTY_DATA.faculty.is_available = newStatus ? 1 : 0;
    if (window.showToast) window.showToast(`Status updated: ${newStatus ? 'Available' : 'Busy / Paused'}`);
    loadFacultyPortal(facultyId);
  }
};

// Resolve Mentorship Request Modal
window.openResolveModal = function(requestId, teamName, milestoneTitle) {
  const modal = document.getElementById('facultyResolveModal');
  if (!modal) return;

  document.getElementById('resolveRequestId').value = requestId;
  document.getElementById('resolveModalDesc').textContent = `Evaluating submission from Team ${teamName}: "${milestoneTitle}"`;
  modal.classList.add('open');
};

export function initFacultyModal() {
  const modal = document.getElementById('facultyResolveModal');
  const closeBtn = document.getElementById('closeFacultyResolveModal');
  const form = document.getElementById('facultyResolveForm');

  if (!modal) return;

  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const requestId = Number(document.getElementById('resolveRequestId').value);
      const notes = document.getElementById('resolveNotes').value;

      try {
        const res = await fetch('/api/mentorship-requests/resolve', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, mentorNotes: notes })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            modal.classList.remove('open');
            form.reset();
            if (window.showToast) window.showToast(data.message);
            loadFacultyPortal(activeFacultyId);
            return;
          }
        }
        throw new Error('Offline resolve');
      } catch (err) {
        modal.classList.remove('open');
        form.reset();
        const req = FALLBACK_FACULTY_DATA.incomingRequests.find(r => r.request_id === requestId);
        if (req) {
          req.status = 'COMPLETED';
          req.mentor_notes = notes;
        }
        if (window.showToast) window.showToast('Mentor evaluation recorded successfully!');
        loadFacultyPortal(activeFacultyId);
      }
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
