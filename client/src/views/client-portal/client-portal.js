import { App } from '../../state/store.js';
import * as api from '../../api/index.js';
import { fmtDate, fmtCur, statusBadge, payBadge } from '../../utils/index.js';
import { t } from '../../i18n/index.js';

export async function renderClientPortal() {
  document.getElementById('sectionClientportal').innerHTML = `<div class="empty" style="padding:40px">${t('client.loading')}</div>`;
  try {
    const myOrds = await api.getOrders();
    const spent  = myOrds.reduce((a, o) => a + o.totalAmount, 0);
    const outs   = myOrds.reduce((a, o) => a + (o.totalAmount - o.paidAmount), 0);
    const active = myOrds.filter(o => o.status !== 'delivered').length;
    document.getElementById('sectionClientportal').innerHTML = `
    <div style="background:linear-gradient(135deg,#201f23,#464e52);color:white;border-radius:16px;padding:28px;margin-bottom:22px;position:relative;overflow:hidden">
      <div style="position:absolute;right:-40px;top:-40px;width:200px;height:200px;border-radius:50%;background:rgba(201,178,152,.08)"></div>
      <h2 style="font-size:22px;font-weight:800;margin-bottom:4px">${t('client.welcomeBack', { name: App.user.name.split(' ')[0] })}</h2>
      <p style="color:rgba(255,255,255,.6);font-size:13px">${t('client.tagline')}</p>
      <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(201,178,152,.15);border:1px solid rgba(201,178,152,.3);color:var(--gold);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin-top:12px">${t('client.portalBadge')}</div>
    </div>
    <div class="kpi-grid">
      <div class="kpi kpi-slate"><span class="kpi-icon">▣</span><div class="kpi-label">${t('client.myOrdersLabel')}</div><div class="kpi-val">${myOrds.length}</div><div class="kpi-sub">${t('client.activeOrders', { n: active })}</div></div>
      <div class="kpi kpi-green"><span class="kpi-icon">◈</span><div class="kpi-label">${t('client.totalSpent')}</div><div class="kpi-val">${fmtCur(spent)}</div><div class="kpi-sub">${t('client.allOrders')}</div></div>
      <div class="kpi kpi-gold"><span class="kpi-icon">⚐</span><div class="kpi-label">${t('client.outstanding')}</div><div class="kpi-val">${fmtCur(outs)}</div><div class="kpi-sub">${outs > 0 ? t('client.balanceDue') : t('client.allSettled')}</div></div>
      <div class="kpi kpi-blue"><span class="kpi-icon">◌</span><div class="kpi-label">${t('client.placeOrderLabel')}</div><div class="kpi-val" style="font-size:14px;padding-top:6px"><button class="btn btn-gold btn-sm" onclick="navigate('clientneworder')">${t('client.newOrderBtn')}</button></div><div class="kpi-sub">${t('client.directToTeam')}</div></div>
    </div>
    <div class="card"><div class="ch"><h3>${t('client.recentOrders')}</h3><button class="btn btn-ghost btn-sm" onclick="navigate('clientorders')">${t('dashboard.viewAll')}</button></div>
      <div style="overflow:auto"><table><thead><tr>
        <th>${t('dashboard.recipeNum')}</th>
        <th>${t('dashboard.status')}</th>
        <th>${t('dashboard.payment')}</th>
        <th>${t('dashboard.amount')}</th>
        <th>${t('orders.dateLabel')}</th>
      </tr></thead>
      <tbody>${myOrds.slice(0, 5).length
        ? myOrds.slice(0, 5).map(o => `<tr style="cursor:pointer" onclick="openClientOrderDetail('${o.id}')">
          <td><span class="td-recipe">${o.recipeNum}</span></td>
          <td>${statusBadge(o.status)}</td>
          <td>${payBadge(o.paymentStatus)}</td>
          <td style="font-weight:700">${fmtCur(o.totalAmount)}</td>
          <td style="color:var(--mute)">${fmtDate(o.createdAt)}</td>
        </tr>`).join('')
        : `<tr><td colspan="5" class="empty" style="padding:24px">${t('client.noOrdersYet')}</td></tr>`}
      </tbody></table></div></div>`;
  } catch (err) {
    document.getElementById('sectionClientportal').innerHTML = `<div class="empty" style="padding:40px">${t('client.failed')}</div>`;
    window.showToast('Error: ' + err.message, 'toast-red');
  }
}
