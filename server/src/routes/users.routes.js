import { Router } from 'express';
import { usersController } from '../controllers/users.controller.js';

export const usersRouter = Router();
usersRouter.get('/', usersController.list);
usersRouter.post('/', usersController.create);
usersRouter.patch('/:id', usersController.update);
usersRouter.delete('/:id', usersController.delete);
