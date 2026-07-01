import { App } from '../../state/store.js';
import { getRequests } from '../../api/index.js';

const NAV = {
  admin:    [{ icon:'◈', label:'Dashboard',      key:'dashboard' }, { icon:'◌', label:'Requests',       key:'requests', badge:true }, { icon:'▣', label:'Orders', key:'orders' }, { icon:'◉', label:'Clients', key:'clients' }, { icon:'▦', label:'Reports', key:'reports' }],
  sales:    [{ icon:'◌', label:'My Requests',    key:'requests' }, { icon:'◉', label:'Clients', key:'clients' }],
  mixer:    [{ icon:'●', label:'My Work Queue',  key:'mywork' }],
  delivery: [{ icon:'▷', label:'My Deliveries',  key:'mywork' }, { icon:'▣', label:'All Orders', key:'orders' }],
  client:   [{ icon:'◈', label:'My Overview',    key:'clientportal' }, { icon:'▣', label:'My Orders', key:'clientorders' }, { icon:'◌', label:'Place Order', key:'clientneworder' }, { icon:'◉', label:'My Account', key:'clientaccount' }],
};

export function renderNav() {
  const items = NAV[App.user.role] || [];
  const pending = getRequests().filter(r => r.status === 'pending').length;
  document.getElementById('sbNav').innerHTML = items.map(n => {
    const badge = n.badge && pending > 0 ? `<span class="nav-badge">${pending}</span>` : '';
    return `<div class="nav-item" id="nav-${n.key}" onclick="navigate('${n.key}')"><span class="nav-icon">${n.icon}</span>${n.label}${badge}</div>`;
  }).join('');
}

export function updateNotifDot() {
  const n = getRequests().filter(r => r.status === 'pending').length;
  document.getElementById('notifDot').style.display = n > 0 && App.user.role === 'admin' ? '' : 'none';
}
