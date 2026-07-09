import bcrypt from 'bcrypt';
import { usersRepository } from '../repositories/users.repository.js';

export const usersService = {
  list: () => usersRepository.findAll(),

  async getById(id) {
    const u = await usersRepository.findById(id);
    if (!u) throw Object.assign(new Error('User not found'), { status: 404 });
    return u;
  },

  async create({ name, role, username, password, avatarInitials, clientId }) {
    if (!name || !role || !username || !password) {
      throw Object.assign(new Error('name, role, username, password are required'), { status: 400 });
    }
    if (password.length < 8) {
      throw Object.assign(new Error('Password must be at least 8 characters'), { status: 400 });
    }
    const VALID_ROLES = ['admin', 'sales', 'mixer', 'delivery', 'client'];
    if (!VALID_ROLES.includes(role)) {
      throw Object.assign(new Error('Invalid role'), { status: 400 });
    }
    const existing = await usersRepository.findByUsername(username);
    if (existing) throw Object.assign(new Error('Username already taken'), { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);
    return usersRepository.create({
      name, role, username, passwordHash,
      avatarInitials: avatarInitials || name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      clientId: clientId || null,
    });
  },

  async update(id, { name, role, username, password, avatarInitials, clientId }) {
    await usersService.getById(id);
    const VALID_ROLES = ['admin', 'sales', 'mixer', 'delivery', 'client'];
    if (role !== undefined && !VALID_ROLES.includes(role)) {
      throw Object.assign(new Error('Invalid role'), { status: 400 });
    }
    if (password && password.length < 8) {
      throw Object.assign(new Error('Password must be at least 8 characters'), { status: 400 });
    }
    const data = {};
    if (name !== undefined) data.name = name;
    if (role !== undefined) data.role = role;
    if (username !== undefined) data.username = username;
    if (password) data.passwordHash = await bcrypt.hash(password, 10);
    if (avatarInitials !== undefined) data.avatarInitials = avatarInitials;
    if (clientId !== undefined) data.clientId = clientId || null;
    return usersRepository.update(id, data);
  },

  async delete(id, requesterId) {
    if (id === requesterId) {
      throw Object.assign(new Error('Cannot delete your own account'), { status: 400 });
    }
    await usersService.getById(id);
    return usersRepository.delete(id);
  },

  async approve(id) {
    await usersService.getById(id);
    return usersRepository.update(id, { status: 'active' });
  },

  async reject(id) {
    await usersService.getById(id);
    return usersRepository.update(id, { status: 'rejected' });
  },

  async listPending() {
    return usersRepository.findPending();
  },
};
