import { ParseResultElement } from '@swagger-api/apidom-core';
import Parser, { ParserOptions } from '../Parser';
import File from '../../../File';
export interface OpenAPIJSON2ParserOptions extends Omit<ParserOptions, 'name'> {
}
declare class OpenAPIJSON2Parser extends Parser {
    syntacticAnalysis?: 'direct' | 'indirect';
    refractorOpts: object;
    constructor(options?: OpenAPIJSON2ParserOptions);
    canParse(file: File): Promise<boolean>;
    parse(file: File): Promise<ParseResultElement>;
}
export default OpenAPIJSON2Parser;
