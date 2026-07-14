import { App } from '../../state/store.js';
import * as api from '../../api/index.js';
import { t } from '../../i18n/index.js';

const NAV = {
  admin:    [
    { icon:'◈', key:'dashboard' },
    { icon:'◌', key:'requests', badge:true },
    { icon:'▣', key:'orders' },
    { icon:'◉', key:'clients' },
    { icon:'◫', key:'products' },
    { icon:'◎', key:'users', usersBadge:true },
    { icon:'▦', key:'reports' },
  ],
  sales:    [{ icon:'◌', key:'requests' }, { icon:'◉', key:'clients' }],
  mixer:    [],
  delivery: [],
  client:   [
    { icon:'◈', key:'clientportal' },
    { icon:'▣', key:'clientorders' },
    { icon:'◌', key:'clientneworder' },
    { icon:'◉', key:'clientaccount' },
  ],
};

const NAV_LABEL = {
  dashboard: 'nav.dashboard', requests: 'nav.requests', orders: 'nav.orders',
  clients: 'nav.clients', products: 'nav.products', users: 'nav.users',
  reports: 'nav.reports', clientportal: 'nav.myOverview', clientorders: 'nav.myOrders',
  clientneworder: 'nav.placeOrder', clientaccount: 'nav.myAccount',
};

export async function renderNav() {
  const items = NAV[App.user.role] || [];
  let pending = 0;
  let pendingUsers = 0;
  try {
    const reqs = await api.getRequests();
    pending = reqs.filter(r => r.status === 'pending' || r.status === 'pricing_submitted').length;
  } catch { /* non-fatal */ }
  if (App.user.role === 'admin') {
    try {
      const users = await api.getUsers();
      pendingUsers = users.filter(u => u.status === 'pending').length;
    } catch { /* non-fatal */ }
  }
  document.getElementById('sbNav').innerHTML = items.map(n => {
    const label      = t(NAV_LABEL[n.key] || 'nav.' + n.key);
    const badge      = n.badge      && pending      > 0 ? `<span class="nav-badge">${pending}</span>`      : '';
    const usersBadge = n.usersBadge && pendingUsers > 0 ? `<span class="nav-badge">${pendingUsers}</span>` : '';
    return `<div class="nav-item" id="nav-${n.key}" onclick="navigate('${n.key}')"><span class="nav-icon">${n.icon}</span><span class="nav-label">${label}</span>${badge}${usersBadge}</div>`;
  }).join('');
  document.getElementById('sbLogout').textContent = t('nav.signOut');
  const current = document.getElementById('nav-' + App.section);
  if (current) current.classList.add('active');
  const dot = document.getElementById('notifDot');
  if (dot) dot.style.display = (pending > 0 || pendingUsers > 0) && App.user?.role === 'admin' ? '' : 'none';
}

export function updateNotifDot() {
  // Stub — dot is updated inside renderNav()
}

export const renderSidebar = renderNav;
