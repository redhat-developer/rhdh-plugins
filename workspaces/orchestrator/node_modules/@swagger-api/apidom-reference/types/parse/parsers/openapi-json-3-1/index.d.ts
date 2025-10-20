import { ParseResultElement } from '@swagger-api/apidom-core';
import Parser, { ParserOptions } from '../Parser';
import File from '../../../File';
export interface OpenAPIJSON3_1ParserOptions extends Omit<ParserOptions, 'name'> {
}
declare class OpenAPIJSON3_1Parser extends Parser {
    syntacticAnalysis?: 'direct' | 'indirect';
    refractorOpts: object;
    constructor(options?: OpenAPIJSON3_1ParserOptions);
    canParse(file: File): Promise<boolean>;
    parse(file: File): Promise<ParseResultElement>;
}
export default OpenAPIJSON3_1Parser;
