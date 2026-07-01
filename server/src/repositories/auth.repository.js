import prisma from '../prisma/client.js';

export const authRepository = {
  findByUsername: (username) => prisma.user.findUnique({ where: { username } }),
  findById: (id) => prisma.user.findUnique({ where: { id } }),
};
