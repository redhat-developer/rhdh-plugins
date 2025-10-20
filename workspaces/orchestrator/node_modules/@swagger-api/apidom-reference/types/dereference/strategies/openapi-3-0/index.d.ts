import { Element } from '@swagger-api/apidom-core';
import DereferenceStrategy, { DereferenceStrategyOptions } from '../DereferenceStrategy';
import File from '../../../File';
import OpenAPI3_0DereferenceVisitor from './visitor';
import type { ReferenceOptions } from '../../../options';
export interface OpenAPI3_0DereferenceStrategyOptions extends Omit<DereferenceStrategyOptions, 'name'> {
}
declare class OpenAPI3_0DereferenceStrategy extends DereferenceStrategy {
    constructor(options?: OpenAPI3_0DereferenceStrategyOptions);
    canDereference(file: File): boolean;
    dereference(file: File, options: ReferenceOptions): Promise<Element>;
}
export { OpenAPI3_0DereferenceVisitor };
export default OpenAPI3_0DereferenceStrategy;
