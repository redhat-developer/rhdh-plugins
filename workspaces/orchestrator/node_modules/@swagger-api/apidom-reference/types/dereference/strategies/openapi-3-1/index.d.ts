import { Element } from '@swagger-api/apidom-core';
import DereferenceStrategy, { DereferenceStrategyOptions } from '../DereferenceStrategy';
import File from '../../../File';
import OpenAPI3_1DereferenceVisitor from './visitor';
import type { ReferenceOptions } from '../../../options';
export interface OpenAPI3_1DereferenceStrategyOptions extends Omit<DereferenceStrategyOptions, 'name'> {
}
declare class OpenAPI3_1DereferenceStrategy extends DereferenceStrategy {
    constructor(options?: OpenAPI3_1DereferenceStrategyOptions);
    canDereference(file: File): boolean;
    dereference(file: File, options: ReferenceOptions): Promise<Element>;
}
export { OpenAPI3_1DereferenceVisitor };
export { resolveSchema$refField, resolveSchema$idField, maybeRefractToSchemaElement } from './util';
export default OpenAPI3_1DereferenceStrategy;
