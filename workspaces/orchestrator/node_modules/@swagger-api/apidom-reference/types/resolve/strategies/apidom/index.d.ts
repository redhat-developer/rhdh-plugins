import ResolveStrategy, { ResolveStrategyOptions } from '../ResolveStrategy';
import ReferenceSet from '../../../ReferenceSet';
import File from '../../../File';
import type { ReferenceOptions } from '../../../options';
export interface ApiDOMResolveStrategyOptions extends Omit<ResolveStrategyOptions, 'name'> {
}
declare class ApiDOMResolveStrategy extends ResolveStrategy {
    constructor(options?: ApiDOMResolveStrategyOptions);
    canResolve(file: File, options: ReferenceOptions): boolean;
    resolve(file: File, options: ReferenceOptions): Promise<ReferenceSet>;
}
export default ApiDOMResolveStrategy;
