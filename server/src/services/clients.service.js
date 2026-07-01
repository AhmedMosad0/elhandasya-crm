import { clientsRepository } from '../repositories/clients.repository.js';

export const clientsService = {
  list: () => clientsRepository.findAll(),

  async getById(id) {
    const c = await clientsRepository.findById(id);
    if (!c) throw Object.assign(new Error('Client not found'), { status: 404 });
    return c;
  },

  create: ({ name, phone, email, address, company }) =>
    clientsRepository.create({ name, phone, email: email || null, address, company: company || null }),

  async update(id, data) {
    await clientsService.getById(id);
    const { name, phone, email, address, company } = data;
    return clientsRepository.update(id, {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email: email || null }),
      ...(address !== undefined && { address }),
      ...(company !== undefined && { company: company || null }),
    });
  },

  async delete(id) {
    await clientsService.getById(id);
    return clientsRepository.delete(id);
  },
};
