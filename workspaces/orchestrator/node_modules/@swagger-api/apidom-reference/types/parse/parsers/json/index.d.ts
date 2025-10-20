import { ParseResultElement } from '@swagger-api/apidom-core';
import Parser, { ParserOptions } from '../Parser';
import File from '../../../File';
export interface JSONParserOptions extends Omit<ParserOptions, 'name'> {
}
declare class JSONParser extends Parser {
    syntacticAnalysis?: 'direct' | 'indirect';
    constructor(options?: JSONParserOptions);
    canParse(file: File): Promise<boolean>;
    parse(file: File): Promise<ParseResultElement>;
}
export default JSONParser;
