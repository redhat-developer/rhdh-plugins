import * as _swagger_api_apidom_core from '@swagger-api/apidom-core';
import { ParseResultElement, MediaTypes } from '@swagger-api/apidom-core';
import { Tree as Tree$1 } from 'web-tree-sitter';
import { Tree as Tree$2 } from 'tree-sitter';

/**
 * Lexical Analysis of source string using WebTreeSitter.
 * This is WebAssembly version of TreeSitters Lexical Analysis.
 *
 * Given JavaScript doesn't support true parallelism, this
 * code should be as lazy as possible and temporal safety should be fine.
 */
declare const analyze$2: (source: string) => Promise<Tree$1>;

/**
 * This version of syntactic analysis translates TreeSitter CTS
 * directly into ApiDOM.
 *
 * Transient transformation of TreeSitter CST is performed
 * using TreeSitter cursor. TreeSitter cursor is a stateful object
 * that allows us to walk syntax tree containing large number of nodes
 * with maximum efficiency. Using this transient CST transformation
 * gives us double the performance when syntactically analyzing
 * CST into ApiDOM.
 *
 * Single traversal pass is needed to get from CST to ApiDOM.
 */
declare const analyze$1: (cst: Tree$2 | Tree$1, { sourceMap }?: {
    sourceMap?: boolean | undefined;
}) => ParseResultElement;

type Tree = Tree$1 | Tree$2;
/**
 * This version of syntactic analysis does following transformations:
 *   TreeSitter CST -> JSON AST -> ApiDOM
 *
 * Transient transformation of TreeSitter CST is performed
 * using TreeSitter cursor. TreeSitter cursor is a stateful object
 * that allows us to walk syntax tree containing large number of nodes
 * with maximum efficiency. Using this transient CST transformation
 * gives us double the performance when syntactically analyzing
 * CST into JSON AST.
 *
 * Two traversals passes are needed to get from CST to ApiDOM.
 * This analysis is much slower than the direct one, but allows
 * to do additional analysis magic on JSON AST.
 */
declare const analyze: (cst: Tree, { sourceMap }?: {
    sourceMap?: boolean | undefined;
}) => ParseResultElement;

declare class JSONMediaTypes extends MediaTypes<string> {
    latest(): string;
}
declare const mediaTypes: JSONMediaTypes;

declare const namespace: _swagger_api_apidom_core.Namespace;
declare const detectionRegExp: RegExp;

declare const detect: (source: string) => Promise<boolean>;
interface ParseFunctionOptions {
    sourceMap?: boolean;
    syntacticAnalysis?: 'direct' | 'indirect';
}
type ParseFunction = (source: string, options?: ParseFunctionOptions) => Promise<ParseResultElement>;
declare const parse: ParseFunction;

export { detect, detectionRegExp, analyze$2 as lexicalAnalysis, mediaTypes, namespace, parse, analyze$1 as syntacticAnalysis, analyze$1 as syntacticAnalysisDirect, analyze as syntacticAnalysisIndirect };
