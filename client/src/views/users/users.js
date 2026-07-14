import { App } from '../../state/store.js';
import * as api from '../../api/index.js';
import { t } from '../../i18n/index.js';
import { fmtDate } from '../../utils/index.js';
import { showToast } from '../../components/toast/toast.js';

const ROLE_LABEL = { admin:'Admin', sales:'Sales', mixer:'Mixer', delivery:'Delivery', client:'Client' };

function _roleBadge(r) {
  return `<span style="font-size:11px;padding:2px 8px;border-radius:99px;background:var(--border-l);color:var(--ink-2);font-weight:600">${ROLE_LABEL[r] || r}</span>`;
}

function _statusBadge(s) {
  const color = s === 'active' ? 'var(--green)' : s === 'rejected' ? 'var(--red)' : 'var(--amber)';
  const label = s === 'active' ? t('user.statusActive') : s === 'rejected' ? t('user.statusRejected') : t('user.statusPending');
  return `<span style="font-size:11px;padding:2px 8px;border-radius:99px;background:${color}1a;color:${color};font-weight:600">${label}</span>`;
}

export async function renderUsers() {
  document.getElementById('sectionUsers').innerHTML = `<div class="empty" style="padding:40px">${t('user.loading')}</div>`;
  try {
    const users = await api.getUsers();
    const pending = users.filter(u => u.status === 'pending');
    const rest    = users.filter(u => u.status !== 'pending');

    document.getElementById('sectionUsers').innerHTML = `
    <div class="ph"><div class="ph-info"><h2>${t('user.title')}</h2><p>${t('user.subtitle')}</p></div></div>

    ${pending.length ? `
    <div style="margin-bottom:8px;font-size:11.5px;font-weight:700;color:var(--amber);text-transform:uppercase;letter-spacing:.5px">${t('user.pendingCount', { n: pending.length })}</div>
    <div class="table-wrap" style="margin-bottom:28px">
      <table class="tbl">
        <thead><tr><th>${t('user.colName')}</th><th>${t('user.colUsername')}</th><th>${t('user.colRole')}</th><th>${t('user.colPhone')}</th><th>${t('user.colRequested')}</th><th>${t('user.colActions')}</th></tr></thead>
        <tbody>${pending.map(u => `<tr>
          <td><strong>${u.name}</strong></td>
          <td><code style="font-size:12px">${u.username}</code></td>
          <td>${_roleBadge(u.role)}</td>
          <td>${u.phone || '—'}</td>
          <td>${fmtDate(u.createdAt)}</td>
          <td style="white-space:nowrap">
            <button class="btn btn-sm" style="background:var(--green);color:white;margin-right:4px" onclick="approveUserById('${u.id}')">${t('user.approveUser')}</button>
            <button class="btn btn-sm" style="background:var(--red);color:white" onclick="rejectUserById('${u.id}')">${t('user.rejectUser')}</button>
          </td>
        </tr>`).join('')}</tbody>
      </table>
    </div>` : `
    <div class="empty" style="margin-bottom:28px;padding:20px">
      <div class="empty-icon">✓</div><h4>${t('user.noPending')}</h4><p>${t('user.noPendingSub')}</p>
    </div>`}

    <div style="margin-bottom:8px;font-size:11.5px;font-weight:700;color:var(--mute);text-transform:uppercase;letter-spacing:.5px">${t('user.allUsers', { n: rest.length })}</div>
    <div class="table-wrap">
      <table class="tbl">
        <thead><tr><th>${t('user.colName')}</th><th>${t('user.colUsername')}</th><th>${t('user.colRole')}</th><th>${t('user.colPhone')}</th><th>${t('user.colStatus')}</th></tr></thead>
        <tbody>${rest.map(u => `<tr>
          <td><strong>${u.name}</strong></td>
          <td><code style="font-size:12px">${u.username}</code></td>
          <td>${_roleBadge(u.role)}</td>
          <td>${u.phone || '—'}</td>
          <td>${_statusBadge(u.status)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`;
  } catch (err) {
    document.getElementById('sectionUsers').innerHTML = `<div class="empty" style="padding:40px">${t('user.failed')}</div>`;
    showToast('Error: ' + err.message, 'toast-red');
  }
}

export async function approveUserById(id) {
  try {
    await api.approveUser(id);
    showToast(t('user.approvedToast'), 'toast-gold');
    await renderUsers();
    await window._renderNav();
  } catch (err) {
    showToast('Failed: ' + err.message, 'toast-red');
  }
}

export async function rejectUserById(id) {
  try {
    await api.rejectUser(id);
    showToast(t('user.rejectedToast'), 'toast-red');
    await renderUsers();
    await window._renderNav();
  } catch (err) {
    showToast('Failed: ' + err.message, 'toast-red');
  }
}
