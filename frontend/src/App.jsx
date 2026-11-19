import { Routes, Route, Navigate } from 'react-router-dom';
import { getUser } from './api';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FindMentorPage from './pages/FindMentorPage';
import MentorsPage from './pages/MentorsPage';
import MyTeamsPage from './pages/MyTeamsPage';

// Shows the page only if someone is logged in.
// If "role" is given, only that role may open the page.
function Protected({ role, children }) {
  const user = getUser();
  if (!user) return <Navigate to="/" />;
  if (role && user.role !== role) return <Navigate to="/dashboard" />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />

      <Route path="/find-mentor" element={<Protected role="coordinator"><FindMentorPage /></Protected>} />
      <Route path="/mentors" element={<Protected role="coordinator"><MentorsPage /></Protected>} />

      <Route path="/my-teams" element={<Protected role="faculty"><MyTeamsPage /></Protected>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}