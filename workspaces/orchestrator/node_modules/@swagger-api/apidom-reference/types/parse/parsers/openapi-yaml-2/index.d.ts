import { ParseResultElement } from '@swagger-api/apidom-core';
import Parser, { ParserOptions } from '../Parser';
import File from '../../../File';
export interface OpenAPIYAML2ParserOptions extends Omit<ParserOptions, 'name'> {
}
declare class OpenAPIYAML2Parser extends Parser {
    refractorOpts: object;
    constructor(options?: OpenAPIYAML2ParserOptions);
    canParse(file: File): Promise<boolean>;
    parse(file: File): Promise<ParseResultElement>;
}
export default OpenAPIYAML2Parser;
