import { ParseResultElement, Element } from '@swagger-api/apidom-core';
import * as minim from 'minim';
import { Element as Element$1, RefElement } from 'minim';
import { ApiDOMError } from '@swagger-api/apidom-error';

/**
 * This class represents a File object with url and data.
 */
interface FileOptions {
    readonly uri: string;
    readonly mediaType?: string;
    readonly data?: Buffer | DataView | ArrayBuffer | string;
    readonly parseResult?: ParseResultElement;
}
declare class File {
    uri: string;
    mediaType: string;
    data?: Buffer | DataView | ArrayBuffer | string;
    parseResult?: ParseResultElement;
    constructor({ uri, mediaType, data, parseResult }: FileOptions);
    get extension(): string;
    toString(): string;
}

interface ReferenceOptions$1<T = Element> {
    readonly uri: string;
    readonly depth?: number;
    readonly refSet?: ReferenceSet;
    readonly value: T;
}
declare class Reference<T = Element> {
    readonly uri: string;
    readonly depth: number;
    readonly value: T;
    refSet?: ReferenceSet;
    readonly errors: Array<Error>;
    constructor({ uri, depth, refSet, value }: ReferenceOptions$1<T>);
}

interface ReferenceSetOptions {
    readonly refs?: Reference[];
    readonly circular?: boolean;
}
declare class ReferenceSet {
    rootRef?: Reference;
    readonly refs: Reference[];
    circular: boolean;
    constructor({ refs, circular }?: ReferenceSetOptions);
    get size(): number;
    add(reference: Reference): this;
    merge(anotherRefSet: this): this;
    has(thing: string | Reference): boolean;
    find(predicate: (value: Reference, index: number, obj: Reference[]) => boolean): Reference | undefined;
    values(): Generator<Reference<minim.Element>, void, undefined>;
    clean(): void;
}

/**
 * SPDX-FileCopyrightText: Copyright (c) 2015 James Messinger
 *
 * SPDX-License-Identifier: MIT
 */
type WindowsPredicate = () => boolean;
/**
 * Returns the protocol of the given URL, or `undefined` if it has no protocol.
 */
declare const getProtocol: (url: string) => string | undefined;
/**
 * Returns true if given URL has protocol.
 */
declare const hasProtocol: (url: string) => boolean;
/**
 * Returns the lower-cased file extension of the given URL,
 * or an empty string if it has no extension.
 */
declare const getExtension: (url: string) => string;
/**
 * Determines whether the given path is a filesystem path.
 * This includes "file://" URLs.
 */
declare const isFileSystemPath: (uri: string) => boolean;
/**
 * Determines whether the given URI is an HTTP(S) URL.
 */
declare const isHttpUrl: (url: string) => boolean;
/**
 * Determines whether the given URI
 * @param uri
 */
declare const isURI: (uri: string) => boolean;
interface ToFileSystemPathOptions {
    keepFileProtocol?: boolean;
    isWindows?: WindowsPredicate;
}
/**
 * Converts a URL to a local filesystem path.
 */
declare const toFileSystemPath: (uri: string, options?: ToFileSystemPathOptions) => string;
/**
 * Converts a filesystem path to a properly-encoded URL.
 *
 * This is intended to handle situations where resolver is called
 * with a filesystem path that contains characters which are not allowed in URLs.
 *
 * @example
 * The following filesystem paths would be converted to the following URLs:
 *
 *    <"!@#$%^&*+=?'>.json              ==>   %3C%22!@%23$%25%5E&*+=%3F\'%3E.json
 *    C:\\My Documents\\File (1).json   ==>   C:/My%20Documents/File%20(1).json
 *    file://Project #42/file.json      ==>   file://Project%20%2342/file.json
 */
declare const fromFileSystemPath: (uri: string) => string;
/**
 * Returns the hash (URL fragment), of the given path.
 * If there is no hash, then the root hash ("#") is returned.
 */
declare const getHash: (uri: string) => string;
/**
 * Removes the hash (URL fragment), if any, from the given path.
 */
declare const stripHash: (uri: string) => string;
/**
 * Returns the current working directory (in Node) or the current page URL (in browsers).
 */
declare const cwd: () => string;
/**
 *  Resolves a target URI relative to a base URI in a manner similar to that of a Web browser resolving an anchor tag HREF.
 */
declare const resolve$1: (from: string, to: string) => string;
/**
 * Sanitizes/Encodes URI to it's url encoded form.
 *
 * The functional will compensate with the usecase when
 * already sanitized URI is passed to it,
 * by first unsatizing it and then performing sanitization again.
 */
declare const sanitize: (uri: string) => string;
/**
 * Unsanitizes/Decodes URI to it's url encoded form.
 * This function already assumes that hash part of the URI
 * has been removed prior to transforming it to it's sanitized form.
 */
declare const unsanitize: (uri: string) => string;

declare const url_d_cwd: typeof cwd;
declare const url_d_fromFileSystemPath: typeof fromFileSystemPath;
declare const url_d_getExtension: typeof getExtension;
declare const url_d_getHash: typeof getHash;
declare const url_d_getProtocol: typeof getProtocol;
declare const url_d_hasProtocol: typeof hasProtocol;
declare const url_d_isFileSystemPath: typeof isFileSystemPath;
declare const url_d_isHttpUrl: typeof isHttpUrl;
declare const url_d_isURI: typeof isURI;
declare const url_d_sanitize: typeof sanitize;
declare const url_d_stripHash: typeof stripHash;
declare const url_d_toFileSystemPath: typeof toFileSystemPath;
declare const url_d_unsanitize: typeof unsanitize;
declare namespace url_d {
  export { url_d_cwd as cwd, url_d_fromFileSystemPath as fromFileSystemPath, url_d_getExtension as getExtension, url_d_getHash as getHash, url_d_getProtocol as getProtocol, url_d_hasProtocol as hasProtocol, url_d_isFileSystemPath as isFileSystemPath, url_d_isHttpUrl as isHttpUrl, url_d_isURI as isURI, resolve$1 as resolve, url_d_sanitize as sanitize, url_d_stripHash as stripHash, url_d_toFileSystemPath as toFileSystemPath, url_d_unsanitize as unsanitize };
}

interface ParserOptions {
    readonly name: string;
    readonly allowEmpty?: boolean;
    readonly sourceMap?: boolean;
    readonly fileExtensions?: string[];
    readonly mediaTypes?: string[];
}
declare abstract class Parser {
    readonly name: string;
    /**
     * Whether to allow "empty" files. This includes zero-byte files.
     */
    allowEmpty: boolean;
    /**
     * Whether to generate source map during parsing.
     */
    sourceMap: boolean;
    /**
     * List of supported file extensions.
     */
    fileExtensions: string[];
    /**
     * List of supported media types.
     */
    mediaTypes: string[];
    constructor({ name, allowEmpty, sourceMap, fileExtensions, mediaTypes, }: ParserOptions);
    abstract canParse(file: File): boolean | Promise<boolean>;
    abstract parse(file: File): ParseResultElement | Promise<ParseResultElement>;
}

interface ResolverOptions {
    readonly name: string;
}
declare abstract class Resolver {
    readonly name: string;
    constructor({ name }: ResolverOptions);
    abstract canRead(file: File): boolean;
    abstract read(file: File): Promise<Buffer>;
}

interface HTTPResolverOptions extends ResolverOptions {
    readonly timeout?: number;
    readonly redirects?: number;
    readonly withCredentials?: boolean;
}
declare abstract class HTTPResolver extends Resolver {
    protected readonly timeout: number;
    protected readonly redirects: number;
    protected readonly withCredentials: boolean;
    constructor(options?: HTTPResolverOptions);
    canRead(file: File): boolean;
    abstract getHttpClient(): unknown;
}

interface DereferenceStrategyOptions {
    readonly name: string;
}
declare abstract class DereferenceStrategy {
    readonly name: string;
    constructor({ name }: DereferenceStrategyOptions);
    abstract canDereference(file: File, options: ReferenceOptions): boolean;
    abstract dereference(file: File, options: ReferenceOptions): Promise<Element$1>;
}

interface BundleStrategyOptions {
    readonly name: string;
}
declare abstract class BundleStrategy {
    readonly name: string;
    constructor({ name }: BundleStrategyOptions);
    abstract canBundle(file: File, options: ReferenceOptions): boolean;
    abstract bundle(file: File, options: ReferenceOptions): Promise<ParseResultElement>;
}

interface ReferenceParseOptions {
    mediaType: string;
    parsers: Array<Parser>;
    parserOpts: Record<string, any>;
}
interface ReferenceResolveOptions {
    baseURI: string;
    resolvers: Array<Resolver>;
    resolverOpts: Record<string, any>;
    strategies: Array<ResolveStrategy>;
    strategyOpts: Record<string, any>;
    internal: boolean;
    external: boolean;
    maxDepth: number;
}
interface ReferenceDereferenceOptions {
    strategies: Array<DereferenceStrategy>;
    strategyOpts: Record<string, any>;
    refSet: null | ReferenceSet;
    maxDepth: number;
    circular: 'ignore' | 'replace' | 'error';
    circularReplacer: (ref: RefElement) => unknown;
    immutable: boolean;
}
interface ReferenceBundleOptions {
    strategies: Array<BundleStrategy>;
    refSet: null | ReferenceSet;
    maxDepth: number;
}
interface ReferenceOptions {
    readonly parse: ReferenceParseOptions;
    readonly resolve: ReferenceResolveOptions;
    readonly dereference: ReferenceDereferenceOptions;
    readonly bundle: ReferenceBundleOptions;
}
declare const defaultOptions: ReferenceOptions;

interface ResolveStrategyOptions {
    readonly name: string;
}
declare abstract class ResolveStrategy {
    readonly name: string;
    constructor({ name }: ResolveStrategyOptions);
    abstract canResolve(file: File, options: ReferenceOptions): boolean;
    abstract resolve(file: File, options: ReferenceOptions): Promise<ReferenceSet>;
}

declare class AncestorLineage<T extends Element> extends Array<Set<T>> {
    includesCycle(element: T): boolean;
    includes(searchElement: Set<T> | T, fromIndex?: number): boolean;
    findItem(predicate: (item: T) => boolean): T | undefined;
}

declare const merge: (lObj: ReferenceOptions, rObj: Record<string, any>) => ReferenceOptions;

declare class BundleError extends ApiDOMError {
}

declare class MaximumBundleDepthError extends BundleError {
}

declare class UnmatchedBundleStrategyError extends BundleError {
}

declare class DereferenceError extends ApiDOMError {
}

declare class EvaluationElementIdError extends ApiDOMError {
}

declare class JsonSchema$anchorError extends ApiDOMError {
}

declare class EvaluationJsonSchema$anchorError extends JsonSchema$anchorError {
}

declare class JsonSchemaUriError extends ApiDOMError {
}

declare class EvaluationJsonSchemaUriError extends JsonSchemaUriError {
}

declare class InvalidJsonSchema$anchorError extends JsonSchema$anchorError {
    constructor(anchor: string);
}

declare class MaximumDereferenceDepthError extends DereferenceError {
}

declare class ResolveError extends ApiDOMError {
}

declare class MaximumResolveDepthError extends ResolveError {
}

declare class ParseError extends ApiDOMError {
}

declare class ParserError extends ParseError {
}

declare class PluginError extends ApiDOMError {
    plugin: any;
    constructor(message: string, options: {
        cause?: Error;
        plugin: any;
    });
}

declare class ResolverError extends ResolveError {
}

declare class UnmatchedDereferenceStrategyError extends DereferenceError {
}

declare class UnmatchedResolveStrategyError extends ResolveError {
}

declare class UnmatchedResolverError extends ResolverError {
}

declare const readFile: (uri: string, options?: {}) => Promise<Buffer>;
declare const parse: (uri: string, options?: {}) => Promise<ParseResultElement>;
declare const resolve: (uri: string, options?: {}) => Promise<ReferenceSet>;
declare const resolveApiDOM: <T extends Element>(element: T, options?: {}) => Promise<ReferenceSet>;
declare const dereference: (uri: string, options?: {}) => Promise<ParseResultElement>;
declare const dereferenceApiDOM: <T extends Element>(element: T, options?: {}) => Promise<T>;
declare const bundle: (uri: string, options?: {}) => Promise<ParseResultElement>;

export { BundleError, BundleStrategy, type BundleStrategyOptions, AncestorLineage as DereferenceAncestorLineage, DereferenceError, DereferenceStrategy, type DereferenceStrategyOptions, EvaluationElementIdError, EvaluationJsonSchema$anchorError, EvaluationJsonSchemaUriError, File, type FileOptions, HTTPResolver, InvalidJsonSchema$anchorError, JsonSchema$anchorError, JsonSchemaUriError as JsonSchemaURIError, MaximumBundleDepthError, MaximumDereferenceDepthError, MaximumResolveDepthError, ParseError, Parser, ParserError, type ParserOptions, PluginError, Reference, type ReferenceOptions$1 as ReferenceOptions, ReferenceSet, type ReferenceSetOptions, ResolveError, ResolveStrategy, type ResolveStrategyOptions, Resolver, ResolverError, type ResolverOptions, UnmatchedBundleStrategyError, UnmatchedDereferenceStrategyError, UnmatchedResolveStrategyError, UnmatchedResolverError, bundle, dereference, dereferenceApiDOM, merge as mergeOptions, defaultOptions as options, parse, readFile, resolve, resolveApiDOM, url_d as url };
