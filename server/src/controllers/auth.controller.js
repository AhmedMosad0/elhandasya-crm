import { authService } from '../services/auth.service.js';

export const authController = {
  login: async (req, res, next) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'username and password are required' });
      }
      res.json(await authService.login(username, password));
    } catch (err) { next(err); }
  },

  me: async (req, res, next) => {
    try {
      res.json(await authService.me(req.user.id));
    } catch (err) { next(err); }
  },
};
