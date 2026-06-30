// Authentication helpers — login, logout, token persistence.
export function getToken() {
  return localStorage.getItem('token');
}

export function saveToken(token) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

export function isAuthenticated() {
  return Boolean(getToken());
}
