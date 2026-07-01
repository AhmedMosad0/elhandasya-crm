import { getOrders, getClients } from '../../api/index.js';
import { fmtCur } from '../../utils/index.js';

export function renderReports() {
  const clients = getClients();
  document.getElementById('sectionReports').innerHTML = `
  <div class="ph"><div class="ph-info"><h2>Reports</h2><p>Performance analytics by client and period</p></div></div>
  <div class="card" style="padding:20px;margin-bottom:20px">
    <div class="fr2">
      <div class="fg"><label class="fl">Client</label>
        <select class="fi" id="rep_cl" onchange="genReport()"><option value="all">All Clients</option>
          ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
      <div class="fg"><label class="fl">Period</label>
        <select class="fi" id="rep_per" onchange="genReport()">
          <option value="3">Last 3 Months</option><option value="6" selected>Last 6 Months</option><option value="12">Last 12 Months</option></select></div>
    </div></div>
  <div id="repOut"></div>`;
  genReport();
}

export function genReport() {
  const cid = document.getElementById('rep_cl').value;
  const mo = parseInt(document.getElementById('rep_per').value) || 6;
  const cut = new Date(); cut.setMonth(cut.getMonth() - mo);
  let ords = getOrders().filter(o => new Date(o.createdAt) >= cut);
  if (cid !== 'all') ords = ords.filter(o => o.clientId === cid);
  const rev = ords.reduce((a, o) => a + o.totalAmount, 0);
  const paid = ords.reduce((a, o) => a + o.paidAmount, 0);
  const del = ords.filter(o => o.status === 'delivered').length;
  const bkts = {};
  for (let i = mo - 1; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); const k = d.toISOString().slice(0, 7); bkts[k] = 0; }
  ords.forEach(o => { const k = (o.createdAt || '').slice(0, 7); if (bkts[k] !== undefined) bkts[k] += o.totalAmount; });
  const maxR = Math.max(...Object.values(bkts), 1);
  const bars = Object.entries(bkts).map(([k, v]) => `<div class="chart-bar-col"><div class="chart-bar" style="height:${Math.max(v / maxR * 100, 2)}%"><div class="chart-bar-tip">${fmtCur(v)}</div></div><div class="chart-lbl">${k.slice(5)}</div></div>`).join('');
  const pm = {}; ords.forEach(o => o.products.forEach(p => { if (!pm[p.name]) pm[p.name] = 0; pm[p.name] += p.qty; }));
  const sp = Object.entries(pm).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const mq = sp[0] ? sp[0][1] : 1;
  const cr = rev > 0 ? Math.round(paid / rev * 100) : 0;
  document.getElementById('repOut').innerHTML = `
  <div class="report-box"><div class="report-sec-title">Revenue by Month</div>
    <div class="chart-wrap">${bars}</div>
    <div class="report-stats-grid">
      <div class="rstat"><div class="rstat-val">${ords.length}</div><div class="rstat-lbl">Orders</div></div>
      <div class="rstat"><div class="rstat-val">${fmtCur(rev)}</div><div class="rstat-lbl">Revenue</div></div>
      <div class="rstat"><div class="rstat-val">${del}</div><div class="rstat-lbl">Delivered</div></div>
    </div></div>
  <div class="two-col">
    <div class="report-box"><div class="report-sec-title">Payment Summary</div>
      <div class="pay-nums">
        <div class="pay-num pn-slate"><div class="pn-val">${fmtCur(rev)}</div><div class="pn-lbl">Invoiced</div></div>
        <div class="pay-num pn-green"><div class="pn-val">${fmtCur(paid)}</div><div class="pn-lbl">Collected</div></div>
        <div class="pay-num pn-red"><div class="pn-val">${fmtCur(rev - paid)}</div><div class="pn-lbl">Outstanding</div></div>
      </div>
      <div class="pay-bar-wrap" style="height:9px"><div class="pay-bar-fill" style="width:${cr}%"></div></div>
      <div class="pay-mini"><span>Collection Rate</span><span style="font-weight:700">${cr}%</span></div>
    </div>
    <div class="report-box"><div class="report-sec-title">Top Products</div>
      ${sp.length ? sp.map(([nm, qty], i) => `<div class="prod-rank"><div class="prod-rank-num">${i + 1}</div>
        <div style="flex:1"><div style="font-size:12.5px;font-weight:600">${nm}</div>
          <div class="prod-bar" style="margin-top:5px"><div class="prod-bar-fill" style="width:${qty / mq * 100}%"></div></div>
        </div><div style="font-size:12px;font-weight:700;color:var(--mute)">${qty}L</div></div>`).join('') : '<div class="empty" style="padding:20px">No data</div>'}
    </div>
  </div>`;
}
