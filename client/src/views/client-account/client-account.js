import { App } from '../../state/store.js';
import * as api from '../../api/index.js';
import { fmtCur } from '../../utils/index.js';
import { t } from '../../i18n/index.js';

export async function renderClientAccount() {
  document.getElementById('sectionClientaccount').innerHTML = `<div class="empty" style="padding:40px">${t('clientAccount.loading')}</div>`;
  try {
    const [c, myOrds] = await Promise.all([
      api.getClient(App.user.clientId).catch(() => null),
      api.getOrders(),
    ]);
    const spent = myOrds.reduce((a, o) => a + o.totalAmount, 0);
    const outs  = myOrds.reduce((a, o) => a + (o.totalAmount - o.paidAmount), 0);
    document.getElementById('sectionClientaccount').innerHTML = `
    <div class="ph"><div class="ph-info"><h2>${t('clientAccount.title')}</h2><p>${t('clientAccount.subtitle')}</p></div></div>
    <div class="two-col">
      <div class="card"><div class="ch"><h3>${t('clientAccount.profile')}</h3></div><div class="cb">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
          <div style="width:60px;height:60px;border-radius:50%;background:var(--gold-l);border:3px solid var(--gold);color:var(--gold-d);font-size:22px;font-weight:800;display:flex;align-items:center;justify-content:center">${App.user.av}</div>
          <div><div style="font-size:18px;font-weight:800">${App.user.name}</div><div style="font-size:12.5px;color:var(--mute)">${t('clientAccount.clientRole')}</div></div>
        </div>
        ${c ? `<div class="info-block">
          <div class="info-row"><span class="ir-label">${t('clients.company')}</span><span class="ir-val">${c.company || '—'}</span></div>
          <div class="info-row"><span class="ir-label">${t('clients.phone')}</span><span class="ir-val">${c.phone}</span></div>
          <div class="info-row"><span class="ir-label">${t('clients.email')}</span><span class="ir-val">${c.email || '—'}</span></div>
          <div class="info-row"><span class="ir-label">${t('clients.address')}</span><span class="ir-val">${c.address}</span></div>
        </div>` : `<div class="empty" style="padding:20px">${t('clientAccount.profileNotFound')}</div>`}
      </div></div>
      <div class="card"><div class="ch"><h3>${t('clientAccount.summary')}</h3></div><div class="cb">
        <div class="rstat" style="margin-bottom:12px"><div class="rstat-val">${myOrds.length}</div><div class="rstat-lbl">${t('clientAccount.totalOrders')}</div></div>
        <div class="rstat" style="margin-bottom:12px"><div class="rstat-val">${fmtCur(spent)}</div><div class="rstat-lbl">${t('clientAccount.totalSpent')}</div></div>
        <div class="rstat" style="margin-bottom:12px"><div class="rstat-val" style="color:${outs>0?'var(--red)':'var(--green)'}">${fmtCur(outs)}</div><div class="rstat-lbl">${t('clientAccount.outstanding')}</div></div>
        <div class="rstat"><div class="rstat-val">${myOrds.filter(o=>o.status==='delivered').length}</div><div class="rstat-lbl">${t('clientAccount.delivered')}</div></div>
        <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
          <button class="btn btn-gold btn-sm" onclick="navigate('clientneworder')" style="width:100%">${t('clientAccount.placeNewOrder')}</button>
        </div>
      </div></div>
    </div>`;
  } catch (err) {
    document.getElementById('sectionClientaccount').innerHTML = `<div class="empty" style="padding:40px">${t('clientAccount.failed')}</div>`;
    window.showToast('Error: ' + err.message, 'toast-red');
  }
}
