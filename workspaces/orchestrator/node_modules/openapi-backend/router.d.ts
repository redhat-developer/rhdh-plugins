import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { PickVersionElement } from './backend';
type Document = OpenAPIV3_1.Document | OpenAPIV3.Document;
/**
 * OperationObject
 * @typedef {(OpenAPIV3_1.OperationObject | OpenAPIV3.OperationObject)} OperationObject
 */
/**
 * OAS Operation Object containing the path and method so it can be placed in a flat array of operations
 *
 * @export
 * @interface Operation
 * @extends {OperationObject}
 */
export type Operation<D extends Document = Document> = PickVersionElement<D, OpenAPIV3.OperationObject, OpenAPIV3_1.OperationObject> & {
    path: string;
    method: string;
};
export type AnyRequestBody = any;
export type UnknownParams = any;
export interface Request {
    method: string;
    path: string;
    headers: {
        [key: string]: string | string[];
    };
    query?: {
        [key: string]: string | string[];
    } | string;
    body?: AnyRequestBody;
}
export interface ParsedRequest<RequestBody = AnyRequestBody, Params = UnknownParams, Query = UnknownParams, Headers = UnknownParams, Cookies = UnknownParams> {
    method: string;
    path: string;
    requestBody: RequestBody;
    params: Params;
    query: Query;
    headers: Headers;
    cookies: Cookies;
    body?: AnyRequestBody;
}
/**
 * Class that handles routing
 *
 * @export
 * @class OpenAPIRouter
 */
export declare class OpenAPIRouter<D extends Document = Document> {
    definition: D;
    apiRoot: string;
    private ignoreTrailingSlashes;
    /**
     * Creates an instance of OpenAPIRouter
     *
     * @param opts - constructor options
     * @param {D} opts.definition - the OpenAPI definition, file path or Document object
     * @param {string} opts.apiRoot - the root URI of the api. all paths are matched relative to apiRoot
     * @memberof OpenAPIRouter
     */
    constructor(opts: {
        definition: D;
        apiRoot?: string;
        ignoreTrailingSlashes?: boolean;
    });
    /**
     * Matches a request to an API operation (router)
     *
     * @param {Request} req
     * @param {boolean} [strict] strict mode, throw error if operation is not found
     * @returns {Operation<D>}
     * @memberof OpenAPIRouter
     */
    matchOperation(req: Request): Operation<D> | undefined;
    matchOperation(req: Request, strict: boolean): Operation<D>;
    /**
     * Flattens operations into a simple array of Operation objects easy to work with
     *
     * @returns {Operation<D>[]}
     * @memberof OpenAPIRouter
     */
    getOperations(): Operation<D>[];
    /**
     * Gets a single operation based on operationId
     *
     * @param {string} operationId
     * @returns {Operation<D>}
     * @memberof OpenAPIRouter
     */
    getOperation(operationId: string): Operation<D> | undefined;
    /**
     * Normalises request:
     * - http method to lowercase
     * - remove path leading slash
     * - remove path query string
     *
     * @export
     * @param {Request} req
     * @returns {Request}
     */
    normalizeRequest(req: Request): Request;
    /**
     * Normalises path for matching: strips apiRoot prefix from the path
     *
     * Also depending on configuration, will remove trailing slashes
     *
     * @export
     * @param {string} path
     * @returns {string}
     */
    normalizePath(pathInput: string): string;
    /**
     * Parses and normalizes a request
     * - parse json body
     * - parse query string
     * - parse cookies from headers
     * - parse path params based on uri template
     *
     * @export
     * @param {Request} req
     * @param {Operation<D>} [operation]
     * @param {string} [patbh]
     * @returns {ParsedRequest}
     */
    parseRequest(req: Request, operation?: Operation<D>): ParsedRequest;
}
export {};
