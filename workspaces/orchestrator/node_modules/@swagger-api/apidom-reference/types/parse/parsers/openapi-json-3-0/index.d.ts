import { ParseResultElement } from '@swagger-api/apidom-core';
import Parser, { ParserOptions } from '../Parser';
import File from '../../../File';
export interface OpenAPIJSON3_0ParserOptions extends Omit<ParserOptions, 'name'> {
}
declare class OpenAPIJSON3_0Parser extends Parser {
    syntacticAnalysis?: 'direct' | 'indirect';
    refractorOpts: object;
    constructor(options?: OpenAPIJSON3_0ParserOptions);
    canParse(file: File): Promise<boolean>;
    parse(file: File): Promise<ParseResultElement>;
}
export default OpenAPIJSON3_0Parser;
