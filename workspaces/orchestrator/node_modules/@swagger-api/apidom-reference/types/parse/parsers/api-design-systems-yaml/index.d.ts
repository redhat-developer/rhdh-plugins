import { ParseResultElement } from '@swagger-api/apidom-core';
import Parser, { ParserOptions } from '../Parser';
import File from '../../../File';
export interface APIDesignSystemsYAMLParserOptions extends Omit<ParserOptions, 'name'> {
}
declare class APIDesignSystemsYAMLParser extends Parser {
    refractorOpts: object;
    constructor(options?: APIDesignSystemsYAMLParserOptions);
    canParse(file: File): Promise<boolean>;
    parse(file: File): Promise<ParseResultElement>;
}
export default APIDesignSystemsYAMLParser;
