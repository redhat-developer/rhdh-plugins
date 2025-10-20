import { ParseResultElement } from '@swagger-api/apidom-core';
import Parser, { ParserOptions } from '../Parser';
import File from '../../../File';
export interface AsyncAPIYAML2ParserOptions extends Omit<ParserOptions, 'name'> {
}
declare class AsyncAPIYAML2Parser extends Parser {
    refractorOpts: object;
    constructor(options?: AsyncAPIYAML2ParserOptions);
    canParse(file: File): Promise<boolean>;
    parse(file: File): Promise<ParseResultElement>;
}
export default AsyncAPIYAML2Parser;
