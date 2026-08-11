import { pool } from '@packages/database';
import { Commission } from './commissions.interface';
import { Opportunity } from '../opportunities/opportunities.interface';
type Queryable = Pick<typeof pool, 'query'>;
export declare function createCommission(opportunity: Opportunity, db?: Queryable): Promise<Commission | null>;
export {};
//# sourceMappingURL=commissions.service.d.ts.map