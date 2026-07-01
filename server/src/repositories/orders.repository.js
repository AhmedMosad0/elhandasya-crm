import prisma from '../prisma/client.js';

const include = {
  products: true,
  payments: { orderBy: { createdAt: 'asc' } },
  activity: { orderBy: { createdAt: 'asc' } },
};

export const ordersRepository = {
  findAll: (where) =>
    prisma.order.findMany({ where, include, orderBy: { createdAt: 'desc' } }),

  findById: (id) => prisma.order.findUnique({ where: { id }, include }),

  count: () => prisma.order.count(),

  create: (data) => prisma.order.create({ data, include }),

  update: (id, data) => prisma.order.update({ where: { id }, data, include }),

  addPayment: (orderId, data) =>
    prisma.payment.create({ data: { orderId, ...data } }),

  updateOrderProduct: (id, delivered) =>
    prisma.orderProduct.update({ where: { id }, data: { delivered } }),

  findOrderProducts: (orderId) =>
    prisma.orderProduct.findMany({ where: { orderId } }),

  addActivity: (orderId, data) =>
    prisma.activityLog.create({ data: { orderId, ...data } }),
};
