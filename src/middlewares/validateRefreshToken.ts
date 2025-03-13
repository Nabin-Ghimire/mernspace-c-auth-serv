import { Request } from 'express';
import { expressjwt } from 'express-jwt';
import { Config } from '../config';
import { AuthCookie, IRefreshTokenPayload } from '../types';
import { AppDataSource } from '../config/data-source';
import { RefreshToken } from '../entity/RefreshToken';
import logger from '../config/logger';

export default expressjwt({
    secret: Config.REFRESH_TOKEN_SECRET!,
    algorithms: ['HS256'],
    getToken(req: Request) {
        const { refreshToken } = req.cookies as AuthCookie;
        return refreshToken;
    },
    async isRevoked(request: Request, token) {
        try {
            const tokenId = Number(
                (token?.payload as IRefreshTokenPayload)?.id,
            );
            const userId = Number(token?.payload?.sub);

            const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
            const refreshToken = await refreshTokenRepo.findOne({
                where: { id: tokenId, user: { id: userId } },
            });

            return refreshToken === null;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            logger.error('Error while getting the refresh token', {
                id: token?.payload as IRefreshTokenPayload,
            });
        }
        return true;
    },
});
