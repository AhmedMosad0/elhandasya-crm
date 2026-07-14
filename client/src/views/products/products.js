import * as api from '../../api/index.js';
import { openModal, closeModal } from '../../components/modal/modal.js';
import { showToast } from '../../components/toast/toast.js';
import { t } from '../../i18n/index.js';

const CATS = [
  'Interior Walls', 'Exterior Walls', 'Wood & Metal',
  'Waterproofing', 'Primers & Undercoats', 'Special Finishes',
];

let _products = [];
let _pQuery = '';
let _pCat = '';
let _editId = null;

export async function renderProducts() {
  const sec = document.getElementById('sectionProducts');
  if (!sec) return;
  sec.innerHTML = `<div class="empty" style="padding:40px">${t('products.loading')}</div>`;
  try {
    _products = await api.getProducts();
    _draw();
  } catch (err) {
    sec.innerHTML = `<div class="empty" style="padding:40px">${t('products.failed')}</div>`;
    showToast('Error: ' + err.message, 'toast-red');
  }
}

function _draw() {
  const sec = document.getElementById('sectionProducts');
  if (!sec) return;
  const q = _pQuery.toLowerCase();
  const list = _products.filter(p =>
    (!q || p.nameEn.toLowerCase().includes(q) || (p.nameAr || '').includes(q))
    && (!_pCat || p.category === _pCat)
  );

  sec.innerHTML = `
  <div class="ph">
    <div class="ph-info">
      <h2>${t('products.title')}</h2>
      <p>${t('products.subtitle', { n: _products.length })}</p>
    </div>
    <div class="ph-actions">
      <button class="btn btn-gold" onclick="openProductForm()">${t('products.addProduct')}</button>
    </div>
  </div>
  <div class="fbar" style="flex-wrap:wrap;gap:7px;align-items:center">
    <input class="fi" placeholder="${t('products.searchPlaceholder')}" style="max-width:220px;margin:0" oninput="_prodSearch(this.value)" value="${_pQuery}">
    <button class="ftab${!_pCat ? ' active' : ''}" data-cat="" onclick="_prodCat(this.dataset.cat)">${t('products.all')} (${_products.length})</button>
    ${CATS.map(c => {
      const count = _products.filter(p => p.category === c).length;
      return `<button class="ftab${_pCat === c ? ' active' : ''}" data-cat="${c}" onclick="_prodCat(this.dataset.cat)">${c.replace('&', '&amp;')} (${count})</button>`;
    }).join('')}
  </div>
  <div class="cards-grid" style="margin-top:16px">
    ${list.length
      ? list.map(_card).join('')
      : `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">◫</div><h4>${t('products.noProductsFound')}</h4><p>${t('products.adjustSearch')}</p></div>`}
  </div>`;
}

function _card(p) {
  const img = p.imageUrl
    ? `<img src="${p.imageUrl}" style="width:100%;height:130px;object-fit:cover;border-radius:8px;margin-bottom:10px" loading="lazy">`
    : `<div style="height:72px;background:var(--border-l);border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:10px;font-size:26px;color:var(--mute)">${t('products.noImage')}</div>`;
  const vs = (p.variants || []).map(v =>
    `<span style="font-size:11.5px;color:var(--mute)">${v.size}: <strong style="color:var(--gold-d)">EGP ${v.price.toLocaleString()}</strong></span>`
  ).join('&ensp;·&ensp;');
  return `<div class="rcard">
    ${img}
    <div style="font-size:13.5px;font-weight:700;margin-bottom:2px">${p.nameEn}</div>
    <div style="font-size:12px;color:var(--mute);margin-bottom:6px;direction:rtl;text-align:right">${p.nameAr || ''}</div>
    <div style="margin-bottom:8px">
      <span style="font-size:11px;background:var(--gold-l);color:var(--gold-d);padding:1px 7px;border-radius:99px">${p.category || ''}</span>
    </div>
    <div style="font-size:12px;margin-bottom:12px;line-height:1.8">${vs}</div>
    <div class="rcard-actions">
      <button class="btn btn-ghost btn-xs" style="flex:1" data-pid="${p.id}" onclick="openProductForm(this.dataset.pid)">${t('products.edit')}</button>
      <button class="btn btn-danger btn-xs" style="flex:1" data-pid="${p.id}" onclick="_deleteProd(this.dataset.pid)">${t('products.delete')}</button>
    </div>
  </div>`;
}

export function openProductForm(id) {
  _editId = id || null;
  const p = id ? _products.find(x => x.id === id) : null;
  const vs = p ? p.variants : [];
  const v1  = vs.find(v => v.size === '1L')?.price  ?? '';
  const v3  = vs.find(v => v.size === '3L')?.price  ?? '';
  const v10 = vs.find(v => v.size === '10L')?.price ?? '';

  const catOpts = CATS.map(c => `<option value="${c}"${p?.category === c ? ' selected' : ''}>${c.replace('&', '&amp;')}</option>`).join('');
  const imgBlock = p?.imageUrl
    ? `<img src="${p.imageUrl}" style="width:100%;max-height:160px;object-fit:cover;border-radius:8px;margin-bottom:8px">`
    : `<div style="height:72px;background:var(--border-l);border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:8px;font-size:22px;color:var(--mute)">${t('products.noImage')}</div>`;

  openModal(`
  <div class="mh">
    <div class="mh-left"><h3>${p ? t('products.editProduct') : t('products.newProduct')}</h3></div>
    <button class="mx" onclick="closeModal()">✕</button>
  </div>
  <div class="mc">
    <div class="fr2">
      <div class="fg"><label class="fl req">${t('products.nameEn')}</label><input class="fi" id="pf_nameEn" value="${p?.nameEn || ''}"></div>
      <div class="fg"><label class="fl req">${t('products.nameAr')}</label><input class="fi" id="pf_nameAr" dir="rtl" value="${p?.nameAr || ''}"></div>
    </div>
    <div class="fr2">
      <div class="fg"><label class="fl">${t('products.descEn')}</label><textarea class="fi" id="pf_descEn" rows="2" style="resize:none">${p?.descEn || ''}</textarea></div>
      <div class="fg"><label class="fl">${t('products.descAr')}</label><textarea class="fi" id="pf_descAr" dir="rtl" rows="2" style="resize:none">${p?.descAr || ''}</textarea></div>
    </div>
    <div class="fg"><label class="fl req">${t('products.category')}</label>
      <select class="fi" id="pf_cat"><option value="">${t('products.selectCategory')}</option>${catOpts}</select>
    </div>
    <div class="fsec">${t('products.variantPrices')}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
      <div class="fg"><label class="fl req">1L</label><input class="fi" id="pf_p1" type="number" min="0" placeholder="e.g. 65" value="${v1}"></div>
      <div class="fg"><label class="fl req">3L</label><input class="fi" id="pf_p3" type="number" min="0" placeholder="e.g. 175" value="${v3}"></div>
      <div class="fg"><label class="fl req">10L</label><input class="fi" id="pf_p10" type="number" min="0" placeholder="e.g. 520" value="${v10}"></div>
    </div>
    <div class="fg">
      <label class="fl">${t('products.productImage')}</label>
      <div id="prodImgWrapper">${imgBlock}</div>
      <input type="file" class="fi" id="pf_img" accept="image/jpeg,image/png,image/webp" onchange="_prodPreview(this)">
      <div style="font-size:11.5px;color:var(--mute);margin-top:4px">${t('products.imageHint')}</div>
    </div>
  </div>
  <div class="mf">
    <button class="btn btn-ghost" onclick="closeModal()">${t('products.cancel')}</button>
    <button class="btn btn-primary" onclick="saveProductForm()">${t('products.save')}</button>
  </div>`, 'modal-lg');
}

export async function saveProductForm() {
  const nameEn = (document.getElementById('pf_nameEn')?.value || '').trim();
  const nameAr = (document.getElementById('pf_nameAr')?.value || '').trim();
  const cat    = document.getElementById('pf_cat')?.value || '';
  const p1     = parseFloat(document.getElementById('pf_p1')?.value);
  const p3     = parseFloat(document.getElementById('pf_p3')?.value);
  const p10    = parseFloat(document.getElementById('pf_p10')?.value);

  if (!nameEn || !nameAr || !cat) { alert('Name (EN/AR) and category are required.'); return; }
  if ([p1, p3, p10].some(v => isNaN(v) || v <= 0)) { alert('Enter valid prices > 0 for all three variants.'); return; }

  const fd = new FormData();
  fd.append('nameEn', nameEn); fd.append('nameAr', nameAr);
  fd.append('descEn', (document.getElementById('pf_descEn')?.value || '').trim());
  fd.append('descAr', (document.getElementById('pf_descAr')?.value || '').trim());
  fd.append('category', cat);
  fd.append('variants', JSON.stringify([
    { size: '1L', price: p1 }, { size: '3L', price: p3 }, { size: '10L', price: p10 },
  ]));
  const imgFile = document.getElementById('pf_img')?.files[0];
  if (imgFile) fd.append('image', imgFile);

  try {
    await api.saveProduct(fd, _editId || undefined);
    closeModal();
    showToast(_editId ? 'Product updated' : 'Product created', 'toast-gold');
    await renderProducts();
  } catch (err) {
    showToast('Failed: ' + err.message, 'toast-red');
  }
}

// ── Window-exposed helpers ──
window._prodSearch = function (v) { _pQuery = v; _draw(); };
window._prodCat    = function (v) { _pCat   = v; _draw(); };

window._prodPreview = function (inp) {
  const f = inp.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = e => {
    const w = document.getElementById('prodImgWrapper');
    if (w) w.innerHTML = `<img src="${e.target.result}" style="width:100%;max-height:160px;object-fit:cover;border-radius:8px;margin-bottom:8px">`;
  };
  reader.readAsDataURL(f);
};

window._deleteProd = async function (id) {
  const p = _products.find(x => x.id === id);
  if (!confirm(t('products.deleteConfirm', { name: p?.nameEn || id }))) return;
  try {
    await api.deleteProduct(id);
    showToast('Product deleted', 'toast-red');
    await renderProducts();
  } catch (err) {
    showToast('Failed: ' + err.message, 'toast-red');
  }
};
