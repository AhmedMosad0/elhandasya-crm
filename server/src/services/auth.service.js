import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authRepository } from '../repositories/auth.repository.js';
import { usersRepository } from '../repositories/users.repository.js';
import { clientsRepository } from '../repositories/clients.repository.js';

function publicUser(u) {
  return { id: u.id, name: u.name, role: u.role, avatarInitials: u.avatarInitials, clientId: u.clientId };
}

function makeToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
}

export const authService = {
  async login(username, password) {
    const user = await authRepository.findByUsername(username);
    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    if (user.status === 'pending')  throw Object.assign(new Error('Your account is pending admin approval.'), { status: 403 });
    if (user.status === 'rejected') throw Object.assign(new Error('Your account was not approved. Contact admin.'), { status: 403 });

    const payload = publicUser(user);
    return { token: makeToken(payload), user: payload };
  },

  async me(userId) {
    const user = await authRepository.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    return publicUser(user);
  },

  async signup({ name, username, password, phone, role, email, address, company, phoneForMatch }) {
    if (!name || !username || !password || !phone || !role) {
      throw Object.assign(new Error('name, username, password, phone, role are required'), { status: 400 });
    }
    const allowed = ['client', 'sales', 'mixer', 'delivery'];
    if (!allowed.includes(role)) {
      throw Object.assign(new Error('Invalid role'), { status: 400 });
    }

    const existing = await usersRepository.findByUsername(username);
    if (existing) throw Object.assign(new Error('Username already taken'), { status: 400 });

    const passwordHash = await bcrypt.hash(password, 10);
    const avatarInitials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    if (role === 'client') {
      const lookupPhone = phoneForMatch || phone;
      let client = await clientsRepository.findByPhone(lookupPhone);
      if (!client) {
        client = await clientsRepository.create({
          name,
          phone,
          email: email || null,
          address: address || '—',
          company: company || null,
        });
      }
      const user = await usersRepository.create({
        name, role, username, passwordHash, avatarInitials,
        phone, clientId: client.id, status: 'active',
      });
      const payload = publicUser(user);
      return { token: makeToken(payload), user: payload };
    }

    // Worker roles → pending approval
    await usersRepository.create({
      name, role, username, passwordHash, avatarInitials,
      phone, clientId: null, status: 'pending',
    });
    return { message: 'Account created. Waiting for admin approval.' };
  },
};
