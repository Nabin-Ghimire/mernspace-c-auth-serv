import { Brackets, Repository } from 'typeorm';
import { User } from '../entity/User';
import bcrypt from 'bcryptjs';
import { LimitedUserData, UserData, UserQueryParams } from '../types';
import createHttpError from 'http-errors';

export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({
        firstName,
        lastName,
        email,
        password,
        tenantId,
        role,
    }: UserData) {
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
                tenant: tenantId ? { id: tenantId } : undefined,
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

    async findByEmail(email: string) {
        return await this.userRepository.findOne({ where: { email } });
    }

    async findByEmailWithPassword(email: string) {
        return await this.userRepository.findOne({
            where: {
                email,
            },
            select: [
                'id',
                'firstName',
                'lastName',
                'email',
                'role',
                'password',
            ],
        });
    }

    async findById(id: number) {
        return await this.userRepository.findOne({
            where: { id },
            relations: { tenant: true },
        });
    }

    async update(
        userId: number,
        { firstName, lastName, role }: LimitedUserData,
    ) {
        try {
            return await this.userRepository.update(userId, {
                firstName,
                lastName,
                role,
            });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            const error = createHttpError(
                500,
                'Failed to update the user in the database',
            );
            throw error;
        }
    }

    async getAll(validatedQuery: UserQueryParams) {
        const queryBuilder = this.userRepository.createQueryBuilder('user'); //give allies when we work with sql to avoid ambiguous column names erro

        if (validatedQuery.q) {
            const searchTerm = `%${validatedQuery.q}%`;
            queryBuilder.where(
                new Brackets((qb) => {
                    qb.where(
                        "CONCAT(user.firstName, ' ', user.lastName) ILike :q",
                        { q: searchTerm },
                    ).orWhere('user.email ILike :q', { q: searchTerm }); //search by first name and last name

                    // qb.where("user.firstName ILike :q",{q:searchTerm}).orWhere("user.lastName ILike :q",{q:searchTerm}).orWhere("user.email ILike :q",{q:searchTerm});//Like only is case sensitive search but ILike is case insensitive search
                }),
            );
        }

        if (validatedQuery.role) {
            queryBuilder.andWhere('role=:role', { role: validatedQuery.role }); //if search query and role query are present that's why andWhere is used here instead of where only.
        }
        const result = queryBuilder
            .leftJoinAndSelect('user.tenant', 'tenant')
            .skip((validatedQuery.currentPage - 1) * validatedQuery.perPage)
            .take(validatedQuery.perPage)
            .orderBy('user.id', 'DESC')
            .getManyAndCount();

        return result;

        // return await this.userRepository.find();
    }

    async deleteById(userId: number) {
        return await this.userRepository.delete(userId);
    }
}
