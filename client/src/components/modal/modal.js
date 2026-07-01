export function openModal(html, cls = 'modal-md') {
  const b = document.getElementById('modalBox');
  b.className = 'modal ' + cls;
  b.innerHTML = html;
  document.getElementById('overlay').classList.remove('hidden');
}

export function closeModal() {
  document.getElementById('overlay').classList.add('hidden');
}
