import { Element } from '@swagger-api/apidom-core';
import DereferenceStrategy, { DereferenceStrategyOptions } from '../DereferenceStrategy';
import File from '../../../File';
import AsyncAPI2DereferenceVisitor from './visitor';
import type { ReferenceOptions } from '../../../options';
export interface AsyncAPI2DeferenceStrategyOptions extends Omit<DereferenceStrategyOptions, 'name'> {
}
declare class AsyncAPI2DereferenceStrategy extends DereferenceStrategy {
    constructor(options?: AsyncAPI2DeferenceStrategyOptions);
    canDereference(file: File): boolean;
    dereference(file: File, options: ReferenceOptions): Promise<Element>;
}
export { AsyncAPI2DereferenceVisitor };
export default AsyncAPI2DereferenceStrategy;
