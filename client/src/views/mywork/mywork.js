import { App } from '../../state/store.js';
import * as api from '../../api/index.js';
import { statusBadge } from '../../utils/index.js';
import { showToast } from '../../components/toast/toast.js';

export async function renderMyWork() {
  document.getElementById('sectionMywork').innerHTML = '<div class="empty" style="padding:40px">Loading work queue…</div>';
  try {
    const orders = await api.getOrders();
    const uid  = App.user.id;
    const role = App.user.role;
    const mine   = orders.filter(o => (role === 'mixer' && o.mixerId === uid) || (role === 'delivery' && o.deliveryId === uid));
    const active = mine.filter(o => o.status !== 'delivered');
    const done   = mine.filter(o => o.status === 'delivered');
    document.getElementById('sectionMywork').innerHTML = `
    <div class="ph"><div class="ph-info"><h2>My Work Queue</h2><p>${role === 'mixer' ? 'Color mixing assignments' : 'Delivery assignments'}</p></div></div>
    ${active.length ? `<div style="margin-bottom:8px;font-size:11.5px;font-weight:700;color:var(--mute);text-transform:uppercase;letter-spacing:.5px">Active (${active.length})</div>
    ${active.map(o => _workCard(o, role)).join('')}` : '<div class="empty"><div class="empty-icon">✓</div><h4>All caught up</h4><p>No active assignments</p></div>'}
    ${done.length ? `<div style="margin:16px 0 8px;font-size:11.5px;font-weight:700;color:var(--mute);text-transform:uppercase;letter-spacing:.5px">Completed (${done.length})</div>${done.map(o => _workCard(o, role, true)).join('')}` : ''}`;
  } catch (err) {
    document.getElementById('sectionMywork').innerHTML = '<div class="empty" style="padding:40px">Failed to load work queue</div>';
    showToast('Error: ' + err.message, 'toast-red');
  }
}

function _workCard(o, role, done) {
  return `<div class="work-card" style="${done ? 'opacity:.65' : ''}">
    <div class="work-head"><div><span class="work-recipe">${o.recipeNum}</span><div class="work-client">${o.clientName}</div><div class="work-note">${o.clientAddress}</div></div><div>${statusBadge(o.status)}</div></div>
    <div style="font-size:12.5px;color:var(--mute);margin-bottom:10px">${o.products.map(p => `• ${p.name} — ${p.qty}${p.unit} [${p.colorCode}]`).join('<br>')}</div>
    ${role === 'mixer' && !done ? `<button class="btn btn-gold btn-sm" onclick="markMixed('${o.id}')">✓ Mark Mixing Done</button>` : ''}
    <button class="btn btn-ghost btn-sm" style="margin-left:8px" onclick="openOrderModal('${o.id}')">View Order</button>
  </div>`;
}

export async function markMixed(oid) {
  try {
    await api.updateOrderStatus(oid, { status: 'ready' });
    showToast('Marked as ready for delivery', 'toast-gold');
    await renderMyWork();
  } catch (err) {
    showToast('Failed: ' + err.message, 'toast-red');
  }
}
