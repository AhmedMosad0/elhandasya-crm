import { App } from '../../state/store.js';

export function handleSearch() {
  const q = document.getElementById('searchInput').value;
  if (App.section === 'orders') window.renderOrders('all', q);
  else if (App.section === 'clients') window.renderClients(q);
}
