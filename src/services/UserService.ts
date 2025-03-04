import { Repository } from 'typeorm';
import { User } from '../entity/User';
import bcrypt from 'bcryptjs';
import { UserData } from '../types';
import createHttpError from 'http-errors';

export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({ firstName, lastName, email, password, role }: UserData) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (user) {
            const err = createHttpError(400, 'Email already exists!');
            throw err;
        }
        //Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        try {
            const userData = await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role,
            });

            return userData;

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            const error = createHttpError(
                500,
                'Failed to store the data in database',
            );
            throw error;
        }
    }
}
