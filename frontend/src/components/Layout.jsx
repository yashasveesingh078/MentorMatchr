import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, logout } from '../api';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

// The frame around every logged-in page: sidebar + top bar + page content
export default function Layout({ children }) {
  const user = getUser();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false); // sidebar on small screens

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="app">
      <Sidebar user={user} open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={handleLogout} />
      <div className={'overlay' + (menuOpen ? ' show' : '')} onClick={() => setMenuOpen(false)} />

      <div className="main">
        <Topbar user={user} onMenuClick={() => setMenuOpen(true)} onLogout={handleLogout} />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}