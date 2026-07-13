import { App } from '../../state/store.js';
import * as api from '../../api/index.js';
import { showToast } from '../../components/toast/toast.js';
import { openProductPicker } from '../../components/ProductPicker/product-picker.js';

let _cplc = 1;

function _plineHTML(i) {
  return `<input class="fi fi-sm" placeholder="Product name" id="cpn_${i}">
    <input class="fi fi-sm" placeholder="Color Code" id="cpc_${i}">
    <input class="fi fi-sm" placeholder="Color Name" id="cpcn_${i}">
    <div style="display:flex;align-items:center;gap:6px">
      <input class="fi fi-sm" type="number" placeholder="Qty" id="cpq_${i}" style="flex:1">
      <span style="font-size:12px;font-weight:600;color:var(--mute);white-space:nowrap">L</span>
    </div>
    <button class="pline-rm" onclick="rmCPline(${i})">✕</button>`;
}

export async function renderClientNewOrder() {
  document.getElementById('sectionClientneworder').innerHTML = '<div class="empty" style="padding:40px">Loading…</div>';
  try {
    const c = await api.getClient(App.user.clientId).catch(() => null);
    document.getElementById('sectionClientneworder').innerHTML = `
    <div class="ph"><div class="ph-info"><h2>Place New Order</h2><p>Submit your order request — our team will review and price it for you</p></div></div>
    <div class="card" style="padding:24px;max-width:760px">
      <div style="background:var(--gold-l);border:1px solid rgba(201,178,152,.4);border-radius:var(--r8);padding:12px 14px;margin-bottom:20px;font-size:13px;color:var(--gold-d)">
        ◈ Your order will be reviewed and priced by our sales team before being confirmed.
      </div>
      <div id="cnOrderSuccess" class="hidden" style="background:var(--green-l);border:1px solid var(--green);border-radius:var(--r8);padding:16px;margin-bottom:20px;font-size:13.5px;color:var(--green)"></div>
      <div id="cnOrderForm">
        <div class="fsec">Delivery Details</div>
        <div class="fr2">
          <div class="fg"><label class="fl req">Delivery Address</label><input class="fi" id="co_addr" value="${c ? c.address : ''}" placeholder="Delivery address"></div>
          <div class="fg"><label class="fl req">Contact Phone</label><input class="fi" id="co_phone" value="${c ? c.phone : ''}" placeholder="01x…"></div>
        </div>
        <div class="fg"><label class="fl">Special Instructions</label><textarea class="fi" id="co_notes" rows="2" style="resize:none" placeholder="Color finish preference, urgency, delivery time…"></textarea></div>
        <div class="fsec">Products <button class="btn btn-ghost btn-xs" onclick="addCPline()" style="margin-left:8px;vertical-align:middle">＋ Add</button><button class="btn btn-ghost btn-xs" onclick="_openPickerForClient()" style="margin-left:6px;vertical-align:middle">◫ Catalog</button></div>
        <div class="pline-wrap" id="cplines">
          <div class="pline" id="cp_0">${_plineHTML(0)}</div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:9px;margin-top:20px">
          <button class="btn btn-ghost" onclick="navigate('clientportal')">Cancel</button>
          <button class="btn btn-gold" onclick="submitClientOrder()" style="font-size:14px;padding:11px 28px">Submit Order Request →</button>
        </div>
      </div>
    </div>`;
    _cplc = 1;
  } catch (err) {
    document.getElementById('sectionClientneworder').innerHTML = '<div class="empty" style="padding:40px">Failed to load form</div>';
    showToast('Error: ' + err.message, 'toast-red');
  }
}

export function addCPline() {
  const i = _cplc++;
  const w = document.getElementById('cplines');
  const d = document.createElement('div'); d.className = 'pline'; d.id = 'cp_' + i;
  d.innerHTML = _plineHTML(i);
  w.appendChild(d);
}

export function rmCPline(i) { const e = document.getElementById('cp_' + i); if (e) e.remove(); }

export function calcCT() { /* no-op — no pricing in client orders */ }

function _openPickerForClient() {
  openProductPicker(({ name, colorName, qty }) => {
    let targetIdx = null;
    for (const pl of document.querySelectorAll('#cplines .pline')) {
      const i = pl.id.replace('cp_', '');
      if (!(document.getElementById('cpn_' + i)?.value || '').trim()) { targetIdx = i; break; }
    }
    if (targetIdx === null) {
      targetIdx = _cplc++;
      const d = document.createElement('div'); d.className = 'pline'; d.id = 'cp_' + targetIdx;
      d.innerHTML = _plineHTML(targetIdx);
      document.getElementById('cplines').appendChild(d);
    }
    document.getElementById('cpn_'  + targetIdx).value = name;
    if (colorName) document.getElementById('cpcn_' + targetIdx).value = colorName;
    document.getElementById('cpq_'  + targetIdx).value = qty;
  });
}
window._openPickerForClient = _openPickerForClient;

export async function submitClientOrder() {
  const addr  = document.getElementById('co_addr').value.trim();
  const phone = document.getElementById('co_phone').value.trim();
  if (!addr || !phone) { alert('Please enter delivery address and phone.'); return; }

  const products = [];
  document.querySelectorAll('#cplines .pline').forEach(pl => {
    const i    = pl.id.replace('cp_', '');
    const name = (document.getElementById('cpn_' + i)?.value || '').trim();
    const qty  = parseFloat(document.getElementById('cpq_' + i)?.value) || 0;
    if (name && qty > 0) products.push({
      name,
      colorCode:  document.getElementById('cpc_'  + i)?.value || '',
      colorName:  document.getElementById('cpcn_' + i)?.value || '',
      qty, unit: 'L', price: 0, total: 0,
    });
  });
  if (!products.length) { alert('Add at least one product with name and quantity.'); return; }

  try {
    await api.createRequest({
      clientId:  App.user.clientId,
      clientName: App.user.name,
      phone, address: addr, source: 'client',
      notes: document.getElementById('co_notes').value || '',
      products,
    });
    const formEl    = document.getElementById('cnOrderForm');
    const successEl = document.getElementById('cnOrderSuccess');
    if (formEl)    formEl.classList.add('hidden');
    if (successEl) {
      successEl.textContent = '✓ Your order has been submitted. You\'ll be notified once it\'s reviewed and priced.';
      successEl.classList.remove('hidden');
    }
    showToast('Order request submitted!', 'toast-gold');
  } catch (err) {
    showToast('Failed to submit: ' + err.message, 'toast-red');
  }
}
