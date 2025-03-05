import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/entity/User';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import { Roles } from '../../src/constants';
import { isJWT } from '../utils';
import { RefreshToken } from '../../src/entity/RefreshToken';

describe('POST /auth/register', () => {
    let connection: DataSource;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        //Database truncate
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe('Given all fields', () => {
        it('should return the 201 status code', async () => {
            //AAA{Arrange,Act,Assert}
            //Arrange
            const userData = {
                firstName: 'Nabin',
                lastName: 'Shrestha',
                email: 'ghimiren2057@gmail.com',
                password: 'secret12345',
            };

            //@ts-ignore
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            //Assert

            expect(response.statusCode).toBe(201);
        });

        it('should return valid json response', async () => {
            //AAA{Arrange,Act,Assert}
            //Arrange
            const userData = {
                firstName: 'Nabin',
                lastName: 'Shrestha',
                email: 'ghimiren2057@gmail.com',
                password: 'secret',
            };

            //Act
            //@ts-ignore
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            //Assert

            expect(
                (response.headers as Record<string, string>)['content-type'],
            ).toEqual(expect.stringContaining('json'));
        });

        it('should persist the user in the database', async () => {
            //Arrange
            const userData = {
                firstName: 'Nabin',
                lastName: 'Shrestha',
                email: 'ghimiren2057@gmail.com',
                password: 'secret12345',
            };

            //Act

            //@ts-ignore
            await request(app).post('/auth/register').send(userData);

            //Asert

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(1);
            expect(users[0].firstName).toBe(userData.firstName);
            expect(users[0].lastName).toBe(userData.lastName);
            expect(users[0].email).toBe(userData.email);
        });

        it('should return an id of created user', async () => {
            const userData = {
                firstName: 'Nabin',
                lastName: 'Shrestha',
                email: 'ghimiren2057@gmail.com',
                password: 'secret12345',
            };

            //Act

            //@ts-ignore
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            //Asert

            expect(response.body).toHaveProperty('id');
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect((response.body as Record<string, string>).id).toBe(
                users[0].id,
            );
        });

        it('should assign a customer role', async () => {
            const userData = {
                firstName: 'Nabin',
                lastName: 'Shrestha',
                email: 'ghimiren2057@gmail.com',
                password: 'secret12345',
            };

            //Act

            //@ts-ignore
            await request(app).post('/auth/register').send(userData);

            //Asert

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users[0]).toHaveProperty('role');
            expect(users[0].role).toBe(Roles.CUSTOMER);
        });

        it('should store the hashed password in the database', async () => {
            const userData = {
                firstName: 'Nabin',
                lastName: 'Shrestha',
                email: 'ghimiren2057@gmail.com',
                password: 'secret12345',
            };

            //Act

            //@ts-ignore
            await request(app).post('/auth/register').send(userData);

            //Asert

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users[0].password).not.toBe(userData.password);
            expect(users[0].password).toHaveLength(60);
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/);
        });

        it('should return 400 status code if email is already exists', async () => {
            //Arrange
            const userData = {
                firstName: 'Nabin',
                lastName: 'Shrestha',
                email: 'ghimiren2057@gmail.com',
                password: 'secret',
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save({ ...userData, role: Roles.CUSTOMER });

            //Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            const users = await userRepository.find();

            //Asert
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(1);
        });

        it('should return the acces token and refresh token inside a cookie', async () => {
            //Arrange
            const userData = {
                firstName: 'Nabin',
                lastName: 'Shrestha',
                email: 'ghimiren2057@gmail.com',
                password: 'secret1234',
            };

            //Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            //    interface Headers{
            //     ['set-cookie']?:string[];
            //    }

            let accessToken: string | null = null;
            let refreshToken: string | null = null;
            //Asert
            const cookies = response.get('Set-Cookie') || [];

            cookies.forEach((cookie) => {
                if (cookie.startsWith('accessToken=')) {
                    accessToken = cookie.split(';')[0].split('=')[1];
                }

                {
                    refreshToken = cookie.split(';')[0].split('=')[1];
                }
            });

            console.log('Access token', accessToken);

            expect(accessToken).toBeDefined();
            expect(refreshToken).toBeDefined();

            expect(isJWT(accessToken)).toBeTruthy();
            expect(isJWT(refreshToken)).toBeTruthy();
        });

        it('should store the refresh token in the database', async () => {
            //Arrange
            const userData = {
                firstName: 'Nabin',
                lastName: 'Shrestha',
                email: 'ghimiren2057@gmail.com',
                password: 'secret1234',
            };

            //Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            //Assert
            const refreshTokenRepo = connection.getRepository(RefreshToken);
            // const refreshTokens=await refreshTokenRepo.find();

            // expect(refreshTokens).toHaveLength(1);

            const tokens = await refreshTokenRepo
                .createQueryBuilder('refreshToken')
                .where('refreshToken.userId=:userId', {
                    userId: (response.body as Record<string, string>).id,
                })
                .getMany();

            expect(tokens).toHaveLength(1);
        });
    });

    describe('Fields are missing', () => {
        it('should return 400 status code if email field is missing', async () => {
            const userData = {
                firstName: 'Nabin',
                lastName: 'Shrestha',
                email: '', //gives error because email is missing
                password: 'secret',
            };

            //Act

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            //Asert

            expect(response.statusCode).toBe(400);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it('should return 400 status code if firstName is missing', async () => {
            const userData = {
                firstName: '', //gives error because firstName is missing
                lastName: 'Shrestha',
                email: 'ghimiren2057@gmail.com',
                password: 'secret',
            };

            //Act

            //@ts-ignore
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            //Asert

            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it('should return 400 status code if lastName is missing', async () => {
            const userData = {
                firstName: 'Nabin',
                lastName: '', // gives error because lastName is missing
                email: 'ghimiren2057@gmail.com',
                password: 'secret',
            };

            //Act

            //@ts-ignore
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            //Asert

            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it('should return 400 status code if password is missing', async () => {
            const userData = {
                firstName: 'Nabin',
                lastName: 'Shrestha',
                email: 'ghimiren2057@gmail.com',
                password: '', //password is missing
            };

            //Act

            //@ts-ignore
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            //Asert

            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });
    });

    describe('Fields are not in proper order', () => {
        it('should trim the email field', async () => {
            const userData = {
                firstName: 'Nabin',
                lastName: 'Shrestha',
                email: '  ghimiren2057@gmail.com  ', //Gives error because email is not trimmed
                password: 'secret12345',
            };

            //Act

            await request(app).post('/auth/register').send(userData);

            //Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            const user = users[0];

            expect(user.email).toBe('ghimiren2057@gmail.com');
        });

        it('should return 400 status code if email is not a valid email', async () => {
            const userData = {
                firstName: 'Nabin',
                lastName: 'Shrestha',
                email: 'ghimiren-2057@gmail.com', //gives error because email is not valid
                password: 'secret',
            };

            //Act

            //@ts-ignore
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            //Asert

            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it('should return 400 status code if password is less than 8 characters', async () => {
            const userData = {
                firstName: 'Nabin',
                lastName: 'Shrestha',
                email: 'ghimiren-2057@gmail.com',
                password: 'secr', //gives error because password is less than 8 characters
            };

            //Act

            //@ts-ignore
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            //Asert

            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it('should return an array of error message if email is missing', async () => {
            const userData = {
                firstName: 'Nabin',
                lastName: 'Shrestha',
                email: 'ghimiren-2057@gmail.com',
                password: 'secret',
            };

            //Act

            //@ts-ignore
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            //Asert

            expect(response.body).toHaveProperty('errors');
            expect(
                (response.body as Record<string, string>).errors.length,
            ).toBeGreaterThan(0);
        });
    });
});
