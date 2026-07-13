import { productsService } from '../services/products.service.js';

export const productsController = {
  list: async (req, res, next) => {
    try { res.json(await productsService.list(req.query)); } catch (err) { next(err); }
  },

  getById: async (req, res, next) => {
    try { res.json(await productsService.getById(req.params.id)); } catch (err) { next(err); }
  },

  create: async (req, res, next) => {
    try {
      const imageUrl = req.file ? req.file.path : null;
      res.status(201).json(await productsService.create({ ...req.body, imageUrl }));
    } catch (err) { next(err); }
  },

  update: async (req, res, next) => {
    try {
      const patch = { ...req.body };
      if (req.file) patch.imageUrl = req.file.path;
      res.json(await productsService.update(req.params.id, patch));
    } catch (err) { next(err); }
  },

  delete: async (req, res, next) => {
    try { res.json(await productsService.delete(req.params.id)); } catch (err) { next(err); }
  },
};
