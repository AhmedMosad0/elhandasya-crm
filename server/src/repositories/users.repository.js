import prisma from '../prisma/client.js';

export const usersRepository = {
  findAll: () => prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
  findById: (id) => prisma.user.findUnique({ where: { id } }),
  findByUsername: (username) => prisma.user.findUnique({ where: { username } }),
  findPending: () => prisma.user.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'asc' } }),
  create: (data) => prisma.user.create({ data }),
  update: (id, data) => prisma.user.update({ where: { id }, data }),
  delete: (id) => prisma.user.delete({ where: { id } }),
};
