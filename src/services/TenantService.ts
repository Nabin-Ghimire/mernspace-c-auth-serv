import { Repository } from 'typeorm';
import { ITenant, UserQueryParams } from '../types';
import { Tenant } from '../entity/Tenant';

export class TenantService {
    constructor(private tenantRepository: Repository<Tenant>) {}
    async create(tenantData: ITenant) {
        return await this.tenantRepository.save(tenantData);
    }
    async update(id: number, tenantData: ITenant) {
        return await this.tenantRepository.update(id, tenantData);
    }

    async getAll(validatedQuery: UserQueryParams) {
        const queryBuilder = this.tenantRepository.createQueryBuilder('tenant');

        if (validatedQuery.q) {
            const searchTerm = `%${validatedQuery.q}%`;
            queryBuilder.where((qb) => {
                qb.where('tenant.name ILike :q', { q: searchTerm }).orWhere(
                    'tenant.address ILike :q',
                    { q: searchTerm },
                );
            });
        }
        const result = await queryBuilder
            .skip((validatedQuery.currentPage - 1) * validatedQuery.perPage)
            .take(validatedQuery.perPage)
            .getManyAndCount();
        return result;

        // return await this.tenantRepository.find();
    }

    async getById(tenantId: number) {
        return await this.tenantRepository.findOne({ where: { id: tenantId } });
    }

    async deleteById(tenantId: number) {
        return await this.tenantRepository.delete(tenantId);
    }

    async getAllTenantsForDropdown() {
        return await this.tenantRepository.find();
    }
}
