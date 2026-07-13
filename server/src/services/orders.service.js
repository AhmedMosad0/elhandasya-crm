import { ordersRepository } from '../repositories/orders.repository.js';
import { usersRepository } from '../repositories/users.repository.js';

function nowStr() { return new Date().toISOString().replace('T', ' ').substring(0, 16); }

function genRecipeNum(counter) {
  const ds = new Date().toISOString().split('T')[0].replace(/-/g, '').substring(2);
  return `EH-${ds}-${String(counter).padStart(4, '0')}`;
}

function calcPaymentStatus(paidAmount, totalAmount) {
  if (paidAmount <= 0) return 'unpaid';
  if (paidAmount >= totalAmount) return 'paid';
  return 'partial';
}

export const ordersService = {
  list(user) {
    // Sales and admin see all orders; client sees own only
    const where = user.role === 'client' ? { clientId: user.clientId } : {};
    return ordersRepository.findAll(where);
  },

  async getById(id) {
    const o = await ordersRepository.findById(id);
    if (!o) throw Object.assign(new Error('Order not found'), { status: 404 });
    return o;
  },

  async create(body, user) {
    const { clientId, clientName, clientPhone, clientAddress, products, notes, source } = body;
    if (!clientId || !products?.length) {
      throw Object.assign(new Error('clientId and at least one product are required'), { status: 400 });
    }
    const count = await ordersRepository.count();
    const recipeNum = genRecipeNum(count + 1);
    const totalAmount = products.reduce((a, p) => a + (p.total ?? p.qty * p.price), 0);

    return ordersRepository.create({
      recipeNum, source: source || 'sales',
      clientId, clientName, clientPhone, clientAddress,
      totalAmount, paidAmount: 0, paymentStatus: 'unpaid', status: 'pending',
      notes: notes || null,
      products: {
        create: products.map(p => ({
          name: p.name, colorCode: p.colorCode || '', colorName: p.colorName || '',
          qty: p.qty, unit: p.unit || 'L', price: p.price,
          total: p.total ?? p.qty * p.price, delivered: 0,
        })),
      },
      activity: {
        create: [{ text: 'Order created', time: nowStr(), userName: user.name }],
      },
    });
  },

  async assign(id, { role, userId }, actorName) {
    if (role !== 'sales') {
      throw Object.assign(new Error('role must be sales'), { status: 400 });
    }
    const o = await ordersRepository.findById(id);
    if (!o) throw Object.assign(new Error('Order not found'), { status: 404 });

    const assignee = await usersRepository.findById(userId);
    if (!assignee) throw Object.assign(new Error('User not found'), { status: 404 });

    const data = { salesId: userId, salesName: assignee.name };
    await ordersRepository.addActivity(id, { text: `Assigned ${assignee.name} as sales rep`, time: nowStr(), userName: actorName });
    return ordersRepository.update(id, data);
  },

  async updateStatus(id, body, actorName) {
    const o = await ordersRepository.findById(id);
    if (!o) throw Object.assign(new Error('Order not found'), { status: 404 });

    const { status, paymentStatus, productId, delivered } = body;
    const data = {};
    const logParts = [];

    if (status) { data.status = status; logParts.push(`Status → ${status}`); }
    if (paymentStatus) { data.paymentStatus = paymentStatus; logParts.push(`Payment → ${paymentStatus}`); }

    if (productId !== undefined && delivered !== undefined) {
      await ordersRepository.updateOrderProduct(productId, delivered);
      logParts.push('Delivery qty updated');

      // Auto-recompute order status from all product deliveries
      const products = await ordersRepository.findOrderProducts(id);
      const updated = products.map(p => p.id === productId ? { ...p, delivered } : p);
      const allDone = updated.every(p => p.delivered >= p.qty);
      const anyDone = updated.some(p => p.delivered > 0);
      if (allDone) data.status = 'delivered';
      else if (anyDone) data.status = 'partial';
    }

    if (logParts.length) {
      await ordersRepository.addActivity(id, { text: logParts.join('; '), time: nowStr(), userName: actorName });
    }
    return ordersRepository.update(id, data);
  },

  async addPayment(id, { amount, date, note, by }, actorName) {
    const o = await ordersRepository.findById(id);
    if (!o) throw Object.assign(new Error('Order not found'), { status: 404 });

    const amt = Number(amount);
    if (!amt || amt <= 0) throw Object.assign(new Error('Invalid payment amount'), { status: 400 });

    await ordersRepository.addPayment(id, {
      amount: amt,
      date: date || new Date().toISOString().split('T')[0],
      note: note || null,
      by: by || actorName,
    });
    await ordersRepository.addActivity(id, {
      text: `Payment of EGP ${amt.toLocaleString()} recorded by ${by || actorName}`,
      time: nowStr(),
      userName: actorName,
    });

    const newPaid = o.paidAmount + amt;
    return ordersRepository.update(id, {
      paidAmount: newPaid,
      paymentStatus: calcPaymentStatus(newPaid, o.totalAmount),
    });
  },
};
