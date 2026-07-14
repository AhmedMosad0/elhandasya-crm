import { App } from '../../state/store.js';
import { t } from '../../i18n/index.js';

export function handleSearch() {
  const q = document.getElementById('searchInput').value;
  if (App.section === 'orders') window.renderOrders('all', q);
  else if (App.section === 'clients') window.renderClients(q);
}

export function updateTopbar() {
  const inp = document.getElementById('searchInput');
  if (inp) inp.placeholder = t('common.searchPlaceholder');
}
