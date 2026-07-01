import { requestsRepository } from '../repositories/requests.repository.js';
import { ordersRepository } from '../repositories/orders.repository.js';

function now() { return new Date(); }
function nowStr() { return now().toISOString().replace('T', ' ').substring(0, 16); }

function genRecipeNum(date, counter) {
  const ds = new Date(date).toISOString().split('T')[0].replace(/-/g, '').substring(2);
  return `EH-${ds}-${String(counter).padStart(4, '0')}`;
}

export const requestsService = {
  list(user) {
    const where = {};
    if (user.role === 'sales') where.createdBy = user.id;
    else if (user.role === 'client') where.clientId = user.clientId;
    return requestsRepository.findAll(where);
  },

  async getById(id) {
    const r = await requestsRepository.findById(id);
    if (!r) throw Object.assign(new Error('Request not found'), { status: 404 });
    return r;
  },

  async create({ clientId, clientName, phone, email, address, products, notes, createdBy, salesName }) {
    if (!clientId || !products?.length) {
      throw Object.assign(new Error('clientId and at least one product are required'), { status: 400 });
    }
    const count = await requestsRepository.count();
    const ref = `REQ-${String(count + 1).padStart(3, '0')}`;
    const totalAmount = products.reduce((a, p) => a + (p.total ?? p.qty * p.price), 0);

    return requestsRepository.create({
      ref, clientId, clientName, phone, email: email || null, address,
      totalAmount, notes: notes || null, salesName, createdBy,
      products: {
        create: products.map(p => ({
          name: p.name, colorCode: p.colorCode || '', colorName: p.colorName || '',
          qty: p.qty, unit: p.unit || 'L', price: p.price,
          total: p.total ?? p.qty * p.price,
        })),
      },
    });
  },

  async approve(id) {
    const req = await requestsRepository.findById(id);
    if (!req) throw Object.assign(new Error('Request not found'), { status: 404 });
    if (req.status !== 'pending') {
      throw Object.assign(new Error('Only pending requests can be approved'), { status: 400 });
    }
    if (req.order) {
      throw Object.assign(new Error('An order already exists for this request'), { status: 409 });
    }

    await requestsRepository.update(id, { status: 'approved' });

    const orderCount = await ordersRepository.count();
    const recipeNum = genRecipeNum(now(), orderCount + 1);

    return ordersRepository.create({
      recipeNum, requestId: id, source: 'sales',
      clientId: req.clientId, clientName: req.clientName,
      clientPhone: req.phone, clientAddress: req.address,
      totalAmount: req.totalAmount, paidAmount: 0,
      paymentStatus: 'unpaid', status: 'pending',
      salesId: req.createdBy, salesName: req.salesName,
      notes: req.notes || null,
      products: {
        create: req.products.map(p => ({
          name: p.name, colorCode: p.colorCode, colorName: p.colorName,
          qty: p.qty, unit: p.unit, price: p.price, total: p.total, delivered: 0,
        })),
      },
      activity: {
        create: [{
          text: `Order created from ${req.ref}`,
          time: nowStr(),
          userName: 'System',
        }],
      },
    });
  },

  async reject(id, rejectionReason) {
    const req = await requestsRepository.findById(id);
    if (!req) throw Object.assign(new Error('Request not found'), { status: 404 });
    if (req.status !== 'pending') {
      throw Object.assign(new Error('Only pending requests can be rejected'), { status: 400 });
    }
    return requestsRepository.update(id, { status: 'rejected', rejectionReason: rejectionReason || null });
  },
};
