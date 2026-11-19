import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { initials } from '../utils';
import { Menu, ChevronDown, LogOut } from 'lucide-react';

// Page names shown in the top bar
const titles = {
  '/dashboard': 'Dashboard',
  '/find-mentor': 'Find Mentor',
  '/mentors': 'Mentors',
  '/my-teams': 'My Teams',
};



export default function Topbar({ user, onMenuClick, onLogout }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const location = useLocation();

  // Close the dropdown when the user clicks anywhere outside it
  useEffect(() => {
    function handleClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="topbar">
      <button className="btn-ghost menu-button" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="topbar-title">
        MentorMatchr / <strong>{titles[location.pathname] || ''}</strong>
      </div>

      <div className="profile" ref={boxRef}>
        <button className="profile-button" onClick={() => setOpen(!open)}>
          <span className="avatar">{initials(user.name)}</span>
          <span className="profile-name">
            {user.name}
            <small>{user.role}</small>
          </span>
          <ChevronDown size={16} />
        </button>

        {open && (
          <div className="dropdown">
            <div className="dropdown-header">
              <span className="avatar avatar-lg">{initials(user.name)}</span>
              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
                <span className="badge badge-blue" style={{ marginTop: 4, textTransform: 'capitalize' }}>
                  {user.role}
                </span>
              </div>
            </div>
            <button className="dropdown-item" onClick={onLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}