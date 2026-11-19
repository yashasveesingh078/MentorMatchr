# MentorMatchr

MentorMatchr is a web application that helps hackathon coordinators assign faculty mentors to student teams. Instead of choosing mentors by hand, the coordinator enters a team, a domain and a few technical keywords, and MentorMatchr ranks the available faculty by how well their domain and skills match. Each mentor can guide at most **3 teams** at a time.

There are two kinds of users:

| Role | What they can do |
|---|---|
| **Coordinator** | Search and rank mentors for a team, assign a mentor, see every mentor with their skills, capacity and assigned teams, view a dashboard of totals |
| **Faculty** | See only the teams assigned to them, with the problem statement, hackathon details and contact email |

> Matching is **rule-based** (points for domain and keyword matches). It does not use AI or machine learning.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, plain CSS, Lucide icons |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL (accessed with the `pg` library) |
| Authentication | bcrypt password hashes (`bcryptjs`) + JSON Web Tokens (`jsonwebtoken`) |

---

## Repositories

The project is split into two repositories:

| Repository | Contents |
|---|---|
| **MentorMatchr** (this repo) | `frontend/` (React app) and `backend/` (Express API) |
| **MentorMatchr_AP_2026** | `dbms/`: normalisation notes, ER diagram, schema, sample queries, query plans and seed data |

```
MentorMatchr_AP_2026/dbms/
├── 01_normalization.md      BCNF normalisation of the design
├── 02_er_diagram.mmd/.png   ER diagram
├── 03_schema.sql            15 tables, constraints, indexes, triggers
├── 04_queries.sql           sample SELECT / JOIN / aggregate queries
├── 05_query_timings.md      EXPLAIN ANALYZE plan analysis
├── 06_login_columns.sql     adds password_hash to coordinator and faculty
├── 07_seed_data.sql         made-up demo data
└── plans/                   EXPLAIN ANALYZE scripts and results
```

---

## Project structure (this repo)

```
MentorMatchr/
├── backend/
│   ├── src/
│   │   ├── server.js                  loads .env, checks DB, starts the server
│   │   ├── app.js                     Express app: middleware + routes
│   │   ├── config/db.js               PostgreSQL connection pool
│   │   ├── middleware/auth.js         verifyToken + allowRole
│   │   ├── routes/                    URL -> controller mapping
│   │   │   ├── authRoutes.js
│   │   │   ├── coordinatorRoutes.js
│   │   │   └── facultyRoutes.js
│   │   └── controllers/               the actual logic and SQL
│   │       ├── authController.js
│   │       ├── coordinatorController.js
│   │       └── facultyController.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── main.jsx                   starts React with the router
    │   ├── App.jsx                    page routes + role protection
    │   ├── api.js                     fetch helper, adds the JWT token
    │   ├── utils.js                   small shared helpers
    │   ├── index.css                  all styles (colour variables at the top)
    │   ├── components/                Layout, Sidebar, Topbar, StatCard,
    │   │                              CapacityBar, ConfirmDialog, Toast, ...
    │   └── pages/
    │       ├── LoginPage.jsx
    │       ├── DashboardPage.jsx      different view for each role
    │       ├── FindMentorPage.jsx     coordinator
    │       ├── MentorsPage.jsx        coordinator
    │       └── MyTeamsPage.jsx        faculty
    ├── .env
    └── package.json
```

---

## How it works

### Request flow

```
React page  ->  api.js (fetch + "Authorization: Bearer <token>")
            ->  Express route  ->  verifyToken  ->  allowRole
            ->  controller  ->  pool.query(sql, [values])  ->  PostgreSQL
            ->  JSON response  ->  React updates the page
```

### Login

1. The user picks **Coordinator** or **Faculty**, then enters an email and password.
2. `POST /api/auth/login` looks up the email in the `coordinator` or `faculty` table. There is no shared users table.
3. `bcrypt.compare` checks the password against the stored `password_hash`. Plain passwords are never stored.
4. If it matches, the server creates a JWT containing `{ id, role, name }`, valid for 8 hours.
5. The frontend saves the token in `localStorage` and sends it with every request.
6. `verifyToken` checks the token's signature, and `allowRole` blocks the wrong role with `403`.

### Mentor matching (`POST /api/coordinator/search`)

For every **available** faculty member, the backend counts:

- **Domain match:** does the faculty member have the typed domain (`faculty_domain`)?
- **Keyword matches:** how many of the typed keywords are in their skills (`faculty_keyword`)?
- **Active teams:** how many `ACTIVE` rows they have in `mentor_assignment`.

```
score = (40 if domain matches + 10 × matching keywords) / (40 + 10 × keywords typed) × 100
```

Mentors are sorted by score, highest first. Mentors with 3 active teams are shown greyed out as **Full** and cannot be chosen.

### Assigning a mentor (`POST /api/coordinator/assign`)

The assignment runs inside a **transaction** (`BEGIN ... COMMIT`, or `ROLLBACK` on any error):

1. Lock the faculty row with `SELECT ... FOR UPDATE`, so two coordinators can't over-fill the same mentor at the same moment.
2. Check that the mentor is available and has fewer than 3 active teams.
3. Check that the team exists and has selected a problem statement.
4. Check that this mentor was never assigned to this team before (`UNIQUE (team_id, faculty_id)`).
5. Mark the team's current mentor, if any, as `REPLACED`.
6. Insert the new `ACTIVE` assignment with the match score and the coordinator's id.

---

## API endpoints

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/health` | none | Server check |
| POST | `/api/auth/login` | none | Login, returns JWT and user info |
| POST | `/api/coordinator/search` | coordinator | Ranked mentors for a team, domain and keywords |
| POST | `/api/coordinator/assign` | coordinator | Assign a mentor to a team (transaction) |
| GET | `/api/coordinator/mentors` | coordinator | All mentors with skills, capacity and active teams |
| GET | `/api/faculty/my-teams` | faculty | Active teams of the logged-in faculty member |

---

## Database

The PostgreSQL schema (`03_schema.sql`) has 15 tables in BCNF, including:

`department`, `faculty`, `domain`, `keyword`, `expertise_area`, `faculty_domain`, `faculty_keyword`, `faculty_expertise`, `hackathon`, `coordinator`, `problem_statement`, `problem_keyword`, `team`, `team_problem_selection`, `mentor_assignment`

Rules enforced by the database:

- At most **one ACTIVE mentor per team** (partial unique index `uq_team_one_active_mentor`).
- The same faculty member is never recorded twice for the same team (`uq_assignment_team_faculty`).
- One primary domain per faculty member.
- A team can only select a problem from its own hackathon (trigger).
- Assignment status is one of `ACTIVE`, `REPLACED`, `WITHDRAWN`.

Rules enforced by the backend (they can't be expressed as simple constraints):

- A mentor can have at most 3 active teams.
- A mentor must be available.
- A team must have selected a problem before getting a mentor.

---

## Running the project

### Requirements
- Node.js 20+
- PostgreSQL 15+ (for example Postgres.app on macOS)

### 1. Database (from the `MentorMatchr_AP_2026` repo)
```bash
psql -d postgres -c "CREATE DATABASE mentormatchr;"
psql -d mentormatchr -f dbms/03_schema.sql
psql -d mentormatchr -f dbms/06_login_columns.sql
psql -d mentormatchr -f dbms/07_seed_data.sql
```
Run `07_seed_data.sql` again at any time to reset the demo data.

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env      # then fill in DB_USER and JWT_SECRET
npm run dev               # http://localhost:4000
```

### 3. Frontend (in a second terminal)
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```
`frontend/.env` must contain `VITE_API_URL=http://localhost:4000/api`.

### Demo accounts
Demo logins are created by `07_seed_data.sql`. The emails and passwords are listed in the comments at the top of that file. All data in the seed file is made up.

---

## Security

- Passwords are stored only as **bcrypt hashes**.
- Every SQL query uses **parameters** (`$1`, `$2`), which prevents SQL injection.
- Roles are checked **on the server** (`allowRole`), not only by hiding pages in the frontend.
- Faculty data is filtered by the id inside the signed token, so a user can't request another person's teams.
- `.env` files (database user, JWT secret) are listed in `.gitignore`.

---

## Future implementations

**Matching**
- Fill in the domain and keywords automatically from the team's selected problem (`problem_statement.domain_id` and `problem_keyword`) instead of typing them.
- Use each faculty member's own `max_teams` value instead of the fixed limit of 3.
- Give extra weight to years of experience from `faculty_expertise`.
- Fair workload: rank mentors with fewer teams higher when scores are equal (partly done already).
- Suggest a team or domain while typing (autocomplete) instead of typing names exactly.

**Coordinator features**
- Dashboard cards for **teams still waiting for a mentor** and **recent assignments** (needs a new `GET /api/coordinator/dashboard` endpoint).
- Show the full assignment history of a team (`ACTIVE`, `REPLACED`, `WITHDRAWN`).
- Mark an assignment as `WITHDRAWN` from the UI.
- Allow bringing back a previously replaced mentor by reactivating the old row.
- Add, edit and remove faculty, teams, problem statements and hackathons from the UI.
- Export assignments as CSV or PDF.
- Show faculty expertise areas (`faculty_expertise`) on the Mentors page.

**Faculty features**
- A profile page (`GET /api/auth/me`) where faculty can update phone, availability and skills.
- Accept or decline an assignment.
- Mentoring time slots that teams can book.

**Notifications**
- Email the mentor and the team when an assignment is made or changed.

**Security and accounts**
- Change and reset password.
- Limit repeated login attempts (rate limiting).
- Store the token in an `httpOnly` cookie instead of `localStorage`.
- Log every assignment change with who made it (audit log).

**Engineering**
- Input validation with a library (e.g. `express-validator` or `zod`).
- Automated tests for the API (e.g. Jest + Supertest) and for the matching score.
- Pagination and server-side search when there are many faculty members.
- Docker setup and deployment (e.g. Render or Railway for the API, Vercel for the frontend, a hosted PostgreSQL database).
- Bring the backend into the same database migration flow (versioned migrations instead of separate SQL files).

---