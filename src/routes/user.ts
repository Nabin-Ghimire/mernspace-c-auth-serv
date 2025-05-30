import express, { NextFunction, Response } from 'express';
import authenticate from '../middlewares/authenticate';
import { canAccess } from '../middlewares/canAccess';
import { Roles } from '../constants';
import { CreateUserRequest, UpdateUserRequest } from '../types';
import { UserController } from '../controllers/userController';
import { UserService } from '../services/UserService';
import { AppDataSource } from '../config/data-source';
import { User } from '../entity/User';
import logger from '../config/logger';
import updateUserValidator from '../validators/update-user-validator';
import createUserValidator from '../validators/create-user-validator';
import listUsersAndTenantValidators from '../validators/list-usersAndTenant-validators';
import { Request } from 'express-jwt';

const router = express.Router();
const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository);
const userController = new UserController(userService, logger);
router.post(
    '/',
    authenticate,
    canAccess([Roles.ADMIN]),
    createUserValidator,
    (req: CreateUserRequest, res: Response, next: NextFunction) =>
        userController.create(req, res, next),
);

router.patch(
    '/:id',
    authenticate,
    canAccess([Roles.ADMIN]),
    updateUserValidator,
    (req: UpdateUserRequest, res: Response, next: NextFunction) =>
        userController.update(req, res, next),
);

router.get(
    '/',
    authenticate,
    canAccess([Roles.ADMIN]),
    listUsersAndTenantValidators,
    (req: Request, res: Response, next: NextFunction) =>
        userController.getAll(req, res, next),
);

router.get('/:id', authenticate, canAccess([Roles.ADMIN]), (req, res, next) =>
    userController.getOne(req, res, next),
);

router.delete(
    '/:id',
    authenticate,
    canAccess([Roles.ADMIN]),
    (req, res, next) => userController.destroy(req, res, next),
);

export default router;
