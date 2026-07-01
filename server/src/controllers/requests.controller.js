import { requestsService } from '../services/requests.service.js';

export const requestsController = {
  list: async (req, res, next) => {
    try { res.json(await requestsService.list(req.user)); } catch (err) { next(err); }
  },

  getById: async (req, res, next) => {
    try { res.json(await requestsService.getById(req.params.id)); } catch (err) { next(err); }
  },

  create: async (req, res, next) => {
    try {
      res.status(201).json(await requestsService.create({
        ...req.body,
        createdBy: req.user.id,
        salesName: req.user.name,
      }));
    } catch (err) { next(err); }
  },

  approve: async (req, res, next) => {
    try { res.json(await requestsService.approve(req.params.id)); } catch (err) { next(err); }
  },

  reject: async (req, res, next) => {
    try {
      res.json(await requestsService.reject(req.params.id, req.body.rejectionReason));
    } catch (err) { next(err); }
  },
};
