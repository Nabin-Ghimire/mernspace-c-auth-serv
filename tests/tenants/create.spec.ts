import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import { Tenant } from '../../src/entity/Tenant';
import createJWKSMock from 'mock-jwks';
import { Roles } from '../../src/constants';

describe('POST /tenants', () => {
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;
    let adminToken: string;

    beforeAll(async () => {
        jwks = createJWKSMock('http://localhost:5501');
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        jwks.start();
        await connection.dropDatabase();
        await connection.synchronize();

        adminToken = jwks.token({ sub: '1', role: Roles.ADMIN });
    });

    afterEach(() => {
        jwks.stop();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe('Given al fielsd', () => {
        it('should return 201 status code', async () => {
            const tenentData = {
                name: 'Tenant name',
                address: 'Tenant address',
            };

            const response = await request(app)
                .post('/tenants')
                .set('Cookie', [`accessToken=${adminToken};`])
                .send(tenentData);

            expect(response.statusCode).toBe(201);
        });

        it('should create tenant in the database', async () => {
            const tenentData = {
                name: 'Tenant name',
                address: 'Tenant address',
            };

            await request(app)
                .post('/tenants')
                .set('Cookie', [`accessToken=${adminToken};`])
                .send(tenentData);

            const tenantRepository = connection.getRepository(Tenant);
            const tenants = await tenantRepository.find();

            expect(tenants).toHaveLength(1);
            expect(tenants[0].name).toBe(tenentData.name);
            expect(tenants[0].address).toBe(tenentData.address);
        });

        it('should return 401 if user is not authenticate', async () => {
            const tenentData = {
                name: 'Tenant name',
                address: 'Tenant address',
            };

            const response = await request(app)
                .post('/tenants')
                .send(tenentData);
            expect(response.statusCode).toBe(401);

            const tenantRepository = connection.getRepository(Tenant);
            const tenants = await tenantRepository.find();

            expect(tenants).toHaveLength(0);
        });
    });
});
