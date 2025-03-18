import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import { Tenant } from '../../src/entity/Tenant';

describe('POST /tenants', () => {
    let connection: DataSource;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        await connection.dropDatabase();
        await connection.synchronize();
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
                .send(tenentData);

            expect(response.statusCode).toBe(201);
        });

        it('should create tenant in the database', async () => {
            const tenentData = {
                name: 'Tenant name',
                address: 'Tenant address',
            };

            await request(app).post('/tenants').send(tenentData);

            const tenantRepository = connection.getRepository(Tenant);
            const tenants = await tenantRepository.find();

            expect(tenants).toHaveLength(1);
            expect(tenants[0].name).toBe(tenentData.name);
            expect(tenants[0].address).toBe(tenentData.address);
        });
    });
});
