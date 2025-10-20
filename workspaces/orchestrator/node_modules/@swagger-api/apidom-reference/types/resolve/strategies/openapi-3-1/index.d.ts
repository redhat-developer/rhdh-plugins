import ResolveStrategy, { ResolveStrategyOptions } from '../ResolveStrategy';
import ReferenceSet from '../../../ReferenceSet';
import File from '../../../File';
import type { ReferenceOptions } from '../../../options';
export interface OpenAPI3_1ResolveStrategyOptions extends Omit<ResolveStrategyOptions, 'name'> {
}
declare class OpenAPI3_1ResolveStrategy extends ResolveStrategy {
    constructor(options?: OpenAPI3_1ResolveStrategyOptions);
    canResolve(file: File, options: ReferenceOptions): boolean;
    resolve(file: File, options: ReferenceOptions): Promise<ReferenceSet>;
}
export default OpenAPI3_1ResolveStrategy;
