import { Element } from '@swagger-api/apidom-core';
import DereferenceStrategy, { DereferenceStrategyOptions } from '../DereferenceStrategy';
import File from '../../../File';
import OpenAPI2DereferenceVisitor from './visitor';
import type { ReferenceOptions } from '../../../options';
export interface OpenAPI2DereferenceStrategyOptions extends Omit<DereferenceStrategyOptions, 'name'> {
}
declare class OpenAPI2DereferenceStrategy extends DereferenceStrategy {
    constructor(options?: OpenAPI2DereferenceStrategyOptions);
    canDereference(file: File): boolean;
    dereference(file: File, options: ReferenceOptions): Promise<Element>;
}
export { OpenAPI2DereferenceVisitor };
export default OpenAPI2DereferenceStrategy;
