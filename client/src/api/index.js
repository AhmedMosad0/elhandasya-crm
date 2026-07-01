// ═══════════════════════════════════════════════════════════════
// Real HTTP client — Phase 4
// Old localStorage mock code is preserved below, commented out.
// ═══════════════════════════════════════════════════════════════

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// ── Token helpers ──
export function getToken()   { return localStorage.getItem('eh_token'); }
export function setToken(t)  { localStorage.setItem('eh_token', t); }
export function clearToken() { localStorage.removeItem('eh_token'); }

// ── Core request helper ──
async function _req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const tok = getToken();
  if (tok) headers['Authorization'] = 'Bearer ' + tok;
  const res = await fetch(BASE + path, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event('session-expired'));
    throw new Error(data.error || 'Session expired');
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ── Activity transform: server uses .userName, views expect .user ──
function _mapOrder(o) {
  if (!o) return o;
  return { ...o, activity: (o.activity || []).map(a => ({ ...a, user: a.userName })) };
}

// ── Auth ──
export async function login(username, password) {
  const { token, user } = await _req('POST', '/auth/login', { username, password });
  setToken(token);
  return user; // { id, name, role, avatarInitials, clientId }
}
export async function getMe() { return _req('GET', '/auth/me'); }

// ── Users ──
export async function getUsers() { return _req('GET', '/users'); }

// ── Clients ──
export async function getClients()       { return _req('GET',  '/clients'); }
export async function getClient(id)      { return _req('GET',  '/clients/' + id); }
export async function createClient(data) { return _req('POST', '/clients', data); }

// ── Requests ──
export async function getRequests()                      { return _req('GET',   '/requests'); }
export async function createRequest(data)                { return _req('POST',  '/requests', data); }
export async function approveRequest(id)                 { return _req('PATCH', '/requests/' + id + '/approve'); }
export async function rejectRequest(id, rejectionReason) { return _req('PATCH', '/requests/' + id + '/reject', { rejectionReason }); }

// ── Orders ──
export async function getOrders() {
  const list = await _req('GET', '/orders');
  return list.map(_mapOrder);
}
export async function getOrder(id)                { return _mapOrder(await _req('GET',   '/orders/' + id)); }
export async function createOrder(data)           { return _mapOrder(await _req('POST',  '/orders', data)); }
export async function assignOrder(id, data)       { return _mapOrder(await _req('PATCH', '/orders/' + id + '/assign', data)); }
export async function updateOrderStatus(id, data) { return _mapOrder(await _req('PATCH', '/orders/' + id + '/status', data)); }
export async function addPayment(id, data)        { return _mapOrder(await _req('POST',  '/orders/' + id + '/payments', data)); }


// ═══════════════════════════════════════════════════════════════
// OLD MOCK CODE — commented out; do not delete (rollback reference)
// ═══════════════════════════════════════════════════════════════
//
// const S = {
//   g: k => { try { return JSON.parse(localStorage.getItem('eh_' + k)); } catch { return null; } },
//   s: (k, v) => localStorage.setItem('eh_' + k, JSON.stringify(v)),
// };
//
// // ── SEED ──
// export function seedData() {
//   if (S.g('seeded')) return;
//   S.s('users', [
//     { id:'u1', name:'Ahmed Mahmoud',   role:'admin',    username:'admin',     pw:'admin123',  av:'AM' },
//     { id:'u2', name:'Sara Ahmed',      role:'sales',    username:'sales1',    pw:'sales123',  av:'SA' },
//     { id:'u3', name:'Omar Khalid',     role:'sales',    username:'sales2',    pw:'pass123',   av:'OK' },
//     { id:'u4', name:'Karim Hassan',    role:'mixer',    username:'mixer1',    pw:'mix123',    av:'KH' },
//     { id:'u5', name:'Tarek Ibrahim',   role:'delivery', username:'delivery1', pw:'del123',    av:'TI' },
//     { id:'u6', name:'Hassan El-Sayed', role:'client',   username:'hassan',    pw:'client123', av:'HE', clientId:'c1' },
//     { id:'u7', name:'Layla Mostafa',   role:'client',   username:'layla',     pw:'client123', av:'LM', clientId:'c2' },
//     { id:'u8', name:'Khaled Nour',     role:'client',   username:'khaled',    pw:'client123', av:'KN', clientId:'c3' },
//   ]);
//   S.s('clients', [
//     { id:'c1', name:'Hassan El-Sayed', phone:'01012345678', email:'hassan@gmail.com',      address:'Cairo, Maadi, Road 9',           company:'El-Sayed Construction', createdAt:'2024-01-15' },
//     { id:'c2', name:'Layla Mostafa',   phone:'01098765432', email:'layla@hotmail.com',     address:'Cairo, Heliopolis, El-Ahrar St', company:'Mostafa & Partners',    createdAt:'2024-02-20' },
//     { id:'c3', name:'Khaled Nour',     phone:'01155556666', email:'khaled.nour@yahoo.com', address:'Giza, Dokki, El-Tahrir Sq',      company:'Nour Contracting',      createdAt:'2024-03-10' },
//     { id:'c4', name:'Nadia Samir',     phone:'01233334444', email:'nadia.samir@gmail.com', address:'Alexandria, Stanley, Corniche',  company:'Samir Interiors',       createdAt:'2024-04-05' },
//     { id:'c5', name:'Walid Fawzy',     phone:'01099887766', email:'walid.fawzy@email.com', address:'Giza, 6th October, Main St',     company:'Fawzy Real Estate',     createdAt:'2024-05-12' },
//   ]);
//   // ... (requests, orders, counters — see git history for full seed)
//   S.s('seeded', true);
// }
//
// // ── USERS ──
// export function getUsers() { return S.g('users') || []; }
//
// // ── SESSION ──
// export function getSession() { return S.g('session'); }
// export function saveSession(user) { S.s('session', user); }
// export function clearSession() { S.s('session', null); }
//
// // ── CLIENTS ──
// export function getClients() { return S.g('clients') || []; }
// export function saveClient(client) {
//   const list = getClients();
//   const idx = list.findIndex(c => c.id === client.id);
//   if (idx >= 0) list[idx] = client; else list.push(client);
//   S.s('clients', list);
// }
//
// // ── REQUESTS ──
// export function getRequests() { return S.g('requests') || []; }
// export function saveRequests(list) { S.s('requests', list); }
// export function getReqCounter() { return S.g('reqCounter') || 5; }
// export function setReqCounter(n) { S.s('reqCounter', n); }
//
// // ── ORDERS ──
// export function getOrders() { return S.g('orders') || []; }
// export function saveOrders(list) { S.s('orders', list); }
// export function getOrderCounter() { return S.g('orderCounter') || 4; }
// export function setOrderCounter(n) { S.s('orderCounter', n); }
