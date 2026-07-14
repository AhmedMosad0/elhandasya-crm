import { App } from '../state/store.js';
import * as api from '../api/index.js';
import { t } from '../i18n/index.js';

export let _portalMode = true; // client portal is the default
let _signupRole = 'client';

export function roleLabel(r) {
  return { admin:'Administrator', sales:'Sales Representative', mixer:'Color Technician', delivery:'Delivery Agent', client:'Client Account' }[r] || r;
}

export function defaultSection(role) {
  if (role === 'admin') return 'dashboard';
  if (role === 'sales') return 'requests';
  if (role === 'client') return 'clientportal';
  return 'dashboard';
}

export function togglePortal() {
  _portalMode = !_portalMode;
  if (_portalMode) {
    document.getElementById('loginPanelTitle').textContent = t('auth.clientPortal');
    document.getElementById('loginPanelSub').textContent   = t('auth.clientPortalSub');
    document.getElementById('loginBtn').textContent = t('auth.accessPortal');
    document.getElementById('loginBtn').className   = 'lf-btn lf-btn-client';
    document.getElementById('loginHints').innerHTML = `
      <div class="login-hints-title">${t('auth.clientAccounts')}</div>
      <div class="hint-row">👤 Hassan El-Sayed <span>hassan / client123</span></div>
      <div class="hint-row">👤 Layla Mostafa <span>layla / client123</span></div>
      <div class="hint-row">👤 Khaled Nour <span>khaled / client123</span></div>`;
    document.getElementById('portalToggle').innerHTML = `${t('auth.portalToggle')} <a onclick="togglePortal()">${t('auth.staffLink')}</a>`;
  } else {
    document.getElementById('loginPanelTitle').textContent = t('auth.staffLogin');
    document.getElementById('loginPanelSub').textContent   = t('auth.staffLoginSub');
    document.getElementById('loginBtn').textContent = t('auth.signIn');
    document.getElementById('loginBtn').className   = 'lf-btn';
    document.getElementById('loginHints').innerHTML = `
      <div class="login-hints-title">${t('auth.staffAccounts')}</div>
      <div class="hint-row">⬛ Admin <span>admin / admin123</span></div>
      <div class="hint-row">🟤 Sales <span>sales1 / sales123</span></div>`;
    document.getElementById('portalToggle').innerHTML = `← <a onclick="togglePortal()">${t('auth.backLink')}</a>`;
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
    let msg;
    if (err.status === 403) {
      msg = err.message?.includes('pending') ? t('auth.pendingApproval') : t('auth.rejected');
    } else {
      msg = t('auth.wrongCredentials');
    }
    document.getElementById('loginErr').textContent = '❌ ' + msg;
  }
}

export function logout() {
  App.user = null;
  api.clearToken();
  document.getElementById('appContainer').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  ['loginUser', 'loginPass'].forEach(id => (document.getElementById(id).value = ''));
  document.getElementById('loginErr').textContent = '';
  _resetToLogin();
}

export function showSignup(role) {
  _signupRole = role || 'client';
  document.getElementById('loginForm').classList.add('hidden');
  const sf = document.getElementById('signupForm');
  sf.classList.remove('hidden');
  sf.innerHTML = `
    <div class="login-h">${t('signup.title')}</div>
    <div class="lf-group">
      <label class="lf-label">${t('signup.fullName')}</label>
      <input class="lf-input" id="signupName" type="text" placeholder="${t('auth.namePlaceholder')}">
    </div>
    <div class="lf-group">
      <label class="lf-label">${t('signup.username')}</label>
      <input class="lf-input" id="signupUsername" type="text" placeholder="${t('auth.usernameSPlaceholder')}">
    </div>
    <div class="lf-group">
      <label class="lf-label">${t('signup.password')}</label>
      <input class="lf-input" id="signupPassword" type="password" placeholder="${t('auth.passwordPlaceholder')}">
    </div>
    <div class="lf-group">
      <label class="lf-label">${t('signup.phone')}</label>
      <input class="lf-input" id="signupPhone" type="text" placeholder="${t('auth.phonePlaceholder')}">
    </div>
    <div class="lf-group">
      <label class="lf-label">${t('signup.role')}</label>
      <div class="signup-role-toggle">
        <button id="signupRoleBtn_client" class="role-btn" onclick="selectSignupRole('client')">${t('signup.roleClient')}</button>
        <button id="signupRoleBtn_sales"  class="role-btn" onclick="selectSignupRole('sales')">${t('signup.roleSales')}</button>
      </div>
    </div>
    <div id="signupClientFields" class="hidden">
      <div class="lf-group">
        <label class="lf-label">${t('signup.email')}</label>
        <input class="lf-input" id="signupEmail" type="email" placeholder="${t('auth.emailPlaceholder')}">
      </div>
      <div class="lf-group">
        <label class="lf-label">${t('signup.address')}</label>
        <input class="lf-input" id="signupAddress" type="text" placeholder="${t('auth.addressPlaceholder')}">
      </div>
      <div class="lf-group">
        <label class="lf-label">${t('signup.company')}</label>
        <input class="lf-input" id="signupCompany" type="text" placeholder="${t('auth.companyPlaceholder')}">
      </div>
      <div class="lf-group">
        <label class="lf-label">${t('signup.linkPhone')}</label>
        <input class="lf-input" id="signupPhoneMatch" type="text" placeholder="${t('auth.phonePlaceholder')}">
        <div class="lf-hint">${t('signup.linkPhoneHint')}</div>
      </div>
    </div>
    <button class="lf-btn" onclick="doSignup()">${t('signup.submit')}</button>
    <div class="lf-err" id="signupErr"></div>
    <div class="lf-success hidden" id="signupSuccess"></div>
    <div class="login-portal-toggle" style="margin-top:14px">
      <a onclick="showLogin()" style="cursor:pointer">${t('signup.backToLogin')}</a>
    </div>`;
  selectSignupRole(_signupRole);
}

export function showLogin() {
  document.getElementById('signupForm').classList.add('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('loginErr').textContent = '';
}

export function selectSignupRole(role) {
  _signupRole = role;
  ['client', 'sales'].forEach(r => {
    const btn = document.getElementById('signupRoleBtn_' + r);
    if (btn) btn.classList.toggle('active', r === role);
  });
  const clientFields = document.getElementById('signupClientFields');
  if (clientFields) clientFields.classList.toggle('hidden', role !== 'client');
}

export async function doSignup() {
  const name     = document.getElementById('signupName').value.trim();
  const username = document.getElementById('signupUsername').value.trim();
  const password = document.getElementById('signupPassword').value;
  const phone    = document.getElementById('signupPhone').value.trim();
  const role     = _signupRole;
  const errEl    = document.getElementById('signupErr');
  const successEl = document.getElementById('signupSuccess');
  errEl.textContent = '';
  successEl.classList.add('hidden');

  if (!name || !username || !password || !phone) {
    errEl.textContent = '❌ ' + t('auth.fillRequired');
    return;
  }

  const data = { name, username, password, phone, role };
  if (role === 'client') {
    const email      = document.getElementById('signupEmail').value.trim();
    const address    = document.getElementById('signupAddress').value.trim();
    const company    = document.getElementById('signupCompany').value.trim();
    const phoneMatch = document.getElementById('signupPhoneMatch').value.trim();
    if (email)      data.email      = email;
    if (address)    data.address    = address;
    if (company)    data.company    = company;
    if (phoneMatch) data.phoneForMatch = phoneMatch;
  }

  try {
    const result = await api.signup(data);
    if (result.token) {
      api.setToken(result.token);
      App.user = { ...result.user, av: result.user.avatarInitials };
      window._showApp();
    } else {
      successEl.textContent = '✓ ' + t('signup.pendingMessage');
      successEl.classList.remove('hidden');
      ['signupName', 'signupUsername', 'signupPassword', 'signupPhone',
       'signupEmail', 'signupAddress', 'signupCompany', 'signupPhoneMatch']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    }
  } catch (err) {
    let msg = err.message || t('common.failed');
    if (msg?.includes('Username already taken') || msg?.includes('already taken')) {
      msg = t('auth.usernameTaken');
    }
    errEl.textContent = '❌ ' + msg;
  }
}

function _resetToLogin() {
  const sf = document.getElementById('signupForm');
  const lf = document.getElementById('loginForm');
  if (sf) sf.classList.add('hidden');
  if (lf) lf.classList.remove('hidden');
}

export async function showApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');
  const u = App.user;
  document.getElementById('sbAvatar').textContent = u.av;
  document.getElementById('sbName').textContent   = u.name;
  document.getElementById('sbRole').textContent   = roleLabel(u.role);
  await window._renderNav();
  window._updateNotifDot();
  window.navigate(defaultSection(u.role));
}

export function refreshLoginForm() {
  const ls = document.getElementById('loginScreen');
  if (!ls || ls.classList.contains('hidden')) return;

  // If signup form is currently visible, re-render it (preserving input values)
  const sf = document.getElementById('signupForm');
  if (sf && !sf.classList.contains('hidden')) {
    const saved = {};
    ['signupName','signupUsername','signupPassword','signupPhone',
     'signupEmail','signupAddress','signupCompany','signupPhoneMatch']
      .forEach(id => { const el = document.getElementById(id); if (el) saved[id] = el.value; });
    showSignup(_signupRole);
    Object.entries(saved).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val; });
    return;
  }

  // Username / password labels + placeholders
  const ul = document.getElementById('loginUserLabel');
  const pl = document.getElementById('loginPassLabel');
  const ui = document.getElementById('loginUser');
  const pi = document.getElementById('loginPass');
  if (ul) ul.textContent = t('auth.username');
  if (pl) pl.textContent = t('auth.password');
  if (ui) ui.placeholder = t('auth.usernamePlaceholder');
  if (pi) pi.placeholder = t('auth.passwordPlaceholder');

  // Portal mode titles / button / toggle link
  const panelTitle = document.getElementById('loginPanelTitle');
  const panelSub   = document.getElementById('loginPanelSub');
  const loginBtn   = document.getElementById('loginBtn');
  const portalTog  = document.getElementById('portalToggle');
  if (_portalMode) {
    if (panelTitle) panelTitle.textContent = t('auth.clientPortal');
    if (panelSub)   panelSub.textContent   = t('auth.clientPortalSub');
    if (loginBtn)   loginBtn.textContent   = t('auth.accessPortal');
    if (portalTog)  portalTog.innerHTML    = `${t('auth.portalToggle')} <a onclick="togglePortal()">${t('auth.staffLink')}</a>`;
  } else {
    if (panelTitle) panelTitle.textContent = t('auth.staffLogin');
    if (panelSub)   panelSub.textContent   = t('auth.staffLoginSub');
    if (loginBtn)   loginBtn.textContent   = t('auth.signIn');
    if (portalTog)  portalTog.innerHTML    = `← <a onclick="togglePortal()">${t('auth.backLink')}</a>`;
  }

  // Signup links
  const signupLinks = document.querySelector('.login-signup-links');
  if (signupLinks) {
    signupLinks.innerHTML = `
      <div>${t('auth.newClient')} <a onclick="showSignup('client')">${t('auth.createAccountLink')}</a></div>
      <div>${t('auth.staffMember')} <a onclick="showSignup('sales')">${t('auth.requestAccessLink')}</a></div>`;
  }
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
  if (err)   err.textContent = '❌ ' + t('auth.sessionExpired');
  _resetToLogin();
});
