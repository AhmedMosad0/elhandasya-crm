import prisma from '../prisma/client.js';

const withRelations = {
  requests: {
    select: { id: true, ref: true, status: true, totalAmount: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  },
  orders: {
    select: { id: true, recipeNum: true, status: true, totalAmount: true, paidAmount: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  },
};

export const clientsRepository = {
  findAll: () => prisma.client.findMany({ orderBy: { name: 'asc' } }),
  findById: (id) => prisma.client.findUnique({ where: { id }, include: withRelations }),
  findByPhone: (phone) => prisma.client.findFirst({ where: { phone } }),
  create: (data) => prisma.client.create({ data }),
  update: (id, data) => prisma.client.update({ where: { id }, data }),
  delete: (id) => prisma.client.delete({ where: { id } }),
};
