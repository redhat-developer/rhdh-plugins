import { ParseResultElement } from '@swagger-api/apidom-core';
import Parser, { ParserOptions } from '../Parser';
import File from '../../../File';
export interface YAMLParserOptions extends Omit<ParserOptions, 'name'> {
}
declare class WorkflowsYAML1Parser extends Parser {
    refractorOpts: object;
    constructor(options?: YAMLParserOptions);
    canParse(file: File): Promise<boolean>;
    parse(file: File): Promise<ParseResultElement>;
}
export default WorkflowsYAML1Parser;
