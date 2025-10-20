import { Element } from 'minim';
import File from '../../File';
import type { ReferenceOptions } from '../../options';
export interface DereferenceStrategyOptions {
    readonly name: string;
}
declare abstract class DereferenceStrategy {
    readonly name: string;
    constructor({ name }: DereferenceStrategyOptions);
    abstract canDereference(file: File, options: ReferenceOptions): boolean;
    abstract dereference(file: File, options: ReferenceOptions): Promise<Element>;
}
export default DereferenceStrategy;
