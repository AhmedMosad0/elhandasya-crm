import { App } from '../../state/store.js';
import * as api from '../../api/index.js';
import { fmtDate, fmtCur, statusBadge } from '../../utils/index.js';
import { openModal, closeModal } from '../../components/modal/modal.js';
import { showToast } from '../../components/toast/toast.js';

let _plc = 1;
let _cid = null;
let _clientsCache = [];
let _reqsCache    = [];

// ── Status label for display ──
const STATUS_LABEL = {
  pending:           'Under Review',
  approved:          'Being Priced',
  pricing_submitted: 'Pricing Under Review',
  final_approved:    'Confirmed',
  rejected:          'Not Approved',
};

export async function renderRequests(filter) {
  document.getElementById('sectionRequests').innerHTML = '<div class="empty" style="padding:40px">Loading requests…</div>';
  try {
    _reqsCache = await api.getRequests();
    const isAdmin = App.user.role === 'admin';
    const isSales = App.user.role === 'sales';

    if (isAdmin) {
      await _renderAdminRequests(filter);
    } else if (isSales) {
      await _renderSalesRequests();
    } else {
      // client — shouldn't reach here normally (they use client-orders view)
      _renderClientRequests();
    }
  } catch (err) {
    document.getElementById('sectionRequests').innerHTML = '<div class="empty" style="padding:40px">Failed to load requests</div>';
    showToast('Error: ' + err.message, 'toast-red');
  }
}

// ── ADMIN VIEW ──
async function _renderAdminRequests(filter) {
  const allReq = _reqsCache;
  let reqs = allReq;
  if (filter && filter !== 'all') reqs = reqs.filter(r => r.status === filter);
  reqs = [...reqs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const counts = {
    all:               allReq.length,
    pending:           allReq.filter(r => r.status === 'pending').length,
    pricing_submitted: allReq.filter(r => r.status === 'pricing_submitted').length,
    rejected:          allReq.filter(r => r.status === 'rejected').length,
  };

  document.getElementById('sectionRequests').innerHTML = `
  <div class="ph"><div class="ph-info"><h2>All Requests</h2><p>Review and approve incoming requests</p></div></div>
  <div class="fbar">
    <button class="ftab ${!filter||filter==='all'?'active':''}" onclick="renderRequests('all')">All (${counts.all})</button>
    <button class="ftab ${filter==='pending'?'active':''}" onclick="renderRequests('pending')">Pending (${counts.pending})</button>
    <button class="ftab ${filter==='pricing_submitted'?'active':''}" onclick="renderRequests('pricing_submitted')">Pricing Review (${counts.pricing_submitted})</button>
    <button class="ftab ${filter==='rejected'?'active':''}" onclick="renderRequests('rejected')">Rejected (${counts.rejected})</button>
  </div>
  <div class="cards-grid">${reqs.length
    ? reqs.map(r => _adminReqCard(r)).join('')
    : '<div class="empty" style="grid-column:1/-1"><div class="empty-icon">◌</div><h4>No requests found</h4><p>Adjust the filter</p></div>'
  }</div>`;
}

function _adminReqCard(r) {
  const rows = r.products.map(p =>
    `<div class="rcard-prod-row">
      <span>${p.name} <span style="color:var(--mute);font-size:11px">[${p.colorCode}]</span></span>
      <span>${p.qty} L${p.price > 0 ? ' × ' + fmtCur(p.price) : ''}</span>
    </div>`
  ).join('');

  let act = '';
  if (r.status === 'pending') {
    if (r.source === 'client') {
      act = `<button class="btn btn-green btn-sm" style="flex:1" onclick="promptApproveWithSales('${r.id}')">✓ Approve &amp; Assign Sales</button>
             <button class="btn btn-danger btn-sm" style="flex:1" onclick="promptReject('${r.id}')">✕ Reject</button>`;
    } else {
      act = `<button class="btn btn-green btn-sm" style="flex:1" onclick="approveRequest('${r.id}')">✓ Approve</button>
             <button class="btn btn-danger btn-sm" style="flex:1" onclick="promptReject('${r.id}')">✕ Reject</button>`;
    }
  } else if (r.status === 'pricing_submitted') {
    act = `<button class="btn btn-green btn-sm" style="flex:1" onclick="doFinalApprove('${r.id}')">✓ Final Approve</button>
           <button class="btn btn-danger btn-sm" style="flex:1" onclick="promptReject('${r.id}')">✕ Reject</button>`;
  }

  const rej = r.status === 'rejected' && r.rejectionReason
    ? `<div style="background:var(--red-l);border-radius:6px;padding:7px 10px;font-size:12px;color:var(--red);margin-bottom:8px">✕ ${r.rejectionReason}</div>`
    : '';

  const assignedInfo = r.assignedSalesName
    ? `<div class="rcard-meta-row">🧾 Assigned to: <strong>${r.assignedSalesName}</strong></div>`
    : '';

  const srcBadge = r.source === 'client'
    ? `<span style="font-size:10px;padding:1px 7px;border-radius:99px;background:var(--blue-l);color:var(--blue);font-weight:700">Client</span>`
    : `<span style="font-size:10px;padding:1px 7px;border-radius:99px;background:var(--border-l);color:var(--mute);font-weight:700">Sales</span>`;

  return `<div class="rcard">
    <div class="rcard-top"><div><div class="rcard-client">${r.clientName}</div><div class="rcard-ref">${r.ref} ${srcBadge}</div></div>${statusBadge(r.status)}</div>
    <div class="rcard-meta"><div class="rcard-meta-row">📞 ${r.phone}</div><div class="rcard-meta-row">📍 ${r.address}</div><div class="rcard-meta-row">👤 ${r.salesName} · ${fmtDate(r.createdAt)}</div>${assignedInfo}</div>
    <div class="rcard-products">${rows}
      <div class="rcard-total"><span style="color:var(--mute);font-size:12.5px;font-weight:600">Total</span><span style="color:var(--gold-d)">${r.totalAmount > 0 ? fmtCur(r.totalAmount) : 'TBD'}</span></div>
    </div>
    ${r.notes ? `<div style="font-size:12px;color:var(--mute);margin-bottom:8px">📝 ${r.notes}</div>` : ''}${rej}${act ? `<div class="rcard-actions">${act}</div>` : ''}
  </div>`;
}

// ── SALES VIEW ──
async function _renderSalesRequests() {
  const uid = App.user.id;
  const myCreated    = _reqsCache.filter(r => r.createdBy === uid);
  const forPricing   = _reqsCache.filter(r => r.assignedSalesId === uid && r.status === 'approved');
  const sorted = arr => [...arr].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  document.getElementById('sectionRequests').innerHTML = `
  <div class="ph"><div class="ph-info"><h2>My Requests</h2><p>Manage your submitted requests and assigned pricing tasks</p></div>
    <div class="ph-actions"><button class="btn btn-gold" onclick="openNewRequestModal()">＋ New Request</button></div></div>

  ${forPricing.length ? `
  <div style="margin-bottom:8px;font-size:11.5px;font-weight:700;color:var(--amber);text-transform:uppercase;letter-spacing:.5px">Assigned for Pricing (${forPricing.length})</div>
  <div class="cards-grid" style="margin-bottom:28px">${sorted(forPricing).map(r => _pricingCard(r)).join('')}</div>` : ''}

  <div style="margin-bottom:8px;font-size:11.5px;font-weight:700;color:var(--mute);text-transform:uppercase;letter-spacing:.5px">My Requests (${myCreated.length})</div>
  <div class="cards-grid">${sorted(myCreated).length
    ? sorted(myCreated).map(r => _salesReqCard(r)).join('')
    : '<div class="empty" style="grid-column:1/-1"><div class="empty-icon">◌</div><h4>No requests yet</h4><p>Create your first request above</p></div>'
  }</div>`;
}

function _salesReqCard(r) {
  const rows = r.products.map(p =>
    `<div class="rcard-prod-row">
      <span>${p.name} <span style="color:var(--mute);font-size:11px">[${p.colorCode}]</span></span>
      <span>${p.qty} L${p.price > 0 ? ' × ' + fmtCur(p.price) : ''}</span>
    </div>`
  ).join('');
  const rej = r.status === 'rejected' && r.rejectionReason
    ? `<div style="background:var(--red-l);border-radius:6px;padding:7px 10px;font-size:12px;color:var(--red);margin-bottom:8px">✕ ${r.rejectionReason}</div>`
    : '';
  return `<div class="rcard">
    <div class="rcard-top"><div><div class="rcard-client">${r.clientName}</div><div class="rcard-ref">${r.ref}</div></div>${statusBadge(r.status)}</div>
    <div class="rcard-meta"><div class="rcard-meta-row">📞 ${r.phone}</div><div class="rcard-meta-row">👤 ${r.salesName} · ${fmtDate(r.createdAt)}</div></div>
    <div class="rcard-products">${rows}<div class="rcard-total"><span style="color:var(--mute);font-size:12.5px;font-weight:600">Total</span><span style="color:var(--gold-d)">${r.totalAmount > 0 ? fmtCur(r.totalAmount) : 'TBD'}</span></div></div>
    ${rej}
  </div>`;
}

function _pricingCard(r) {
  const rows = r.products.map(p =>
    `<div class="rcard-prod-row"><span>${p.name} <span style="color:var(--mute);font-size:11px">[${p.colorCode}]</span></span><span>${p.qty} L</span></div>`
  ).join('');
  return `<div class="rcard" style="border-left:3px solid var(--amber)">
    <div class="rcard-top"><div><div class="rcard-client">${r.clientName}</div><div class="rcard-ref">${r.ref}</div></div>${statusBadge(r.status)}</div>
    <div class="rcard-meta"><div class="rcard-meta-row">📞 ${r.phone}</div><div class="rcard-meta-row">📍 ${r.address}</div></div>
    <div class="rcard-products">${rows}</div>
    ${r.notes ? `<div style="font-size:12px;color:var(--mute);margin-bottom:8px">📝 ${r.notes}</div>` : ''}
    <div class="rcard-actions"><button class="btn btn-gold btn-sm" style="flex:1" onclick="openPricingModal('${r.id}')">✏ Add Pricing</button></div>
  </div>`;
}

// ── CLIENT VIEW ──
function _renderClientRequests() {
  // Clients use renderClientOrders — this is a fallback
  const reqs = _reqsCache;
  document.getElementById('sectionRequests').innerHTML = `
  <div class="ph"><div class="ph-info"><h2>My Orders</h2><p>Track the status of your order requests</p></div></div>
  <div class="cards-grid">${reqs.map(r => {
    const label = STATUS_LABEL[r.status] || r.status;
    const rej = r.status === 'rejected' && r.rejectionReason
      ? `<div style="background:var(--red-l);border-radius:6px;padding:7px 10px;font-size:12px;color:var(--red);margin-top:8px">Reason: ${r.rejectionReason}</div>`
      : '';
    return `<div class="rcard">
      <div class="rcard-top"><div><div class="rcard-client">${r.clientName}</div><div class="rcard-ref">${r.ref}</div></div>${statusBadge(r.status)}</div>
      <div class="rcard-meta"><div class="rcard-meta-row">📅 ${fmtDate(r.createdAt)}</div><div class="rcard-meta-row" style="font-weight:600">${label}</div></div>
      ${rej}
    </div>`;
  }).join('')}`;
}

// ── APPROVE SALES REQUEST (direct, no modal) ──
export async function approveRequest(reqId) {
  try {
    const result = await api.approveRequest(reqId);
    await window._renderNav();
    window._updateNotifDot();
    const msg = result.recipeNum ? `✓ Approved — ${result.recipeNum}` : '✓ Request approved';
    showToast(msg, 'toast-gold');
    if (App.section === 'requests') await renderRequests('all');
    else if (App.section === 'dashboard') await window.renderDashboard();
  } catch (err) {
    showToast('Failed to approve: ' + err.message, 'toast-red');
  }
}

// ── APPROVE CLIENT REQUEST (modal: choose sales person) ──
export async function promptApproveWithSales(reqId) {
  let salesUsers = [];
  try { salesUsers = (await api.getUsers()).filter(u => u.role === 'sales' && u.status === 'active'); }
  catch { /* non-fatal */ }

  openModal(`<div class="mh"><div class="mh-left"><h3>Approve &amp; Assign Sales</h3></div><button class="mx" onclick="closeModal()">✕</button></div>
  <div class="mc">
    <p style="color:var(--mute);margin-bottom:16px">Assign a salesperson to add pricing before final approval.</p>
    <div class="fg"><label class="fl req">Assign to Sales Rep</label>
      <select class="fi" id="approveSalesSelect">
        <option value="">— Select salesperson —</option>
        ${salesUsers.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
      </select>
    </div>
  </div>
  <div class="mf"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-green" onclick="doApproveWithSales('${reqId}')">Confirm &amp; Assign →</button></div>`, 'modal-sm');
}

export async function doApproveWithSales(reqId) {
  const assignedSalesId = document.getElementById('approveSalesSelect').value;
  if (!assignedSalesId) { alert('Please select a salesperson.'); return; }
  try {
    await api.approveRequest(reqId, { assignedSalesId });
    closeModal();
    await window._renderNav();
    showToast('Request approved and assigned for pricing', 'toast-gold');
    if (App.section === 'requests') await renderRequests('all');
    else if (App.section === 'dashboard') await window.renderDashboard();
  } catch (err) {
    showToast('Failed: ' + err.message, 'toast-red');
  }
}

// ── FINAL APPROVE (after pricing is submitted) ──
export async function doFinalApprove(reqId) {
  try {
    const order = await api.finalApproveRequest(reqId);
    await window._renderNav();
    window._updateNotifDot();
    showToast(`✓ Final approved — ${order.recipeNum}`, 'toast-gold');
    if (App.section === 'requests') await renderRequests('all');
    else if (App.section === 'dashboard') await window.renderDashboard();
  } catch (err) {
    showToast('Failed to final approve: ' + err.message, 'toast-red');
  }
}

// ── REJECT (any stage) ──
export function promptReject(reqId) {
  openModal(`<div class="mh"><div class="mh-left"><h3>Reject Request</h3></div><button class="mx" onclick="closeModal()">✕</button></div>
  <div class="mc"><p style="color:var(--mute);margin-bottom:14px">Provide a reason for the rejection.</p>
    <div class="fg"><label class="fl req">Rejection Reason</label>
      <textarea class="fi" id="rejReason" rows="3" placeholder="e.g. Color not in stock…" style="resize:none"></textarea></div></div>
  <div class="mf"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-danger" onclick="doReject('${reqId}')">Confirm Rejection</button></div>`, 'modal-sm');
}

export async function doReject(reqId) {
  const r = document.getElementById('rejReason').value.trim();
  if (!r) { alert('Please enter a reason.'); return; }
  try {
    await api.rejectRequest(reqId, r);
    closeModal();
    await window._renderNav();
    window._updateNotifDot();
    showToast('Request rejected', 'toast-red');
    if (App.section === 'requests') await renderRequests('all');
    else if (App.section === 'dashboard') await window.renderDashboard();
  } catch (err) {
    showToast('Failed to reject: ' + err.message, 'toast-red');
  }
}

// ── PRICING MODAL (sales) ──
export function openPricingModal(reqId) {
  const r = _reqsCache.find(req => req.id === reqId);
  if (!r) { showToast('Request data not found — please refresh', 'toast-red'); return; }

  const rows = r.products.map(p => `
    <tr class="pricing-row" data-pid="${p.id}" data-qty="${p.qty}">
      <td>${p.name} <span style="color:var(--mute);font-size:11px">[${p.colorCode}]</span></td>
      <td style="text-align:center">${p.qty} L</td>
      <td><input class="fi fi-sm" type="number" id="pp_${p.id}" placeholder="0.00" oninput="calcPricingTotal()" style="width:90px;text-align:right"></td>
      <td id="pt_${p.id}" style="text-align:right;color:var(--gold-d);font-weight:600">—</td>
    </tr>`).join('');

  openModal(`<div class="mh"><div class="mh-left"><h3>Add Pricing</h3><span class="mh-recipe">${r.ref}</span></div><button class="mx" onclick="closeModal()">✕</button></div>
  <div class="mc">
    <p style="color:var(--mute);font-size:12.5px;margin-bottom:12px">Client: <strong>${r.clientName}</strong> · ${r.phone}</p>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="font-size:11px;color:var(--mute);text-transform:uppercase">
        <th style="text-align:left;padding:6px 0">Product</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:center">Price/L</th>
        <th style="text-align:right">Total</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-top:14px;padding-top:10px;border-top:2px solid var(--gold)">
      <span style="font-size:12px;color:var(--mute);font-weight:600;text-transform:uppercase">Order Total</span>
      <span id="pricingTotal" style="font-size:16px;font-weight:800;color:var(--gold-d)">EGP 0</span>
    </div>
  </div>
  <div class="mf"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="submitPricing('${reqId}')">Submit Pricing →</button></div>`, 'modal-md');
}

export function calcPricingTotal() {
  let t = 0;
  document.querySelectorAll('.pricing-row').forEach(row => {
    const pid   = row.dataset.pid;
    const qty   = parseFloat(row.dataset.qty) || 0;
    const price = parseFloat(document.getElementById('pp_' + pid)?.value) || 0;
    const lineTotal = qty * price;
    t += lineTotal;
    const ptEl = document.getElementById('pt_' + pid);
    if (ptEl) ptEl.textContent = fmtCur(lineTotal);
  });
  const totEl = document.getElementById('pricingTotal');
  if (totEl) totEl.textContent = fmtCur(t);
}

export async function submitPricing(reqId) {
  const r = _reqsCache.find(req => req.id === reqId);
  if (!r) return;

  const products = r.products.map(p => ({
    id:    p.id,
    qty:   p.qty,
    price: parseFloat(document.getElementById('pp_' + p.id)?.value) || 0,
  }));

  if (products.some(p => p.price <= 0)) {
    alert('Please enter a price greater than 0 for all products.');
    return;
  }

  try {
    await api.assignPricingRequest(reqId, products);
    closeModal();
    showToast('Pricing submitted for admin review', 'toast-gold');
    await renderRequests();
  } catch (err) {
    showToast('Failed: ' + err.message, 'toast-red');
  }
}

// ── NEW REQUEST MODAL (sales) ──
export async function openNewRequestModal() {
  try { _clientsCache = await api.getClients(); }
  catch { _clientsCache = []; }
  openModal(`<div class="mh"><div class="mh-left"><h3>New Sales Request</h3></div><button class="mx" onclick="closeModal()">✕</button></div>
  <div class="mc">
    <div class="fsec">Client Information</div>
    <div class="fr2">
      <div class="fg"><label class="fl req">Client Name</label>
        <input class="fi" id="nr_client" list="cList" placeholder="Search or type name…" oninput="fillClient()">
        <datalist id="cList">${_clientsCache.map(c => `<option value="${c.name}">`).join('')}</datalist></div>
      <div class="fg"><label class="fl req">Phone</label><input class="fi" id="nr_phone" placeholder="010…"></div>
    </div>
    <div class="fr2">
      <div class="fg"><label class="fl req">Address</label><input class="fi" id="nr_address" placeholder="City, Area, Street"></div>
      <div class="fg"><label class="fl">Email</label><input class="fi" id="nr_email" type="email"></div>
    </div>
    <div class="fg"><label class="fl">Notes</label><textarea class="fi" id="nr_notes" rows="2" style="resize:none" placeholder="Special instructions…"></textarea></div>
    <div class="fsec">Products <button class="btn btn-ghost btn-xs" onclick="addPline()" style="margin-left:8px;vertical-align:middle">＋ Add</button></div>
    <div class="pline-wrap" id="plines">
      <div class="pline" id="pl_0">
        <input class="fi fi-sm" placeholder="Product name" id="pn_0" oninput="calcTotal()">
        <input class="fi fi-sm" placeholder="Color Code" id="pc_0">
        <input class="fi fi-sm" placeholder="Color Name" id="pcn_0">
        <div style="display:flex;align-items:center;gap:6px">
          <input class="fi fi-sm" type="number" placeholder="Qty" id="pq_0" oninput="calcTotal()" style="flex:1">
          <span style="font-size:12px;font-weight:600;color:var(--mute)">L</span>
        </div>
        <input class="fi fi-sm" type="number" placeholder="Price/L" id="pp_0" oninput="calcTotal()">
        <button class="pline-rm" onclick="removePline(0)">✕</button>
      </div>
    </div>
    <div class="ptotal-row"><span class="ptotal-label">Total</span><span id="reqTotal" style="color:var(--gold-d)">EGP 0</span></div>
  </div>
  <div class="mf"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="submitNewRequest()">Submit Request</button></div>`, 'modal-lg');
  _plc = 1; _cid = null;
}

export function fillClient() {
  const v = document.getElementById('nr_client').value;
  const c = _clientsCache.find(x => x.name === v);
  if (c) {
    document.getElementById('nr_phone').value   = c.phone   || '';
    document.getElementById('nr_address').value = c.address || '';
    document.getElementById('nr_email').value   = c.email   || '';
    _cid = c.id;
  } else { _cid = null; }
}

export function addPline() {
  const i = _plc++;
  const w = document.getElementById('plines');
  const d = document.createElement('div'); d.className = 'pline'; d.id = 'pl_' + i;
  d.innerHTML = `<input class="fi fi-sm" placeholder="Product name" id="pn_${i}" oninput="calcTotal()"><input class="fi fi-sm" placeholder="Color Code" id="pc_${i}"><input class="fi fi-sm" placeholder="Color Name" id="pcn_${i}"><div style="display:flex;align-items:center;gap:6px"><input class="fi fi-sm" type="number" placeholder="Qty" id="pq_${i}" oninput="calcTotal()" style="flex:1"><span style="font-size:12px;font-weight:600;color:var(--mute)">L</span></div><input class="fi fi-sm" type="number" placeholder="Price/L" id="pp_${i}" oninput="calcTotal()"><button class="pline-rm" onclick="removePline(${i})">✕</button>`;
  w.appendChild(d);
}

export function removePline(i) { const e = document.getElementById('pl_' + i); if (e) e.remove(); calcTotal(); }

export function calcTotal() {
  let t = 0;
  document.querySelectorAll('.pline').forEach(pl => {
    const i = pl.id.replace('pl_', '');
    const q = parseFloat(document.getElementById('pq_' + i)?.value) || 0;
    const p = parseFloat(document.getElementById('pp_' + i)?.value) || 0;
    t += q * p;
  });
  const e = document.getElementById('reqTotal'); if (e) e.textContent = fmtCur(t); return t;
}

export async function submitNewRequest() {
  const clientName = document.getElementById('nr_client').value.trim();
  const phone      = document.getElementById('nr_phone').value.trim();
  const addr       = document.getElementById('nr_address').value.trim();
  if (!clientName || !phone || !addr) { alert('Client name, phone and address are required.'); return; }
  if (!_cid) { alert('Please select an existing client from the suggestion list.'); return; }
  const products = [];
  document.querySelectorAll('.pline').forEach(pl => {
    const i    = pl.id.replace('pl_', '');
    const name = (document.getElementById('pn_' + i)?.value || '').trim();
    const qty  = parseFloat(document.getElementById('pq_' + i)?.value) || 0;
    const price = parseFloat(document.getElementById('pp_' + i)?.value) || 0;
    if (name && qty > 0) products.push({ name, colorCode: document.getElementById('pc_' + i)?.value || '', colorName: document.getElementById('pcn_' + i)?.value || '', qty, unit: 'L', price, total: qty * price });
  });
  if (!products.length) { alert('Add at least one product.'); return; }
  try {
    const req = await api.createRequest({
      clientId: _cid, clientName, phone,
      email:   document.getElementById('nr_email').value   || '',
      address: addr,
      notes:   document.getElementById('nr_notes').value   || '',
      products, source: 'sales',
    });
    closeModal();
    await window._renderNav();
    window._updateNotifDot();
    showToast(`${req.ref} submitted`, 'toast-gold');
    await renderRequests('all');
  } catch (err) {
    showToast('Failed to submit: ' + err.message, 'toast-red');
  }
}
