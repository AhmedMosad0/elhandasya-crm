import { requestsRepository } from '../repositories/requests.repository.js';
import { ordersRepository } from '../repositories/orders.repository.js';
import { usersRepository } from '../repositories/users.repository.js';

function now() { return new Date(); }
function nowStr() { return now().toISOString().replace('T', ' ').substring(0, 16); }

function genRecipeNum(date, counter) {
  const ds = new Date(date).toISOString().split('T')[0].replace(/-/g, '').substring(2);
  return `EH-${ds}-${String(counter).padStart(4, '0')}`;
}

async function _createOrderFromRequest(req, source) {
  const orderCount = await ordersRepository.count();
  const recipeNum = genRecipeNum(now(), orderCount + 1);
  return ordersRepository.create({
    recipeNum, requestId: req.id, source,
    clientId: req.clientId, clientName: req.clientName,
    clientPhone: req.phone, clientAddress: req.address,
    totalAmount: req.totalAmount, paidAmount: 0,
    paymentStatus: 'unpaid', status: 'pending',
    salesId: req.assignedSalesId || req.createdBy || null,
    salesName: req.assignedSalesName || req.salesName || null,
    notes: req.notes || null,
    products: {
      create: req.products.map(p => ({
        name: p.name, colorCode: p.colorCode, colorName: p.colorName,
        qty: p.qty, unit: 'L', price: p.price, total: p.total, delivered: 0,
      })),
    },
    activity: {
      create: [{ text: `Order created from ${req.ref}`, time: nowStr(), userName: 'System' }],
    },
  });
}

export const requestsService = {
  list(user) {
    // Sales sees all requests (full pipeline view)
    // Client only sees their own
    const where = user.role === 'client' ? { clientId: user.clientId } : {};
    return requestsRepository.findAll(where);
  },

  async getById(id) {
    const r = await requestsRepository.findById(id);
    if (!r) throw Object.assign(new Error('Request not found'), { status: 404 });
    return r;
  },

  async create({
    clientId, clientName, phone, email, address, products, notes, createdBy, salesName, source,
    requestType, surfaceType, texture, spaceType,
    roomLength, roomWidth, roomHeight, numRooms, apartmentArea, consultNotes,
  }) {
    if (!clientId) {
      throw Object.assign(new Error('clientId is required'), { status: 400 });
    }
    const isConsultation = requestType === 'consultation';
    if (!isConsultation && !products?.length) {
      throw Object.assign(new Error('clientId and at least one product are required'), { status: 400 });
    }

    const count = await requestsRepository.count();
    const ref = `REQ-${String(count + 1).padStart(3, '0')}`;
    const totalAmount = isConsultation
      ? 0
      : products.reduce((a, p) => a + (p.total ?? p.qty * p.price), 0);

    const consultFields = isConsultation ? {
      surfaceType: surfaceType || null,
      texture: texture || null,
      spaceType: spaceType || null,
      roomLength: roomLength || null,
      roomWidth: roomWidth || null,
      roomHeight: roomHeight || null,
      numRooms: numRooms || null,
      apartmentArea: apartmentArea || null,
      consultNotes: consultNotes || null,
    } : {};

    return requestsRepository.create({
      ref, source: source || 'sales',
      requestType: requestType || 'standard',
      clientId, clientName, phone, email: email || null, address,
      totalAmount, notes: notes || null, salesName, createdBy,
      ...consultFields,
      products: {
        create: (products || []).map(p => ({
          name: p.name, colorCode: p.colorCode || '', colorName: p.colorName || '',
          qty: p.qty, unit: 'L', price: p.price ?? 0,
          total: p.total ?? p.qty * (p.price ?? 0),
        })),
      },
    });
  },

  async claim(id, user) {
    const req = await requestsRepository.findById(id);
    if (!req) throw Object.assign(new Error('Request not found'), { status: 404 });
    if (req.requestType !== 'consultation') {
      throw Object.assign(new Error('Only consultation requests can be claimed'), { status: 400 });
    }
    if (req.status !== 'pending') {
      throw Object.assign(new Error('Only pending requests can be claimed'), { status: 400 });
    }
    if (req.assignedSalesId) {
      throw Object.assign(new Error('This request has already been claimed by another salesman'), { status: 409 });
    }
    return requestsRepository.update(id, {
      status: 'approved',
      assignedSalesId: user.id,
      assignedSalesName: user.name,
    });
  },

  async approve(id, { assignedSalesId } = {}) {
    const req = await requestsRepository.findById(id);
    if (!req) throw Object.assign(new Error('Request not found'), { status: 404 });
    if (req.status !== 'pending') {
      throw Object.assign(new Error('Only pending requests can be approved'), { status: 400 });
    }

    if (req.source === 'sales') {
      if (req.order) throw Object.assign(new Error('An order already exists for this request'), { status: 409 });
      await requestsRepository.update(id, { status: 'final_approved' });
      return _createOrderFromRequest(req, 'sales');
    }

    if (!assignedSalesId) {
      throw Object.assign(new Error('assignedSalesId is required for client requests'), { status: 400 });
    }
    const salesUser = await usersRepository.findById(assignedSalesId);
    if (!salesUser) throw Object.assign(new Error('Assigned sales user not found'), { status: 404 });

    return requestsRepository.update(id, {
      status: 'approved',
      assignedSalesId,
      assignedSalesName: salesUser.name,
    });
  },

  async assignPricing(id, products, actorId) {
    const req = await requestsRepository.findById(id);
    if (!req) throw Object.assign(new Error('Request not found'), { status: 404 });
    if (req.status !== 'approved') {
      throw Object.assign(new Error('Request must be approved before pricing can be added'), { status: 400 });
    }
    if (req.assignedSalesId !== actorId) {
      throw Object.assign(new Error('You are not assigned to price this request'), { status: 403 });
    }

    if (req.requestType === 'consultation') {
      // Consultation: salesman creates all products from scratch
      const totalAmount = products.reduce((a, p) => a + (p.qty * p.price), 0);
      await requestsRepository.deleteProducts(id);
      await requestsRepository.createProducts(id, products);
      return requestsRepository.update(id, { status: 'pricing_submitted', totalAmount });
    }

    // Standard: update existing product prices
    for (const { id: prodId, price, qty } of products) {
      await requestsRepository.updateProduct(prodId, { price: price ?? 0, total: (qty ?? 0) * (price ?? 0) });
    }
    const updated = await requestsRepository.findById(id);
    const newTotal = updated.products.reduce((a, p) => a + p.total, 0);
    return requestsRepository.update(id, { status: 'pricing_submitted', totalAmount: newTotal });
  },

  async finalApprove(id) {
    const req = await requestsRepository.findById(id);
    if (!req) throw Object.assign(new Error('Request not found'), { status: 404 });
    if (req.status !== 'pricing_submitted') {
      throw Object.assign(new Error('Request must have pricing submitted before final approval'), { status: 400 });
    }
    if (req.order) throw Object.assign(new Error('An order already exists for this request'), { status: 409 });

    await requestsRepository.update(id, { status: 'final_approved' });
    return _createOrderFromRequest(req, 'client');
  },

  async reject(id, rejectionReason) {
    const req = await requestsRepository.findById(id);
    if (!req) throw Object.assign(new Error('Request not found'), { status: 404 });
    const rejectableStatuses = ['pending', 'approved', 'pricing_submitted'];
    if (!rejectableStatuses.includes(req.status)) {
      throw Object.assign(new Error('Cannot reject a request at this stage'), { status: 400 });
    }
    return requestsRepository.update(id, { status: 'rejected', rejectionReason: rejectionReason || null });
  },

  async callStatus(id, { callStatus, callStatusNote }, user) {
    const VALID = ['callback', 'following', 'no_answer', 'low_budget', 'lead', 'out_of_zone'];
    if (!VALID.includes(callStatus)) {
      throw Object.assign(new Error('Invalid call status. Must be one of: ' + VALID.join(', ')), { status: 400 });
    }
    const req = await requestsRepository.findById(id);
    if (!req) throw Object.assign(new Error('Request not found'), { status: 404 });
    return requestsRepository.update(id, {
      callStatus,
      callStatusNote: callStatusNote || null,
      callStatusAt: new Date(),
      callStatusBy: user.name,
    });
  },

  async updateAdminNotes(id, adminNotes) {
    const req = await requestsRepository.findById(id);
    if (!req) throw Object.assign(new Error('Request not found'), { status: 404 });
    return requestsRepository.update(id, { adminNotes: adminNotes || null });
  },

  async setClaimWithoutPayment(id, value) {
    const req = await requestsRepository.findById(id);
    if (!req) throw Object.assign(new Error('Request not found'), { status: 404 });
    return requestsRepository.update(id, { claimWithoutPayment: Boolean(value) });
  },
};
