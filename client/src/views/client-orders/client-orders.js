import { App } from '../../state/store.js';
import * as api from '../../api/index.js';
import { fmtDate, fmtCur, statusBadge, payBadge } from '../../utils/index.js';
import { openModal } from '../../components/modal/modal.js';

const REQ_STATUS_LABEL = {
  pending:           'Under Review',
  approved:          'Being Priced',
  pricing_submitted: 'Pricing Under Review',
  final_approved:    'Confirmed — view order below',
  rejected:          'Not Approved',
};

function _reqStatusColor(s) {
  if (s === 'rejected')          return 'var(--red)';
  if (s === 'final_approved')    return 'var(--green)';
  if (s === 'pricing_submitted') return 'var(--blue)';
  if (s === 'approved')          return 'var(--amber)';
  return 'var(--mute)';
}

export async function renderClientOrders(filter) {
  document.getElementById('sectionClientorders').innerHTML = '<div class="empty" style="padding:40px">Loading orders…</div>';
  try {
    const [all, allReqs] = await Promise.all([api.getOrders(), api.getRequests().catch(() => [])]);
    // Requests not yet converted to orders (exclude final_approved — those have orders)
    const pendingReqs = allReqs.filter(r => !['final_approved', 'rejected'].includes(r.status));
    const rejectedReqs = allReqs.filter(r => r.status === 'rejected');

    let ords = all;
    if (filter === 'active')         ords = ords.filter(o => o.status !== 'delivered');
    else if (filter === 'delivered') ords = ords.filter(o => o.status === 'delivered');
    else if (filter === 'unpaid')    ords = ords.filter(o => o.paymentStatus === 'unpaid');

    const c = {
      all:       all.length,
      active:    all.filter(o => o.status !== 'delivered').length,
      delivered: all.filter(o => o.status === 'delivered').length,
      unpaid:    all.filter(o => o.paymentStatus === 'unpaid').length,
    };

    const pipelineHTML = pendingReqs.length || rejectedReqs.length ? `
    <div style="margin-bottom:10px;font-size:11.5px;font-weight:700;color:var(--amber);text-transform:uppercase;letter-spacing:.5px">Order Requests In Progress (${pendingReqs.length})</div>
    ${pendingReqs.map(r => `
    <div style="background:var(--card);border-radius:var(--r12);padding:14px 16px;margin-bottom:10px;border:1px solid var(--border);box-shadow:var(--sh1)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div>
          <div style="font-size:12px;color:var(--mute)">${r.ref} · ${fmtDate(r.createdAt)}</div>
        </div>
        <div style="font-size:11.5px;font-weight:700;color:${_reqStatusColor(r.status)}">${REQ_STATUS_LABEL[r.status] || r.status}</div>
      </div>
      ${r.products.map(p => `<div style="font-size:13px;padding:3px 0;border-bottom:1px solid var(--border-l);display:flex;justify-content:space-between"><span>${p.name}</span><span style="color:var(--mute)">${p.qty} L</span></div>`).join('')}
    </div>`).join('')}
    ${rejectedReqs.map(r => `
    <div style="background:var(--red-l);border-radius:var(--r12);padding:14px 16px;margin-bottom:10px;border:1px solid rgba(192,57,43,.2)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <div style="font-size:12px;color:var(--mute)">${r.ref} · ${fmtDate(r.createdAt)}</div>
        <div style="font-size:11.5px;font-weight:700;color:var(--red)">Not Approved</div>
      </div>
      ${r.rejectionReason ? `<div style="font-size:12px;color:var(--red)">Reason: ${r.rejectionReason}</div>` : ''}
    </div>`).join('')}
    <div style="margin-top:16px;margin-bottom:10px;font-size:11.5px;font-weight:700;color:var(--mute);text-transform:uppercase;letter-spacing:.5px">My Orders (${all.length})</div>` : '';

    document.getElementById('sectionClientorders').innerHTML = `
    <div class="ph"><div class="ph-info"><h2>My Orders</h2><p>Track all your orders and deliveries</p></div>
      <div class="ph-actions"><button class="btn btn-gold" onclick="navigate('clientneworder')">＋ New Order</button></div></div>
    ${pipelineHTML}
    <div class="fbar">
      <button class="ftab ${filter==='all'?'active':''}" onclick="renderClientOrders('all')">All (${c.all})</button>
      <button class="ftab ${filter==='active'?'active':''}" onclick="renderClientOrders('active')">Active (${c.active})</button>
      <button class="ftab ${filter==='delivered'?'active':''}" onclick="renderClientOrders('delivered')">Delivered (${c.delivered})</button>
      <button class="ftab ${filter==='unpaid'?'active':''}" onclick="renderClientOrders('unpaid')">Unpaid (${c.unpaid})</button>
    </div>
    ${ords.length ? ords.map(o => `
    <div class="portal-order-card" onclick="openClientOrderDetail('${o.id}')">
      <div class="portal-order-head"><span class="portal-order-num">${o.recipeNum}</span><div style="display:flex;gap:7px">${statusBadge(o.status)}${payBadge(o.paymentStatus)}</div></div>
      <div style="font-size:12.5px;color:var(--mute);margin:6px 0">${fmtDate(o.createdAt)} · ${o.products.length} product${o.products.length > 1 ? 's' : ''}</div>
      ${o.products.map(p => `<div style="font-size:13px;padding:3px 0;border-bottom:1px solid var(--border-l);display:flex;justify-content:space-between"><span>${p.name}</span><span style="color:var(--mute)">${p.qty} L</span></div>`).join('')}
      <div style="display:flex;justify-content:space-between;margin-top:10px;align-items:center">
        <div class="pay-bar-wrap" style="flex:1;margin:0 12px 0 0"><div class="pay-bar-fill" style="width:${o.totalAmount>0?Math.round(o.paidAmount/o.totalAmount*100):0}%"></div></div>
        <strong style="font-size:14px">${fmtCur(o.totalAmount)}</strong>
      </div>
    </div>`).join('') : '<div class="empty"><div class="empty-icon">▣</div><h4>No orders yet</h4><p>Place your first order!</p></div>'}`;
  } catch (err) {
    document.getElementById('sectionClientorders').innerHTML = '<div class="empty" style="padding:40px">Failed to load orders</div>';
    window.showToast('Error: ' + err.message, 'toast-red');
  }
}

export async function openClientOrderDetail(oid) {
  try {
    const o = await api.getOrder(oid);
    if (!o) return;
    const pct    = o.totalAmount > 0 ? Math.round(o.paidAmount / o.totalAmount * 100) : 0;
    const ditems = o.products.map(p => `<div class="ditem${p.delivered>=p.qty?' done':''}">
      <div class="dchk${p.delivered>=p.qty?' on':''}" style="cursor:default">${p.delivered>=p.qty?'✓':''}</div>
      <div class="ditem-info"><div class="ditem-name">${p.name}</div><div class="ditem-detail">[${p.colorCode}] ${p.colorName}</div></div>
      <div class="ditem-qty">${p.delivered||0}/${p.qty} L</div></div>`).join('');
    openModal(`<div class="mh"><div class="mh-left"><h3>Order Details</h3><span class="mh-recipe">${o.recipeNum}</span></div><button class="mx" onclick="closeModal()">✕</button></div>
    <div class="mc">
      <div class="two-col" style="margin-bottom:16px">
        <div class="info-block">
          <div class="info-row"><span class="ir-label">Status</span><span class="ir-val">${statusBadge(o.status)}</span></div>
          <div class="info-row"><span class="ir-label">Payment</span><span class="ir-val">${payBadge(o.paymentStatus)}</span></div>
          <div class="info-row"><span class="ir-label">Date</span><span class="ir-val">${fmtDate(o.createdAt)}</span></div>
        </div>
        <div class="info-block">
          <div class="info-row"><span class="ir-label">Total</span><span class="ir-val" style="color:var(--gold-d);font-weight:800">${fmtCur(o.totalAmount)}</span></div>
          <div class="info-row"><span class="ir-label">Paid</span><span class="ir-val" style="color:var(--green)">${fmtCur(o.paidAmount)}</span></div>
          <div class="info-row"><span class="ir-label">Balance</span><span class="ir-val" style="color:var(--red)">${fmtCur(o.totalAmount-o.paidAmount)}</span></div>
        </div>
      </div>
      <div class="pay-bar-wrap" style="height:9px;margin-bottom:16px"><div class="pay-bar-fill" style="width:${pct}%"></div></div>
      <div class="fsec">Delivery Status</div>
      ${ditems}
      ${o.mixerName&&o.mixerName!=='Unassigned'?`<div style="font-size:12.5px;color:var(--mute);margin-top:10px">🎨 Mixed by: <strong>${o.mixerName}</strong></div>`:''}
      ${o.deliveryName&&o.deliveryName!=='Unassigned'?`<div style="font-size:12.5px;color:var(--mute)">🚚 Delivery: <strong>${o.deliveryName}</strong></div>`:''}
      ${o.notes?`<div style="margin-top:12px;font-size:12.5px;color:var(--mute);background:var(--bg);padding:10px;border-radius:6px">📝 ${o.notes}</div>`:''}
    </div>
    <div class="mf"><button class="btn btn-ghost" onclick="closeModal()">Close</button></div>`, 'modal-md');
  } catch (err) {
    window.showToast('Failed to load order: ' + err.message, 'toast-red');
  }
}
