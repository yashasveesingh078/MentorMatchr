# MentorMatchr – Hackathon Mentor Allocation Portal (Frontend)

MentorMatchr is a web-based platform designed to streamline the process of assigning faculty mentors to student teams during college hackathons through an intelligent, explainable domain and keyword matching engine.

---

## 🏛️ Architecture & Role-Isolated Features

The application provides dedicated, fully isolated interfaces tailored specifically for each hackathon participant persona:

### 1. 🎓 Student Team Workspace (`#/student`)
- **Selected Challenge Dossier:** View assigned problem statement (`PS-04`), primary domain, difficulty rating, and required technical tags.
- **Assigned Faculty Mentor Card:** Displays assigned mentor profile (e.g., Dr. Arun Sharma, CSE), algorithm compatibility score (86.7%), domain overlap badge, and contact extension.
- **Milestone Guidance & Review Sessions:** Log architecture check-ins and receive evaluation notes/remarks directly from your assigned faculty mentor.
- **Progress Stepper:** Track hackathon milestone completion from problem lock to final evaluation pitch.

### 2. 👨‍🏫 Faculty Mentor Dashboard (`#/faculty`)
- **Workload Capacity Banner:** Real-time active team tracking (e.g., 1 of 2 teams active, 1 free).
- **Live Availability Toggle:** One-click toggle between `Available` and `Busy / Paused` status.
- **Allocated Hackathon Teams:** Inspect assigned teams, members, and algorithm compatibility breakdown.
- **Student Review Ticket Queue:** Evaluate incoming student milestone submissions and record mentor remarks.
- **Expertise & Taxonomy Breakdown:** View verified primary domains, expertise areas, and technical keywords.

### 3. 🎯 Coordinator Allocation Hub (`#/coordinator`)
- **Interactive Matching Matrix:** Search mentors by technical keywords (`#PyTorch`, `#Transformers`, `#Solidity`), filter by domain, expertise, and minimum experience.
- **Ranked Recommendations:** Top faculty recommendations ranked by explainable score (60% Primary Domain Match + 40% Tag Overlap).
- **Registered Teams Table:** Overview of all registered teams with single-active mentor enforcement and reassignment controls.
- **Allocation Audit Trail:** Real-time historical log of all mentor assignments and updates.

### 4. 🔐 Dedicated Login & Navigation
- **Login-First Workflow:** Unauthenticated users land directly on the role-selection sign-in screen.
- **1-Click Test Logins:** Instant demo buttons for Student (`CareSync AI`), Faculty (`Dr. Arun Sharma`), and Coordinator (`Priya Nair`).
- **Clean Royal Navbar:** Free of on-page anchor clutter; features clean branding, active portal status pill, and user profile badge.
- **In-Page Segmented Tab Navigation:** Luxury pill switchers inside each portal for seamless module switching with buttery micro-fade animations.

---

## 🎨 Visual Identity & Styling
- **Palette:** Warm Ivory/Linen (`#FAF8F5`), Obsidian (`#171615`), Sage Green Accents (`#E6ECE5`, `#344837`), Muted Amber (`#FFF3DC`).
- **Typography:** Inter Sans paired with Newsreader Serif Italic for an editorial, sophisticated look.
- **Micro-Animations:** Fluid tab transitions, hover lifts, pulse glows, and zero layout shift.

---

## 🚀 Quick Start (Zero Dependencies)

The frontend is built using standard ES Modules and vanilla modern CSS. It runs out of the box with zero external npm dependencies.

### Option 1: VS Code Live Server
Right-click `index.html` and select **"Open with Live Server"**.

### Option 2: Command Line (Any static HTTP server)
```bash
# Using npx serve
npx serve .

# Or using Python 3
python3 -m http.server 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Repository Structure
```
MentorMatchr/
├── index.html          # Main HTML document & view templates
├── css/
│   └── style.css       # Complete Warm Linen/Obsidian/Sage design system
├── js/
│   ├── app.js          # Main application coordinator & modal manager
│   ├── auth.js         # Authentication state, session handling & clean navbar
│   ├── router.js       # Client-side hash router with strict role guards
│   ├── student.js      # Student Team portal controller & tabs
│   ├── faculty.js      # Faculty Mentor dashboard & review evaluator
│   ├── filter.js       # Keyword & domain filter matrix
│   └── simulator.js    # Live match simulator for landing view
└── README.md
```
