import { ParseResultElement } from '@swagger-api/apidom-core';
import type { ReferenceOptions } from '../options';
/**
 * Parses a file into ApiDOM.
 */
declare const parse: (uri: string, options: ReferenceOptions) => Promise<ParseResultElement>;
export default parse;
