import { ParseResultElement } from '@swagger-api/apidom-core';
import Parser, { ParserOptions } from '../Parser';
import File from '../../../File';
export interface WorkflowsJSON1ParserOptions extends Omit<ParserOptions, 'name'> {
}
declare class WorkflowsJSON1Parser extends Parser {
    syntacticAnalysis?: 'direct' | 'indirect';
    refractorOpts: object;
    constructor(options?: WorkflowsJSON1ParserOptions);
    canParse(file: File): Promise<boolean>;
    parse(file: File): Promise<ParseResultElement>;
}
export default WorkflowsJSON1Parser;
