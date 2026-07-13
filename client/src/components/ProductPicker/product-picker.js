import * as api from '../../api/index.js';

const CATS = [
  'Interior Walls', 'Exterior Walls', 'Wood & Metal',
  'Waterproofing', 'Primers & Undercoats', 'Special Finishes',
];

let _onSelect = null;
let _products = [];
let _query = '';
let _cat = '';
let _searchTimer = null;

export async function openProductPicker(onSelect) {
  _onSelect = onSelect;
  _query = '';
  _cat = '';

  let ov = document.getElementById('productPickerOverlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'productPickerOverlay';
    document.body.appendChild(ov);
  }
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:2000;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';

  // Build static shell ONCE — search input lives here and is NEVER replaced
  ov.innerHTML = `
  <div style="background:var(--bg);border-radius:12px;width:min(940px,100%);max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.45)">
    <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;flex-shrink:0">
      <div style="font-size:15px;font-weight:700;flex:1">
        ◫ Pick from Catalog
        <span id="pickerCount" style="font-size:12px;font-weight:400;color:var(--mute)"></span>
      </div>
      <input id="pickerSearchInput" class="fi" placeholder="Search…"
        style="max-width:200px;margin:0"
        oninput="_pickerSearch(this.value)">
      <button class="btn btn-ghost btn-sm" onclick="closeProductPicker()">✕ Close</button>
    </div>
    <div id="pickerCatBar" style="padding:10px 20px;border-bottom:1px solid var(--border);display:flex;gap:7px;flex-wrap:wrap;flex-shrink:0">
      <button class="ftab active" data-cat="" onclick="_pickerCat(this.dataset.cat)">All</button>
      ${CATS.map(c => `<button class="ftab" data-cat="${c}" onclick="_pickerCat(this.dataset.cat)">${c.replace('&', '&amp;')}</button>`).join('')}
    </div>
    <div id="pickerResults" style="flex:1;overflow-y:auto;padding:16px 20px">
      <div style="color:var(--mute);font-size:14px;text-align:center;padding:40px 0">Loading…</div>
    </div>
  </div>`;

  try {
    _products = await api.getProducts();
  } catch {
    _products = [];
  }
  _renderResults();
}

export function closeProductPicker() {
  const ov = document.getElementById('productPickerOverlay');
  if (ov) ov.remove();
}

function _filtered() {
  const q = _query.toLowerCase();
  return _products.filter(p =>
    (!q || p.nameEn.toLowerCase().includes(q) || (p.nameAr || '').includes(q))
    && (!_cat || p.category === _cat)
  );
}

// Only updates the results div — never touches the search input or category bar
function _renderResults() {
  const results = document.getElementById('pickerResults');
  if (!results) return;
  const list = _filtered();
  const countEl = document.getElementById('pickerCount');
  if (countEl) countEl.textContent = `(${list.length} products)`;
  results.innerHTML = list.length
    ? `<div class="cards-grid">${list.map(_card).join('')}</div>`
    : '<div class="empty" style="padding:48px 0"><div class="empty-icon">◫</div><h4>No products found</h4></div>';
}

function _card(p) {
  const img = p.imageUrl
    ? `<img src="${p.imageUrl}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px" loading="lazy">`
    : `<div style="height:64px;background:var(--border-l);border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:8px;font-size:22px;color:var(--mute)">◫</div>`;
  const vOpts = (p.variants || []).map(v =>
    `<option value="${v.id}" data-price="${v.price}" data-size="${v.size}">${v.size} — EGP ${v.price.toLocaleString()}</option>`
  ).join('');
  return `<div class="rcard" style="cursor:default">
    ${img}
    <div style="font-size:13px;font-weight:700;line-height:1.3;margin-bottom:2px">${p.nameEn}</div>
    <div style="font-size:11.5px;color:var(--mute);margin-bottom:6px;direction:rtl;text-align:right">${p.nameAr || ''}</div>
    <div style="margin-bottom:10px">
      <span style="font-size:11px;background:var(--gold-l);color:var(--gold-d);padding:1px 7px;border-radius:99px">${p.category || ''}</span>
    </div>
    <div style="display:flex;gap:5px;align-items:center">
      <select class="fi fi-sm" id="ppv_${p.id}" style="flex:1;min-width:0">${vOpts}</select>
      <input class="fi fi-sm" type="number" id="ppq_${p.id}" min="1" value="1" style="width:54px;text-align:center">
      <button class="btn btn-gold btn-xs" data-pid="${p.id}" onclick="_pickerPick(this.dataset.pid)">Add</button>
    </div>
  </div>`;
}

// ── Window-exposed picker internals ──

// Debounced search — does NOT re-render the shell, only the results div
window._pickerSearch = function (v) {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => {
    _query = v;
    _renderResults();
  }, 300);
};

// Category switch — updates active class on existing buttons, then re-renders results only
window._pickerCat = function (v) {
  _cat = v;
  document.querySelectorAll('#pickerCatBar .ftab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === v);
  });
  _renderResults();
};

window._pickerPick = function (pid) {
  const p   = _products.find(x => x.id === pid);
  const sel = document.getElementById('ppv_' + pid);
  const qEl = document.getElementById('ppq_' + pid);
  if (!p || !sel || !qEl) return;
  const opt   = sel.options[sel.selectedIndex];
  const price = parseFloat(opt.dataset.price) || 0;
  const size  = opt.dataset.size || '';
  const qty   = parseFloat(qEl.value) || 1;
  if (_onSelect) _onSelect({ name: p.nameEn + ' (' + size + ')', colorCode: '', colorName: p.nameAr || '', qty, price });
  closeProductPicker();
};
