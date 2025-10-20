import { ParseResultElement } from '@swagger-api/apidom-core';
import File from '../../File';
import type { ReferenceOptions } from '../../options';
export interface BundleStrategyOptions {
    readonly name: string;
}
declare abstract class BundleStrategy {
    readonly name: string;
    constructor({ name }: BundleStrategyOptions);
    abstract canBundle(file: File, options: ReferenceOptions): boolean;
    abstract bundle(file: File, options: ReferenceOptions): Promise<ParseResultElement>;
}
export default BundleStrategy;
