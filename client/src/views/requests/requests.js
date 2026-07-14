import { App } from '../../state/store.js';
import * as api from '../../api/index.js';
import { fmtDate, fmtCur, statusBadge } from '../../utils/index.js';
import { openModal, closeModal } from '../../components/modal/modal.js';
import { showToast } from '../../components/toast/toast.js';
import { openProductPicker } from '../../components/ProductPicker/product-picker.js';
import { t } from '../../i18n/index.js';

let _plc  = 1;
let _cplc = 1;
let _cid  = null;
let _clientsCache = [];
let _reqsCache    = [];

function _reqStatusLabel(s) {
  return {
    pending:           t('clientOrders.underReview'),
    approved:          t('clientOrders.beingPriced'),
    pricing_submitted: t('clientOrders.pricingUnderReview'),
    final_approved:    t('clientOrders.confirmed'),
    rejected:          t('clientOrders.notApproved'),
  }[s] || s;
}

const CS_CFG = {
  callback:    { label: '📞 Callback',     color: '#b45309', bg: '#fdf3dc' },
  following:   { label: '👀 Following Up',  color: '#1d4ed8', bg: '#eff6ff' },
  no_answer:   { label: '📵 No Answer',     color: '#6b7280', bg: '#f3f4f6' },
  low_budget:  { label: '💸 Low Budget',    color: '#c2410c', bg: '#fff7ed' },
  lead:        { label: '🆕 New Lead',      color: '#15803d', bg: '#f0fdf4' },
  out_of_zone: { label: '🚫 Out of Zone',   color: '#b91c1c', bg: '#fef2f2' },
};

function _isDelayed(r) {
  const OPEN = ['pending', 'approved', 'pricing_submitted'];
  if (!OPEN.includes(r.status)) return false;
  return (Date.now() - new Date(r.createdAt).getTime()) > 24 * 60 * 60 * 1000;
}

function _ageStr(r) {
  const h = Math.floor((Date.now() - new Date(r.createdAt).getTime()) / 3600000);
  const d = Math.floor(h / 24);
  return d > 0 ? `${d}d ${h % 24}h` : `${h}h`;
}

function _relTime(isoStr) {
  if (!isoStr) return '';
  const m = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function _sortDelayedFirst(arr) {
  return [...arr].sort((a, b) => {
    const da = _isDelayed(a) ? 0 : 1;
    const db = _isDelayed(b) ? 0 : 1;
    if (da !== db) return da - db;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function _delayBadge(r) {
  if (!_isDelayed(r)) return '';
  return `<div style="font-size:11px;font-weight:700;color:#dc2626;background:#fef2f2;border-radius:99px;padding:1px 8px;display:inline-block;margin-bottom:6px">⏰ ${t('requests.delayed')} ${_ageStr(r)}</div>`;
}

function _callStatusBadge(r) {
  if (!r.callStatus) return '';
  const cfg = CS_CFG[r.callStatus] || { label: r.callStatus, color: '#6b7280', bg: '#f3f4f6' };
  const meta = r.callStatusBy
    ? `<span style="font-size:10.5px;color:var(--mute);margin-left:6px">${t('requests.byLabel')} ${r.callStatusBy}${r.callStatusAt ? ' · ' + _relTime(r.callStatusAt) : ''}</span>`
    : '';
  return `<div style="margin-bottom:6px"><span style="font-size:11.5px;font-weight:700;padding:2px 9px;border-radius:99px;background:${cfg.bg};color:${cfg.color}">${cfg.label}</span>${meta}</div>`;
}

function _adminNotesBlock(r, isAdmin) {
  const noteHtml = r.adminNotes
    ? `<div style="background:#fdf3dc;border-left:3px solid #f59e0b;border-radius:4px;padding:7px 10px;font-size:12.5px;color:#92400e;margin-bottom:8px">📝 ${r.adminNotes}</div>`
    : '';
  if (isAdmin) {
    return noteHtml + `<button class="btn btn-ghost btn-xs" onclick="openAdminNotesModal('${r.id}')" style="margin-bottom:8px;font-size:11px">${r.adminNotes ? t('requests.editNote') : t('requests.addNote')}</button>`;
  }
  return noteHtml;
}

function _cwpBlock(r, isAdmin) {
  if (isAdmin) {
    const show = r.status === 'final_approved' || r.claimWithoutPayment;
    if (!show) return '';
    return `<label style="display:flex;align-items:center;gap:7px;font-size:12px;cursor:pointer;margin-bottom:8px;color:var(--mute)">
      <input type="checkbox" ${r.claimWithoutPayment ? 'checked' : ''} onchange="toggleClaimWithoutPayment('${r.id}', this.checked)">
      ${t('requests.cwpLabel')}
    </label>`;
  }
  if (r.claimWithoutPayment) {
    return `<div style="background:#fff7ed;border:1px solid #f97316;border-radius:6px;padding:6px 10px;font-size:12px;color:#c2410c;font-weight:600;margin-bottom:8px">${t('requests.cwpBadge')}</div>`;
  }
  return '';
}

function _consultSummary(r) {
  const parts = [];
  if (r.surfaceType) parts.push(r.surfaceType === 'internal' ? t('clientNewOrder.internal') : t('clientNewOrder.external'));
  if (r.texture) {
    const tex = { concrete: t('clientNewOrder.concrete'), wood: t('clientNewOrder.wood'), gypsum_board: t('clientNewOrder.gypsumBoard') };
    parts.push(tex[r.texture] || r.texture);
  }
  if (r.spaceType === 'room' && r.roomLength && r.roomWidth) {
    parts.push(`📐 ${r.roomLength}×${r.roomWidth}m${r.roomHeight ? ` h${r.roomHeight}` : ''}`);
  } else if (r.spaceType === 'apartment' && r.numRooms) {
    parts.push(`🏢 ${r.numRooms} rooms${r.apartmentArea ? `, ${r.apartmentArea}m²` : ''}`);
  }
  return parts.join(' · ');
}

// ── MAIN RENDER ──
export async function renderRequests(filter) {
  document.getElementById('sectionRequests').innerHTML = `<div class="empty" style="padding:40px">${t('requests.loading')}</div>`;
  try {
    _reqsCache = await api.getRequests();
    const isAdmin = App.user.role === 'admin';
    const isSales = App.user.role === 'sales';
    if (isAdmin)      await _renderAdminRequests(filter);
    else if (isSales) await _renderSalesRequests();
    else              _renderClientRequests();
  } catch (err) {
    document.getElementById('sectionRequests').innerHTML = `<div class="empty" style="padding:40px">${t('requests.failed')}</div>`;
    showToast('Error: ' + err.message, 'toast-red');
  }
}

// ── ADMIN VIEW ──
async function _renderAdminRequests(filter) {
  const allReq = _reqsCache;
  let reqs = allReq;
  if (filter && filter !== 'all') reqs = reqs.filter(r => r.status === filter);
  reqs = _sortDelayedFirst(reqs);

  const delayed = allReq.filter(r => _isDelayed(r)).length;
  const counts = {
    all:               allReq.length,
    pending:           allReq.filter(r => r.status === 'pending').length,
    pricing_submitted: allReq.filter(r => r.status === 'pricing_submitted').length,
    rejected:          allReq.filter(r => r.status === 'rejected').length,
  };

  document.getElementById('sectionRequests').innerHTML = `
  <div class="ph"><div class="ph-info"><h2>${t('requests.title')}</h2><p>${t('requests.titleSub')}</p></div></div>
  <div class="kpi-grid" style="margin-bottom:20px">
    <div class="kpi kpi-red" style="padding:14px 18px"><span class="kpi-icon" style="font-size:18px">⏰</span><div class="kpi-label">${t('requests.delayed')}</div><div class="kpi-val" style="font-size:20px;color:#dc2626">${delayed}</div><div class="kpi-sub">${t('requests.openOver24h')}</div></div>
  </div>
  <div class="fbar">
    <button class="ftab ${!filter||filter==='all'?'active':''}" onclick="renderRequests('all')">${t('requests.all')} (${counts.all})</button>
    <button class="ftab ${filter==='pending'?'active':''}" onclick="renderRequests('pending')">${t('requests.pending')} (${counts.pending})</button>
    <button class="ftab ${filter==='pricing_submitted'?'active':''}" onclick="renderRequests('pricing_submitted')">${t('requests.pricingReview')} (${counts.pricing_submitted})</button>
    <button class="ftab ${filter==='rejected'?'active':''}" onclick="renderRequests('rejected')">${t('requests.rejected')} (${counts.rejected})</button>
  </div>
  <div class="cards-grid">${reqs.length
    ? reqs.map(r => _adminReqCard(r)).join('')
    : `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">◌</div><h4>${t('requests.noRequests')}</h4><p>${t('requests.adjustFilter')}</p></div>`
  }</div>`;
}

function _adminReqCard(r) {
  const isConsult = r.requestType === 'consultation';
  const delayed   = _isDelayed(r);

  const rows = r.products.map(p =>
    `<div class="rcard-prod-row">
      <span>${p.name} <span style="color:var(--mute);font-size:11px">[${p.colorCode}]</span></span>
      <span>${p.qty} L${p.price > 0 ? ' × ' + fmtCur(p.price) : ''}</span>
    </div>`
  ).join('');

  let act = '';
  if (r.status === 'pending') {
    if (r.source === 'client') {
      act = `<button class="btn btn-green btn-sm" style="flex:1" onclick="promptApproveWithSales('${r.id}')">${t('requests.approveAssignBtn')}</button>
             <button class="btn btn-danger btn-sm" style="flex:1" onclick="promptReject('${r.id}')">${t('requests.rejectBtn')}</button>`;
    } else {
      act = `<button class="btn btn-green btn-sm" style="flex:1" onclick="approveRequest('${r.id}')">${t('requests.approveBtn')}</button>
             <button class="btn btn-danger btn-sm" style="flex:1" onclick="promptReject('${r.id}')">${t('requests.rejectBtn')}</button>`;
    }
  } else if (r.status === 'pricing_submitted') {
    act = `<button class="btn btn-green btn-sm" style="flex:1" onclick="doFinalApprove('${r.id}')">${t('requests.finalApproveBtn')}</button>
           <button class="btn btn-danger btn-sm" style="flex:1" onclick="promptReject('${r.id}')">${t('requests.rejectBtn')}</button>`;
  }

  const rej = r.status === 'rejected' && r.rejectionReason
    ? `<div style="background:var(--red-l);border-radius:6px;padding:7px 10px;font-size:12px;color:var(--red);margin-bottom:8px">✕ ${r.rejectionReason}</div>`
    : '';

  const assignedInfo = r.assignedSalesName
    ? `<div class="rcard-meta-row">🧾 ${t('requests.assignedTo')}: <strong>${r.assignedSalesName}</strong></div>`
    : '';

  const srcBadge = r.source === 'client'
    ? `<span style="font-size:10px;padding:1px 7px;border-radius:99px;background:var(--blue-l);color:var(--blue);font-weight:700">${t('requests.srcClient')}</span>`
    : `<span style="font-size:10px;padding:1px 7px;border-radius:99px;background:var(--border-l);color:var(--mute);font-weight:700">${t('requests.srcSales')}</span>`;

  const consultBadge = isConsult
    ? `<span style="font-size:10px;padding:1px 7px;border-radius:99px;background:#eff6ff;color:#2563eb;font-weight:700;margin-left:4px">${t('requests.consultBadge')}</span>`
    : '';

  const consultBlock = isConsult ? (() => {
    const summary = _consultSummary(r);
    return `<div style="background:#eff6ff;border-radius:6px;padding:8px 10px;font-size:12px;color:#1d4ed8;margin-bottom:8px">
      💬 <strong>${t('requests.consultBadge')}</strong>${summary ? ' · ' + summary : ''}
      ${r.consultNotes ? `<div style="color:var(--mute);margin-top:3px">📝 ${r.consultNotes}</div>` : ''}
    </div>`;
  })() : '';

  const productsBlock = (!isConsult || r.products.length > 0) ? `
    <div class="rcard-products">${rows}
      <div class="rcard-total"><span style="color:var(--mute);font-size:12.5px;font-weight:600">${t('requests.total')}</span><span style="color:var(--gold-d)">${r.totalAmount > 0 ? fmtCur(r.totalAmount) : t('requests.tbd')}</span></div>
    </div>` : '';

  return `<div class="rcard${delayed ? ' delayed-card' : ''}">
    ${_delayBadge(r)}
    <div class="rcard-top"><div><div class="rcard-client">${r.clientName}</div><div class="rcard-ref">${r.ref} ${srcBadge}${consultBadge}</div></div>${statusBadge(r.status)}</div>
    <div class="rcard-meta"><div class="rcard-meta-row">📞 ${r.phone}</div><div class="rcard-meta-row">📍 ${r.address}</div><div class="rcard-meta-row">👤 ${r.salesName} · ${fmtDate(r.createdAt)}</div>${assignedInfo}</div>
    ${_callStatusBadge(r)}
    ${consultBlock}${productsBlock}
    ${r.notes ? `<div style="font-size:12px;color:var(--mute);margin-bottom:8px">📝 ${r.notes}</div>` : ''}
    ${rej}
    ${_adminNotesBlock(r, true)}
    ${_cwpBlock(r, true)}
    <button class="btn btn-ghost btn-xs" onclick="openCallStatusModal('${r.id}')" style="font-size:11px;margin-bottom:8px">${t('requests.updateContact')}</button>
    ${act ? `<div class="rcard-actions">${act}</div>` : ''}
  </div>`;
}

// ── SALES VIEW ──
async function _renderSalesRequests() {
  const uid = App.user.id;
  const myPricing    = _reqsCache.filter(r => r.assignedSalesId === uid && r.status === 'approved');
  const myPricingIds = new Set(myPricing.map(r => r.id));
  const openConsults = _reqsCache.filter(r => r.requestType === 'consultation' && r.status === 'pending' && !r.assignedSalesId);
  const openIds      = new Set(openConsults.map(r => r.id));
  const myCreated    = _reqsCache.filter(r => r.createdBy === uid && !myPricingIds.has(r.id));
  const others       = _reqsCache.filter(r =>
    r.createdBy !== uid && !myPricingIds.has(r.id) && !openIds.has(r.id)
  );

  document.getElementById('sectionRequests').innerHTML = `
  <div class="ph"><div class="ph-info"><h2>${t('requests.pipelineTitle')}</h2><p>${t('requests.pipelineSub')}</p></div>
    <div class="ph-actions"><button class="btn btn-gold" onclick="openNewRequestModal()">${t('requests.newRequest')}</button></div></div>

  ${openConsults.length ? `
  <div style="margin-bottom:8px;font-size:11.5px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:.5px">${t('requests.openConsultations')} (${openConsults.length})</div>
  <div class="cards-grid" style="margin-bottom:28px">${_sortDelayedFirst(openConsults).map(r => _consultationCard(r)).join('')}</div>` : ''}

  ${myPricing.length ? `
  <div style="margin-bottom:8px;font-size:11.5px;font-weight:700;color:var(--amber);text-transform:uppercase;letter-spacing:.5px">${t('requests.assignedPricing')} (${myPricing.length})</div>
  <div class="cards-grid" style="margin-bottom:28px">${_sortDelayedFirst(myPricing).map(r => r.requestType === 'consultation' ? _consultPricingCard(r) : _pricingCard(r)).join('')}</div>` : ''}

  <div style="margin-bottom:8px;font-size:11.5px;font-weight:700;color:var(--mute);text-transform:uppercase;letter-spacing:.5px">${t('requests.myRequests')} (${myCreated.length})</div>
  <div class="cards-grid" style="margin-bottom:28px">${myCreated.length
    ? _sortDelayedFirst(myCreated).map(r => _salesReqCard(r, true)).join('')
    : `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">◌</div><h4>${t('requests.noCreated')}</h4><p>${t('requests.noCreatedSub')}</p></div>`
  }</div>

  ${others.length ? `
  <div style="margin-bottom:8px;font-size:11.5px;font-weight:700;color:var(--mute);text-transform:uppercase;letter-spacing:.5px">${t('requests.teamRequests')} (${others.length})</div>
  <div class="cards-grid">${_sortDelayedFirst(others).map(r => _salesReqCard(r, false)).join('')}</div>` : ''}`;
}

function _consultationCard(r) {
  const summary = _consultSummary(r);
  const delayed = _isDelayed(r);
  return `<div class="rcard${delayed ? ' delayed-card' : ''}" style="border-left:3px solid #2563eb">
    ${_delayBadge(r)}
    <div class="rcard-top"><div>
      <div class="rcard-client">${r.clientName}</div>
      <div class="rcard-ref">${r.ref} <span style="font-size:10px;padding:1px 7px;border-radius:99px;background:#eff6ff;color:#2563eb;font-weight:700">${t('requests.consultBadge')}</span></div>
    </div>${statusBadge(r.status)}</div>
    <div class="rcard-meta">
      <div class="rcard-meta-row">📞 ${r.phone}</div>
      <div class="rcard-meta-row">📍 ${r.address}</div>
      <div class="rcard-meta-row">📅 ${fmtDate(r.createdAt)}</div>
    </div>
    ${_callStatusBadge(r)}
    ${summary ? `<div style="font-size:12.5px;color:var(--mute);margin-bottom:8px">${summary}</div>` : ''}
    ${r.consultNotes ? `<div style="font-size:12px;color:var(--mute);margin-bottom:8px">📝 ${r.consultNotes}</div>` : ''}
    ${_adminNotesBlock(r, false)}
    <div class="contact-actions">
      <button onclick="callClient('${r.phone}')" class="btn-call">📞 ${t('wa.call')}</button>
      <button onclick="waInitial('${r.id}')" class="btn-wa">💬 ${t('wa.initialContact')}</button>
    </div>
    <div class="rcard-actions">
      <button class="btn btn-primary btn-sm" style="flex:1" onclick="claimConsultation('${r.id}')">${t('requests.claimBtn')}</button>
      <button class="btn btn-ghost btn-xs" onclick="openCallStatusModal('${r.id}')" style="font-size:11px">${t('requests.contactBtn')}</button>
    </div>
  </div>`;
}

function _consultPricingCard(r) {
  const summary = _consultSummary(r);
  const delayed = _isDelayed(r);
  return `<div class="rcard${delayed ? ' delayed-card' : ''}" style="border-left:3px solid var(--amber)">
    ${_delayBadge(r)}
    <div class="rcard-top"><div>
      <div class="rcard-client">${r.clientName}</div>
      <div class="rcard-ref">${r.ref} <span style="font-size:10px;padding:1px 7px;border-radius:99px;background:#eff6ff;color:#2563eb;font-weight:700">${t('requests.consultBadge')}</span></div>
    </div>${statusBadge(r.status)}</div>
    <div class="rcard-meta">
      <div class="rcard-meta-row">📞 ${r.phone}</div>
      <div class="rcard-meta-row">📍 ${r.address}</div>
    </div>
    ${_callStatusBadge(r)}
    ${summary ? `<div style="font-size:12.5px;color:var(--mute);margin-bottom:8px">${summary}</div>` : ''}
    ${r.consultNotes ? `<div style="font-size:12px;color:var(--mute);margin-bottom:8px">📝 ${r.consultNotes}</div>` : ''}
    ${_adminNotesBlock(r, false)}
    <div class="contact-actions">
      <button onclick="callClient('${r.phone}')" class="btn-call">📞 ${t('wa.call')}</button>
      <button onclick="waInitial('${r.id}')" class="btn-wa">💬 ${t('wa.initialContact')}</button>
      <button onclick="waPricing('${r.id}')" class="btn-wa">💬 ${t('wa.sendPricing')}</button>
      <button onclick="printRequestReceipt('${r.id}')" class="btn-print">🖨️ ${t('wa.printReceipt')}</button>
    </div>
    <div class="rcard-actions">
      <button class="btn btn-gold btn-sm" style="flex:1" onclick="openConsultPricingModal('${r.id}')">${t('requests.setPriceBtn')}</button>
      <button class="btn btn-ghost btn-xs" onclick="openCallStatusModal('${r.id}')" style="font-size:11px">${t('requests.contactBtn')}</button>
    </div>
  </div>`;
}

function _salesReqCard(r, isOwn) {
  const delayed   = _isDelayed(r);
  const isConsult = r.requestType === 'consultation';
  const consultBadge = isConsult
    ? `<span style="font-size:10px;padding:1px 7px;border-radius:99px;background:#eff6ff;color:#2563eb;font-weight:700;margin-left:4px">${t('requests.consultBadge')}</span>`
    : '';

  const rows = r.products.map(p =>
    `<div class="rcard-prod-row">
      <span>${p.name} <span style="color:var(--mute);font-size:11px">[${p.colorCode}]</span></span>
      <span>${p.qty} L${p.price > 0 ? ' × ' + fmtCur(p.price) : ''}</span>
    </div>`
  ).join('');

  const rej = r.status === 'rejected' && r.rejectionReason
    ? `<div style="background:var(--red-l);border-radius:6px;padding:7px 10px;font-size:12px;color:var(--red);margin-bottom:8px">✕ ${r.rejectionReason}</div>`
    : '';

  const viewOnlyStyle = !isOwn ? 'opacity:0.78;background:var(--border-l)' : '';

  let extraAct = '';
  if (!isOwn) {
    const orderId = r.order?.id;
    if (orderId) {
      extraAct = `<div class="rcard-actions" style="margin-top:8px">
        <button class="btn btn-ghost btn-sm" style="flex:1;font-size:11px" onclick="markDelivered('${orderId}')">${t('requests.markDelivered')}</button>
        <button class="btn btn-ghost btn-sm" style="flex:1;font-size:11px" onclick="openAddPayment('${orderId}')">${t('requests.addPayment')}</button>
      </div>`;
    }
  }

  return `<div class="rcard${delayed ? ' delayed-card' : ''}" style="${viewOnlyStyle}">
    ${_delayBadge(r)}
    <div class="rcard-top"><div>
      <div class="rcard-client">${r.clientName}${!isOwn ? ` <span style="font-size:10px;color:var(--mute)">· ${r.salesName}</span>` : ''}</div>
      <div class="rcard-ref">${r.ref}${consultBadge}</div>
    </div>${statusBadge(r.status)}</div>
    <div class="rcard-meta">
      <div class="rcard-meta-row">📞 ${r.phone}</div>
      <div class="rcard-meta-row">👤 ${r.salesName} · ${fmtDate(r.createdAt)}</div>
    </div>
    ${_callStatusBadge(r)}
    ${rows.length ? `<div class="rcard-products">${rows}<div class="rcard-total"><span style="color:var(--mute);font-size:12.5px;font-weight:600">${t('requests.total')}</span><span style="color:var(--gold-d)">${r.totalAmount > 0 ? fmtCur(r.totalAmount) : t('requests.tbd')}</span></div></div>` : ''}
    ${rej}
    ${_adminNotesBlock(r, false)}
    ${_cwpBlock(r, false)}
    ${isOwn ? `<button class="btn btn-ghost btn-xs" onclick="openCallStatusModal('${r.id}')" style="font-size:11px;margin-top:4px">${t('requests.updateContact')}</button>` : ''}
    <div class="contact-actions">
      <button onclick="callClient('${r.phone}')" class="btn-call">📞 ${t('wa.call')}</button>
      <button onclick="waInitial('${r.id}')" class="btn-wa">💬 ${t('wa.initialContact')}</button>
      ${isOwn ? `
      <button onclick="waPricing('${r.id}')" class="btn-wa">💬 ${t('wa.sendPricing')}</button>
      <button onclick="printRequestReceipt('${r.id}')" class="btn-print">🖨️ ${t('wa.printReceipt')}</button>` : ''}
    </div>
    ${extraAct}
  </div>`;
}

function _pricingCard(r) {
  const delayed = _isDelayed(r);
  const rows = r.products.map(p =>
    `<div class="rcard-prod-row"><span>${p.name} <span style="color:var(--mute);font-size:11px">[${p.colorCode}]</span></span><span>${p.qty} L</span></div>`
  ).join('');
  return `<div class="rcard${delayed ? ' delayed-card' : ''}" style="border-left:3px solid var(--amber)">
    ${_delayBadge(r)}
    <div class="rcard-top"><div><div class="rcard-client">${r.clientName}</div><div class="rcard-ref">${r.ref}</div></div>${statusBadge(r.status)}</div>
    <div class="rcard-meta"><div class="rcard-meta-row">📞 ${r.phone}</div><div class="rcard-meta-row">📍 ${r.address}</div></div>
    ${_callStatusBadge(r)}
    <div class="rcard-products">${rows}</div>
    ${r.notes ? `<div style="font-size:12px;color:var(--mute);margin-bottom:8px">📝 ${r.notes}</div>` : ''}
    ${_adminNotesBlock(r, false)}
    <div class="contact-actions">
      <button onclick="callClient('${r.phone}')" class="btn-call">📞 ${t('wa.call')}</button>
      <button onclick="waInitial('${r.id}')" class="btn-wa">💬 ${t('wa.initialContact')}</button>
      <button onclick="waPricing('${r.id}')" class="btn-wa">💬 ${t('wa.sendPricing')}</button>
      <button onclick="printRequestReceipt('${r.id}')" class="btn-print">🖨️ ${t('wa.printReceipt')}</button>
    </div>
    <div class="rcard-actions">
      <button class="btn btn-gold btn-sm" style="flex:1" onclick="openPricingModal('${r.id}')">${t('requests.addPricingBtn')}</button>
      <button class="btn btn-ghost btn-xs" onclick="openCallStatusModal('${r.id}')" style="font-size:11px">${t('requests.contactBtn')}</button>
    </div>
  </div>`;
}

// ── CLIENT VIEW ──
function _renderClientRequests() {
  const reqs = _reqsCache;
  document.getElementById('sectionRequests').innerHTML = `
  <div class="ph"><div class="ph-info"><h2>${t('requests.myOrdersTitle')}</h2><p>${t('requests.myOrdersSub')}</p></div></div>
  <div class="cards-grid">${reqs.map(r => {
    const label = _reqStatusLabel(r.status);
    const rej = r.status === 'rejected' && r.rejectionReason
      ? `<div style="background:var(--red-l);border-radius:6px;padding:7px 10px;font-size:12px;color:var(--red);margin-top:8px">${t('requests.reason')} ${r.rejectionReason}</div>`
      : '';
    return `<div class="rcard">
      <div class="rcard-top"><div><div class="rcard-client">${r.clientName}</div><div class="rcard-ref">${r.ref}</div></div>${statusBadge(r.status)}</div>
      <div class="rcard-meta"><div class="rcard-meta-row">📅 ${fmtDate(r.createdAt)}</div><div class="rcard-meta-row" style="font-weight:600">${label}</div></div>
      ${_cwpBlock(r, false)}
      ${rej}
    </div>`;
  }).join('')}`;
}

// ── APPROVE SALES REQUEST ──
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

// ── APPROVE CLIENT REQUEST ──
export async function promptApproveWithSales(reqId) {
  let salesUsers = [];
  try { salesUsers = (await api.getUsers()).filter(u => u.role === 'sales' && u.status === 'active'); }
  catch { /* non-fatal */ }

  openModal(`<div class="mh"><div class="mh-left"><h3>${t('requests.approveAssignTitle')}</h3></div><button class="mx" onclick="closeModal()">✕</button></div>
  <div class="mc">
    <p style="color:var(--mute);margin-bottom:16px">${t('requests.approveAssignSub')}</p>
    <div class="fg"><label class="fl req">${t('requests.assignSalesRep')}</label>
      <select class="fi" id="approveSalesSelect">
        <option value="">${t('requests.selectSalesperson')}</option>
        ${salesUsers.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
      </select>
    </div>
  </div>
  <div class="mf"><button class="btn btn-ghost" onclick="closeModal()">${t('requests.cancel')}</button>
    <button class="btn btn-green" onclick="doApproveWithSales('${reqId}')">${t('requests.confirmAssign')}</button></div>`, 'modal-sm');
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

// ── FINAL APPROVE ──
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

// ── REJECT ──
export function promptReject(reqId) {
  openModal(`<div class="mh"><div class="mh-left"><h3>${t('requests.rejectTitle')}</h3></div><button class="mx" onclick="closeModal()">✕</button></div>
  <div class="mc"><p style="color:var(--mute);margin-bottom:14px">${t('requests.rejectSub')}</p>
    <div class="fg"><label class="fl req">${t('requests.rejectionReason')}</label>
      <textarea class="fi" id="rejReason" rows="3" placeholder="${t('requests.rejectionPlaceholder')}" style="resize:none"></textarea></div></div>
  <div class="mf"><button class="btn btn-ghost" onclick="closeModal()">${t('requests.cancel')}</button>
    <button class="btn btn-danger" onclick="doReject('${reqId}')">${t('requests.confirmRejection')}</button></div>`, 'modal-sm');
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

// ── CALL STATUS MODAL ──
export function openCallStatusModal(reqId) {
  const r = _reqsCache.find(req => req.id === reqId);
  const cur = r?.callStatus || '';
  openModal(`<div class="mh"><div class="mh-left"><h3>${t('requests.contactStatusTitle')}</h3></div><button class="mx" onclick="closeModal()">✕</button></div>
  <div class="mc">
    <div class="fg"><label class="fl req">${t('requests.contactStatus')}</label>
      <select class="fi" id="csSelect">
        <option value="">${t('requests.selectStatus')}</option>
        <option value="callback"    ${cur==='callback'   ?'selected':''}>📞 Callback</option>
        <option value="following"   ${cur==='following'  ?'selected':''}>👀 Following Up</option>
        <option value="no_answer"   ${cur==='no_answer'  ?'selected':''}>📵 No Answer</option>
        <option value="low_budget"  ${cur==='low_budget' ?'selected':''}>💸 Low Budget</option>
        <option value="lead"        ${cur==='lead'       ?'selected':''}>🆕 New Lead</option>
        <option value="out_of_zone" ${cur==='out_of_zone'?'selected':''}>🚫 Out of Zone</option>
      </select>
    </div>
    <div class="fg"><label class="fl">${t('requests.note')} <span style="font-size:11px;color:var(--mute)">${t('requests.optional')}</span></label>
      <input class="fi" id="csNote" placeholder="${t('requests.notePlaceholder')}" value="${r?.callStatusNote || ''}">
    </div>
  </div>
  <div class="mf"><button class="btn btn-ghost" onclick="closeModal()">${t('requests.cancel')}</button>
    <button class="btn btn-primary" onclick="_saveCallStatus('${reqId}')">${t('requests.saveStatus')}</button></div>`, 'modal-sm');
}

window._saveCallStatus = async function (reqId) {
  const callStatus = document.getElementById('csSelect').value;
  if (!callStatus) { alert('Please select a status.'); return; }
  const callStatusNote = document.getElementById('csNote').value.trim();
  try {
    const updated = await api.updateCallStatus(reqId, { callStatus, callStatusNote });
    _reqsCache = _reqsCache.map(r => r.id === reqId ? updated : r);
    closeModal();
    showToast('Contact status updated', 'toast-gold');
    if (App.section === 'requests') await renderRequests();
    else if (App.section === 'dashboard') await window.renderDashboard();
  } catch (err) {
    showToast('Failed: ' + err.message, 'toast-red');
  }
};

// ── ADMIN NOTES MODAL ──
export function openAdminNotesModal(reqId) {
  const r = _reqsCache.find(req => req.id === reqId);
  openModal(`<div class="mh"><div class="mh-left"><h3>${t('requests.adminNoteTitle')}</h3></div><button class="mx" onclick="closeModal()">✕</button></div>
  <div class="mc">
    <p style="color:var(--mute);font-size:12.5px;margin-bottom:12px">${t('requests.adminNoteSub')}</p>
    <div class="fg"><label class="fl">${t('requests.notesForSales')}</label>
      <textarea class="fi" id="anText" rows="4" style="resize:none" placeholder="${t('requests.notesSalesPlaceholder')}">${r?.adminNotes || ''}</textarea>
    </div>
  </div>
  <div class="mf"><button class="btn btn-ghost" onclick="closeModal()">${t('requests.cancel')}</button>
    <button class="btn btn-primary" onclick="_saveAdminNotes('${reqId}')">${t('requests.saveNote')}</button></div>`, 'modal-sm');
}

window._saveAdminNotes = async function (reqId) {
  const adminNotes = document.getElementById('anText').value.trim();
  try {
    const updated = await api.updateAdminNotes(reqId, { adminNotes });
    _reqsCache = _reqsCache.map(r => r.id === reqId ? updated : r);
    closeModal();
    showToast('Note saved', 'toast-gold');
    if (App.section === 'requests') await renderRequests();
  } catch (err) {
    showToast('Failed: ' + err.message, 'toast-red');
  }
};

// ── CLAIM WITHOUT PAYMENT TOGGLE ──
export async function toggleClaimWithoutPayment(reqId, value) {
  try {
    const updated = await api.setClaimWithoutPayment(reqId, value);
    _reqsCache = _reqsCache.map(r => r.id === reqId ? updated : r);
    showToast(value ? '⚠ Claim without payment authorized' : 'Claim without payment removed', value ? 'toast-gold' : 'toast-red');
  } catch (err) {
    showToast('Failed: ' + err.message, 'toast-red');
    if (App.section === 'requests') await renderRequests();
  }
}

// ── MARK DELIVERED ──
export async function markDelivered(orderId) {
  try {
    await api.updateOrderStatus(orderId, { status: 'delivered' });
    showToast('Order marked as delivered', 'toast-gold');
    if (App.section === 'requests') await renderRequests();
  } catch (err) {
    showToast('Failed: ' + err.message, 'toast-red');
  }
}

// ── CONSULTATION CLAIM ──
export async function claimConsultation(reqId) {
  try {
    await api.claimRequest(reqId);
    showToast('Consultation claimed — check "Assigned for Pricing"', 'toast-gold');
    await renderRequests();
  } catch (err) {
    if (err.message && err.message.includes('409')) {
      showToast('Already claimed by another salesperson', 'toast-red');
      await renderRequests();
    } else {
      showToast('Failed to claim: ' + err.message, 'toast-red');
    }
  }
}

// ── CONSULTATION PRICING MODAL ──
function _cplLineHTML(i) {
  return `<input class="fi fi-sm" placeholder="${t('clientNewOrder.productName')}" id="cpln_${i}">
    <input class="fi fi-sm" placeholder="${t('clientNewOrder.colorCode')}" id="cplcc_${i}">
    <input class="fi fi-sm" placeholder="${t('clientNewOrder.colorName')}" id="cplcn_${i}">
    <div style="display:flex;align-items:center;gap:6px">
      <input class="fi fi-sm" type="number" placeholder="${t('clientNewOrder.qty')}" id="cplq_${i}" oninput="calcCPLTotal()" style="flex:1">
      <span style="font-size:12px;font-weight:600;color:var(--mute);white-space:nowrap">L</span>
    </div>
    <input class="fi fi-sm" type="number" placeholder="${t('requests.pricePerL')}" id="cplp_${i}" oninput="calcCPLTotal()">
    <button class="pline-rm" onclick="rmCPLline(${i})">✕</button>`;
}

export function openConsultPricingModal(reqId) {
  const r = _reqsCache.find(req => req.id === reqId);
  if (!r) { showToast('Request data not found — please refresh', 'toast-red'); return; }
  _cplc = 1;
  const summary = _consultSummary(r);
  openModal(`<div class="mh"><div class="mh-left"><h3>${t('requests.recommendTitle')}</h3><span class="mh-recipe">${r.ref}</span></div><button class="mx" onclick="closeModal()">✕</button></div>
  <div class="mc">
    <p style="color:var(--mute);font-size:12.5px;margin-bottom:4px">Client: <strong>${r.clientName}</strong> · ${r.phone}</p>
    ${summary ? `<p style="font-size:12px;color:var(--mute);margin-bottom:8px">${summary}</p>` : ''}
    ${r.consultNotes ? `<div style="background:var(--border-l);border-radius:6px;padding:8px 10px;font-size:12px;color:var(--mute);margin-bottom:12px">📝 ${r.consultNotes}</div>` : ''}
    <div class="fsec">${t('requests.recommendedProducts')}
      <button class="btn btn-ghost btn-xs" onclick="addCPLline()" style="margin-left:8px;vertical-align:middle">${t('requests.addProduct')}</button>
      <button class="btn btn-ghost btn-xs" onclick="_openPickerForConsult()" style="margin-left:6px;vertical-align:middle">${t('requests.catalog')}</button>
    </div>
    <div class="pline-wrap" id="cpllines">
      <div class="pline" id="cpl_0">${_cplLineHTML(0)}</div>
    </div>
    <div class="ptotal-row"><span class="ptotal-label">${t('requests.total')}</span><span id="cplTotal" style="color:var(--gold-d)">EGP 0</span></div>
  </div>
  <div class="mf"><button class="btn btn-ghost" onclick="closeModal()">${t('requests.cancel')}</button>
    <button class="btn btn-primary" onclick="submitConsultPricing('${reqId}')">${t('requests.submitConsultPricing')}</button></div>`, 'modal-lg');
}

window.addCPLline = function () {
  const i = _cplc++;
  const w = document.getElementById('cpllines');
  const d = document.createElement('div'); d.className = 'pline'; d.id = 'cpl_' + i;
  d.innerHTML = _cplLineHTML(i);
  w.appendChild(d);
};

window.rmCPLline = function (i) {
  const e = document.getElementById('cpl_' + i); if (e) e.remove(); window.calcCPLTotal();
};

window.calcCPLTotal = function () {
  let total = 0;
  document.querySelectorAll('#cpllines .pline').forEach(pl => {
    const i = pl.id.replace('cpl_', '');
    const q = parseFloat(document.getElementById('cplq_' + i)?.value) || 0;
    const p = parseFloat(document.getElementById('cplp_' + i)?.value) || 0;
    total += q * p;
  });
  const e = document.getElementById('cplTotal'); if (e) e.textContent = fmtCur(total);
};

function _openPickerForConsult() {
  openProductPicker(({ name, colorCode, colorName, qty, price }) => {
    let targetIdx = null;
    for (const pl of document.querySelectorAll('#cpllines .pline')) {
      const i = pl.id.replace('cpl_', '');
      if (!(document.getElementById('cpln_' + i)?.value || '').trim()) { targetIdx = i; break; }
    }
    if (targetIdx === null) {
      targetIdx = _cplc++;
      const d = document.createElement('div'); d.className = 'pline'; d.id = 'cpl_' + targetIdx;
      d.innerHTML = _cplLineHTML(targetIdx);
      document.getElementById('cpllines').appendChild(d);
    }
    document.getElementById('cpln_'  + targetIdx).value = name;
    if (colorCode) document.getElementById('cplcc_' + targetIdx).value = colorCode;
    if (colorName) document.getElementById('cplcn_' + targetIdx).value = colorName;
    document.getElementById('cplq_'  + targetIdx).value = qty;
    document.getElementById('cplp_'  + targetIdx).value = price;
    window.calcCPLTotal();
  });
}
window._openPickerForConsult = _openPickerForConsult;

export async function submitConsultPricing(reqId) {
  const products = [];
  let hasIncomplete = false;
  document.querySelectorAll('#cpllines .pline').forEach(pl => {
    const i     = pl.id.replace('cpl_', '');
    const name  = (document.getElementById('cpln_' + i)?.value || '').trim();
    const qty   = parseFloat(document.getElementById('cplq_' + i)?.value) || 0;
    const price = parseFloat(document.getElementById('cplp_' + i)?.value) || 0;
    const isEmpty = !name && !qty;
    if (isEmpty) { pl.style.outline = ''; return; }
    if (!name || qty <= 0 || price <= 0) {
      pl.style.outline = '2px solid var(--red)'; pl.style.borderRadius = '6px'; hasIncomplete = true;
    } else {
      pl.style.outline = '';
      products.push({ name, colorCode: document.getElementById('cplcc_' + i)?.value || '', colorName: document.getElementById('cplcn_' + i)?.value || '', qty, price });
    }
  });
  if (hasIncomplete) { showToast('Please complete all product details or remove incomplete rows', 'toast-red'); return; }
  if (!products.length) { alert('Add at least one recommended product with name, quantity and price.'); return; }
  try {
    await api.assignPricingRequest(reqId, products);
    closeModal();
    showToast('Consultation pricing submitted for admin review', 'toast-gold');
    await renderRequests();
  } catch (err) {
    showToast('Failed: ' + err.message, 'toast-red');
  }
}

// ── STANDARD PRICING MODAL (sales) ──
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

  openModal(`<div class="mh"><div class="mh-left"><h3>${t('requests.pricingTitle')}</h3><span class="mh-recipe">${r.ref}</span></div><button class="mx" onclick="closeModal()">✕</button></div>
  <div class="mc">
    <p style="color:var(--mute);font-size:12.5px;margin-bottom:12px">Client: <strong>${r.clientName}</strong> · ${r.phone}</p>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="font-size:11px;color:var(--mute);text-transform:uppercase">
        <th style="text-align:left;padding:6px 0">${t('requests.productCol')}</th>
        <th style="text-align:center">${t('requests.qtyCol')}</th>
        <th style="text-align:center">${t('requests.pricePerL')}</th>
        <th style="text-align:right">${t('requests.total')}</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-top:14px;padding-top:10px;border-top:2px solid var(--gold)">
      <span style="font-size:12px;color:var(--mute);font-weight:600;text-transform:uppercase">${t('requests.orderTotal')}</span>
      <span id="pricingTotal" style="font-size:16px;font-weight:800;color:var(--gold-d)">EGP 0</span>
    </div>
  </div>
  <div class="mf"><button class="btn btn-ghost" onclick="closeModal()">${t('requests.cancel')}</button>
    <button class="btn btn-primary" onclick="submitPricing('${reqId}')">${t('requests.submitPricing')}</button></div>`, 'modal-md');
}

export function calcPricingTotal() {
  let total = 0;
  document.querySelectorAll('.pricing-row').forEach(row => {
    const pid  = row.dataset.pid;
    const qty  = parseFloat(row.dataset.qty) || 0;
    const price = parseFloat(document.getElementById('pp_' + pid)?.value) || 0;
    const lineTotal = qty * price;
    total += lineTotal;
    const ptEl = document.getElementById('pt_' + pid);
    if (ptEl) ptEl.textContent = fmtCur(lineTotal);
  });
  const totEl = document.getElementById('pricingTotal');
  if (totEl) totEl.textContent = fmtCur(total);
}

export async function submitPricing(reqId) {
  const r = _reqsCache.find(req => req.id === reqId);
  if (!r) return;
  const products = r.products.map(p => ({
    id: p.id, qty: p.qty, price: parseFloat(document.getElementById('pp_' + p.id)?.value) || 0,
  }));
  if (products.some(p => p.price <= 0)) { alert('Please enter a price greater than 0 for all products.'); return; }
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
function _newPlineHTML(i) {
  return `<input class="fi fi-sm" placeholder="${t('clientNewOrder.productName')}" id="pn_${i}" oninput="calcTotal()"><input class="fi fi-sm" placeholder="${t('clientNewOrder.colorCode')}" id="pc_${i}"><input class="fi fi-sm" placeholder="${t('clientNewOrder.colorName')}" id="pcn_${i}"><div style="display:flex;align-items:center;gap:6px"><input class="fi fi-sm" type="number" placeholder="${t('clientNewOrder.qty')}" id="pq_${i}" oninput="calcTotal()" style="flex:1"><span style="font-size:12px;font-weight:600;color:var(--mute)">L</span></div><input class="fi fi-sm" type="number" placeholder="${t('requests.pricePerL')}" id="pp_${i}" oninput="calcTotal()"><button class="pline-rm" onclick="removePline(${i})">✕</button>`;
}

export async function openNewRequestModal() {
  try { _clientsCache = await api.getClients(); }
  catch { _clientsCache = []; }
  openModal(`<div class="mh"><div class="mh-left"><h3>${t('requests.newRequestTitle')}</h3></div><button class="mx" onclick="closeModal()">✕</button></div>
  <div class="mc">
    <div class="fsec">${t('requests.clientInfo')}</div>
    <div class="fr2">
      <div class="fg"><label class="fl req">${t('requests.clientNameLabel')}</label>
        <input class="fi" id="nr_client" list="cList" placeholder="${t('requests.clientNamePlaceholder')}" oninput="fillClient()">
        <datalist id="cList">${_clientsCache.map(c => `<option value="${c.name}">`).join('')}</datalist></div>
      <div class="fg"><label class="fl req">${t('requests.phoneLabel')}</label><input class="fi" id="nr_phone" placeholder="${t('requests.phonePlaceholder')}"></div>
    </div>
    <div class="fr2">
      <div class="fg"><label class="fl req">${t('requests.addressLabel')}</label><input class="fi" id="nr_address" placeholder="${t('requests.addressPlaceholder')}"></div>
      <div class="fg"><label class="fl">${t('requests.emailLabel')}</label><input class="fi" id="nr_email" type="email"></div>
    </div>
    <div class="fg"><label class="fl">${t('requests.notesLabel')}</label><textarea class="fi" id="nr_notes" rows="2" style="resize:none" placeholder="${t('requests.notesPlaceholder')}"></textarea></div>
    <div class="fsec">${t('requests.productsLabel')} <button class="btn btn-ghost btn-xs" onclick="addPline()" style="margin-left:8px;vertical-align:middle">${t('requests.addProduct')}</button><button class="btn btn-ghost btn-xs" onclick="_openPickerForRequest()" style="margin-left:6px;vertical-align:middle">${t('requests.catalog')}</button></div>
    <div class="pline-wrap" id="plines">
      <div class="pline" id="pl_0">${_newPlineHTML(0)}</div>
    </div>
    <div class="ptotal-row"><span class="ptotal-label">${t('requests.total')}</span><span id="reqTotal" style="color:var(--gold-d)">EGP 0</span></div>
  </div>
  <div class="mf"><button class="btn btn-ghost" onclick="closeModal()">${t('requests.cancel')}</button>
    <button class="btn btn-primary" onclick="submitNewRequest()">${t('requests.submitRequest')}</button></div>`, 'modal-lg');
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
  d.innerHTML = _newPlineHTML(i);
  w.appendChild(d);
}

export function removePline(i) { const e = document.getElementById('pl_' + i); if (e) e.remove(); calcTotal(); }

export function calcTotal() {
  let total = 0;
  document.querySelectorAll('#plines .pline').forEach(pl => {
    const i = pl.id.replace('pl_', '');
    const q = parseFloat(document.getElementById('pq_' + i)?.value) || 0;
    const p = parseFloat(document.getElementById('pp_' + i)?.value) || 0;
    total += q * p;
  });
  const e = document.getElementById('reqTotal'); if (e) e.textContent = fmtCur(total); return total;
}

function _openPickerForRequest() {
  openProductPicker(({ name, colorCode, colorName, qty, price }) => {
    let targetIdx = null;
    for (const pl of document.querySelectorAll('#plines .pline')) {
      const i = pl.id.replace('pl_', '');
      if (!(document.getElementById('pn_' + i)?.value || '').trim()) { targetIdx = i; break; }
    }
    if (targetIdx === null) {
      targetIdx = _plc++;
      const d = document.createElement('div'); d.className = 'pline'; d.id = 'pl_' + targetIdx;
      d.innerHTML = _newPlineHTML(targetIdx);
      document.getElementById('plines').appendChild(d);
    }
    document.getElementById('pn_'  + targetIdx).value = name;
    if (colorCode) document.getElementById('pc_'  + targetIdx).value = colorCode;
    if (colorName) document.getElementById('pcn_' + targetIdx).value = colorName;
    document.getElementById('pq_'  + targetIdx).value = qty;
    document.getElementById('pp_'  + targetIdx).value = price;
    calcTotal();
  });
}
window._openPickerForRequest = _openPickerForRequest;

export async function submitNewRequest() {
  const clientName = document.getElementById('nr_client').value.trim();
  const phone      = document.getElementById('nr_phone').value.trim();
  const addr       = document.getElementById('nr_address').value.trim();
  if (!clientName || !phone || !addr) { alert('Client name, phone and address are required.'); return; }
  if (!_cid) { alert('Please select an existing client from the suggestion list.'); return; }

  const products = [];
  let hasIncomplete = false;
  document.querySelectorAll('#plines .pline').forEach(pl => {
    const i     = pl.id.replace('pl_', '');
    const name  = (document.getElementById('pn_' + i)?.value || '').trim();
    const qty   = parseFloat(document.getElementById('pq_' + i)?.value) || 0;
    const price = parseFloat(document.getElementById('pp_' + i)?.value) || 0;
    const isEmpty = !name && !qty;
    if (isEmpty) { pl.style.outline = ''; return; }
    if (!name || qty <= 0) {
      pl.style.outline = '2px solid var(--red)'; pl.style.borderRadius = '6px'; hasIncomplete = true;
    } else {
      pl.style.outline = '';
      products.push({ name, colorCode: document.getElementById('pc_' + i)?.value || '', colorName: document.getElementById('pcn_' + i)?.value || '', qty, unit: 'L', price, total: qty * price });
    }
  });

  if (hasIncomplete) { showToast('Please complete all product details or remove incomplete rows', 'toast-red'); return; }
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
