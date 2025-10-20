import { ApiDOMStructuredError, ApiDOMErrorOptions } from '@swagger-api/apidom-error';

interface PointOptions {
    readonly row: number;
    readonly column: number;
    readonly char: number;
}
declare class Point {
    static readonly type: string;
    readonly type: string;
    readonly row: number;
    readonly column: number;
    readonly char: number;
    constructor({ row, column, char }: PointOptions);
}
interface PositionOptions {
    readonly start: Point;
    readonly end: Point;
}
declare class Position {
    static readonly type: string;
    readonly type: string;
    readonly start: Point;
    readonly end: Point;
    constructor({ start, end }: PositionOptions);
}

interface NodeOptions {
    readonly children?: unknown[];
    readonly position?: Position;
    readonly isMissing?: boolean;
}
declare class Node {
    static readonly type: string;
    readonly type: string;
    readonly isMissing: boolean;
    children: unknown[];
    position?: Position;
    constructor({ children, position, isMissing }?: NodeOptions);
    clone(): Node;
}

declare class JsonNode extends Node {
}

declare class JsonDocument extends JsonNode {
    static readonly type = "document";
    get child(): unknown;
}

declare class JsonString extends JsonNode {
    static readonly type: string;
    get value(): string;
}

declare class JsonKey extends JsonString {
    static readonly type = "key";
}

interface JsonValueOptions extends NodeOptions {
    value: string;
}
declare class JsonValue$1 extends JsonNode {
    static readonly type: string;
    readonly value: string;
    constructor({ value, ...rest }: JsonValueOptions);
}

declare class JsonFalse extends JsonValue$1 {
    static readonly type = "false";
}

declare class JsonTrue extends JsonValue$1 {
    static readonly type = "true";
}

declare class JsonNull extends JsonValue$1 {
    static readonly type = "null";
}

declare class JsonNumber extends JsonValue$1 {
    static readonly type = "number";
}

declare class JsonArray extends JsonNode {
    static readonly type = "array";
    get items(): unknown[];
}

type JsonValue = JsonFalse | JsonTrue | JsonNull | JsonNumber | JsonString | JsonArray | JsonObject;
declare class JsonProperty extends JsonNode {
    static readonly type = "property";
    get key(): JsonKey | undefined;
    get value(): JsonValue | undefined;
}

declare class JsonObject extends JsonNode {
    static readonly type = "object";
    get properties(): Array<JsonProperty>;
}

declare class JsonStringContent extends JsonValue$1 {
    static readonly type = "stringContent";
}

declare class JsonEscapeSequence extends JsonValue$1 {
    static readonly type = "escapeSequence";
}

declare const isDocument$1: (node: unknown) => node is JsonDocument;
declare const isString: (node: unknown) => node is JsonString;
declare const isFalse: (node: unknown) => node is JsonFalse;
declare const isTrue: (node: unknown) => node is JsonTrue;
declare const isNull: (node: unknown) => node is JsonNull;
declare const isNumber: (node: unknown) => node is JsonNumber;
declare const isArray: (node: unknown) => node is JsonArray;
declare const isObject: (node: unknown) => node is JsonObject;
declare const isStringContent: (node: unknown) => node is JsonStringContent;
declare const isEscapeSequence: (node: unknown) => node is JsonEscapeSequence;
declare const isProperty: (node: unknown) => node is JsonProperty;
declare const isKey: (node: unknown) => node is JsonKey;

interface YamlAliasOptions extends NodeOptions {
    readonly content: string;
}
declare class YamlAlias extends Node {
    static readonly type = "alias";
    readonly content: string;
    constructor({ content, ...rest }: YamlAliasOptions);
}

declare enum YamlNodeKind {
    Scalar = "Scalar",
    Sequence = "Sequence",
    Mapping = "Mapping"
}
interface YamlTagOptions extends NodeOptions {
    readonly explicitName: string;
    readonly kind: YamlNodeKind;
}
declare class YamlTag extends Node {
    static readonly type = "tag";
    readonly explicitName: string;
    readonly kind: YamlNodeKind;
    constructor({ explicitName, kind, ...rest }: YamlTagOptions);
}

interface YamlAnchorOptions extends NodeOptions {
    readonly name: string;
}
declare class YamlAnchor extends Node {
    static readonly type = "anchor";
    readonly name: string;
    constructor({ name, ...rest }: YamlAnchorOptions);
}

declare enum YamlStyle {
    Plain = "Plain",
    SingleQuoted = "SingleQuoted",
    DoubleQuoted = "DoubleQuoted",
    Literal = "Literal",
    Folded = "Folded",
    Explicit = "Explicit",
    SinglePair = "SinglePair",
    NextLine = "NextLine",
    InLine = "InLine"
}
declare enum YamlStyleGroup {
    Flow = "Flow",
    Block = "Block"
}

interface YamlNodeOptions extends NodeOptions {
    readonly anchor?: YamlAnchor;
    readonly tag?: YamlTag;
    readonly style: YamlStyle;
    readonly styleGroup: YamlStyleGroup;
}
declare class YamlNode extends Node {
    readonly anchor?: YamlAnchor;
    readonly tag?: YamlTag;
    readonly style: YamlStyle;
    readonly styleGroup: YamlStyleGroup;
    constructor({ anchor, tag, style, styleGroup, ...rest }: YamlNodeOptions);
}

declare class YamlCollection extends YamlNode {
}

interface YamlCommentOptions extends NodeOptions {
    readonly content: string;
}
declare class YamlComment extends Node {
    static readonly type = "comment";
    readonly content: string;
    constructor({ content, ...rest }: YamlCommentOptions);
}

interface YamlDirectiveParameters {
    readonly version?: string;
    readonly handle?: string;
    readonly prefix?: string;
}
interface YamlDirectiveOptions extends NodeOptions {
    readonly name?: string;
    readonly parameters: YamlDirectiveParameters;
}
declare class YamlDirective extends Node {
    static readonly type = "directive";
    readonly name?: string;
    readonly parameters: YamlDirectiveParameters;
    constructor({ name, parameters, ...rest }: YamlDirectiveOptions);
}

declare class YamlDocument extends Node {
    static readonly type = "document";
}

interface YamlKeyValuePairOptions extends NodeOptions {
    readonly styleGroup: YamlStyleGroup;
}
declare class YamlKeyValuePair extends Node {
    static readonly type = "keyValuePair";
    readonly styleGroup: YamlStyleGroup;
    constructor({ styleGroup, ...rest }: YamlKeyValuePairOptions);
}

declare class YamlMapping extends YamlCollection {
    static readonly type = "mapping";
}

interface YamlScalarOptions extends YamlNodeOptions {
    readonly content: string;
}
declare class YamlScalar extends YamlNode {
    static readonly type = "scalar";
    readonly content: string;
    constructor({ content, ...rest }: YamlScalarOptions);
}

declare class YamlSequence extends YamlCollection {
    static readonly type = "sequence";
}

declare class YamlStream extends Node {
    static readonly type = "stream";
}

declare class FailsafeSchema {
    tags: any[];
    tagDirectives: YamlDirective[];
    constructor();
    toSpecificTagName(node: any): string;
    registerTagDirective(tagDirective: YamlDirective): void;
    registerTag(tag: any, beginning?: boolean): this;
    overrideTag(tag: any): this;
    resolve(node: any): any;
}

declare class JsonSchema extends FailsafeSchema {
    constructor();
    toSpecificTagName(node: any): any;
}

declare class ReferenceManager {
    addAnchor(node: YamlNode): void;
    resolveAlias(alias: YamlAlias): YamlScalar;
}

declare const isStream: (node: unknown) => node is YamlStream;
declare const isDocument: (node: unknown) => node is YamlDocument;
declare const isMapping: (node: unknown) => node is YamlMapping;
declare const isSequence: (node: unknown) => node is YamlSequence;
declare const isKeyValuePair: (node: unknown) => node is YamlKeyValuePair;
declare const isTag: (node: unknown) => node is YamlTag;
declare const isAnchor: (node: unknown) => node is YamlAnchor;
declare const isScalar: (node: unknown) => node is YamlScalar;
declare const isAlias: (node: unknown) => node is YamlAlias;
declare const isDirective: (node: unknown) => node is YamlDirective;
declare const isComment: (node: unknown) => node is YamlComment;

declare class YamlError extends ApiDOMStructuredError {
}

declare class YamlReferenceError extends YamlError {
}

declare class YamlSchemaError extends YamlError {
}

interface YamlTagErrorOptions<T extends Node = Node> extends ApiDOMErrorOptions {
    readonly specificTagName: string;
    readonly explicitTagName: string;
    readonly tagKind: string;
    readonly tagPosition?: Position;
    readonly nodeCanonicalContent?: string;
    readonly node?: T;
}
declare class YamlTagError extends YamlSchemaError {
    readonly specificTagName: string;
    readonly explicitTagName: string;
    readonly tagKind: string;
    readonly tagPosition?: Position;
    readonly nodeCanonicalContent?: string;
    readonly node?: unknown;
    constructor(message?: string, structuredOptions?: YamlTagErrorOptions);
}

interface LiteralOptions extends NodeOptions {
    readonly value?: unknown;
}
declare class Literal extends Node {
    static readonly type: string;
    readonly value: unknown;
    constructor({ value, ...rest }?: LiteralOptions);
}

interface ErrorOptions extends NodeOptions {
    readonly value?: unknown;
    readonly isUnexpected?: boolean;
}
declare class Error extends Node {
    static readonly type: string;
    readonly value: unknown;
    readonly isUnexpected: boolean;
    constructor({ value, isUnexpected, ...rest }?: ErrorOptions);
}

declare class ParseResult extends Node {
    static readonly type: string;
    get rootNode(): unknown;
}

declare const isLiteral: (node: unknown) => node is Literal;
declare const isPosition: (node: unknown) => node is Position;
declare const isPoint: (node: unknown) => node is Point;
declare const isParseResult: (node: unknown) => node is ParseResult;

/**
 * SPDX-FileCopyrightText: Copyright (c) GraphQL Contributors
 *
 * SPDX-License-Identifier: MIT
 */
declare const getVisitFn: (visitor: any, type: string, isLeaving: boolean) => any;
declare const BREAK: {};
declare const getNodeType: (node: any) => any;
declare const isNode: (node: any) => boolean;
declare const cloneNode: (node: any) => any;
/**
 * Creates a new visitor instance which delegates to many visitors to run in
 * parallel. Each visitor will be visited for each node before moving on.
 *
 * If a prior visitor edits a node, no following visitors will see that node.
 * `exposeEdits=true` can be used to expose the edited node from the previous visitors.
 */
interface MergeAllSync {
    (visitors: any[], options?: {
        visitFnGetter?: typeof getVisitFn;
        nodeTypeGetter?: typeof getNodeType;
        breakSymbol?: typeof BREAK;
        deleteNodeSymbol?: any;
        skipVisitingNodeSymbol?: boolean;
        exposeEdits?: boolean;
    }): {
        enter: (node: any, ...rest: any[]) => any;
        leave: (node: any, ...rest: any[]) => any;
    };
    [key: symbol]: MergeAllAsync;
}
interface MergeAllAsync {
    (visitors: any[], options?: {
        visitFnGetter?: typeof getVisitFn;
        nodeTypeGetter?: typeof getNodeType;
        breakSymbol?: typeof BREAK;
        deleteNodeSymbol?: any;
        skipVisitingNodeSymbol?: boolean;
        exposeEdits?: boolean;
    }): {
        enter: (node: any, ...rest: any[]) => Promise<any>;
        leave: (node: any, ...rest: any[]) => Promise<any>;
    };
}
declare const mergeAll: MergeAllSync;
/**
 * visit() will walk through an AST using a preorder depth first traversal, calling
 * the visitor's enter function at each node in the traversal, and calling the
 * leave function after visiting that node and all of its child nodes.
 *
 * By returning different values from the enter and leave functions, the
 * behavior of the visitor can be altered, including skipping over a sub-tree of
 * the AST (by returning false), editing the AST by returning a value or null
 * to remove the value, or to stop the whole traversal by returning BREAK.
 *
 * When using visit() to edit an AST, the original AST will not be modified, and
 * a new version of the AST with the changes applied will be returned from the
 * visit function.
 *
 *     const editedAST = visit(ast, {
 *       enter(node, key, parent, path, ancestors) {
 *         // @return
 *         //   undefined: no action
 *         //   false: skip visiting this node
 *         //   BREAK: stop visiting altogether
 *         //   null: delete this node
 *         //   any value: replace this node with the returned value
 *       },
 *       leave(node, key, parent, path, ancestors) {
 *         // @return
 *         //   undefined: no action
 *         //   false: no action
 *         //   BREAK: stop visiting altogether
 *         //   null: delete this node
 *         //   any value: replace this node with the returned value
 *       }
 *     });
 *
 * Alternatively to providing enter() and leave() functions, a visitor can
 * instead provide functions named the same as the kinds of AST nodes, or
 * enter/leave visitors at a named key, leading to four permutations of
 * visitor API:
 *
 * 1) Named visitors triggered when entering a node a specific kind.
 *
 *     visit(ast, {
 *       Kind(node) {
 *         // enter the "Kind" node
 *       }
 *     })
 *
 * 2) Named visitors that trigger upon entering and leaving a node of
 *    a specific kind.
 *
 *     visit(ast, {
 *       Kind: {
 *         enter(node) {
 *           // enter the "Kind" node
 *         }
 *         leave(node) {
 *           // leave the "Kind" node
 *         }
 *       }
 *     })
 *
 * 3) Generic visitors that trigger upon entering and leaving any node.
 *
 *     visit(ast, {
 *       enter(node) {
 *         // enter any node
 *       },
 *       leave(node) {
 *         // leave any node
 *       }
 *     })
 *
 * 4) Parallel visitors for entering and leaving nodes of a specific kind.
 *
 *     visit(ast, {
 *       enter: {
 *         Kind(node) {
 *           // enter the "Kind" node
 *         }
 *       },
 *       leave: {
 *         Kind(node) {
 *           // leave the "Kind" node
 *         }
 *       }
 *     })
 *
 *  @sig visit :: (Node, Visitor, Options)
 *  @sig      Options = { keyMap: Object, state: Object }
 */
declare const visit: (root: any, visitor: any, { keyMap, state, breakSymbol, deleteNodeSymbol, skipVisitingNodeSymbol, visitFnGetter, nodeTypeGetter, nodePredicate, nodeCloneFn, detectCycles, }?: {
    keyMap?: null | undefined;
    state?: {} | undefined;
    breakSymbol?: {} | undefined;
    deleteNodeSymbol?: null | undefined;
    skipVisitingNodeSymbol?: boolean | undefined;
    visitFnGetter?: ((visitor: any, type: string, isLeaving: boolean) => any) | undefined;
    nodeTypeGetter?: ((node: any) => any) | undefined;
    nodePredicate?: ((node: any) => boolean) | undefined;
    nodeCloneFn?: ((node: any) => any) | undefined;
    detectCycles?: boolean | undefined;
}) => any;

export { BREAK, Error, JsonArray, JsonDocument, JsonEscapeSequence, JsonFalse, JsonKey, JsonNode, JsonNull, JsonNumber, JsonObject, JsonProperty, JsonString, JsonStringContent, JsonTrue, JsonValue$1 as JsonValue, Literal, type MergeAllAsync, type MergeAllSync, ParseResult, Point, Position, YamlAlias, YamlAnchor, YamlCollection, YamlComment, YamlDirective, YamlDocument, YamlError, FailsafeSchema as YamlFailsafeSchema, JsonSchema as YamlJsonSchema, YamlKeyValuePair, YamlMapping, YamlNode, YamlNodeKind, YamlReferenceError, ReferenceManager as YamlReferenceManager, YamlScalar, YamlSchemaError, YamlSequence, YamlStream, YamlStyle, YamlStyleGroup, YamlTag, YamlTagError, type YamlTagErrorOptions, cloneNode, getNodeType, getVisitFn, isArray as isJsonArray, isDocument$1 as isJsonDocument, isEscapeSequence as isJsonEscapeSequence, isFalse as isJsonFalse, isKey as isJsonKey, isNull as isJsonNull, isNumber as isJsonNumber, isObject as isJsonObject, isProperty as isJsonProperty, isString as isJsonString, isStringContent as isJsonStringContent, isTrue as isJsonTrue, isLiteral, isNode, isParseResult, isPoint, isPosition, isAlias as isYamlAlias, isAnchor as isYamlAnchor, isComment as isYamlComment, isDirective as isYamlDirective, isDocument as isYamlDocument, isKeyValuePair as isYamlKeyValuePair, isMapping as isYamlMapping, isScalar as isYamlScalar, isSequence as isYamlSequence, isStream as isYamlStream, isTag as isYamlTag, mergeAll as mergeAllVisitors, visit };
