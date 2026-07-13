import * as api from '../../api/index.js';
import { fmtDate, fmtCur, statusBadge, payBadge } from '../../utils/index.js';

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

export async function renderDashboard() {
  document.getElementById('sectionDashboard').innerHTML = '<div class="empty" style="padding:40px">Loading dashboard…</div>';
  try {
    const [orders, requests] = await Promise.all([api.getOrders(), api.getRequests()]);
    const pending   = requests.filter(r => r.status === 'pending' || r.status === 'pricing_submitted').length;
    const delayed   = requests.filter(r => _isDelayed(r)).length;
    const revenue   = orders.reduce((a, o) => a + o.totalAmount, 0);
    const paid      = orders.reduce((a, o) => a + o.paidAmount,  0);
    const active    = orders.filter(o => o.status !== 'delivered').length;
    const recent    = [...orders].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 6);

    const pendingReqs = requests.filter(r => r.status === 'pending' || r.status === 'pricing_submitted')
      .sort((a, b) => {
        // delayed first
        const da = _isDelayed(a) ? 0 : 1;
        const db = _isDelayed(b) ? 0 : 1;
        if (da !== db) return da - db;
        return b.createdAt.localeCompare(a.createdAt);
      });

    document.getElementById('sectionDashboard').innerHTML = `
    <div class="ph"><div class="ph-info"><h2>Overview</h2><p>El Handasya · Mohamed Diaa Dealership · ${fmtDate(new Date().toISOString())}</p></div>
      <div class="ph-actions"><button class="btn btn-gold" onclick="navigate('orders')">▣ Manage Orders</button></div></div>
    <div class="kpi-grid">
      <div class="kpi kpi-slate"><span class="kpi-icon">▣</span><div class="kpi-label">Total Orders</div><div class="kpi-val">${orders.length}</div><div class="kpi-sub">${active} currently active</div></div>
      <div class="kpi kpi-gold"><span class="kpi-icon">◌</span><div class="kpi-label">Pending Approvals</div><div class="kpi-val">${pending}</div><div class="kpi-sub"><a href="#" onclick="navigate('requests')" style="color:var(--gold-d)">Review now →</a></div></div>
      <div class="kpi kpi-green"><span class="kpi-icon">◈</span><div class="kpi-label">Total Revenue</div><div class="kpi-val">${fmtCur(revenue)}</div><div class="kpi-sub">All-time gross</div></div>
      <div class="kpi kpi-blue"><span class="kpi-icon">⚐</span><div class="kpi-label">Outstanding</div><div class="kpi-val">${fmtCur(revenue - paid)}</div><div class="kpi-sub">Awaiting collection</div></div>
      <div class="kpi" style="background:var(--red-l);border:1px solid #fca5a5"><span class="kpi-icon" style="color:#dc2626">⏰</span><div class="kpi-label">Delayed Requests</div><div class="kpi-val" style="color:#dc2626">${delayed}</div><div class="kpi-sub">Open &gt; 24 hours</div></div>
    </div>
    <div class="two-col">
      <div class="card"><div class="ch"><h3>Recent Orders</h3><button class="btn btn-ghost btn-sm" onclick="navigate('orders')">View all</button></div>
        <div style="overflow:auto"><table><thead><tr><th>Recipe #</th><th>Client</th><th>Status</th><th>Payment</th><th>Amount</th></tr></thead>
        <tbody>${recent.length ? recent.map(o => `<tr style="cursor:pointer" onclick="openOrderModal('${o.id}')">
          <td><span class="td-recipe">${o.recipeNum}</span></td>
          <td><strong>${o.clientName}</strong>${o.source === 'client' ? ' <span class="badge b-direct" style="font-size:9px;padding:1px 5px">Portal</span>' : ''}</td>
          <td>${statusBadge(o.status)}</td><td>${payBadge(o.paymentStatus)}</td>
          <td style="font-weight:700">${fmtCur(o.totalAmount)}</td></tr>`).join('') : '<tr><td colspan="5" class="empty" style="padding:24px">No orders yet</td></tr>'}
        </tbody></table></div></div>
      <div class="card"><div class="ch"><h3>Pending Requests</h3><button class="btn btn-ghost btn-sm" onclick="navigate('requests')">View all</button></div>
        <div class="cb" style="padding-top:12px">
          ${pendingReqs.length ? pendingReqs.slice(0, 4).map(r => {
            const late = _isDelayed(r);
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-l)${late ? ';background:linear-gradient(90deg,#fef2f2,transparent);border-radius:4px;padding-left:8px' : ''}">
              <div>
                ${late ? `<div style="font-size:10px;color:#dc2626;font-weight:700;margin-bottom:2px">⏰ ${_ageStr(r)} delayed</div>` : ''}
                <div style="font-weight:700;font-size:13.5px">${r.clientName}${r.status === 'pricing_submitted' ? ' <span style="font-size:10px;padding:2px 6px;border-radius:3px;background:#fdf3dc;color:#b45309;font-weight:600">Pricing Review</span>' : ''}</div>
                <div style="font-size:11.5px;color:var(--mute)">${r.ref} · ${fmtDate(r.createdAt)} · ${fmtCur(r.totalAmount)}</div>
              </div>
              <div style="display:flex;gap:6px">
                <button class="btn btn-green btn-xs" onclick="${r.status === 'pricing_submitted' ? 'doFinalApprove' : r.source !== 'sales' ? 'promptApproveWithSales' : 'approveRequest'}('${r.id}')">✓</button>
                <button class="btn btn-danger btn-xs" onclick="promptReject('${r.id}')">✕</button>
              </div>
            </div>`;
          }).join('') : '<div class="empty" style="padding:24px"><div>✅</div><p>All requests handled</p></div>'}
        </div></div>
    </div>`;
  } catch (err) {
    document.getElementById('sectionDashboard').innerHTML = '<div class="empty" style="padding:40px">Failed to load dashboard</div>';
    window.showToast('Dashboard error: ' + err.message, 'toast-red');
  }
}
