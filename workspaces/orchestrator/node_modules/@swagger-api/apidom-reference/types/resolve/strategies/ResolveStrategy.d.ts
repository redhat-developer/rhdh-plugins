import File from '../../File';
import ReferenceSet from '../../ReferenceSet';
import type { ReferenceOptions } from '../../options';
export interface ResolveStrategyOptions {
    readonly name: string;
}
declare abstract class ResolveStrategy {
    readonly name: string;
    constructor({ name }: ResolveStrategyOptions);
    abstract canResolve(file: File, options: ReferenceOptions): boolean;
    abstract resolve(file: File, options: ReferenceOptions): Promise<ReferenceSet>;
}
export default ResolveStrategy;
