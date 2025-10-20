import { ParseResultElement } from '@swagger-api/apidom-core';
import type { ReferenceOptions } from '../options';
/**
 * Bundle a file with all its external references to a compound document.
 */
declare const bundle: (uri: string, options: ReferenceOptions) => Promise<ParseResultElement>;
export default bundle;
