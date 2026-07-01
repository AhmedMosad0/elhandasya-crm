import { App } from '../../state/store.js';
import { getRequests, saveRequests, getReqCounter, setReqCounter, getOrderCounter, setOrderCounter, getOrders, saveOrders, getClients } from '../../api/index.js';
import { fmtDate, fmtCur, statusBadge } from '../../utils/index.js';
import { openModal, closeModal } from '../../components/modal/modal.js';
import { showToast } from '../../components/toast/toast.js';

let _plc = 1;
let _cid = null;

export function renderRequests(filter) {
  const allReq = getRequests();
  const isAdmin = App.user.role === 'admin';
  let reqs = isAdmin ? allReq : allReq.filter(r => r.createdBy === App.user.id);
  if (filter !== 'all') reqs = reqs.filter(r => r.status === filter);
  reqs = [...reqs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const mine = allReq.filter(r => isAdmin || r.createdBy === App.user.id);
  const counts = { all: mine.length, pending: mine.filter(r => r.status === 'pending').length };

  document.getElementById('sectionRequests').innerHTML = `
  <div class="ph"><div class="ph-info"><h2>${isAdmin ? 'All Requests' : 'My Requests'}</h2><p>${isAdmin ? 'Review and approve incoming requests' : 'Track your submitted requests'}</p></div>
    <div class="ph-actions">${!isAdmin ? `<button class="btn btn-gold" onclick="openNewRequestModal()">＋ New Request</button>` : ''}</div></div>
  <div class="fbar">
    <button class="ftab ${filter === 'all' ? 'active' : ''}" onclick="renderRequests('all')">All (${counts.all})</button>
    <button class="ftab ${filter === 'pending' ? 'active' : ''}" onclick="renderRequests('pending')">Pending (${counts.pending})</button>
    <button class="ftab ${filter === 'approved' ? 'active' : ''}" onclick="renderRequests('approved')">Approved</button>
    <button class="ftab ${filter === 'rejected' ? 'active' : ''}" onclick="renderRequests('rejected')">Rejected</button>
  </div>
  <div class="cards-grid">${reqs.length ? reqs.map(r => _reqCard(r, isAdmin)).join('') : '<div class="empty" style="grid-column:1/-1"><div class="empty-icon">◌</div><h4>No requests found</h4><p>Adjust the filter</p></div>'}</div>`;
}

function _reqCard(r, isAdmin) {
  const rows = r.products.map(p => `<div class="rcard-prod-row"><span>${p.name} <span style="color:var(--mute);font-size:11px">[${p.colorCode}]</span></span><span>${p.qty}${p.unit} × ${fmtCur(p.price)}</span></div>`).join('');
  const act = isAdmin && r.status === 'pending'
    ? `<button class="btn btn-green btn-sm" style="flex:1" onclick="approveRequest('${r.id}')">✓ Approve</button><button class="btn btn-danger btn-sm" style="flex:1" onclick="promptReject('${r.id}')">✕ Reject</button>`
    : '';
  const rej = r.status === 'rejected' && r.rejectionReason
    ? `<div style="background:var(--red-l);border-radius:6px;padding:7px 10px;font-size:12px;color:var(--red);margin-bottom:8px">✕ ${r.rejectionReason}</div>`
    : '';
  return `<div class="rcard">
    <div class="rcard-top"><div><div class="rcard-client">${r.clientName}</div><div class="rcard-ref">${r.ref}</div></div>${statusBadge(r.status)}</div>
    <div class="rcard-meta"><div class="rcard-meta-row">📞 ${r.phone}</div><div class="rcard-meta-row">📍 ${r.address}</div><div class="rcard-meta-row">👤 ${r.salesName} · ${fmtDate(r.createdAt)}</div></div>
    <div class="rcard-products">${rows}<div class="rcard-total"><span style="color:var(--mute);font-size:12.5px;font-weight:600">Total</span><span style="color:var(--gold-d)">${fmtCur(r.totalAmount)}</span></div></div>
    ${r.notes ? `<div style="font-size:12px;color:var(--mute);margin-bottom:8px">📝 ${r.notes}</div>` : ''}${rej}${act ? `<div class="rcard-actions">${act}</div>` : ''}</div>`;
}

export function approveRequest(reqId) {
  const reqs = getRequests();
  const req = reqs.find(r => r.id === reqId);
  if (!req) return;
  req.status = 'approved';
  saveRequests(reqs);
  const cnt = getOrderCounter() + 1;
  setOrderCounter(cnt);
  const today = new Date().toISOString().split('T')[0];
  const rn = 'EH-' + today.replace(/-/g, '').substring(2) + '-' + String(cnt).padStart(4, '0');
  const order = {
    id: 'o' + Date.now(), recipeNum: rn, requestId: reqId, source: 'sales',
    clientId: req.clientId, clientName: req.clientName, clientPhone: req.phone, clientAddress: req.address,
    products: req.products.map(p => ({ ...p, delivered: 0 })),
    totalAmount: req.totalAmount, paidAmount: 0, paymentStatus: 'unpaid', status: 'pending',
    payments: [], mixerId: '', mixerName: 'Unassigned', deliveryId: '', deliveryName: 'Unassigned',
    salesId: req.createdBy, salesName: req.salesName, notes: '',
    activity: [{ text: `Order created from ${req.ref} — Recipe: ${rn}`, time: today + ' ' + new Date().toTimeString().slice(0, 5), user: App.user.name }],
    createdAt: today,
  };
  const ords = getOrders(); ords.push(order); saveOrders(ords);
  window._renderNav(); window._updateNotifDot();
  showToast(`✓ Approved — ${rn}`, 'toast-gold');
  if (App.section === 'requests') renderRequests('all');
  else if (App.section === 'dashboard') window.renderDashboard();
}

export function promptReject(reqId) {
  openModal(`<div class="mh"><div class="mh-left"><h3>Reject Request</h3></div><button class="mx" onclick="closeModal()">✕</button></div>
  <div class="mc"><p style="color:var(--mute);margin-bottom:14px">Provide a reason so the sales rep can follow up.</p>
    <div class="fg"><label class="fl req">Rejection Reason</label>
      <textarea class="fi" id="rejReason" rows="3" placeholder="e.g. Color not in stock…" style="resize:none"></textarea></div></div>
  <div class="mf"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-danger" onclick="doReject('${reqId}')">Confirm Rejection</button></div>`, 'modal-sm');
}

export function doReject(reqId) {
  const r = document.getElementById('rejReason').value.trim();
  if (!r) { alert('Please enter a reason.'); return; }
  const reqs = getRequests(); const req = reqs.find(x => x.id === reqId);
  if (req) { req.status = 'rejected'; req.rejectionReason = r; saveRequests(reqs); }
  closeModal(); window._renderNav(); window._updateNotifDot();
  showToast('Request rejected', 'toast-red');
  if (App.section === 'requests') renderRequests('all');
  else if (App.section === 'dashboard') window.renderDashboard();
}

export function openNewRequestModal() {
  const clients = getClients();
  openModal(`<div class="mh"><div class="mh-left"><h3>New Sales Request</h3></div><button class="mx" onclick="closeModal()">✕</button></div>
  <div class="mc">
    <div class="fsec">Client Information</div>
    <div class="fr2">
      <div class="fg"><label class="fl req">Client Name</label>
        <input class="fi" id="nr_client" list="cList" placeholder="Search or type name…" oninput="fillClient()">
        <datalist id="cList">${clients.map(c => `<option value="${c.name}">`).join('')}</datalist></div>
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
        <input class="fi fi-sm" type="number" placeholder="Qty" id="pq_0" oninput="calcTotal()">
        <input class="fi fi-sm" type="number" placeholder="Price/unit" id="pp_0" oninput="calcTotal()">
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
  const c = getClients().find(x => x.name === v);
  if (c) {
    document.getElementById('nr_phone').value = c.phone || '';
    document.getElementById('nr_address').value = c.address || '';
    document.getElementById('nr_email').value = c.email || '';
    _cid = c.id;
  } else { _cid = null; }
}

export function addPline() {
  const i = _plc++;
  const w = document.getElementById('plines');
  const d = document.createElement('div'); d.className = 'pline'; d.id = 'pl_' + i;
  d.innerHTML = `<input class="fi fi-sm" placeholder="Product name" id="pn_${i}" oninput="calcTotal()"><input class="fi fi-sm" placeholder="Color Code" id="pc_${i}"><input class="fi fi-sm" placeholder="Color Name" id="pcn_${i}"><input class="fi fi-sm" type="number" placeholder="Qty" id="pq_${i}" oninput="calcTotal()"><input class="fi fi-sm" type="number" placeholder="Price/unit" id="pp_${i}" oninput="calcTotal()"><button class="pline-rm" onclick="removePline(${i})">✕</button>`;
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

export function submitNewRequest() {
  const client = document.getElementById('nr_client').value.trim();
  const phone = document.getElementById('nr_phone').value.trim();
  const addr = document.getElementById('nr_address').value.trim();
  if (!client || !phone || !addr) { alert('Client name, phone and address are required.'); return; }
  const products = [];
  document.querySelectorAll('.pline').forEach(pl => {
    const i = pl.id.replace('pl_', '');
    const name = (document.getElementById('pn_' + i)?.value || '').trim();
    const qty = parseFloat(document.getElementById('pq_' + i)?.value) || 0;
    const price = parseFloat(document.getElementById('pp_' + i)?.value) || 0;
    if (name && qty > 0) products.push({ name, colorCode: document.getElementById('pc_' + i)?.value || '', colorName: document.getElementById('pcn_' + i)?.value || '', qty, unit: 'L', price, total: qty * price });
  });
  if (!products.length) { alert('Add at least one product.'); return; }
  const total = products.reduce((a, p) => a + p.total, 0);
  const cnt = getReqCounter() + 1; setReqCounter(cnt);
  const ref = 'REQ-' + String(cnt).padStart(3, '0');
  const req = {
    id: 'r' + Date.now(), ref, clientId: _cid || '', clientName: client, phone,
    email: document.getElementById('nr_email').value || '', address: addr, products,
    totalAmount: total, notes: document.getElementById('nr_notes').value || '',
    status: 'pending', createdBy: App.user.id, salesName: App.user.name, createdAt: new Date().toISOString(),
  };
  const reqs = getRequests(); reqs.push(req); saveRequests(reqs);
  closeModal(); window._renderNav(); window._updateNotifDot();
  showToast(`${ref} submitted`, 'toast-gold'); renderRequests('all');
}
