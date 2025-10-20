import ResolveStrategy, { ResolveStrategyOptions } from '../ResolveStrategy';
import ReferenceSet from '../../../ReferenceSet';
import File from '../../../File';
import type { ReferenceOptions } from '../../../options';
export interface OpenAPI3_0ResolveStrategyOptions extends Omit<ResolveStrategyOptions, 'name'> {
}
declare class OpenAPI3_0ResolveStrategy extends ResolveStrategy {
    constructor(options?: OpenAPI3_0ResolveStrategyOptions);
    canResolve(file: File, options: ReferenceOptions): boolean;
    resolve(file: File, options: ReferenceOptions): Promise<ReferenceSet>;
}
export default OpenAPI3_0ResolveStrategy;
