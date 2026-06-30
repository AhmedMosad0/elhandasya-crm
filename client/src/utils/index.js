// Shared utility helpers.
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('ar-EG');
}

export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
