import { App } from '../state/store.js';
import { getUsers, getSession, saveSession, clearSession } from '../api/index.js';

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

export function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const found = getUsers().find(x => x.username === u && x.pw === p);
  if (!found) { document.getElementById('loginErr').textContent = '❌ Wrong username or password.'; return; }
  App.user = found;
  saveSession(found);
  // showApp is called from main.js — imported lazily to avoid circular refs
  window._showApp();
}

export function logout() {
  App.user = null;
  clearSession();
  document.getElementById('appContainer').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  ['loginUser', 'loginPass'].forEach(id => (document.getElementById(id).value = ''));
  document.getElementById('loginErr').textContent = '';
}

export function showApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');
  const u = App.user;
  document.getElementById('sbAvatar').textContent = u.av;
  document.getElementById('sbName').textContent = u.name;
  document.getElementById('sbRole').textContent = roleLabel(u.role);
  // renderNav, updateNotifDot, navigate resolved via window to avoid circular import
  window._renderNav();
  window._updateNotifDot();
  window.navigate(defaultSection(u.role));
}

export function checkSession() {
  const sv = getSession();
  if (sv) { App.user = sv; window._showApp(); }
}
