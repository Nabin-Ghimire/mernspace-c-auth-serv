import { NextFunction, Response } from 'express';
import { AuthRequest, RegisterUserRequest } from '../types';
import { UserService } from '../services/UserService';
import { Logger } from 'winston';
import { validationResult } from 'express-validator';
import { JwtPayload } from 'jsonwebtoken';
import { TokenService } from '../services/TokenService';
import createHttpError from 'http-errors';
import { CredentialService } from '../services/CredentialService';

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
        private credentialService: CredentialService,
    ) {}

    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        //Validation
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        const { firstName, lastName, email, password, role } = req.body;
        this.logger.debug('New request to register user', {
            firstName,
            lastName,
            email,
            password: '*******',
            role,
        });

        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
                role,
            });

            this.logger.info('User has been registered', { id: user.id });

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            };

            const accessToken = this.tokenService.generateAccessToken(payload);

            //Persist the refresh token

            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user);

            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            });

            res.cookie('accessToken', accessToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60, //1 hour
                httpOnly: true,
            });
            res.cookie('refreshToken', refreshToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 365, //1 hour
                httpOnly: true,
            });

            res.status(201).json({ id: user.id });
        } catch (error) {
            next(error);
            return;
        }
    }

    async login(req: RegisterUserRequest, res: Response, next: NextFunction) {
        //Validation
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        const { email, password } = req.body;
        this.logger.debug('New request to login user', {
            email,
            password: '*******',
        });

        try {
            const user = await this.userService.findByEmailWithPassword(email);

            if (!user) {
                const error = createHttpError(
                    400,
                    'Email or password does not match',
                );
                next(error);
                return;
            }

            const passwordMatch = await this.credentialService.comparePassword(
                password,
                user.password,
            );

            if (!passwordMatch) {
                const error = createHttpError(
                    400,
                    'Email or password does not match',
                );
                next(error);
                return;
            }

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
                tenant: user.tenant ? String(user.tenant.id) : '',
            };

            const accessToken = this.tokenService.generateAccessToken(payload);

            //Persist the refresh token. Created a database table for refresh token

            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user);

            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            });

            res.cookie('accessToken', accessToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60, //1 hour
                httpOnly: true,
            });
            res.cookie('refreshToken', refreshToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 365, //1 year
                httpOnly: true,
            });

            this.logger.info('User has been logged in', { id: user.id });

            res.json({ id: user.id });
        } catch (error) {
            next(error);
            return;
        }
    }

    async self(req: AuthRequest, res: Response) {
        const user = await this.userService.findById(Number(req.auth.sub));

        res.json({ ...user, password: undefined });
    }

    async refresh(req: AuthRequest, res: Response, next: NextFunction) {
        const payload: JwtPayload = {
            sub: req.auth.sub,
            role: req.auth.role,
            tenant: req.auth.tenant,
        };

        try {
            //Generating access token
            const accessToken = this.tokenService.generateAccessToken(payload);

            const user = await this.userService.findById(Number(req.auth.sub));
            if (!user) {
                const error = createHttpError(
                    400,
                    'User with the token could not found',
                );
                next(error);
                return;
            }

            //Persist the refresh token. Created a database table for refresh token
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user);

            //Deleting existing refresh token id
            await this.tokenService.deleteRefreshTokenById(Number(req.auth.id));

            //Generating refresh token
            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            });

            res.cookie('accessToken', accessToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60, //1 hour
                httpOnly: true,
            });
            res.cookie('refreshToken', refreshToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 365, //1 hour
                httpOnly: true,
            });

            this.logger.info('User has been logged in', { id: user.id });

            res.json({ id: user.id });
        } catch (error) {
            next(error);
            return;
        }
    }

    async logout(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            await this.tokenService.deleteRefreshTokenById(Number(req.auth.id)); //This (req.auth.id) is returned by authenticate middleware while validating refresh token by expressJWT.
            this.logger.info('User has been logged out', { id: req.auth.sub });
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.json({});
        } catch (error) {
            next(error);
            return;
        }
    }
}
