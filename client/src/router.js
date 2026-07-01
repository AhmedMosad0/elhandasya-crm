import { App } from './state/store.js';
import { cap } from './utils/index.js';
import { renderDashboard } from './views/dashboard/dashboard.js';
import { renderRequests } from './views/requests/requests.js';
import { renderOrders } from './views/orders/orders.js';
import { renderClients } from './views/clients/clients.js';
import { renderReports } from './views/reports/reports.js';
import { renderMyWork } from './views/mywork/mywork.js';
import { renderClientPortal } from './views/client-portal/client-portal.js';
import { renderClientOrders } from './views/client-orders/client-orders.js';
import { renderClientNewOrder } from './views/client-neworder/client-neworder.js';
import { renderClientAccount } from './views/client-account/client-account.js';

const TITLES = {
  dashboard:'Dashboard', requests:'Requests', orders:'Orders', clients:'Clients',
  reports:'Reports', mywork:'My Work Queue', clientportal:'My Overview',
  clientorders:'My Orders', clientneworder:'Place New Order', clientaccount:'My Account',
};

export function navigate(sec, ...args) {
  App.section = sec;
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const el = document.getElementById('section' + cap(sec));
  if (el) el.classList.add('active');
  const nv = document.getElementById('nav-' + sec);
  if (nv) nv.classList.add('active');
  document.getElementById('tbTitle').textContent = TITLES[sec] || sec;

  if (sec === 'dashboard') renderDashboard();
  else if (sec === 'requests') renderRequests(args[0] || 'all');
  else if (sec === 'orders') renderOrders(args[0] || 'all');
  else if (sec === 'clients') renderClients();
  else if (sec === 'reports') renderReports();
  else if (sec === 'mywork') renderMyWork();
  else if (sec === 'clientportal') renderClientPortal();
  else if (sec === 'clientorders') renderClientOrders(args[0] || 'all');
  else if (sec === 'clientneworder') renderClientNewOrder();
  else if (sec === 'clientaccount') renderClientAccount();
}
