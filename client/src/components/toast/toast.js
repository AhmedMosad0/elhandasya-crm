export function showToast(msg, cls = '') {
  const t = document.getElementById('toast');
  t.className = 'toast ' + (cls || '');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}
