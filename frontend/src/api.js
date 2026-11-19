// Small helper to call the backend. Adds the login token to every request.
const API_URL = import.meta.env.VITE_API_URL;

export function getUser() {
  const saved = localStorage.getItem('user');
  return saved ? JSON.parse(saved) : null;
}

export function saveLogin(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// method = 'GET' or 'POST', body = object to send (for POST)
export async function api(path, method = 'GET', body) {
  const token = localStorage.getItem('token');

  const response = await fetch(API_URL + path, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? 'Bearer ' + token : '',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  // Token expired or missing: log out and go back to login
  if (response.status === 401 && path !== '/auth/login') {
    logout();
    window.location.href = '/';
  }

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}