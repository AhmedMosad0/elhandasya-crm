import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const ROUNDS = 10;

const d = (m) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - m);
  return dt.toISOString().split('T')[0];
};

const dt = (dateStr, time) => new Date(`${dateStr}T${time}`);

function recipeNum(dateStr, counter) {
  return 'EH-' + dateStr.replace(/-/g, '').substring(2) + '-' + String(counter).padStart(4, '0');
}

async function main() {
  console.log('Clearing existing data...');
  await prisma.activityLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderProduct.deleteMany();
  await prisma.order.deleteMany();
  await prisma.requestProduct.deleteMany();
  await prisma.request.deleteMany();
  await prisma.user.deleteMany();
  await prisma.client.deleteMany();

  console.log('Seeding users and clients...');

  await prisma.client.createMany({
    data: [
      { id:'c1', name:'Hassan El-Sayed', phone:'01012345678', email:'hassan@gmail.com',      address:'Cairo, Maadi, Road 9',           company:'El-Sayed Construction', createdAt: new Date('2024-01-15') },
      { id:'c2', name:'Layla Mostafa',   phone:'01098765432', email:'layla@hotmail.com',     address:'Cairo, Heliopolis, El-Ahrar St', company:'Mostafa & Partners',    createdAt: new Date('2024-02-20') },
      { id:'c3', name:'Khaled Nour',     phone:'01155556666', email:'khaled.nour@yahoo.com', address:'Giza, Dokki, El-Tahrir Sq',      company:'Nour Contracting',      createdAt: new Date('2024-03-10') },
      { id:'c4', name:'Nadia Samir',     phone:'01233334444', email:'nadia.samir@gmail.com', address:'Alexandria, Stanley, Corniche',  company:'Samir Interiors',       createdAt: new Date('2024-04-05') },
      { id:'c5', name:'Walid Fawzy',     phone:'01099887766', email:'walid.fawzy@email.com', address:'Giza, 6th October, Main St',     company:'Fawzy Real Estate',     createdAt: new Date('2024-05-12') },
    ],
  });

  // Seed passwords — change these after first login in any real environment.
  const hashes = await Promise.all([
    bcrypt.hash('EH-Admin@2024',  ROUNDS),
    bcrypt.hash('EH-Sales1@2024', ROUNDS),
    bcrypt.hash('EH-Sales2@2024', ROUNDS),
    bcrypt.hash('EH-Mixer@2024!', ROUNDS),
    bcrypt.hash('EH-Deliv@2024!', ROUNDS),
    bcrypt.hash('EH-Client2024!', ROUNDS),
  ]);

  await prisma.user.createMany({
    data: [
      { id:'u1', name:'Ahmed Mahmoud',   role:'admin',    username:'admin',     passwordHash: hashes[0], avatarInitials:'AM' },
      { id:'u2', name:'Sara Ahmed',      role:'sales',    username:'sales1',    passwordHash: hashes[1], avatarInitials:'SA' },
      { id:'u3', name:'Omar Khalid',     role:'sales',    username:'sales2',    passwordHash: hashes[2], avatarInitials:'OK' },
      { id:'u4', name:'Karim Hassan',    role:'mixer',    username:'mixer1',    passwordHash: hashes[3], avatarInitials:'KH' },
      { id:'u5', name:'Tarek Ibrahim',   role:'delivery', username:'delivery1', passwordHash: hashes[4], avatarInitials:'TI' },
      { id:'u6', name:'Hassan El-Sayed', role:'client',   username:'hassan',    passwordHash: hashes[5], avatarInitials:'HE', clientId:'c1' },
      { id:'u7', name:'Layla Mostafa',   role:'client',   username:'layla',     passwordHash: hashes[5], avatarInitials:'LM', clientId:'c2' },
      { id:'u8', name:'Khaled Nour',     role:'client',   username:'khaled',    passwordHash: hashes[5], avatarInitials:'KN', clientId:'c3' },
    ],
  });

  console.log('Seeding requests...');

  await prisma.request.create({
    data: {
      id:'r1', ref:'REQ-001', clientId:'c1', clientName:'Hassan El-Sayed', phone:'01012345678',
      email:'hassan@gmail.com', address:'Cairo, Maadi, Road 9',
      totalAmount:11800, notes:'Urgent delivery needed', status:'pending',
      createdBy:'u2', salesName:'Sara Ahmed', createdAt: dt(d(2), '09:30:00'),
      products: { create: [
        { name:'Handasya Shield Antifade', colorCode:'EH-1023', colorName:'Warm Ivory', qty:20, unit:'L',  price:450, total:9000 },
        { name:'Handasya Plast Premium',   colorCode:'EH-0512', colorName:'Rose Pearl', qty:10, unit:'L',  price:280, total:2800 },
      ]},
    },
  });
  await prisma.request.create({
    data: {
      id:'r2', ref:'REQ-002', clientId:'c2', clientName:'Layla Mostafa', phone:'01098765432',
      email:'layla@hotmail.com', address:'Cairo, Heliopolis, El-Ahrar St',
      totalAmount:5700, status:'approved', createdBy:'u3', salesName:'Omar Khalid', createdAt: dt(d(8), '11:00:00'),
      products: { create: [
        { name:'Handasya Majestic Décor', colorCode:'EH-2201', colorName:'Sky Blue', qty:15, unit:'L', price:380, total:5700 },
      ]},
    },
  });
  await prisma.request.create({
    data: {
      id:'r3', ref:'REQ-003', clientId:'c3', clientName:'Khaled Nour', phone:'01155556666',
      email:'khaled.nour@yahoo.com', address:'Giza, Dokki, El-Tahrir Sq',
      totalAmount:10600, notes:'Client wants matte finish', status:'approved',
      createdBy:'u2', salesName:'Sara Ahmed', createdAt: dt(d(11), '14:20:00'),
      products: { create: [
        { name:'Handasya Essence',       colorCode:'EH-0330', colorName:'Forest Green', qty:30, unit:'L',  price:320, total:9600 },
        { name:'Handasya Pilot Premium', colorCode:'EH-0001', colorName:'Pure White',   qty:5,  unit:'kg', price:200, total:1000 },
      ]},
    },
  });
  await prisma.request.create({
    data: {
      id:'r4', ref:'REQ-004', clientId:'c4', clientName:'Nadia Samir', phone:'01233334444',
      email:'nadia.samir@gmail.com', address:'Alexandria, Stanley, Corniche',
      totalAmount:7750, status:'rejected', rejectionReason:'Requested color not in stock',
      createdBy:'u2', salesName:'Sara Ahmed', createdAt: dt(d(14), '10:00:00'),
      products: { create: [
        { name:'Handasya Plast Max', colorCode:'EH-1105', colorName:'Cream Beige', qty:25, unit:'L', price:310, total:7750 },
      ]},
    },
  });
  await prisma.request.create({
    data: {
      id:'r5', ref:'REQ-005', clientId:'c5', clientName:'Walid Fawzy', phone:'01099887766',
      email:'walid.fawzy@email.com', address:'Giza, 6th October, Main St',
      totalAmount:23200, notes:'Large project — multiple batches', status:'pending',
      createdBy:'u3', salesName:'Omar Khalid', createdAt: dt(d(1), '08:45:00'),
      products: { create: [
        { name:'Handasya Shield Antifade', colorCode:'EH-1023', colorName:'Warm Ivory', qty:40, unit:'L', price:450, total:18000 },
        { name:'Handasya Shield Topcoat',  colorCode:'EH-5500', colorName:'Stone Gray', qty:10, unit:'L', price:520, total:5200  },
      ]},
    },
  });

  console.log('Seeding orders...');

  await prisma.order.create({
    data: {
      id:'o1', recipeNum: recipeNum(d(8), 1), requestId:'r2', source:'sales',
      clientId:'c2', clientName:'Layla Mostafa', clientPhone:'01098765432',
      clientAddress:'Cairo, Heliopolis, El-Ahrar St',
      totalAmount:5700, paidAmount:5700, paymentStatus:'paid', status:'delivered',
      mixerId:'u4', mixerName:'Karim Hassan', deliveryId:'u5', deliveryName:'Tarek Ibrahim',
      salesId:'u3', salesName:'Omar Khalid', notes:'Delivered on time. Client satisfied.',
      createdAt: new Date(d(8)),
      products: { create: [
        { name:'Handasya Majestic Décor', colorCode:'EH-2201', colorName:'Sky Blue', qty:15, unit:'L', price:380, total:5700, delivered:15 },
      ]},
      payments: { create: [
        { id:'pay1', amount:5700, date:d(7), note:'Full payment — cash', by:'Ahmed Mahmoud' },
      ]},
      activity: { create: [
        { text:'Order created from REQ-002',          time:d(8)+' 11:30', userName:'Ahmed Mahmoud' },
        { text:'Assigned to Karim Hassan for mixing', time:d(8)+' 12:00', userName:'Ahmed Mahmoud' },
        { text:'Color mixing completed',              time:d(7)+' 09:00', userName:'Karim Hassan'  },
        { text:'Order fully delivered',               time:d(7)+' 14:00', userName:'Tarek Ibrahim' },
      ]},
    },
  });

  await prisma.order.create({
    data: {
      id:'o2', recipeNum: recipeNum(d(11), 2), requestId:'r3', source:'sales',
      clientId:'c3', clientName:'Khaled Nour', clientPhone:'01155556666',
      clientAddress:'Giza, Dokki, El-Tahrir Sq',
      totalAmount:10600, paidAmount:5000, paymentStatus:'partial', status:'partial',
      mixerId:'u4', mixerName:'Karim Hassan', deliveryId:'u5', deliveryName:'Tarek Ibrahim',
      salesId:'u2', salesName:'Sara Ahmed', notes:'Remaining 10L Forest Green — next batch.',
      createdAt: new Date(d(11)),
      products: { create: [
        { name:'Handasya Essence',       colorCode:'EH-0330', colorName:'Forest Green', qty:30, unit:'L',  price:320, total:9600, delivered:20 },
        { name:'Handasya Pilot Premium', colorCode:'EH-0001', colorName:'Pure White',   qty:5,  unit:'kg', price:200, total:1000, delivered:5  },
      ]},
      payments: { create: [
        { id:'pay2', amount:5000, date:d(10), note:'Down payment 50%', by:'Ahmed Mahmoud' },
      ]},
      activity: { create: [
        { text:'Order created from REQ-003',   time:d(11)+' 15:00', userName:'Ahmed Mahmoud' },
        { text:'Partial delivery: 20L + 5kg',  time:d(9)+' 11:00',  userName:'Tarek Ibrahim' },
      ]},
    },
  });

  await prisma.order.create({
    data: {
      id:'o3', recipeNum: recipeNum(d(3), 3), requestId:null, source:'client',
      clientId:'c1', clientName:'Hassan El-Sayed', clientPhone:'01012345678',
      clientAddress:'Cairo, Maadi, Road 9',
      totalAmount:7620, paidAmount:0, paymentStatus:'unpaid', status:'pending',
      notes:'Direct order via Client Portal.',
      createdAt: new Date(d(3)),
      products: { create: [
        { name:'Handasya Shield Antifade', colorCode:'EH-1023', colorName:'Warm Ivory', qty:10, unit:'L', price:450, total:4500, delivered:0 },
        { name:'Handasya Silk Velvet',     colorCode:'EH-7701', colorName:'Dusty Rose', qty:8,  unit:'L', price:390, total:3120, delivered:0 },
      ]},
      activity: { create: [
        { text:'Direct order placed via Client Portal', time:d(3)+' 16:20', userName:'Hassan El-Sayed' },
      ]},
    },
  });

  // Historical orders
  const hClients = [
    { id:'c1', name:'Hassan El-Sayed' },
    { id:'c2', name:'Layla Mostafa'   },
    { id:'c3', name:'Khaled Nour'     },
  ];
  const hProds = [
    [{ name:'Handasya Shield Antifade', colorCode:'EH-1023', colorName:'Warm Ivory',  qty:20, unit:'L',  price:450, total:9000, delivered:20 }],
    [{ name:'Handasya Plast Premium',   colorCode:'EH-0512', colorName:'Rose Pearl',  qty:15, unit:'L',  price:280, total:4200, delivered:15 }],
    [{ name:'Handasya Majestic Décor',  colorCode:'EH-2201', colorName:'Sky Blue',    qty:10, unit:'L',  price:380, total:3800, delivered:10 }],
    [
      { name:'Handasya Essence',       colorCode:'EH-0330', colorName:'Forest Green', qty:25, unit:'L',  price:320, total:8000, delivered:25 },
      { name:'Handasya Pilot Premium', colorCode:'EH-0001', colorName:'Pure White',   qty:5,  unit:'kg', price:200, total:1000, delivered:5  },
    ],
  ];
  const ages = [180, 160, 140, 120, 100, 80, 60, 50];
  let idx = 4;
  for (let i = 0; i < ages.length; i++) {
    const ago = ages[i];
    const cl = hClients[i % 3];
    const pr = hProds[i % 4];
    const tot = pr.reduce((a, p) => a + p.total, 0);
    await prisma.order.create({
      data: {
        id: 'oh' + i,
        recipeNum: recipeNum(d(ago), idx),
        requestId: null, source: 'sales',
        clientId: cl.id, clientName: cl.name,
        clientPhone: '01012345678', clientAddress: 'Cairo',
        totalAmount: tot, paidAmount: tot, paymentStatus: 'paid', status: 'delivered',
        mixerId: 'u4', mixerName: 'Karim Hassan',
        deliveryId: 'u5', deliveryName: 'Tarek Ibrahim',
        salesId: 'u2', salesName: 'Sara Ahmed',
        createdAt: new Date(d(ago)),
        products: { create: pr },
        payments: { create: [{ id:'ph'+i, amount:tot, date:d(ago-1), note:'Full payment', by:'Ahmed Mahmoud' }] },
        activity: { create: [{ text:'Order delivered', time:d(ago)+' 14:00', userName:'Tarek Ibrahim' }] },
      },
    });
    idx++;
  }

  const counts = {
    users:    await prisma.user.count(),
    clients:  await prisma.client.count(),
    requests: await prisma.request.count(),
    orders:   await prisma.order.count(),
  };
  console.log('Seed complete:', counts);
}

main().catch(console.error).finally(() => prisma.$disconnect());
