import { ParseResultElement } from '@swagger-api/apidom-core';
import Parser, { ParserOptions } from '../Parser';
import File from '../../../File';
export interface OpenAPIYAML3_1ParserOptions extends Omit<ParserOptions, 'name'> {
}
declare class OpenAPIYAML3_1Parser extends Parser {
    refractorOpts: object;
    constructor(options?: OpenAPIYAML3_1ParserOptions);
    canParse(file: File): Promise<boolean>;
    parse(file: File): Promise<ParseResultElement>;
}
export default OpenAPIYAML3_1Parser;
