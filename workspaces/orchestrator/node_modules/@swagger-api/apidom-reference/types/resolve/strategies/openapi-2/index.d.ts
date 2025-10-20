import ResolveStrategy, { ResolveStrategyOptions } from '../ResolveStrategy';
import ReferenceSet from '../../../ReferenceSet';
import File from '../../../File';
import type { ReferenceOptions } from '../../../options';
export interface OpenAPI2ResolveStrategyOptions extends Omit<ResolveStrategyOptions, 'name'> {
}
declare class OpenAPI2ResolveStrategy extends ResolveStrategy {
    constructor(options?: OpenAPI2ResolveStrategyOptions);
    canResolve(file: File, options: ReferenceOptions): boolean;
    resolve(file: File, options: ReferenceOptions): Promise<ReferenceSet>;
}
export default OpenAPI2ResolveStrategy;
