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
declare const analyze$1: (source: string) => Promise<Tree$1>;

type Tree = Tree$1 | Tree$2;
/**
 * This version of syntactic analysis does following transformations:
 *   TreeSitter CST -> YAML AST -> ApiDOM
 * Two traversals passes are needed to get from CST to ApiDOM.
 */
declare const analyze: (cst: Tree, { sourceMap }?: {
    sourceMap?: boolean | undefined;
}) => ParseResultElement;

declare class YamlMediaTypes extends MediaTypes<string> {
    latest(): string;
}
declare const mediaTypes: YamlMediaTypes;

declare const namespace: _swagger_api_apidom_core.Namespace;

declare const detect: (source: string) => Promise<boolean>;
interface ParseFunctionOptions {
    sourceMap?: boolean;
}
type ParseFunction = (source: string, options?: ParseFunctionOptions) => Promise<ParseResultElement>;
declare const parse: ParseFunction;

export { detect, analyze$1 as lexicalAnalysis, mediaTypes, namespace, parse, analyze as syntacticAnalysis };
