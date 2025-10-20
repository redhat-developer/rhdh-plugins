import { ParseResultElement } from '@swagger-api/apidom-core';
import File from '../../../File';
import BundleStrategy, { BundleStrategyOptions } from '../BundleStrategy';
export interface OpenAPI3_1BundleStrategyOptions extends Omit<BundleStrategyOptions, 'name'> {
}
declare class OpenAPI3_1BundleStrategy extends BundleStrategy {
    constructor(options?: OpenAPI3_1BundleStrategyOptions);
    canBundle(file: File): boolean;
    bundle(file: File): Promise<ParseResultElement>;
}
export default OpenAPI3_1BundleStrategy;
