import ResolveStrategy, { ResolveStrategyOptions } from '../ResolveStrategy';
import ReferenceSet from '../../../ReferenceSet';
import File from '../../../File';
import type { ReferenceOptions } from '../../../options';
export interface AsyncAPI2ResolveStrategyOptions extends Omit<ResolveStrategyOptions, 'name'> {
}
declare class AsyncAPI2ResolveStrategy extends ResolveStrategy {
    constructor(options?: AsyncAPI2ResolveStrategyOptions);
    canResolve(file: File, options: ReferenceOptions): boolean;
    resolve(file: File, options: ReferenceOptions): Promise<ReferenceSet>;
}
export default AsyncAPI2ResolveStrategy;
