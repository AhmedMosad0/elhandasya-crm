import { App } from '../../state/store.js';
import * as api from '../../api/index.js';
import { fmtCur } from '../../utils/index.js';
import { showToast } from '../../components/toast/toast.js';

let _cplc = 1;

export async function renderClientNewOrder() {
  document.getElementById('sectionClientneworder').innerHTML = '<div class="empty" style="padding:40px">Loading…</div>';
  try {
    const c = await api.getClient(App.user.clientId).catch(() => null);
    document.getElementById('sectionClientneworder').innerHTML = `
    <div class="ph"><div class="ph-info"><h2>Place New Order</h2><p>Your order goes directly to our team — no approval step needed</p></div></div>
    <div class="card" style="padding:24px;max-width:760px">
      <div style="background:var(--gold-l);border:1px solid rgba(201,178,152,.4);border-radius:var(--r8);padding:12px 14px;margin-bottom:20px;font-size:13px;color:var(--gold-d)">
        ◈ Orders placed here go directly to El Handasya production — no sales request needed.
      </div>
      <div class="fsec">Delivery Details</div>
      <div class="fr2">
        <div class="fg"><label class="fl req">Delivery Address</label><input class="fi" id="co_addr" value="${c ? c.address : ''}" placeholder="Delivery address"></div>
        <div class="fg"><label class="fl req">Contact Phone</label><input class="fi" id="co_phone" value="${c ? c.phone : ''}" placeholder="01x…"></div>
      </div>
      <div class="fg"><label class="fl">Special Instructions</label><textarea class="fi" id="co_notes" rows="2" style="resize:none" placeholder="Color finish preference, urgency, delivery time…"></textarea></div>
      <div class="fsec">Products <button class="btn btn-ghost btn-xs" onclick="addCPline()" style="margin-left:8px;vertical-align:middle">＋ Add Product</button></div>
      <div class="pline-wrap" id="cplines">
        <div class="pline" id="cp_0">
          <input class="fi fi-sm" placeholder="Product name" id="cpn_0" oninput="calcCT()">
          <input class="fi fi-sm" placeholder="Color Code" id="cpc_0">
          <input class="fi fi-sm" placeholder="Color Name" id="cpcn_0">
          <input class="fi fi-sm" type="number" placeholder="Qty" id="cpq_0" oninput="calcCT()">
          <input class="fi fi-sm" type="number" placeholder="Price/unit" id="cpp_0" oninput="calcCT()">
          <button class="pline-rm" onclick="rmCPline(0)">✕</button>
        </div>
      </div>
      <div class="ptotal-row"><span class="ptotal-label">Order Total</span><span id="ctotal" style="color:var(--gold-d)">EGP 0</span></div>
      <div style="display:flex;justify-content:flex-end;gap:9px;margin-top:20px">
        <button class="btn btn-ghost" onclick="navigate('clientportal')">Cancel</button>
        <button class="btn btn-gold" onclick="submitClientOrder()" style="font-size:14px;padding:11px 28px">Place Order →</button>
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
  d.innerHTML = `<input class="fi fi-sm" placeholder="Product name" id="cpn_${i}" oninput="calcCT()"><input class="fi fi-sm" placeholder="Color Code" id="cpc_${i}"><input class="fi fi-sm" placeholder="Color Name" id="cpcn_${i}"><input class="fi fi-sm" type="number" placeholder="Qty" id="cpq_${i}" oninput="calcCT()"><input class="fi fi-sm" type="number" placeholder="Price/unit" id="cpp_${i}" oninput="calcCT()"><button class="pline-rm" onclick="rmCPline(${i})">✕</button>`;
  w.appendChild(d);
}

export function rmCPline(i) { const e = document.getElementById('cp_' + i); if (e) e.remove(); calcCT(); }

export function calcCT() {
  let t = 0;
  document.querySelectorAll('#cplines .pline').forEach(pl => {
    const i = pl.id.replace('cp_', '');
    const q = parseFloat(document.getElementById('cpq_' + i)?.value) || 0;
    const p = parseFloat(document.getElementById('cpp_' + i)?.value) || 0;
    t += q * p;
  });
  const e = document.getElementById('ctotal'); if (e) e.textContent = fmtCur(t); return t;
}

export async function submitClientOrder() {
  const addr  = document.getElementById('co_addr').value.trim();
  const phone = document.getElementById('co_phone').value.trim();
  if (!addr || !phone) { alert('Please enter delivery address and phone.'); return; }
  const products = [];
  document.querySelectorAll('#cplines .pline').forEach(pl => {
    const i     = pl.id.replace('cp_', '');
    const name  = (document.getElementById('cpn_' + i)?.value || '').trim();
    const qty   = parseFloat(document.getElementById('cpq_' + i)?.value) || 0;
    const price = parseFloat(document.getElementById('cpp_' + i)?.value) || 0;
    if (name && qty > 0) products.push({ name, colorCode:document.getElementById('cpc_'+i)?.value||'', colorName:document.getElementById('cpcn_'+i)?.value||'', qty, unit:'L', price, total:qty*price });
  });
  if (!products.length) { alert('Add at least one product with name and quantity.'); return; }
  try {
    const order = await api.createOrder({
      clientId:      App.user.clientId,
      clientName:    App.user.name,
      clientPhone:   phone,
      clientAddress: addr,
      source:        'client',
      notes:         document.getElementById('co_notes').value || '',
      products,
    });
    showToast(`Order ${order.recipeNum} placed!`, 'toast-gold');
    window.navigate('clientorders');
  } catch (err) {
    showToast('Failed to place order: ' + err.message, 'toast-red');
  }
}
