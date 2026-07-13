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
    try { res.json(await requestsService.approve(req.params.id, req.body || {})); } catch (err) { next(err); }
  },

  reject: async (req, res, next) => {
    try {
      res.json(await requestsService.reject(req.params.id, req.body.rejectionReason));
    } catch (err) { next(err); }
  },

  assignPricing: async (req, res, next) => {
    try {
      res.json(await requestsService.assignPricing(req.params.id, req.body.products, req.user.id));
    } catch (err) { next(err); }
  },

  finalApprove: async (req, res, next) => {
    try { res.json(await requestsService.finalApprove(req.params.id)); } catch (err) { next(err); }
  },

  claim: async (req, res, next) => {
    try { res.json(await requestsService.claim(req.params.id, req.user)); } catch (err) { next(err); }
  },

  callStatus: async (req, res, next) => {
    try { res.json(await requestsService.callStatus(req.params.id, req.body, req.user)); } catch (err) { next(err); }
  },

  updateAdminNotes: async (req, res, next) => {
    try { res.json(await requestsService.updateAdminNotes(req.params.id, req.body.adminNotes)); } catch (err) { next(err); }
  },

  setClaimWithoutPayment: async (req, res, next) => {
    try { res.json(await requestsService.setClaimWithoutPayment(req.params.id, req.body.claimWithoutPayment)); } catch (err) { next(err); }
  },
};
