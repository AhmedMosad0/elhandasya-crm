import en from './en.js';
import ar from './ar.js';

const STRINGS = { en, ar };

let _lang = localStorage.getItem('eh_lang') || 'en';

export function getLang() { return _lang; }

export function setLang(lang) {
  _lang = lang;
  localStorage.setItem('eh_lang', lang);
  applyDocumentDir();
  _updateLangBtns();
  if (window._refreshLogin) window._refreshLogin();
  if (window.__rerender) window.__rerender();
}

export function applyDocumentDir() {
  document.documentElement.lang = _lang;
  document.documentElement.dir  = _lang === 'ar' ? 'rtl' : 'ltr';
}

export function t(key, vars) {
  const parts = key.split('.');
  let val = STRINGS[_lang];
  for (const p of parts) { if (!val) break; val = val[p]; }
  // Fall back to English
  if (val === undefined || val === null || val === '') {
    val = STRINGS.en;
    for (const p of parts) { if (!val) break; val = val[p]; }
  }
  if (typeof val !== 'string') return key;
  if (vars) val = val.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] ?? ''));
  return val;
}

function _updateLangBtns() {
  const label = t('lang.toggle');
  document.querySelectorAll('.lang-btn').forEach(btn => { btn.textContent = label; });
}

export function updateLangBtns() { _updateLangBtns(); }
