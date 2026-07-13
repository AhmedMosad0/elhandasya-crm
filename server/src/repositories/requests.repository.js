import prisma from '../prisma/client.js';

const include = { products: true, order: { select: { id: true, recipeNum: true } } };

export const requestsRepository = {
  findAll: (where) =>
    prisma.request.findMany({ where, include, orderBy: { createdAt: 'desc' } }),

  findById: (id) => prisma.request.findUnique({ where: { id }, include }),

  create: (data) => prisma.request.create({ data, include }),

  update: (id, data) => prisma.request.update({ where: { id }, data, include }),

  updateProduct: (id, data) => prisma.requestProduct.update({ where: { id }, data }),

  deleteProducts: (requestId) => prisma.requestProduct.deleteMany({ where: { requestId } }),

  createProducts: (requestId, products) => prisma.requestProduct.createMany({
    data: products.map(p => ({
      requestId,
      name: p.name, colorCode: p.colorCode || '', colorName: p.colorName || '',
      qty: p.qty, unit: 'L', price: p.price ?? 0, total: p.qty * (p.price ?? 0),
    })),
  }),

  count: () => prisma.request.count(),
};
