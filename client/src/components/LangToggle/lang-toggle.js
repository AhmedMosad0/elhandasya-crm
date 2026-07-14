import { t } from '../../i18n/index.js';

export function langToggleHTML() {
  return `<button class="lang-btn" onclick="switchLang()">${t('lang.toggle')}</button>`;
}
