import { App } from '../../state/store.js';
import * as api from '../../api/index.js';
import { fmtDate, fmtCur, statusBadge, payBadge } from '../../utils/index.js';
import { openModal } from '../../components/modal/modal.js';
import { t } from '../../i18n/index.js';

function _reqStatusLabel(s) {
  return {
    pending:           t('clientOrders.underReview'),
    approved:          t('clientOrders.beingPriced'),
    pricing_submitted: t('clientOrders.pricingUnderReview'),
    final_approved:    t('clientOrders.confirmed'),
    rejected:          t('clientOrders.notApproved'),
  }[s] || s;
}

function _reqStatusColor(s) {
  if (s === 'rejected')          return 'var(--red)';
  if (s === 'final_approved')    return 'var(--green)';
  if (s === 'pricing_submitted') return 'var(--blue)';
  if (s === 'approved')          return 'var(--amber)';
  return 'var(--mute)';
}

export async function renderClientOrders(filter) {
  document.getElementById('sectionClientorders').innerHTML = `<div class="empty" style="padding:40px">${t('clientOrders.loading')}</div>`;
  try {
    const [all, allReqs] = await Promise.all([api.getOrders(), api.getRequests().catch(() => [])]);
    const pendingReqs  = allReqs.filter(r => !['final_approved', 'rejected'].includes(r.status));
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
    <div style="margin-bottom:10px;font-size:11.5px;font-weight:700;color:var(--amber);text-transform:uppercase;letter-spacing:.5px">${t('clientOrders.inProgress', { n: pendingReqs.length })}</div>
    ${pendingReqs.map(r => `
    <div style="background:var(--card);border-radius:var(--r12);padding:14px 16px;margin-bottom:10px;border:1px solid var(--border);box-shadow:var(--sh1)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div><div style="font-size:12px;color:var(--mute)">${r.ref} · ${fmtDate(r.createdAt)}</div></div>
        <div style="font-size:11.5px;font-weight:700;color:${_reqStatusColor(r.status)}">${_reqStatusLabel(r.status)}</div>
      </div>
      ${r.products.map(p => `<div style="font-size:13px;padding:3px 0;border-bottom:1px solid var(--border-l);display:flex;justify-content:space-between"><span>${p.name}</span><span style="color:var(--mute)">${p.qty} L</span></div>`).join('')}
    </div>`).join('')}
    ${rejectedReqs.map(r => `
    <div style="background:var(--red-l);border-radius:var(--r12);padding:14px 16px;margin-bottom:10px;border:1px solid rgba(192,57,43,.2)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <div style="font-size:12px;color:var(--mute)">${r.ref} · ${fmtDate(r.createdAt)}</div>
        <div style="font-size:11.5px;font-weight:700;color:var(--red)">${t('clientOrders.notApproved')}</div>
      </div>
      ${r.rejectionReason ? `<div style="font-size:12px;color:var(--red)">${t('clientOrders.reason')}${r.rejectionReason}</div>` : ''}
    </div>`).join('')}
    <div style="margin-top:16px;margin-bottom:10px;font-size:11.5px;font-weight:700;color:var(--mute);text-transform:uppercase;letter-spacing:.5px">${t('clientOrders.myOrders', { n: all.length })}</div>` : '';

    document.getElementById('sectionClientorders').innerHTML = `
    <div class="ph"><div class="ph-info"><h2>${t('clientOrders.title')}</h2><p>${t('clientOrders.subtitle')}</p></div>
      <div class="ph-actions"><button class="btn btn-gold" onclick="navigate('clientneworder')">${t('clientOrders.newOrder')}</button></div></div>
    ${pipelineHTML}
    <div class="fbar">
      <button class="ftab ${filter==='all'?'active':''}" onclick="renderClientOrders('all')">${t('clientOrders.all')} (${c.all})</button>
      <button class="ftab ${filter==='active'?'active':''}" onclick="renderClientOrders('active')">${t('clientOrders.active')} (${c.active})</button>
      <button class="ftab ${filter==='delivered'?'active':''}" onclick="renderClientOrders('delivered')">${t('clientOrders.delivered')} (${c.delivered})</button>
      <button class="ftab ${filter==='unpaid'?'active':''}" onclick="renderClientOrders('unpaid')">${t('clientOrders.unpaid')} (${c.unpaid})</button>
    </div>
    ${ords.length ? ords.map(o => `
    <div class="portal-order-card" onclick="openClientOrderDetail('${o.id}')">
      <div class="portal-order-head"><span class="portal-order-num">${o.recipeNum}</span><div style="display:flex;gap:7px">${statusBadge(o.status)}${payBadge(o.paymentStatus)}</div></div>
      <div style="font-size:12.5px;color:var(--mute);margin:6px 0">${fmtDate(o.createdAt)} · ${o.products.length} ${o.products.length > 1 ? 'products' : 'product'}</div>
      ${o.products.map(p => `<div style="font-size:13px;padding:3px 0;border-bottom:1px solid var(--border-l);display:flex;justify-content:space-between"><span>${p.name}</span><span style="color:var(--mute)">${p.qty} L</span></div>`).join('')}
      <div style="display:flex;justify-content:space-between;margin-top:10px;align-items:center">
        <div class="pay-bar-wrap" style="flex:1;margin:0 12px 0 0"><div class="pay-bar-fill" style="width:${o.totalAmount>0?Math.round(o.paidAmount/o.totalAmount*100):0}%"></div></div>
        <strong style="font-size:14px">${fmtCur(o.totalAmount)}</strong>
      </div>
    </div>`).join('') : `<div class="empty"><div class="empty-icon">▣</div><h4>${t('clientOrders.noOrders')}</h4><p>${t('clientOrders.placeFirst')}</p></div>`}`;
  } catch (err) {
    document.getElementById('sectionClientorders').innerHTML = `<div class="empty" style="padding:40px">${t('clientOrders.failed')}</div>`;
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
    openModal(`<div class="mh"><div class="mh-left"><h3>${t('clientOrders.orderDetails')}</h3><span class="mh-recipe">${o.recipeNum}</span></div><button class="mx" onclick="closeModal()">✕</button></div>
    <div class="mc">
      <div class="two-col" style="margin-bottom:16px">
        <div class="info-block">
          <div class="info-row"><span class="ir-label">${t('clientOrders.status')}</span><span class="ir-val">${statusBadge(o.status)}</span></div>
          <div class="info-row"><span class="ir-label">${t('clientOrders.payment')}</span><span class="ir-val">${payBadge(o.paymentStatus)}</span></div>
          <div class="info-row"><span class="ir-label">${t('clientOrders.date')}</span><span class="ir-val">${fmtDate(o.createdAt)}</span></div>
        </div>
        <div class="info-block">
          <div class="info-row"><span class="ir-label">${t('clientOrders.total')}</span><span class="ir-val" style="color:var(--gold-d);font-weight:800">${fmtCur(o.totalAmount)}</span></div>
          <div class="info-row"><span class="ir-label">${t('clientOrders.paid')}</span><span class="ir-val" style="color:var(--green)">${fmtCur(o.paidAmount)}</span></div>
          <div class="info-row"><span class="ir-label">${t('clientOrders.balance')}</span><span class="ir-val" style="color:var(--red)">${fmtCur(o.totalAmount-o.paidAmount)}</span></div>
        </div>
      </div>
      <div class="pay-bar-wrap" style="height:9px;margin-bottom:16px"><div class="pay-bar-fill" style="width:${pct}%"></div></div>
      <div class="fsec">${t('clientOrders.deliveryStatus')}</div>
      ${ditems}
      ${o.mixerName&&o.mixerName!=='Unassigned'?`<div style="font-size:12.5px;color:var(--mute);margin-top:10px">${t('clientOrders.mixedBy')}${o.mixerName}</div>`:''}
      ${o.deliveryName&&o.deliveryName!=='Unassigned'?`<div style="font-size:12.5px;color:var(--mute)">${t('clientOrders.deliveryBy')}${o.deliveryName}</div>`:''}
      ${o.notes?`<div style="margin-top:12px;font-size:12.5px;color:var(--mute);background:var(--bg);padding:10px;border-radius:6px">📝 ${o.notes}</div>`:''}
    </div>
    <div class="mf"><button class="btn btn-ghost" onclick="closeModal()">${t('clientOrders.close')}</button></div>`, 'modal-md');
  } catch (err) {
    window.showToast('Failed to load order: ' + err.message, 'toast-red');
  }
}
