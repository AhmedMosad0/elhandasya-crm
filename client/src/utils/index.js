import { getLang } from '../i18n/index.js';

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

// ── Phone / WhatsApp helpers ──

export function formatWhatsAppNumber(phone) {
  let num = phone.replace(/[\s\-\+]/g, '');
  if (num.startsWith('0')) num = '20' + num.slice(1);
  return num;
}

export function openWhatsApp(phone, message) {
  const num = formatWhatsAppNumber(phone);
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${num}?text=${encoded}`, '_blank');
}

export function openPhoneCall(phone) {
  window.location.href = `tel:${phone}`;
}

// ── WhatsApp message builders ──

export function buildWAInitialContact(clientName, salesName) {
  const lang = getLang();
  if (lang === 'ar') {
    return `مرحباً ${clientName}،\nأنا ${salesName} من الهندسية للدهانات.\nوصلنا طلبك وهنتواصل معاك بخصوص المنتجات المناسبة.\nشكراً لتواصلك معنا 🎨`;
  }
  return `Hello ${clientName},\nI'm ${salesName} from El Handasya Paints.\nWe received your request and will get back to you regarding the right products.\nThank you for reaching out 🎨`;
}

export function buildWAPricingReady(clientName, salesName, reqRef, total) {
  const lang = getLang();
  if (lang === 'ar') {
    return `مرحباً ${clientName}،\nتم تجهيز عرض الأسعار لطلبك رقم ${reqRef}.\nالإجمالي: ${total} جنيه.\nفي انتظار الموافقة النهائية من الإدارة وهنعلمك فور التأكيد. 🎨`;
  }
  return `Hello ${clientName},\nYour pricing proposal for request ${reqRef} is ready.\nTotal: EGP ${total}.\nPending final admin approval — we'll notify you once confirmed. 🎨`;
}

export function buildWAOrderConfirmed(clientName, reqRef, total, products) {
  const lang = getLang();
  const productLines = (products || []).map(p =>
    lang === 'ar'
      ? `• ${p.nameAr || p.name} — ${p.qty} لتر`
      : `• ${p.name} — ${p.qty}L`
  ).join('\n');
  if (lang === 'ar') {
    return `مرحباً ${clientName}،\nتم تأكيد طلبك رقم ${reqRef} ✅\n\nالمنتجات:\n${productLines}\n\nالإجمالي: ${total} جنيه\nسيتم التواصل معك لترتيب الاستلام. 🎨`;
  }
  return `Hello ${clientName},\nYour order ${reqRef} has been confirmed ✅\n\nProducts:\n${productLines}\n\nTotal: EGP ${total}\nWe will contact you to arrange pickup/delivery. 🎨`;
}

export function buildWAReceipt(clientName, reqRef, products, total, paid, outstanding) {
  const lang = getLang();
  const productLines = (products || []).map(p =>
    lang === 'ar'
      ? `• ${p.nameAr || p.name} — ${p.qty} لتر × ${p.price} جنيه = ${p.total || p.qty * p.price} جنيه`
      : `• ${p.name} — ${p.qty}L × EGP ${p.price} = EGP ${p.total || p.qty * p.price}`
  ).join('\n');
  if (lang === 'ar') {
    return `🧾 إيصال طلب رقم ${reqRef}\nعزيزي ${clientName}،\n\nالمنتجات:\n${productLines}\n\nالإجمالي: ${total} جنيه\nالمدفوع: ${paid} جنيه\nالمتبقي: ${outstanding} جنيه\n\nشكراً لتعاملك مع الهندسية للدهانات 🎨`;
  }
  return `🧾 Receipt for Order ${reqRef}\nDear ${clientName},\n\nProducts:\n${productLines}\n\nTotal: EGP ${total}\nPaid: EGP ${paid}\nOutstanding: EGP ${outstanding}\n\nThank you for choosing El Handasya Paints 🎨`;
}

// ── Branded print receipt (works for both requests and orders) ──

export function printReceipt(data) {
  const lang = getLang();
  const isAr = lang === 'ar';
  const dir  = isAr ? 'rtl' : 'ltr';

  const productRows = (data.products || []).map(p => `
    <tr>
      <td>${isAr ? (p.nameAr || p.name) : p.name}</td>
      <td>${p.qty} ${isAr ? 'لتر' : 'L'}</td>
      <td>${isAr ? 'جنيه' : 'EGP'} ${(p.price || 0).toLocaleString()}</td>
      <td>${isAr ? 'جنيه' : 'EGP'} ${(p.total != null ? p.total : (p.qty || 0) * (p.price || 0)).toLocaleString()}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${isAr ? 'إيصال' : 'Receipt'} — ${data.ref || data.recipeNum || ''}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${isAr ? "'Cairo'" : "'Segoe UI'"}, sans-serif;
      direction: ${dir};
      padding: 40px;
      color: #1a1a2e;
      font-size: 14px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #C9A84C;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .company-name { font-size: 28px; font-weight: 700; color: #1a1a2e; letter-spacing: 1px; }
    .company-sub  { font-size: 12px; color: #888; margin-top: 4px; }
    .receipt-title { font-size: 20px; font-weight: 700; color: #C9A84C; }
    .receipt-num   { font-size: 13px; color: #555; margin-top: 4px; }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 24px;
      margin-bottom: 24px;
      padding: 16px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    .info-row { display: flex; gap: 8px; }
    .info-label { color: #888; font-size: 12px; min-width: 80px; }
    .info-value { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th {
      background: #1a1a2e;
      color: white;
      padding: 10px 12px;
      text-align: ${isAr ? 'right' : 'left'};
      font-size: 13px;
    }
    td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    tr:nth-child(even) td { background: #f9f9f9; }
    .totals {
      display: flex;
      flex-direction: column;
      align-items: ${isAr ? 'flex-start' : 'flex-end'};
      gap: 6px;
      margin-bottom: 24px;
    }
    .total-row { display: flex; gap: 24px; font-size: 14px; }
    .total-label { color: #555; }
    .total-value { font-weight: 600; min-width: 120px; text-align: ${isAr ? 'left' : 'right'}; }
    .grand-total { font-size: 18px; font-weight: 700; color: #C9A84C; border-top: 2px solid #C9A84C; padding-top: 8px; }
    .footer {
      text-align: center;
      color: #aaa;
      font-size: 12px;
      border-top: 1px solid #eee;
      padding-top: 16px;
      margin-top: 24px;
    }
    @media print { body { padding: 20px; } button { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">${isAr ? 'الهندسية للدهانات' : 'EL HANDASYA PAINTS'}</div>
      <div class="company-sub">${isAr ? 'دهانات وقائية وزخرفية' : 'Protective & Decorative Paints'}</div>
    </div>
    <div style="text-align:${isAr ? 'left' : 'right'}">
      <div class="receipt-title">${isAr ? 'إيصال' : 'RECEIPT'}</div>
      <div class="receipt-num"># ${data.ref || data.recipeNum || '—'}</div>
      <div class="receipt-num">${new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-GB')}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-row">
      <span class="info-label">${isAr ? 'العميل:' : 'Client:'}</span>
      <span class="info-value">${data.clientName || '—'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">${isAr ? 'الهاتف:' : 'Phone:'}</span>
      <span class="info-value">${data.phone || data.clientPhone || '—'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">${isAr ? 'العنوان:' : 'Address:'}</span>
      <span class="info-value">${data.address || data.clientAddress || '—'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">${isAr ? 'المندوب:' : 'Sales:'}</span>
      <span class="info-value">${data.salesName || '—'}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>${isAr ? 'المنتج' : 'Product'}</th>
        <th>${isAr ? 'الكمية' : 'Qty'}</th>
        <th>${isAr ? 'السعر' : 'Unit Price'}</th>
        <th>${isAr ? 'الإجمالي' : 'Total'}</th>
      </tr>
    </thead>
    <tbody>${productRows || `<tr><td colspan="4" style="text-align:center;color:#888;padding:20px">${isAr ? 'لا توجد منتجات' : 'No products'}</td></tr>`}</tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span class="total-label">${isAr ? 'الإجمالي:' : 'Total:'}</span>
      <span class="total-value">${isAr ? 'جنيه' : 'EGP'} ${(data.totalAmount || 0).toLocaleString()}</span>
    </div>
    <div class="total-row">
      <span class="total-label">${isAr ? 'المدفوع:' : 'Paid:'}</span>
      <span class="total-value">${isAr ? 'جنيه' : 'EGP'} ${(data.paidAmount || 0).toLocaleString()}</span>
    </div>
    <div class="total-row grand-total">
      <span class="total-label">${isAr ? 'المتبقي:' : 'Outstanding:'}</span>
      <span class="total-value">${isAr ? 'جنيه' : 'EGP'} ${((data.totalAmount || 0) - (data.paidAmount || 0)).toLocaleString()}</span>
    </div>
  </div>

  <div class="footer">
    ${isAr
      ? 'شكراً لتعاملك مع الهندسية للدهانات — جودة في كل فرشة 🎨'
      : 'Thank you for choosing El Handasya Paints — Quality in every stroke 🎨'
    }
  </div>

  <script>window.onload = () => window.print();<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=800,height=900,scrollbars=yes');
  if (!win) { alert('Popup blocked — please allow popups for printing.'); return; }
  win.document.write(html);
  win.document.close();
}
