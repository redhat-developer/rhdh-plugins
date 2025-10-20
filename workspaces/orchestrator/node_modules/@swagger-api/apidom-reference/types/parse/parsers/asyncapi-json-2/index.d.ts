import { ParseResultElement } from '@swagger-api/apidom-core';
import Parser, { ParserOptions } from '../Parser';
import File from '../../../File';
export interface AsyncAPIJSON2ParserOptions extends Omit<ParserOptions, 'name'> {
}
declare class AsyncAPIJSON2Parser extends Parser {
    syntacticAnalysis?: 'direct' | 'indirect';
    refractorOpts: object;
    constructor(options?: AsyncAPIJSON2ParserOptions);
    canParse(file: File): Promise<boolean>;
    parse(file: File): Promise<ParseResultElement>;
}
export default AsyncAPIJSON2Parser;
