import { App } from '../state/store.js';
import * as api from '../api/index.js';

export let _portalMode = false;

export function roleLabel(r) {
  return { admin:'Administrator', sales:'Sales Representative', mixer:'Color Technician', delivery:'Delivery Agent', client:'Client Account' }[r] || r;
}

export function defaultSection(role) {
  if (role === 'admin') return 'dashboard';
  if (role === 'sales') return 'requests';
  if (role === 'client') return 'clientportal';
  return 'mywork';
}

export function togglePortal() {
  _portalMode = !_portalMode;
  if (_portalMode) {
    document.getElementById('loginPanelTitle').textContent = 'Client Portal';
    document.getElementById('loginPanelSub').textContent = 'Sign in to place and track your orders';
    document.getElementById('loginBtn').textContent = 'Access My Portal →';
    document.getElementById('loginBtn').className = 'lf-btn lf-btn-client';
    document.getElementById('loginHints').innerHTML = `
      <div class="login-hints-title">Client Accounts</div>
      <div class="hint-row">👤 Hassan El-Sayed <span>hassan / client123</span></div>
      <div class="hint-row">👤 Layla Mostafa <span>layla / client123</span></div>
      <div class="hint-row">👤 Khaled Nour <span>khaled / client123</span></div>`;
    document.getElementById('portalToggle').innerHTML = 'Staff? <a onclick="togglePortal()">← Back to Staff Login</a>';
  } else {
    document.getElementById('loginPanelTitle').textContent = 'Welcome Back';
    document.getElementById('loginPanelSub').textContent = 'Sign in to your workspace';
    document.getElementById('loginBtn').textContent = 'Sign In →';
    document.getElementById('loginBtn').className = 'lf-btn';
    document.getElementById('loginHints').innerHTML = `
      <div class="login-hints-title">Staff Accounts</div>
      <div class="hint-row">⬛ Admin <span>admin / admin123</span></div>
      <div class="hint-row">🟤 Sales <span>sales1 / sales123</span></div>
      <div class="hint-row">🟡 Mixer <span>mixer1 / mix123</span></div>
      <div class="hint-row">🟢 Delivery <span>delivery1 / del123</span></div>`;
    document.getElementById('portalToggle').innerHTML = 'Client? <a onclick="togglePortal()">Access Client Portal →</a>';
  }
}

export async function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  document.getElementById('loginErr').textContent = '';
  try {
    const user = await api.login(u, p);
    App.user = { ...user, av: user.avatarInitials };
    window._showApp();
  } catch (err) {
    document.getElementById('loginErr').textContent = '❌ ' + (err.message || 'Wrong username or password.');
  }
}

export function logout() {
  App.user = null;
  api.clearToken();
  document.getElementById('appContainer').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  ['loginUser', 'loginPass'].forEach(id => (document.getElementById(id).value = ''));
  document.getElementById('loginErr').textContent = '';
}

export async function showApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');
  const u = App.user;
  document.getElementById('sbAvatar').textContent = u.av;
  document.getElementById('sbName').textContent = u.name;
  document.getElementById('sbRole').textContent = roleLabel(u.role);
  // Await nav so nav-items exist before navigate() tries to mark one active
  await window._renderNav();
  window._updateNotifDot();
  window.navigate(defaultSection(u.role));
}

export async function checkSession() {
  const tok = api.getToken();
  if (!tok) return;
  try {
    const user = await api.getMe();
    App.user = { ...user, av: user.avatarInitials };
    window._showApp();
  } catch {
    api.clearToken();
  }
}

// Any 401 from the API layer clears state and surfaces the login screen
window.addEventListener('session-expired', () => {
  App.user = null;
  const app   = document.getElementById('appContainer');
  const login = document.getElementById('loginScreen');
  const err   = document.getElementById('loginErr');
  if (app)   app.classList.add('hidden');
  if (login) login.classList.remove('hidden');
  if (err)   err.textContent = '❌ Session expired — please sign in again.';
});
