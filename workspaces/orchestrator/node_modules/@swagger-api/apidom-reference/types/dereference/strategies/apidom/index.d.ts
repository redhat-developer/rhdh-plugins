import { Element } from '@swagger-api/apidom-core';
import DereferenceStrategy, { DereferenceStrategyOptions } from '../DereferenceStrategy';
import File from '../../../File';
import ApiDOMDereferenceVisitor from './visitor';
import type { ReferenceOptions } from '../../../options';
export interface ApiDOMDereferenceStrategyOptions extends Omit<DereferenceStrategyOptions, 'name'> {
}
declare class ApiDOMDereferenceStrategy extends DereferenceStrategy {
    constructor(options?: ApiDOMDereferenceStrategyOptions);
    canDereference(file: File): boolean;
    dereference(file: File, options: ReferenceOptions): Promise<Element>;
}
export { ApiDOMDereferenceVisitor };
export default ApiDOMDereferenceStrategy;
