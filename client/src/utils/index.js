export function fmtCur(n) {
  return 'EGP ' + (n || 0).toLocaleString('en-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

export function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function statusBadge(s) {
  const m = { pending:'b-pending', approved:'b-approved', rejected:'b-rejected', mixing:'b-production', ready:'b-ready', partial:'b-partial', delivered:'b-delivered' };
  const l = { pending:'Pending', approved:'Approved', rejected:'Rejected', mixing:'Mixing', ready:'Ready', partial:'Partial', delivered:'Delivered' };
  return `<span class="badge ${m[s] || 'b-pending'}">${l[s] || s}</span>`;
}

export function payBadge(s) {
  const m = { paid:'b-paid', partial:'b-partial', unpaid:'b-unpaid' };
  const l = { paid:'Paid', partial:'Partial', unpaid:'Unpaid' };
  return `<span class="badge ${m[s] || 'b-unpaid'}">${l[s] || s}</span>`;
}

export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
