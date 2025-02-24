import request from 'supertest';
import app from '../../app';

describe('POST /auth/register', () => {
    describe('Given all fields', () => {
        it('should return the 201 status code', async () => {
            //AAA{Arrange,Act,Assert}
            //Arrange
            const userData = {
                firstName: 'Nabin',
                lastName: 'Shrestha',
                email: 'ghimiren2057@gmail.com',
                password: 'secret',
            };

            //Act
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
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            //Assert

            expect(
                (response.headers as Record<string, string>)['content-type'],
            ).toEqual(expect.stringContaining('json'));
        });

        it('should persist the user in the databasse', async () => {
            //Arrange
            const userData = {
                firstName: 'Nabin',
                lastName: 'Shrestha',
                email: 'ghimiren2057@gmail.com',
                password: 'secret',
            };

            //Act
            await request(app).post('/auth/register').send(userData);

            //Asert
        });
    });

    describe('Fields are missing', () => {});
});
