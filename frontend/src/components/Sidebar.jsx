import { NavLink } from 'react-router-dom';
import { Handshake, LayoutDashboard, Search, Users, UsersRound, LogOut } from 'lucide-react';

// Links shown for each role. Only pages that really exist are listed.
const links = {
  coordinator: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/find-mentor', label: 'Find Mentor', icon: Search },
    { to: '/mentors', label: 'Mentors', icon: Users },
  ],
  faculty: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/my-teams', label: 'My Teams', icon: UsersRound },
  ],
};

export default function Sidebar({ user, open, onClose, onLogout }) {
  return (
    <aside className={'sidebar' + (open ? ' open' : '')}>
      <div className="sidebar-brand">
        <span className="brand-mark">
          <Handshake size={18} />
        </span>
        MentorMatchr
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-label">Menu</div>
        {links[user.role].map((link) => {
          const Icon = link.icon;
          return (
            <NavLink key={link.to} to={link.to} className="sidebar-link" onClick={onClose}>
              <Icon size={18} />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-link" onClick={onLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}