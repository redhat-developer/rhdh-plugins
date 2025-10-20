import type { Options as AjvOpts } from 'ajv';
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { OpenAPIRouter, Request, ParsedRequest, Operation, UnknownParams } from './router';
import { OpenAPIValidator, ValidationResult, AjvCustomizer } from './validation';
export type Document = OpenAPIV3_1.Document | OpenAPIV3.Document;
export type PickVersionElement<D extends Document, V30, V31> = D extends OpenAPIV3_1.Document ? V31 : V30;
export type SecurityRequirement = OpenAPIV3_1.SecurityRequirementObject | OpenAPIV3.SecurityRequirementObject;
/**
 * Security / Authorization context for requests
 */
interface SecurityHandlerResults {
    [name: string]: any;
}
export interface SecurityContext extends SecurityHandlerResults {
    authorized: boolean;
}
/**
 * Passed context built for request. Passed as first argument for all handlers.
 */
export interface Context<RequestBody = any, Params = UnknownParams, Query = UnknownParams, Headers = UnknownParams, Cookies = UnknownParams, D extends Document = Document> {
    api: OpenAPIBackend<D>;
    request: ParsedRequest<RequestBody, Params, Query, Headers, Cookies>;
    operation: Operation<D>;
    validation: ValidationResult;
    security: SecurityHandlerResults;
    response: any;
}
/**
 * A handler for an operation with request Context and passed arguments from handleRequest
 */
export type Handler<RequestBody = any, Params = UnknownParams, Query = UnknownParams, Headers = UnknownParams, Cookies = UnknownParams, D extends Document = Document> = (context: Context<RequestBody, Params, Query, Headers, Cookies, D>, ...args: any[]) => any | Promise<any>;
/**
 * Map of operation handlers
 */
export type HandlerMap = {
    [operationId: string]: Handler | undefined;
};
export type BoolPredicate = (context: Context, ...args: any[]) => boolean;
/**
 * The different possibilities for set matching.
 *
 * @enum {string}
 */
export declare enum SetMatchType {
    Any = "any",
    Superset = "superset",
    Subset = "subset",
    Exact = "exact"
}
/**
 * Constructor options
 *
 * @export
 * @interface Options
 */
export interface Options<D extends Document = Document> {
    definition: D | string;
    apiRoot?: string;
    strict?: boolean;
    quick?: boolean;
    validate?: boolean | BoolPredicate;
    ajvOpts?: AjvOpts;
    customizeAjv?: AjvCustomizer;
    handlers?: HandlerMap & {
        notFound?: Handler;
        notImplemented?: Handler;
        validationFail?: Handler;
    };
    securityHandlers?: HandlerMap;
    ignoreTrailingSlashes?: boolean;
}
/**
 * Main class and the default export of the 'openapi-backend' module
 *
 * @export
 * @class OpenAPIBackend
 */
export declare class OpenAPIBackend<D extends Document = Document> {
    document: D;
    inputDocument: D | string;
    definition: D;
    apiRoot: string;
    initalized: boolean;
    strict: boolean;
    quick: boolean;
    validate: boolean | BoolPredicate;
    ignoreTrailingSlashes: boolean;
    ajvOpts: AjvOpts;
    customizeAjv: AjvCustomizer | undefined;
    handlers: HandlerMap;
    allowedHandlers: string[];
    securityHandlers: HandlerMap;
    router: OpenAPIRouter<D>;
    validator: OpenAPIValidator<D>;
    /**
     * Creates an instance of OpenAPIBackend.
     *
     * @param opts - constructor options
     * @param {D | string} opts.definition - the OpenAPI definition, file path or Document object
     * @param {string} opts.apiRoot - the root URI of the api. all paths are matched relative to apiRoot
     * @param {boolean} opts.strict - strict mode, throw errors or warn on OpenAPI spec validation errors (default: false)
     * @param {boolean} opts.quick - quick startup, attempts to optimise startup; might break things (default: false)
     * @param {boolean} opts.validate - whether to validate requests with Ajv (default: true)
     * @param {boolean} opts.ignoreTrailingSlashes - whether to ignore trailing slashes when routing (default: true)
     * @param {boolean} opts.ajvOpts - default ajv opts to pass to the validator
     * @param {{ [operationId: string]: Handler | ErrorHandler }} opts.handlers - Operation handlers to be registered
     * @memberof OpenAPIBackend
     */
    constructor(opts: Options<D>);
    /**
     * Initalizes OpenAPIBackend.
     *
     * 1. Loads and parses the OpenAPI document passed in constructor options
     * 2. Validates the OpenAPI document
     * 3. Builds validation schemas for all API operations
     * 4. Marks property `initalized` to true
     * 5. Registers all [Operation Handlers](#operation-handlers) passed in constructor options
     *
     * The init() method should be called right after creating a new instance of OpenAPIBackend
     *
     * @returns parent instance of OpenAPIBackend
     * @memberof OpenAPIBackend
     */
    init(): Promise<this>;
    /**
     * Loads the input document asynchronously and sets this.document
     *
     * @memberof OpenAPIBackend
     */
    loadDocument(): Promise<D>;
    /**
     * Handles a request
     * 1. Routing: Matches the request to an API operation
     * 2. Validation: Validates the request against the API operation schema
     * 3. Handling: Passes the request on to a registered handler
     *
     * @param {Request} req
     * @param {...any[]} handlerArgs
     * @returns {Promise} handler return value
     * @memberof OpenAPIBackend
     */
    handleRequest(req: Request, ...handlerArgs: any[]): Promise<any>;
    /**
     * Registers a handler for an operation
     *
     * @param {string} operationId
     * @param {Handler} handler
     * @memberof OpenAPIBackend
     */
    registerHandler(operationId: string, handler: Handler): void;
    /**
     * Registers multiple handlers
     *
     * @param {{ [operationId: string]: Handler }} handlers
     * @memberof OpenAPIBackend
     */
    register<Handlers extends HandlerMap = HandlerMap>(handlers: Handlers): void;
    /**
     * Registers a handler for an operation
     *
     * Alias for: registerHandler
     *
     * @param {string} operationId
     * @param {Handler} handler
     * @memberof OpenAPIBackend
     */
    register<OperationHandler = Handler>(operationId: string, handler: OperationHandler): void;
    /**
     * Registers a security handler for a security scheme
     *
     * @param {string} name - security scheme name
     * @param {Handler} handler - security handler
     * @memberof OpenAPIBackend
     */
    registerSecurityHandler(name: string, handler: Handler): void;
    /**
     * Mocks a response for an operation based on example or response schema
     *
     * @param {string} operationId - operationId of the operation for which to mock the response
     * @param {object} opts - (optional) options
     * @param {number} opts.responseStatus - (optional) the response code of the response to mock (default: 200)
     * @param {string} opts.mediaType - (optional) the media type of the response to mock (default: application/json)
     * @param {string} opts.example - (optional) the specific example to use (if operation has multiple examples)
     * @returns {{ status: number; mock: any }}
     * @memberof OpenAPIBackend
     */
    mockResponseForOperation(operationId: string, opts?: {
        code?: number;
        mediaType?: string;
        example?: string;
    }): {
        status: number;
        mock: any;
    };
    /**
     * Validates this.document, which is the parsed OpenAPI document. Throws an error if validation fails.
     *
     * @returns {D} parsed document
     * @memberof OpenAPIBackend
     */
    validateDefinition(): D;
    /**
     * Flattens operations into a simple array of Operation objects easy to work with
     *
     * Alias for: router.getOperations()
     *
     * @returns {Operation<D>[]}
     * @memberof OpenAPIBackend
     */
    getOperations(): Operation<D>[];
    /**
     * Gets a single operation based on operationId
     *
     * Alias for: router.getOperation(operationId)
     *
     * @param {string} operationId
     * @returns {Operation<D>}
     * @memberof OpenAPIBackend
     */
    getOperation(operationId: string): Operation<D> | undefined;
    /**
     * Matches a request to an API operation (router)
     *
     * Alias for: router.matchOperation(req)
     *
     * @param {Request} req
     * @returns {Operation<D>}
     * @memberof OpenAPIBackend
     */
    matchOperation(req: Request): Operation<D> | undefined;
    /**
     * Validates a request and returns the result.
     *
     * The method will first match the request to an API operation and use the pre-compiled Ajv validation schemas to
     * validate it.
     *
     * Alias for validator.validateRequest
     *
     * @param {Request} req - request to validate
     * @param {(Operation<D> | string)} [operation]
     * @returns {ValidationStatus}
     * @memberof OpenAPIBackend
     */
    validateRequest(req: Request, operation?: Operation<D> | string): ValidationResult;
    /**
     * Validates a response and returns the result.
     *
     * The method will use the pre-compiled Ajv validation schema to validate a request it.
     *
     * Alias for validator.validateResponse
     *
     * @param {*} res - response to validate
     * @param {(Operation<D> | string)} [operation]
     * @param {number} status
     * @returns {ValidationStatus}
     * @memberof OpenAPIBackend
     */
    validateResponse(res: any, operation: Operation<D> | string, statusCode?: number): ValidationResult;
    /**
     * Validates response headers and returns the result.
     *
     * The method will use the pre-compiled Ajv validation schema to validate a request it.
     *
     * Alias for validator.validateResponseHeaders
     *
     * @param {*} headers - response to validate
     * @param {(Operation<D> | string)} [operation]
     * @param {number} [opts.statusCode]
     * @param {SetMatchType} [opts.setMatchType] - one of 'any', 'superset', 'subset', 'exact'
     * @returns {ValidationStatus}
     * @memberof OpenAPIBackend
     */
    validateResponseHeaders(headers: any, operation: Operation<D> | string, opts?: {
        statusCode?: number;
        setMatchType?: SetMatchType;
    }): ValidationResult;
}
export {};
