import { App } from '../../state/store.js';
import * as api from '../../api/index.js';

const NAV = {
  admin:    [{ icon:'◈', label:'Dashboard', key:'dashboard' }, { icon:'◌', label:'Requests', key:'requests', badge:true }, { icon:'▣', label:'Orders', key:'orders' }, { icon:'◉', label:'Clients', key:'clients' }, { icon:'◫', label:'Products', key:'products' }, { icon:'◎', label:'Users', key:'users', usersBadge:true }, { icon:'▦', label:'Reports', key:'reports' }],
  sales:    [{ icon:'◌', label:'My Requests',    key:'requests' }, { icon:'◉', label:'Clients', key:'clients' }],
  mixer:    [{ icon:'●', label:'My Work Queue',  key:'mywork' }],
  delivery: [{ icon:'▷', label:'My Deliveries',  key:'mywork' }, { icon:'▣', label:'All Orders', key:'orders' }],
  client:   [{ icon:'◈', label:'My Overview',    key:'clientportal' }, { icon:'▣', label:'My Orders', key:'clientorders' }, { icon:'◌', label:'Place Order', key:'clientneworder' }, { icon:'◉', label:'My Account', key:'clientaccount' }],
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
    const badge      = n.badge      && pending      > 0 ? `<span class="nav-badge">${pending}</span>`      : '';
    const usersBadge = n.usersBadge && pendingUsers > 0 ? `<span class="nav-badge">${pendingUsers}</span>` : '';
    return `<div class="nav-item" id="nav-${n.key}" onclick="navigate('${n.key}')"><span class="nav-icon">${n.icon}</span>${n.label}${badge}${usersBadge}</div>`;
  }).join('');
  const current = document.getElementById('nav-' + App.section);
  if (current) current.classList.add('active');
  const dot = document.getElementById('notifDot');
  if (dot) dot.style.display = (pending > 0 || pendingUsers > 0) && App.user?.role === 'admin' ? '' : 'none';
}

export function updateNotifDot() {
  // Dot is updated at the end of renderNav() which already holds the count.
  // This stub is kept so existing callers (main.js, approveRequest, doReject) don't break.
}
