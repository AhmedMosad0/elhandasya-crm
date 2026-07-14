import prisma from '../prisma/client.js';

export const authRepository = {
  findByUsername: (username) => prisma.user.findFirst({ where: { username: { equals: username, mode: 'insensitive' } } }),
  findById: (id) => prisma.user.findUnique({ where: { id } }),
};
