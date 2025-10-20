import { Namespace, ParseResultElement } from '@swagger-api/apidom-core';
import Parser, { ParserOptions } from '../Parser';
import File from '../../../File';
export interface ApiDOMJSONParserOptions extends Omit<ParserOptions, 'name'> {
    readonly namespace?: Namespace;
}
declare class ApiDOMJSONParser extends Parser {
    namespace: Namespace;
    ['apidom-json']: {
        namespace?: Namespace;
    };
    constructor(options?: ApiDOMJSONParserOptions);
    canParse(file: File): boolean;
    parse(file: File): ParseResultElement;
}
export default ApiDOMJSONParser;
