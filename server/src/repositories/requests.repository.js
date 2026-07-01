import prisma from '../prisma/client.js';

const include = { products: true, order: { select: { id: true, recipeNum: true } } };

export const requestsRepository = {
  findAll: (where) =>
    prisma.request.findMany({ where, include, orderBy: { createdAt: 'desc' } }),

  findById: (id) => prisma.request.findUnique({ where: { id }, include }),

  create: (data) => prisma.request.create({ data, include }),

  update: (id, data) => prisma.request.update({ where: { id }, data, include }),

  updateProduct: (id, data) => prisma.requestProduct.update({ where: { id }, data }),

  count: () => prisma.request.count(),
};
