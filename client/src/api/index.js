// Mock API layer — all data access goes through here.
// Internally uses localStorage as the mock backend.
// When the real Express API is ready, replace S.g/S.s calls with fetch() calls.

const S = {
  g: k => { try { return JSON.parse(localStorage.getItem('eh_' + k)); } catch { return null; } },
  s: (k, v) => localStorage.setItem('eh_' + k, JSON.stringify(v)),
};

// ── SEED ──
export function seedData() {
  if (S.g('seeded')) return;
  S.s('users', [
    { id:'u1', name:'Ahmed Mahmoud',   role:'admin',    username:'admin',     pw:'admin123',  av:'AM' },
    { id:'u2', name:'Sara Ahmed',      role:'sales',    username:'sales1',    pw:'sales123',  av:'SA' },
    { id:'u3', name:'Omar Khalid',     role:'sales',    username:'sales2',    pw:'pass123',   av:'OK' },
    { id:'u4', name:'Karim Hassan',    role:'mixer',    username:'mixer1',    pw:'mix123',    av:'KH' },
    { id:'u5', name:'Tarek Ibrahim',   role:'delivery', username:'delivery1', pw:'del123',    av:'TI' },
    { id:'u6', name:'Hassan El-Sayed', role:'client',   username:'hassan',    pw:'client123', av:'HE', clientId:'c1' },
    { id:'u7', name:'Layla Mostafa',   role:'client',   username:'layla',     pw:'client123', av:'LM', clientId:'c2' },
    { id:'u8', name:'Khaled Nour',     role:'client',   username:'khaled',    pw:'client123', av:'KN', clientId:'c3' },
  ]);
  S.s('clients', [
    { id:'c1', name:'Hassan El-Sayed', phone:'01012345678', email:'hassan@gmail.com',      address:'Cairo, Maadi, Road 9',           company:'El-Sayed Construction', createdAt:'2024-01-15' },
    { id:'c2', name:'Layla Mostafa',   phone:'01098765432', email:'layla@hotmail.com',     address:'Cairo, Heliopolis, El-Ahrar St', company:'Mostafa & Partners',    createdAt:'2024-02-20' },
    { id:'c3', name:'Khaled Nour',     phone:'01155556666', email:'khaled.nour@yahoo.com', address:'Giza, Dokki, El-Tahrir Sq',      company:'Nour Contracting',      createdAt:'2024-03-10' },
    { id:'c4', name:'Nadia Samir',     phone:'01233334444', email:'nadia.samir@gmail.com', address:'Alexandria, Stanley, Corniche',  company:'Samir Interiors',       createdAt:'2024-04-05' },
    { id:'c5', name:'Walid Fawzy',     phone:'01099887766', email:'walid.fawzy@email.com', address:'Giza, 6th October, Main St',     company:'Fawzy Real Estate',     createdAt:'2024-05-12' },
  ]);

  const today = new Date();
  const d = m => { const dt = new Date(today); dt.setDate(dt.getDate() - m); return dt.toISOString().split('T')[0]; };

  S.s('requests', [
    { id:'r1', ref:'REQ-001', clientId:'c1', clientName:'Hassan El-Sayed', phone:'01012345678', email:'hassan@gmail.com', address:'Cairo, Maadi, Road 9',
      products:[{name:'Handasya Shield Antifade',colorCode:'EH-1023',colorName:'Warm Ivory',qty:20,unit:'L',price:450,total:9000},{name:'Handasya Plast Premium',colorCode:'EH-0512',colorName:'Rose Pearl',qty:10,unit:'L',price:280,total:2800}],
      totalAmount:11800, notes:'Urgent delivery needed', status:'pending', createdBy:'u2', salesName:'Sara Ahmed', createdAt:d(2)+'T09:30:00' },
    { id:'r2', ref:'REQ-002', clientId:'c2', clientName:'Layla Mostafa', phone:'01098765432', email:'layla@hotmail.com', address:'Cairo, Heliopolis, El-Ahrar St',
      products:[{name:'Handasya Majestic Décor',colorCode:'EH-2201',colorName:'Sky Blue',qty:15,unit:'L',price:380,total:5700}],
      totalAmount:5700, notes:'', status:'approved', createdBy:'u3', salesName:'Omar Khalid', createdAt:d(8)+'T11:00:00' },
    { id:'r3', ref:'REQ-003', clientId:'c3', clientName:'Khaled Nour', phone:'01155556666', email:'khaled.nour@yahoo.com', address:'Giza, Dokki, El-Tahrir Sq',
      products:[{name:'Handasya Essence',colorCode:'EH-0330',colorName:'Forest Green',qty:30,unit:'L',price:320,total:9600},{name:'Handasya Pilot Premium',colorCode:'EH-0001',colorName:'Pure White',qty:5,unit:'kg',price:200,total:1000}],
      totalAmount:10600, notes:'Client wants matte finish', status:'approved', createdBy:'u2', salesName:'Sara Ahmed', createdAt:d(11)+'T14:20:00' },
    { id:'r4', ref:'REQ-004', clientId:'c4', clientName:'Nadia Samir', phone:'01233334444', email:'nadia.samir@gmail.com', address:'Alexandria, Stanley, Corniche',
      products:[{name:'Handasya Plast Max',colorCode:'EH-1105',colorName:'Cream Beige',qty:25,unit:'L',price:310,total:7750}],
      totalAmount:7750, notes:'', status:'rejected', rejectionReason:'Requested color not in stock', createdBy:'u2', salesName:'Sara Ahmed', createdAt:d(14)+'T10:00:00' },
    { id:'r5', ref:'REQ-005', clientId:'c5', clientName:'Walid Fawzy', phone:'01099887766', email:'walid.fawzy@email.com', address:'Giza, 6th October, Main St',
      products:[{name:'Handasya Shield Antifade',colorCode:'EH-1023',colorName:'Warm Ivory',qty:40,unit:'L',price:450,total:18000},{name:'Handasya Shield Topcoat',colorCode:'EH-5500',colorName:'Stone Gray',qty:10,unit:'L',price:520,total:5200}],
      totalAmount:23200, notes:'Large project — multiple batches', status:'pending', createdBy:'u3', salesName:'Omar Khalid', createdAt:d(1)+'T08:45:00' },
  ]);

  const orders = [
    { id:'o1', recipeNum:'EH-'+d(8).replace(/-/g,'').substring(2)+'-0001', requestId:'r2', source:'sales',
      clientId:'c2', clientName:'Layla Mostafa', clientPhone:'01098765432', clientAddress:'Cairo, Heliopolis, El-Ahrar St',
      products:[{name:'Handasya Majestic Décor',colorCode:'EH-2201',colorName:'Sky Blue',qty:15,unit:'L',price:380,total:5700,delivered:15}],
      totalAmount:5700, paidAmount:5700, paymentStatus:'paid', status:'delivered',
      payments:[{id:'pay1',amount:5700,date:d(7),note:'Full payment — cash',by:'Ahmed Mahmoud'}],
      mixerId:'u4', mixerName:'Karim Hassan', deliveryId:'u5', deliveryName:'Tarek Ibrahim', salesId:'u3', salesName:'Omar Khalid',
      notes:'Delivered on time. Client satisfied.',
      activity:[{text:'Order created from REQ-002',time:d(8)+' 11:30',user:'Ahmed Mahmoud'},{text:'Assigned to Karim Hassan for mixing',time:d(8)+' 12:00',user:'Ahmed Mahmoud'},{text:'Color mixing completed',time:d(7)+' 09:00',user:'Karim Hassan'},{text:'Order fully delivered',time:d(7)+' 14:00',user:'Tarek Ibrahim'}],
      createdAt:d(8) },
    { id:'o2', recipeNum:'EH-'+d(11).replace(/-/g,'').substring(2)+'-0002', requestId:'r3', source:'sales',
      clientId:'c3', clientName:'Khaled Nour', clientPhone:'01155556666', clientAddress:'Giza, Dokki, El-Tahrir Sq',
      products:[{name:'Handasya Essence',colorCode:'EH-0330',colorName:'Forest Green',qty:30,unit:'L',price:320,total:9600,delivered:20},{name:'Handasya Pilot Premium',colorCode:'EH-0001',colorName:'Pure White',qty:5,unit:'kg',price:200,total:1000,delivered:5}],
      totalAmount:10600, paidAmount:5000, paymentStatus:'partial', status:'partial',
      payments:[{id:'pay2',amount:5000,date:d(10),note:'Down payment 50%',by:'Ahmed Mahmoud'}],
      mixerId:'u4', mixerName:'Karim Hassan', deliveryId:'u5', deliveryName:'Tarek Ibrahim', salesId:'u2', salesName:'Sara Ahmed',
      notes:'Remaining 10L Forest Green — next batch.',
      activity:[{text:'Order created from REQ-003',time:d(11)+' 15:00',user:'Ahmed Mahmoud'},{text:'Partial delivery: 20L + 5kg',time:d(9)+' 11:00',user:'Tarek Ibrahim'}],
      createdAt:d(11) },
    { id:'o3', recipeNum:'EH-'+d(3).replace(/-/g,'').substring(2)+'-0003', requestId:'', source:'client',
      clientId:'c1', clientName:'Hassan El-Sayed', clientPhone:'01012345678', clientAddress:'Cairo, Maadi, Road 9',
      products:[{name:'Handasya Shield Antifade',colorCode:'EH-1023',colorName:'Warm Ivory',qty:10,unit:'L',price:450,total:4500,delivered:0},{name:'Handasya Silk Velvet',colorCode:'EH-7701',colorName:'Dusty Rose',qty:8,unit:'L',price:390,total:3120,delivered:0}],
      totalAmount:7620, paidAmount:0, paymentStatus:'unpaid', status:'pending',
      payments:[], mixerId:'', mixerName:'Unassigned', deliveryId:'', deliveryName:'Unassigned', salesId:'', salesName:'Client Portal',
      notes:'Direct order via Client Portal.',
      activity:[{text:'Direct order placed via Client Portal',time:d(3)+' 16:20',user:'Hassan El-Sayed'}],
      createdAt:d(3) },
  ];

  const hClients = [{ id:'c1', name:'Hassan El-Sayed' }, { id:'c2', name:'Layla Mostafa' }, { id:'c3', name:'Khaled Nour' }];
  const hProds = [
    [{name:'Handasya Shield Antifade',colorCode:'EH-1023',colorName:'Warm Ivory',qty:20,unit:'L',price:450,total:9000,delivered:20}],
    [{name:'Handasya Plast Premium',colorCode:'EH-0512',colorName:'Rose Pearl',qty:15,unit:'L',price:280,total:4200,delivered:15}],
    [{name:'Handasya Majestic Décor',colorCode:'EH-2201',colorName:'Sky Blue',qty:10,unit:'L',price:380,total:3800,delivered:10}],
    [{name:'Handasya Essence',colorCode:'EH-0330',colorName:'Forest Green',qty:25,unit:'L',price:320,total:8000,delivered:25},{name:'Handasya Pilot Premium',colorCode:'EH-0001',colorName:'Pure White',qty:5,unit:'kg',price:200,total:1000,delivered:5}],
  ];
  const ages = [180, 160, 140, 120, 100, 80, 60, 50];
  let idx = 4;
  ages.forEach((ago, i) => {
    const cl = hClients[i % 3]; const pr = hProds[i % 4]; const tot = pr.reduce((a, p) => a + p.total, 0);
    orders.push({
      id:'oh'+i, recipeNum:'EH-'+d(ago).replace(/-/g,'').substring(2)+'-'+String(idx).padStart(4,'0'),
      requestId:'', source:'sales', clientId:cl.id, clientName:cl.name, clientPhone:'01012345678', clientAddress:'Cairo',
      products:pr, totalAmount:tot, paidAmount:tot, paymentStatus:'paid', status:'delivered',
      payments:[{id:'ph'+i,amount:tot,date:d(ago-1),note:'Full payment',by:'Ahmed Mahmoud'}],
      mixerId:'u4', mixerName:'Karim Hassan', deliveryId:'u5', deliveryName:'Tarek Ibrahim', salesId:'u2', salesName:'Sara Ahmed',
      notes:'', activity:[{text:'Order delivered',time:d(ago)+' 14:00',user:'Tarek Ibrahim'}], createdAt:d(ago),
    });
    idx++;
  });
  S.s('orders', orders);
  S.s('reqCounter', 5);
  S.s('orderCounter', idx);
  S.s('seeded', true);
}

// ── USERS ──
export function getUsers() { return S.g('users') || []; }

// ── SESSION ──
export function getSession() { return S.g('session'); }
export function saveSession(user) { S.s('session', user); }
export function clearSession() { S.s('session', null); }

// ── CLIENTS ──
export function getClients() { return S.g('clients') || []; }
export function saveClient(client) {
  const list = getClients();
  const idx = list.findIndex(c => c.id === client.id);
  if (idx >= 0) list[idx] = client; else list.push(client);
  S.s('clients', list);
}

// ── REQUESTS ──
export function getRequests() { return S.g('requests') || []; }
export function saveRequests(list) { S.s('requests', list); }
export function getReqCounter() { return S.g('reqCounter') || 5; }
export function setReqCounter(n) { S.s('reqCounter', n); }

// ── ORDERS ──
export function getOrders() { return S.g('orders') || []; }
export function saveOrders(list) { S.s('orders', list); }
export function getOrderCounter() { return S.g('orderCounter') || 4; }
export function setOrderCounter(n) { S.s('orderCounter', n); }
