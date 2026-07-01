import { ordersService } from '../services/orders.service.js';

export const ordersController = {
  list: async (req, res, next) => {
    try { res.json(await ordersService.list(req.user)); } catch (err) { next(err); }
  },

  getById: async (req, res, next) => {
    try { res.json(await ordersService.getById(req.params.id)); } catch (err) { next(err); }
  },

  create: async (req, res, next) => {
    try { res.status(201).json(await ordersService.create(req.body, req.user)); } catch (err) { next(err); }
  },

  assign: async (req, res, next) => {
    try { res.json(await ordersService.assign(req.params.id, req.body, req.user.name)); } catch (err) { next(err); }
  },

  updateStatus: async (req, res, next) => {
    try { res.json(await ordersService.updateStatus(req.params.id, req.body, req.user.name)); } catch (err) { next(err); }
  },

  addPayment: async (req, res, next) => {
    try { res.status(201).json(await ordersService.addPayment(req.params.id, req.body, req.user.name)); } catch (err) { next(err); }
  },
};
