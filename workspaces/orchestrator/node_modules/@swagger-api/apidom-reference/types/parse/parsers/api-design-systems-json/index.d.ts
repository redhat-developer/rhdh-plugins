import { ParseResultElement } from '@swagger-api/apidom-core';
import Parser, { ParserOptions } from '../Parser';
import File from '../../../File';
export interface APIDesignSystemsJSONParserOptions extends Omit<ParserOptions, 'name'> {
}
declare class APIDesignSystemsJSONParser extends Parser {
    syntacticAnalysis?: 'direct' | 'indirect';
    refractorOpts: object;
    constructor(options?: APIDesignSystemsJSONParserOptions);
    canParse(file: File): Promise<boolean>;
    parse(file: File): Promise<ParseResultElement>;
}
export default APIDesignSystemsJSONParser;
