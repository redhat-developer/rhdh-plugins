import { ParseResultElement } from '@swagger-api/apidom-core';
import Parser, { ParserOptions } from '../Parser';
import File from '../../../File';
/**
 * Everything that is not recognized by other parsers will be considered by this parser
 * as a binary data and will be encoded to Base64 format.
 */
export interface BinaryParserOptions extends Omit<ParserOptions, 'name'> {
}
declare class BinaryParser extends Parser {
    constructor(options?: BinaryParserOptions);
    canParse(file: File): boolean;
    parse(file: File): ParseResultElement;
}
export default BinaryParser;
