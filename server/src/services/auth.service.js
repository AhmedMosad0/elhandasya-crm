import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authRepository } from '../repositories/auth.repository.js';

function publicUser(u) {
  return { id: u.id, name: u.name, role: u.role, avatarInitials: u.avatarInitials, clientId: u.clientId };
}

export const authService = {
  async login(username, password) {
    const user = await authRepository.findByUsername(username);
    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const payload = publicUser(user);
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });
    return { token, user: payload };
  },

  async me(userId) {
    const user = await authRepository.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    return publicUser(user);
  },
};
