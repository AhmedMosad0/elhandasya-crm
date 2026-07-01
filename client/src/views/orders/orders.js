import { App } from '../../state/store.js';
import * as api from '../../api/index.js';
import { fmtDate, fmtCur, cap, statusBadge, payBadge } from '../../utils/index.js';
import { openModal, closeModal } from '../../components/modal/modal.js';
import { showToast } from '../../components/toast/toast.js';

export async function renderOrders(filter, q) {
  document.getElementById('sectionOrders').innerHTML = '<div class="empty" style="padding:40px">Loading orders…</div>';
  try {
    const all = await api.getOrders();
    let ords = all;
    if (filter === 'unpaid') ords = ords.filter(o => o.paymentStatus === 'unpaid');
    else if (filter !== 'all') ords = ords.filter(o => o.status === filter);
    if (q) { const ql = q.toLowerCase(); ords = ords.filter(o => o.clientName.toLowerCase().includes(ql) || o.recipeNum.toLowerCase().includes(ql)); }
    ords = [...ords].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const c = { all:all.length, pending:all.filter(o=>o.status==='pending').length, partial:all.filter(o=>o.status==='partial').length, delivered:all.filter(o=>o.status==='delivered').length, unpaid:all.filter(o=>o.paymentStatus==='unpaid').length };
    document.getElementById('sectionOrders').innerHTML = `
    <div class="ph"><div class="ph-info"><h2>Orders</h2><p>Track delivery, payment and assignments</p></div></div>
    <div class="fbar">
      <button class="ftab ${!filter||filter==='all'?'active':''}" onclick="renderOrders('all')">All (${c.all})</button>
      <button class="ftab ${filter==='pending'?'active':''}" onclick="renderOrders('pending')">Active (${c.pending})</button>
      <button class="ftab ${filter==='partial'?'active':''}" onclick="renderOrders('partial')">Partial (${c.partial})</button>
      <button class="ftab ${filter==='delivered'?'active':''}" onclick="renderOrders('delivered')">Delivered (${c.delivered})</button>
      <button class="ftab ${filter==='unpaid'?'active':''}" onclick="renderOrders('unpaid')">Unpaid (${c.unpaid})</button>
    </div>
    <div class="cards-grid">${ords.length ? ords.map(o => _orderCard(o)).join('') : '<div class="empty" style="grid-column:1/-1"><div class="empty-icon">▣</div><h4>No orders found</h4></div>'}</div>`;
  } catch (err) {
    document.getElementById('sectionOrders').innerHTML = '<div class="empty" style="padding:40px">Failed to load orders</div>';
    showToast('Error: ' + err.message, 'toast-red');
  }
}

function _orderCard(o) {
  const pct = o.totalAmount > 0 ? Math.round(o.paidAmount / o.totalAmount * 100) : 0;
  const bc = { pending:'oc-gold', mixing:'oc-blue', ready:'oc-slate', partial:'oc-amber', delivered:'oc-green' }[o.status] || 'oc-gold';
  return `<div class="ocard ${bc}" onclick="openOrderModal('${o.id}')">
    <div class="ocard-head"><span class="recipe-tag">${o.recipeNum}</span>${o.source==='client'?`<span class="badge b-direct" style="font-size:10px">Client Portal</span>`:statusBadge(o.status)}</div>
    <div class="ocard-client">${o.clientName}</div><div class="ocard-date">${fmtDate(o.createdAt)}</div>
    <div class="ocard-badges">${statusBadge(o.status)}${payBadge(o.paymentStatus)}</div>
    <div class="pay-bar-wrap"><div class="pay-bar-fill" style="width:${pct}%"></div></div>
    <div class="pay-mini"><span>${fmtCur(o.paidAmount)} paid</span><span>${pct}%</span></div>
    <div class="ocard-assign"><span class="assignee"><span class="assignee-dot">M</span>${o.mixerName||'Unassigned'}</span>
      <span class="assignee"><span class="assignee-dot">D</span>${o.deliveryName||'Unassigned'}</span></div>
  </div>`;
}

export async function openOrderModal(oid) {
  try {
    const isAdmin = App.user.role === 'admin';
    const [o, users] = await Promise.all([
      api.getOrder(oid),
      isAdmin ? api.getUsers() : Promise.resolve([]),
    ]);
    if (!o) return;
    const canDel  = App.user.role === 'delivery' && o.deliveryId === App.user.id;
    const mixers  = users.filter(u => u.role === 'mixer');
    const delvrs  = users.filter(u => u.role === 'delivery');
    const pct = o.totalAmount > 0 ? Math.round(o.paidAmount / o.totalAmount * 100) : 0;
    const ditems = o.products.map((p, i) => {
      const done = p.delivered >= p.qty; const can = isAdmin || canDel;
      return `<div class="ditem${done?' done':''}" id="di_${i}">
        <div class="dchk${done?' on':''}" id="dc_${i}" ${can?`onclick="togDel('${oid}',${i})"` :'style="cursor:default"'}>${done?'✓':''}</div>
        <div class="ditem-info"><div class="ditem-name">${p.name}</div><div class="ditem-detail">[${p.colorCode}] ${p.colorName}</div></div>
        <div class="ditem-qty">${p.delivered||0}/${p.qty} ${p.unit}</div>
      </div>`;
    }).join('');
    const pays = o.payments && o.payments.length
      ? o.payments.map(pay => `<div class="pay-entry"><div><strong>${fmtCur(pay.amount)}</strong><div class="pe-meta">${pay.note||'—'}</div></div><div style="text-align:right"><div class="pe-amount">${fmtCur(pay.amount)}</div><div class="pe-meta">${pay.date}</div></div></div>`).join('')
      : `<div style="color:var(--mute);font-size:13px;padding:10px 0">No payments recorded yet</div>`;
    const acts = (o.activity || []).slice().reverse().map(a => `<div class="act-item"><div class="act-dot"></div><div class="act-body">${a.text}<div class="act-time">${a.time} · ${a.user}</div></div></div>`).join('');
    const assignSec = isAdmin ? `
      <div class="fsec">Assignments</div>
      <div class="assign-grid">
        <div class="assign-card"><div class="assign-role">Color Mixer</div>
          <select onchange="assignUser('${oid}','mixer',this.value)">
            <option value="">— Unassigned —</option>
            ${mixers.map(m=>`<option value="${m.id}"${o.mixerId===m.id?' selected':''}>${m.name}</option>`).join('')}
          </select></div>
        <div class="assign-card"><div class="assign-role">Delivery Agent</div>
          <select onchange="assignUser('${oid}','delivery',this.value)">
            <option value="">— Unassigned —</option>
            ${delvrs.map(d=>`<option value="${d.id}"${o.deliveryId===d.id?' selected':''}>${d.name}</option>`).join('')}
          </select></div>
      </div>
      <div class="fr2">
        <div class="fg"><label class="fl">Order Status</label>
          <select class="fi" onchange="updateOrderStatus('${oid}',this.value)">
            ${['pending','mixing','ready','partial','delivered'].map(s=>`<option value="${s}"${o.status===s?' selected':''}>${cap(s)}</option>`).join('')}
          </select></div>
        <div class="fg"><label class="fl">Payment Status</label>
          <select class="fi" onchange="updatePayStatus('${oid}',this.value)">
            ${['unpaid','partial','paid'].map(s=>`<option value="${s}"${o.paymentStatus===s?' selected':''}>${cap(s)}</option>`).join('')}
          </select></div>
      </div>` : '';
    openModal(`<div class="mh"><div class="mh-left"><h3>${o.clientName}</h3><span class="mh-recipe">${o.recipeNum}</span></div><button class="mx" onclick="closeModal()">✕</button></div>
    <div class="mc">
      <div class="two-col" style="margin-bottom:16px">
        <div class="info-block">
          <div class="info-row"><span class="ir-label">Client</span><span class="ir-val">${o.clientName}</span></div>
          <div class="info-row"><span class="ir-label">Phone</span><span class="ir-val">${o.clientPhone}</span></div>
          <div class="info-row"><span class="ir-label">Address</span><span class="ir-val">${o.clientAddress}</span></div>
          <div class="info-row"><span class="ir-label">Source</span><span class="ir-val">${o.source==='client'?'Client Portal':'Sales'}</span></div>
        </div>
        <div class="info-block">
          <div class="info-row"><span class="ir-label">Status</span><span class="ir-val">${statusBadge(o.status)}</span></div>
          <div class="info-row"><span class="ir-label">Payment</span><span class="ir-val">${payBadge(o.paymentStatus)}</span></div>
          <div class="info-row"><span class="ir-label">Total</span><span class="ir-val" style="color:var(--gold-d);font-weight:800">${fmtCur(o.totalAmount)}</span></div>
          <div class="info-row"><span class="ir-label">Date</span><span class="ir-val">${fmtDate(o.createdAt)}</span></div>
        </div>
      </div>
      <div class="fsec">Delivery Tracking</div>
      <div id="deliveryItems">${ditems}</div>
      <div class="fsec">Payment</div>
      <div class="pay-section">
        <div class="pay-nums">
          <div class="pay-num pn-slate"><div class="pn-val">${fmtCur(o.totalAmount)}</div><div class="pn-lbl">Total</div></div>
          <div class="pay-num pn-green"><div class="pn-val">${fmtCur(o.paidAmount)}</div><div class="pn-lbl">Paid</div></div>
          <div class="pay-num pn-red"><div class="pn-val">${fmtCur(o.totalAmount-o.paidAmount)}</div><div class="pn-lbl">Remaining</div></div>
        </div>
        <div class="pay-bar-wrap" style="height:9px"><div class="pay-bar-fill" style="width:${pct}%"></div></div>
        <div class="pay-mini"><span>${pct}% collected</span></div>
        <div class="pay-list" style="margin-top:12px">${pays}</div>
        ${isAdmin?`<button class="btn btn-green btn-sm" style="margin-top:8px" onclick="openAddPayment('${oid}')">＋ Add Payment</button>`:''}
      </div>
      ${assignSec}
      <div class="fsec">Activity Log</div>
      <div class="activity-log">${acts||'<div style="color:var(--mute);font-size:13px">No activity yet</div>'}</div>
    </div>
    <div class="mf"><button class="btn btn-ghost" onclick="printReceipt('${oid}')">🖨 Print</button>
      <button class="btn btn-ghost" onclick="closeModal()">Close</button></div>`, 'modal-lg');
  } catch (err) {
    showToast('Failed to load order: ' + err.message, 'toast-red');
  }
}

export async function togDel(oid, idx) {
  try {
    const o = await api.getOrder(oid);
    if (!o) return;
    const p = o.products[idx];
    const newDelivered = p.delivered >= p.qty ? 0 : p.qty;
    await api.updateOrderStatus(oid, { productId: p.id, delivered: newDelivered });
    showToast(newDelivered > 0 ? 'Item delivered' : 'Delivery reset', 'toast-gold');
    await openOrderModal(oid);
  } catch (err) {
    showToast('Failed: ' + err.message, 'toast-red');
  }
}

export async function assignUser(oid, role, uid) {
  if (!uid) return;
  try {
    await api.assignOrder(oid, { role, userId: uid });
    showToast('Assignment saved', 'toast-gold');
  } catch (err) {
    showToast('Failed to assign: ' + err.message, 'toast-red');
  }
}

export async function updateOrderStatus(oid, val) {
  try {
    await api.updateOrderStatus(oid, { status: val });
    showToast('Status updated', 'toast-gold');
  } catch (err) {
    showToast('Failed: ' + err.message, 'toast-red');
  }
}

export async function updatePayStatus(oid, val) {
  try {
    await api.updateOrderStatus(oid, { paymentStatus: val });
    showToast('Payment status updated', 'toast-gold');
  } catch (err) {
    showToast('Failed: ' + err.message, 'toast-red');
  }
}

export function openAddPayment(oid) {
  openModal(`<div class="mh"><div class="mh-left"><h3>Add Payment</h3></div><button class="mx" onclick="closeModal()">✕</button></div>
  <div class="mc">
    <div class="fr2">
      <div class="fg"><label class="fl req">Amount (EGP)</label><input class="fi" type="number" id="pay_amt" placeholder="0.00"></div>
      <div class="fg"><label class="fl req">Date</label><input class="fi" type="date" id="pay_dt" value="${new Date().toISOString().split('T')[0]}"></div>
    </div>
    <div class="fg"><label class="fl">Note</label><input class="fi" id="pay_nt" placeholder="e.g. Cash, partial…"></div>
  </div>
  <div class="mf"><button class="btn btn-ghost" onclick="openOrderModal('${oid}')">← Back</button>
    <button class="btn btn-green" onclick="savePayment('${oid}')">Save Payment</button></div>`, 'modal-sm');
}

export async function savePayment(oid) {
  const amt = parseFloat(document.getElementById('pay_amt').value) || 0;
  const dt  = document.getElementById('pay_dt').value;
  if (!amt || !dt) { alert('Enter amount and date.'); return; }
  try {
    await api.addPayment(oid, { amount: amt, date: dt, note: document.getElementById('pay_nt').value, by: App.user.name });
    showToast(`${fmtCur(amt)} payment saved`, 'toast-green');
    await openOrderModal(oid);
  } catch (err) {
    showToast('Failed to save payment: ' + err.message, 'toast-red');
  }
}

export async function printReceipt(oid) {
  // Open the window synchronously (before any await) so popup blockers allow it
  const w = window.open('', '_blank');
  if (!w) { showToast('Popup blocked — allow popups for printing.', 'toast-red'); return; }
  w.document.write('<html><body style="font-family:Arial,sans-serif;padding:40px">Loading receipt…</body></html>');
  try {
    const o = await api.getOrder(oid);
    if (!o) { w.close(); return; }
    w.document.open();
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt ${o.recipeNum}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;max-width:680px;margin:0 auto;color:#201f23}
    .logo-row{display:flex;align-items:center;gap:14px;margin-bottom:24px;border-bottom:2px solid #c9b298;padding-bottom:16px}
    .logo-name{font-size:18px;font-weight:800;letter-spacing:1px;text-transform:uppercase}
    .logo-sub{font-size:10px;color:#7f7f7f;letter-spacing:.5px;text-transform:uppercase;margin-top:2px}
    h3{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#7f7f7f;margin:18px 0 8px}
    table{width:100%;border-collapse:collapse}
    th{text-align:left;font-size:11px;color:#7f7f7f;padding:7px 0;border-bottom:1px solid #e5e5e4;text-transform:uppercase}
    td{padding:9px 0;border-bottom:1px solid #f0efec;font-size:13px}
    .total-row{font-weight:800;font-size:15px;border-top:2px solid #c9b298}
    .footer{margin-top:32px;text-align:center;font-size:11px;color:#7f7f7f;line-height:1.8}
    @media print{@page{margin:20mm}}</style></head><body>
    <div class="logo-row">
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none"><path d="M22 2.5L40.5 12.8V31.2L22 41.5L3.5 31.2V12.8L22 2.5Z" fill="#201f23" stroke="#c9b298" stroke-width="1.5"/><path d="M12.5 15H15.5V22H28.5V15H31.5V29H28.5V24H15.5V29H12.5V15Z" fill="#c9b298"/></svg>
      <div><div class="logo-name">El Handasya</div><div class="logo-sub">Protective &amp; Decorative Paints</div></div>
    </div>
    <div style="font-family:monospace;font-size:13px;color:#7f7f7f;margin-bottom:24px">Receipt: ${o.recipeNum} · ${fmtDate(o.createdAt)}</div>
    <h3>Client</h3>
    <p>${o.clientName} · ${o.clientPhone}<br>${o.clientAddress}</p>
    <h3>Products</h3>
    <table><thead><tr><th>Product</th><th>Color</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
    <tbody>${o.products.map(p=>`<tr><td>${p.name}</td><td>[${p.colorCode}] ${p.colorName}</td><td>${p.qty}${p.unit}</td><td>${fmtCur(p.price)}</td><td>${fmtCur(p.total)}</td></tr>`).join('')}
    <tr class="total-row"><td colspan="4" style="text-align:right;padding-right:12px">Total</td><td>${fmtCur(o.totalAmount)}</td></tr>
    <tr><td colspan="4" style="text-align:right;padding-right:12px;color:#2e7d4f">Paid</td><td style="color:#2e7d4f">${fmtCur(o.paidAmount)}</td></tr>
    <tr><td colspan="4" style="text-align:right;padding-right:12px;color:#c0392b">Balance</td><td style="color:#c0392b">${fmtCur(o.totalAmount-o.paidAmount)}</td></tr>
    </tbody></table>
    <div class="footer">El Handasya · Protective and Decorative Paints<br>Mohamed Diaa Authorized Dealership<br>Thank you for your business</div>
    <script>window.onload=()=>{window.print()}<\/script></body></html>`);
    w.document.close();
  } catch (err) {
    w.close();
    showToast('Failed to load receipt: ' + err.message, 'toast-red');
  }
}
