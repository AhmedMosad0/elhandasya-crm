import { clientsService } from '../services/clients.service.js';

export const clientsController = {
  list: async (req, res, next) => {
    try { res.json(await clientsService.list()); } catch (err) { next(err); }
  },

  getById: async (req, res, next) => {
    try { res.json(await clientsService.getById(req.params.id)); } catch (err) { next(err); }
  },

  create: async (req, res, next) => {
    try { res.status(201).json(await clientsService.create(req.body)); } catch (err) { next(err); }
  },

  update: async (req, res, next) => {
    try { res.json(await clientsService.update(req.params.id, req.body)); } catch (err) { next(err); }
  },

  delete: async (req, res, next) => {
    try { await clientsService.delete(req.params.id); res.status(204).end(); } catch (err) { next(err); }
  },
};
