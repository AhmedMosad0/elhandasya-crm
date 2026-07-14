import { App } from '../../state/store.js';
import * as api from '../../api/index.js';
import { fmtDate, fmtCur, statusBadge, payBadge } from '../../utils/index.js';
import { openModal, closeModal } from '../../components/modal/modal.js';
import { showToast } from '../../components/toast/toast.js';
import { t } from '../../i18n/index.js';

export async function renderClients(q) {
  document.getElementById('sectionClients').innerHTML = `<div class="empty" style="padding:40px">${t('clients.loading')}</div>`;
  try {
    const [clients, orders] = await Promise.all([api.getClients(), api.getOrders()]);
    const isAdmin = App.user.role === 'admin';
    let list = clients;
    if (q) { const ql = q.toLowerCase(); list = list.filter(c => c.name.toLowerCase().includes(ql) || (c.company || '').toLowerCase().includes(ql)); }
    document.getElementById('sectionClients').innerHTML = `
    <div class="ph"><div class="ph-info"><h2>${t('clients.title')}</h2><p>${list.length} ${t('clients.title').toLowerCase()}</p></div>
      <div class="ph-actions">${isAdmin ? `<button class="btn btn-gold" onclick="openAddClient()">${t('clients.addClient')}</button>` : ''}</div></div>
    <div class="cards-grid">${list.map(c => {
      const co   = orders.filter(o => o.clientId === c.id);
      const spent = co.reduce((a, o) => a + o.totalAmount, 0);
      const outs  = co.reduce((a, o) => a + (o.totalAmount - o.paidAmount), 0);
      return `<div class="ccard" onclick="openClientModal('${c.id}')">
        <div class="ccard-avatar">${c.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
        <div class="ccard-name">${c.name}</div><div class="ccard-company">${c.company || '—'}</div>
        <div class="ccard-meta">
          <div class="ccard-stat"><span>${t('clients.orders')}</span><strong>${co.length}</strong></div>
          <div class="ccard-stat"><span>${t('clients.totalSpent')}</span><strong>${fmtCur(spent)}</strong></div>
          <div class="ccard-stat"><span>${t('clients.outstanding')}</span><strong style="${outs > 0 ? 'color:var(--red)' : ''}">${fmtCur(outs)}</strong></div>
        </div></div>`;
    }).join('')}</div>`;
  } catch (err) {
    document.getElementById('sectionClients').innerHTML = `<div class="empty" style="padding:40px">${t('clients.failed')}</div>`;
    showToast('Error: ' + err.message, 'toast-red');
  }
}

export async function openClientModal(cid) {
  try {
    const c = await api.getClient(cid);
    if (!c) return;
    const ords  = (c.orders || []).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const spent = ords.reduce((a, o) => a + o.totalAmount, 0);
    const outs  = ords.reduce((a, o) => a + (o.totalAmount - o.paidAmount), 0);
    openModal(`<div class="mh"><div class="mh-left"><h3>${c.name}</h3></div><button class="mx" onclick="closeModal()">✕</button></div>
    <div class="mc">
      <div class="info-block" style="margin-bottom:16px">
        <div class="info-row"><span class="ir-label">${t('clients.company')}</span><span class="ir-val">${c.company || '—'}</span></div>
        <div class="info-row"><span class="ir-label">${t('clients.phone')}</span><span class="ir-val">${c.phone}</span></div>
        <div class="info-row"><span class="ir-label">${t('clients.email')}</span><span class="ir-val">${c.email || '—'}</span></div>
        <div class="info-row"><span class="ir-label">${t('clients.address')}</span><span class="ir-val">${c.address}</span></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:18px">
        <div class="rstat"><div class="rstat-val">${ords.length}</div><div class="rstat-lbl">${t('clients.orders')}</div></div>
        <div class="rstat"><div class="rstat-val" style="color:var(--green)">${fmtCur(spent)}</div><div class="rstat-lbl">${t('clients.totalSpent')}</div></div>
        <div class="rstat"><div class="rstat-val" style="color:${outs > 0 ? 'var(--red)' : 'var(--green)'}">${fmtCur(outs)}</div><div class="rstat-lbl">${t('clients.outstanding')}</div></div>
      </div>
      <div class="fsec">${t('clients.orderHistory')}</div>
      ${ords.length ? ords.map(o => `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-l);cursor:pointer" onclick="closeModal();setTimeout(()=>openOrderModal('${o.id}'),100)">
        <div><span class="td-recipe">${o.recipeNum}</span> ${fmtDate(o.createdAt)}</div>
        <div style="display:flex;gap:8px;align-items:center">${statusBadge(o.status)}${payBadge(o.paymentStatus)}<strong>${fmtCur(o.totalAmount)}</strong></div>
      </div>`).join('') : `<div class="empty" style="padding:20px">${t('clients.noOrders')}</div>`}
    </div>
    <div class="mf"><button class="btn btn-ghost" onclick="closeModal()">${t('clients.close')}</button></div>`, 'modal-lg');
  } catch (err) {
    showToast('Failed to load client: ' + err.message, 'toast-red');
  }
}

export function openAddClient() {
  openModal(`<div class="mh"><div class="mh-left"><h3>${t('clients.addClientTitle')}</h3></div><button class="mx" onclick="closeModal()">✕</button></div>
  <div class="mc">
    <div class="fr2"><div class="fg"><label class="fl req">${t('clients.fullName')}</label><input class="fi" id="nc_name"></div><div class="fg"><label class="fl">${t('clients.company')}</label><input class="fi" id="nc_company"></div></div>
    <div class="fr2"><div class="fg"><label class="fl req">${t('clients.phone')}</label><input class="fi" id="nc_phone"></div><div class="fg"><label class="fl">${t('clients.email')}</label><input class="fi" id="nc_email" type="email"></div></div>
    <div class="fg"><label class="fl req">${t('clients.address')}</label><input class="fi" id="nc_addr"></div>
  </div>
  <div class="mf"><button class="btn btn-ghost" onclick="closeModal()">${t('clients.cancel')}</button><button class="btn btn-primary" onclick="saveNewClient()">${t('clients.addClientBtn')}</button></div>`, 'modal-sm');
}

export async function saveNewClient() {
  const name  = document.getElementById('nc_name').value.trim();
  const phone = document.getElementById('nc_phone').value.trim();
  const addr  = document.getElementById('nc_addr').value.trim();
  if (!name || !phone || !addr) { alert('Name, phone and address required.'); return; }
  try {
    await api.createClient({ name, phone, email: document.getElementById('nc_email').value || '', address: addr, company: document.getElementById('nc_company').value || '' });
    closeModal();
    showToast(`${t('clients.addClientBtn')} — ${name}`, 'toast-gold');
    await renderClients();
  } catch (err) {
    showToast('Failed to add client: ' + err.message, 'toast-red');
  }
}
