import { App } from '../../state/store.js';
import * as api from '../../api/index.js';
import { showToast } from '../../components/toast/toast.js';
import { openProductPicker } from '../../components/ProductPicker/product-picker.js';
import { t } from '../../i18n/index.js';

let _cplc = 1;
let _clientData = null;
let _surfaceType = '';
let _texture = '';
let _spaceType = '';

function _plineHTML(i) {
  return `<input class="fi fi-sm" placeholder="${t('clientNewOrder.productName')}" id="cpn_${i}">
    <input class="fi fi-sm" placeholder="${t('clientNewOrder.colorCode')}" id="cpc_${i}">
    <input class="fi fi-sm" placeholder="${t('clientNewOrder.colorName')}" id="cpcn_${i}">
    <div style="display:flex;align-items:center;gap:6px">
      <input class="fi fi-sm" type="number" placeholder="${t('clientNewOrder.qty')}" id="cpq_${i}" style="flex:1">
      <span style="font-size:12px;font-weight:600;color:var(--mute);white-space:nowrap">L</span>
    </div>
    <button class="pline-rm" onclick="rmCPline(${i})">✕</button>`;
}

export async function renderClientNewOrder() {
  document.getElementById('sectionClientneworder').innerHTML = `<div class="empty" style="padding:40px">${t('clientNewOrder.loading')}</div>`;
  try {
    _clientData = await api.getClient(App.user.clientId).catch(() => null);
    _showTypeChooser();
  } catch (err) {
    document.getElementById('sectionClientneworder').innerHTML = `<div class="empty" style="padding:40px">${t('clientNewOrder.failed')}</div>`;
    showToast('Error: ' + err.message, 'toast-red');
  }
}

function _showTypeChooser() {
  document.getElementById('sectionClientneworder').innerHTML = `
  <div class="ph"><div class="ph-info"><h2>${t('clientNewOrder.title')}</h2><p>${t('clientNewOrder.chooseSub')}</p></div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:720px">
    <div class="card" style="padding:28px 24px;cursor:pointer;text-align:center;border:2px solid transparent;transition:border-color .15s"
      onclick="_chooseType('standard')"
      onmouseover="this.style.borderColor='var(--gold)'"
      onmouseout="this.style.borderColor='transparent'">
      <div style="font-size:42px;margin-bottom:14px">📋</div>
      <div style="font-size:16px;font-weight:700;margin-bottom:6px">${t('clientNewOrder.knowWhatINeed')}</div>
      <div style="font-size:13px;color:var(--mute);direction:rtl;margin-bottom:12px">${t('clientNewOrder.knowWhatINeedAr')}</div>
      <div style="font-size:12.5px;color:var(--mute);line-height:1.6">${t('clientNewOrder.knowDesc')}</div>
    </div>
    <div class="card" style="padding:28px 24px;cursor:pointer;text-align:center;border:2px solid transparent;transition:border-color .15s"
      onclick="_chooseType('consultation')"
      onmouseover="this.style.borderColor='var(--blue,#2563eb)'"
      onmouseout="this.style.borderColor='transparent'">
      <div style="font-size:42px;margin-bottom:14px">💬</div>
      <div style="font-size:16px;font-weight:700;margin-bottom:6px">${t('clientNewOrder.needAdvice')}</div>
      <div style="font-size:13px;color:var(--mute);direction:rtl;margin-bottom:12px">${t('clientNewOrder.needAdviceAr')}</div>
      <div style="font-size:12.5px;color:var(--mute);line-height:1.6">${t('clientNewOrder.needAdviceDesc')}</div>
    </div>
  </div>`;
}

function _showStandardForm() {
  const c = _clientData;
  document.getElementById('sectionClientneworder').innerHTML = `
  <div class="ph">
    <div class="ph-info"><h2>${t('clientNewOrder.title')}</h2><p>${t('clientNewOrder.chooseSub')}</p></div>
    <div class="ph-actions"><button class="btn btn-ghost" onclick="_showTypeChooser()">${t('clientNewOrder.back')}</button></div>
  </div>
  <div class="card" style="padding:24px;max-width:760px">
    <div style="background:var(--gold-l);border:1px solid rgba(201,178,152,.4);border-radius:var(--r8);padding:12px 14px;margin-bottom:20px;font-size:13px;color:var(--gold-d)">
      ${t('clientNewOrder.reviewNotice')}
    </div>
    <div id="cnOrderSuccess" class="hidden" style="background:var(--green-l);border:1px solid var(--green);border-radius:var(--r8);padding:16px;margin-bottom:20px;font-size:13.5px;color:var(--green)"></div>
    <div id="cnOrderForm">
      <div class="fsec">${t('clientNewOrder.deliveryDetails')}</div>
      <div class="fr2">
        <div class="fg"><label class="fl req">${t('clientNewOrder.deliveryAddress')}</label><input class="fi" id="co_addr" value="${c ? c.address : ''}" placeholder="${t('clientNewOrder.addressPlaceholder')}"></div>
        <div class="fg"><label class="fl req">${t('clientNewOrder.contactPhone')}</label><input class="fi" id="co_phone" value="${c ? c.phone : ''}" placeholder="${t('clientNewOrder.phonePlaceholder')}"></div>
      </div>
      <div class="fg"><label class="fl">${t('clientNewOrder.specialInstructions')}</label><textarea class="fi" id="co_notes" rows="2" style="resize:none" placeholder="${t('clientNewOrder.specialInstructionsPlaceholder')}"></textarea></div>
      <div class="fsec">${t('clientNewOrder.products')}
        <button class="btn btn-ghost btn-xs" onclick="addCPline()" style="margin-left:8px;vertical-align:middle">${t('clientNewOrder.addProduct')}</button>
        <button class="btn btn-ghost btn-xs" onclick="_openPickerForClient()" style="margin-left:6px;vertical-align:middle">${t('clientNewOrder.catalog')}</button>
      </div>
      <div class="pline-wrap" id="cplines">
        <div class="pline" id="cp_0">${_plineHTML(0)}</div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:9px;margin-top:20px">
        <button class="btn btn-ghost" onclick="_showTypeChooser()">${t('clientNewOrder.cancel')}</button>
        <button class="btn btn-gold" onclick="submitClientOrder()" style="font-size:14px;padding:11px 28px">${t('clientNewOrder.submitOrder')}</button>
      </div>
    </div>
  </div>`;
  _cplc = 1;
}

function _showConsultationForm() {
  _surfaceType = ''; _texture = ''; _spaceType = '';
  const c = _clientData;

  document.getElementById('sectionClientneworder').innerHTML = `
  <div class="ph">
    <div class="ph-info"><h2>${t('clientNewOrder.consultTitle')}</h2><p>${t('clientNewOrder.consultSub')}</p></div>
    <div class="ph-actions"><button class="btn btn-ghost" onclick="_showTypeChooser()">${t('clientNewOrder.back')}</button></div>
  </div>
  <div class="card" style="padding:24px;max-width:760px">
    <div id="cnConsultSuccess" class="hidden" style="background:var(--green-l);border:1px solid var(--green);border-radius:var(--r8);padding:16px;margin-bottom:20px;font-size:13.5px;color:var(--green)"></div>
    <div id="cnConsultForm">
      <div class="fsec">${t('clientNewOrder.contactDetails')}</div>
      <div class="fr2">
        <div class="fg"><label class="fl req">${t('clientNewOrder.address')}</label><input class="fi" id="co_addr" value="${c ? c.address : ''}" placeholder="${t('clientNewOrder.addressPlaceholder')}"></div>
        <div class="fg"><label class="fl req">${t('clientNewOrder.phone')}</label><input class="fi" id="co_phone" value="${c ? c.phone : ''}" placeholder="${t('clientNewOrder.phonePlaceholder')}"></div>
      </div>

      <div class="fsec">${t('clientNewOrder.surfaceType')} <span style="font-size:11px;color:var(--red);font-weight:400">${t('clientNewOrder.required')}</span></div>
      <div id="tg_surface" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
        <button class="ftab" style="flex:1;min-width:140px;text-align:center;padding:10px 14px" data-val="internal" onclick="_selectToggle('surface',this.dataset.val)">
          ${t('clientNewOrder.internal')}<div style="font-size:11px;color:var(--mute);direction:rtl">${t('clientNewOrder.internalAr')}</div>
        </button>
        <button class="ftab" style="flex:1;min-width:140px;text-align:center;padding:10px 14px" data-val="external" onclick="_selectToggle('surface',this.dataset.val)">
          ${t('clientNewOrder.external')}<div style="font-size:11px;color:var(--mute);direction:rtl">${t('clientNewOrder.externalAr')}</div>
        </button>
      </div>

      <div class="fsec">${t('clientNewOrder.surfaceTexture')} <span style="font-size:11px;color:var(--red);font-weight:400">${t('clientNewOrder.required')}</span></div>
      <div id="tg_texture" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
        <button class="ftab" style="flex:1;min-width:120px;text-align:center;padding:10px 14px" data-val="concrete" onclick="_selectToggle('texture',this.dataset.val)">
          ${t('clientNewOrder.concrete')}<div style="font-size:11px;color:var(--mute);direction:rtl">${t('clientNewOrder.concreteAr')}</div>
        </button>
        <button class="ftab" style="flex:1;min-width:120px;text-align:center;padding:10px 14px" data-val="wood" onclick="_selectToggle('texture',this.dataset.val)">
          ${t('clientNewOrder.wood')}<div style="font-size:11px;color:var(--mute);direction:rtl">${t('clientNewOrder.woodAr')}</div>
        </button>
        <button class="ftab" style="flex:1;min-width:120px;text-align:center;padding:10px 14px" data-val="gypsum_board" onclick="_selectToggle('texture',this.dataset.val)">
          ${t('clientNewOrder.gypsumBoard')}<div style="font-size:11px;color:var(--mute);direction:rtl">${t('clientNewOrder.gypsumBoardAr')}</div>
        </button>
      </div>

      <div class="fsec">${t('clientNewOrder.spaceType')} <span style="font-size:11px;color:var(--red);font-weight:400">${t('clientNewOrder.required')}</span></div>
      <div id="tg_space" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
        <button class="ftab" style="flex:1;min-width:140px;text-align:center;padding:10px 14px" data-val="room" onclick="_selectToggle('space',this.dataset.val)">
          ${t('clientNewOrder.room')}<div style="font-size:11px;color:var(--mute);direction:rtl">${t('clientNewOrder.roomAr')}</div>
        </button>
        <button class="ftab" style="flex:1;min-width:140px;text-align:center;padding:10px 14px" data-val="apartment" onclick="_selectToggle('space',this.dataset.val)">
          ${t('clientNewOrder.apartment')}<div style="font-size:11px;color:var(--mute);direction:rtl">${t('clientNewOrder.apartmentAr')}</div>
        </button>
      </div>

      <div id="consultSpaceFields"></div>

      <div class="fg" style="margin-top:4px">
        <label class="fl">${t('clientNewOrder.additionalNotes')} <span style="font-size:11.5px;color:var(--mute)">${t('clientNewOrder.additionalNotesOptional')}</span></label>
        <textarea class="fi" id="co_consultNotes" rows="3" style="resize:none" placeholder="${t('clientNewOrder.additionalNotesPlaceholder')}"></textarea>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:9px;margin-top:20px">
        <button class="btn btn-ghost" onclick="_showTypeChooser()">${t('clientNewOrder.cancel')}</button>
        <button class="btn btn-gold" onclick="submitConsultation()" style="font-size:14px;padding:11px 28px">${t('clientNewOrder.submitConsultation')}</button>
      </div>
    </div>
  </div>`;
}

// ── Toggle helpers (on window for onclick) ──
window._showTypeChooser = _showTypeChooser;

window._chooseType = function (type) {
  if (type === 'standard') _showStandardForm();
  else _showConsultationForm();
};

window._selectToggle = function (group, val) {
  if (group === 'surface')  _surfaceType = val;
  else if (group === 'texture') _texture = val;
  else if (group === 'space') { _spaceType = val; _renderSpaceFields(); }
  document.querySelectorAll(`#tg_${group} .ftab`).forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === val);
  });
};

function _renderSpaceFields() {
  const el = document.getElementById('consultSpaceFields');
  if (!el) return;
  if (_spaceType === 'room') {
    el.innerHTML = `
    <div class="fsec">${t('clientNewOrder.roomDimensions')}</div>
    <div class="fr2">
      <div class="fg"><label class="fl req">${t('clientNewOrder.length')}</label><input class="fi" id="co_rl" type="number" min="0" step="0.1" oninput="_calcRoomArea()"></div>
      <div class="fg"><label class="fl req">${t('clientNewOrder.width')}</label><input class="fi" id="co_rw" type="number" min="0" step="0.1" oninput="_calcRoomArea()"></div>
    </div>
    <div class="fr2">
      <div class="fg"><label class="fl">${t('clientNewOrder.height')}</label><input class="fi" id="co_rh" type="number" min="0" step="0.1" value="2.8"></div>
      <div class="fg"><label class="fl">${t('clientNewOrder.floorArea')}</label><input class="fi" id="co_rarea" readonly style="background:var(--border-l);color:var(--mute)" placeholder="L × W"></div>
    </div>`;
  } else if (_spaceType === 'apartment') {
    el.innerHTML = `
    <div class="fsec">${t('clientNewOrder.apartmentDetails')}</div>
    <div class="fr2">
      <div class="fg"><label class="fl req">${t('clientNewOrder.numRooms')}</label><input class="fi" id="co_rooms" type="number" min="1" step="1" placeholder="${t('clientNewOrder.roomNumPlaceholder')}"></div>
      <div class="fg"><label class="fl req">${t('clientNewOrder.totalArea')}</label><input class="fi" id="co_aarea" type="number" min="0" step="1" placeholder="${t('clientNewOrder.areaPlaceholder')}"></div>
    </div>`;
  } else {
    el.innerHTML = '';
  }
}

window._calcRoomArea = function () {
  const l = parseFloat(document.getElementById('co_rl')?.value) || 0;
  const w = parseFloat(document.getElementById('co_rw')?.value) || 0;
  const el = document.getElementById('co_rarea');
  if (el) el.value = l && w ? (l * w).toFixed(2) + ' m²' : '';
};

// ── Standard order functions ──
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
  const addr  = (document.getElementById('co_addr')?.value  || '').trim();
  const phone = (document.getElementById('co_phone')?.value || '').trim();
  if (!addr || !phone) { alert(t('clientNewOrder.needDeliveryInfo')); return; }

  const products = [];
  let hasIncomplete = false;

  document.querySelectorAll('#cplines .pline').forEach(pl => {
    const i    = pl.id.replace('cp_', '');
    const name = (document.getElementById('cpn_' + i)?.value || '').trim();
    const qty  = parseFloat(document.getElementById('cpq_' + i)?.value) || 0;

    const isEmpty = !name && !qty;
    if (isEmpty) { pl.style.outline = ''; return; }

    if (!name || qty <= 0) {
      pl.style.outline = '2px solid var(--red)';
      pl.style.borderRadius = '6px';
      hasIncomplete = true;
    } else {
      pl.style.outline = '';
      products.push({
        name,
        colorCode:  document.getElementById('cpc_'  + i)?.value || '',
        colorName:  document.getElementById('cpcn_' + i)?.value || '',
        qty, unit: 'L', price: 0, total: 0,
      });
    }
  });

  if (hasIncomplete) {
    showToast(t('clientNewOrder.completeProducts'), 'toast-red');
    return;
  }
  if (!products.length) { alert(t('clientNewOrder.addAtLeastOne')); return; }

  try {
    await api.createRequest({
      clientId: App.user.clientId, clientName: App.user.name,
      phone, address: addr, source: 'client', requestType: 'standard',
      notes: document.getElementById('co_notes')?.value || '', products,
    });
    const formEl    = document.getElementById('cnOrderForm');
    const successEl = document.getElementById('cnOrderSuccess');
    if (formEl)    formEl.classList.add('hidden');
    if (successEl) { successEl.textContent = t('clientNewOrder.orderSuccess'); successEl.classList.remove('hidden'); }
    showToast(t('clientNewOrder.orderSubmitted'), 'toast-gold');
  } catch (err) {
    showToast(t('clientNewOrder.failedSubmit') + ': ' + err.message, 'toast-red');
  }
}

// ── Consultation submit ──
export async function submitConsultation() {
  const addr  = (document.getElementById('co_addr')?.value  || '').trim();
  const phone = (document.getElementById('co_phone')?.value || '').trim();
  if (!addr || !phone) { alert(t('clientNewOrder.needContactInfo')); return; }
  if (!_surfaceType) { alert(t('clientNewOrder.selectSurface')); return; }
  if (!_texture)     { alert(t('clientNewOrder.selectTexture')); return; }
  if (!_spaceType)   { alert(t('clientNewOrder.selectSpace')); return; }

  const payload = {
    clientId: App.user.clientId, clientName: App.user.name,
    phone, address: addr, source: 'client', requestType: 'consultation',
    products: [], totalAmount: 0,
    surfaceType: _surfaceType, texture: _texture, spaceType: _spaceType,
    consultNotes: document.getElementById('co_consultNotes')?.value || '',
  };

  if (_spaceType === 'room') {
    payload.roomLength = parseFloat(document.getElementById('co_rl')?.value) || null;
    payload.roomWidth  = parseFloat(document.getElementById('co_rw')?.value) || null;
    payload.roomHeight = parseFloat(document.getElementById('co_rh')?.value) || null;
    if (!payload.roomLength || !payload.roomWidth) { alert(t('clientNewOrder.enterRoomDims')); return; }
  } else if (_spaceType === 'apartment') {
    payload.numRooms      = parseInt(document.getElementById('co_rooms')?.value)   || null;
    payload.apartmentArea = parseFloat(document.getElementById('co_aarea')?.value) || null;
    if (!payload.numRooms || !payload.apartmentArea) { alert(t('clientNewOrder.enterApartmentDims')); return; }
  }

  try {
    await api.createRequest(payload);
    const formEl    = document.getElementById('cnConsultForm');
    const successEl = document.getElementById('cnConsultSuccess');
    if (formEl)    formEl.classList.add('hidden');
    if (successEl) { successEl.textContent = t('clientNewOrder.consultSuccess'); successEl.classList.remove('hidden'); }
    showToast(t('clientNewOrder.consultSubmitted'), 'toast-gold');
  } catch (err) {
    showToast(t('clientNewOrder.failedSubmit') + ': ' + err.message, 'toast-red');
  }
}
