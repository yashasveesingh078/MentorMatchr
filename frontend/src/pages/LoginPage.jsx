import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Handshake, Mail, Lock, Eye, EyeOff, CircleAlert, LoaderCircle,
  ClipboardList, GraduationCap, UsersRound,
} from 'lucide-react';
import { api, saveLogin, getUser } from '../api';

// Where each role goes after logging in
// const homePage = { coordinator: '/find-mentor', faculty: '/my-teams' };

export default function LoginPage() {
  const [role, setRole] = useState('coordinator');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Already logged in? Go straight to the home page
  const user = getUser();
  if (user) return <Navigate to="/dashboard" />;

  // Simple checks before calling the backend
  function validate() {
    if (!email.trim()) return 'Please enter your email';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Please enter a valid email address';
    if (!password) return 'Please enter your password';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await api('/auth/login', 'POST', { email: email.trim(), password, role });
      saveLogin(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Cannot reach the server. Is the backend running?' : err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      {/* Left side: branding */}
      <section className="auth-brand">
        <div className="auth-logo">
          <span className="brand-mark">
            <Handshake size={18} />
          </span>
          MentorMatchr
        </div>

        <div className="auth-intro">
          <h1>Right mentor for every hackathon team.</h1>
          <p>
            Coordinators match teams with faculty mentors by domain and skills.
            Faculty see the teams they guide and how to reach them.
          </p>
        </div>

        {/* Small picture: coordinator links a team with a mentor */}
        <div className="auth-visual">
          <div className="visual-node">
            <UsersRound size={20} />
            <span>Team</span>
          </div>
          <div className="visual-line" />
          <div className="visual-node visual-center">
            <ClipboardList size={20} />
            <span>Coordinator</span>
          </div>
          <div className="visual-line" />
          <div className="visual-node">
            <GraduationCap size={20} />
            <span>Mentor</span>
          </div>
        </div>
      </section>

      {/* Right side: login form */}
      <section className="auth-form-side">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <h2>Welcome back</h2>
          <p className="muted">Sign in to continue</p>

          <label>Login as</label>
          <div className="segmented">
            <button
              type="button"
              className={role === 'coordinator' ? 'selected' : ''}
              onClick={() => setRole('coordinator')}
            >
              Coordinator
            </button>
            <button
              type="button"
              className={role === 'faculty' ? 'selected' : ''}
              onClick={() => setRole('faculty')}
            >
              Faculty
            </button>
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <div className="input-icon">
              <Mail size={16} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@college.edu"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="input-icon">
              <Lock size={16} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn-ghost password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <CircleAlert size={16} />
              {error}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading && <LoaderCircle size={16} className="spinner" />}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </div>
  );
}