import Ajv, { Options as AjvOpts, ErrorObject, ValidateFunction } from 'ajv';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { OpenAPIRouter, Request, Operation } from './router';
import { SetMatchType } from './backend';
type Document = OpenAPIV3_1.Document | OpenAPIV3.Document;
/**
 * The output object for validationRequest. Contains the results for validation
 *
 * @export
 * @interface ValidationStatus
 */
export interface ValidationResult {
    valid: boolean;
    errors?: ErrorObject[] | null;
}
interface ResponseHeadersValidateFunctionMap {
    [statusCode: string]: {
        [setMatchType: string]: ValidateFunction;
    };
}
interface StatusBasedResponseValidatorsFunctionMap {
    [statusCode: string]: ValidateFunction;
}
export declare enum ValidationContext {
    RequestBody = "requestBodyValidator",
    Params = "paramsValidator",
    Response = "responseValidator",
    ResponseHeaders = "responseHeadersValidator"
}
export type AjvCustomizer = (originalAjv: Ajv, ajvOpts: AjvOpts, validationContext: ValidationContext) => Ajv;
/**
 * Class that handles JSON schema validation
 *
 * @export
 * @class OpenAPIValidator
 */
export declare class OpenAPIValidator<D extends Document = Document> {
    definition: D;
    ajvOpts: AjvOpts;
    lazyCompileValidators: boolean;
    customizeAjv: AjvCustomizer | undefined;
    requestValidators: {
        [operationId: string]: ValidateFunction[] | null;
    };
    responseValidators: {
        [operationId: string]: ValidateFunction | null;
    };
    statusBasedResponseValidators: {
        [operationId: string]: StatusBasedResponseValidatorsFunctionMap | null;
    };
    responseHeadersValidators: {
        [operationId: string]: ResponseHeadersValidateFunctionMap | null;
    };
    router: OpenAPIRouter<D>;
    /**
     * Creates an instance of OpenAPIValidation
     *
     * @param opts - constructor options
     * @param {Document | string} opts.definition - the OpenAPI definition, file path or Document object
     * @param {object} opts.ajvOpts - default ajv constructor opts (default: { unknownFormats: 'ignore' })
     * @param {OpenAPIRouter} opts.router - passed instance of OpenAPIRouter. Will create own child if no passed
     * @param {boolean} opts.lazyCompileValidators - skips precompiling Ajv validators and compiles only when needed
     * @memberof OpenAPIRequestValidator
     */
    constructor(opts: {
        definition: D;
        ajvOpts?: AjvOpts;
        router?: OpenAPIRouter<D>;
        lazyCompileValidators?: boolean;
        customizeAjv?: AjvCustomizer;
    });
    /**
     * Pre-compiles Ajv validators for requests of all api operations
     *
     * @memberof OpenAPIValidator
     */
    preCompileRequestValidators(): void;
    /**
     * Pre-compiles Ajv validators for responses of all api operations
     *
     * @memberof OpenAPIValidator
     */
    preCompileResponseValidators(): void;
    /**
     * Pre-compiles Ajv validators for response headers of all api operations
     *
     * @memberof OpenAPIValidator
     */
    preCompileResponseHeaderValidators(): void;
    /**
     * Validates a request against prebuilt Ajv validators and returns the validation result.
     *
     * The method will first match the request to an API operation and use the pre-compiled Ajv validation schema to
     * validate it.
     *
     * @param {Request} req - request to validate
     * @param {(Operation<D> | string)} operation - operation to validate against
     * @returns {ValidationResult}
     * @memberof OpenAPIRequestValidator
     */
    validateRequest(req: Request, operation?: Operation<D> | string): ValidationResult;
    /**
     * Validates a response against a prebuilt Ajv validator and returns the result
     *
     * @param {*} res
     * @param {(Operation<D> | string)} operation
     * @package {number} [statusCode]
     * @returns {ValidationResult}
     * @memberof OpenAPIRequestValidator
     */
    validateResponse(res: any, operation: Operation<D> | string, statusCode?: number): ValidationResult;
    /**
     * Validates response headers against a prebuilt Ajv validator and returns the result
     *
     * @param {*} headers
     * @param {(Operation<D> | string)} operation
     * @param {number} [opts.statusCode]
     * @param {SetMatchType} [opts.setMatchType] - one of 'any', 'superset', 'subset', 'exact'
     * @returns {ValidationResult}
     * @memberof OpenAPIRequestValidator
     */
    validateResponseHeaders(headers: any, operation: Operation<D> | string, opts?: {
        statusCode?: number;
        setMatchType?: SetMatchType;
    }): ValidationResult;
    /**
     * Get an array of request validator functions for an operation by operationId
     *
     * @param {string} operationId
     * @returns {*}  {(ValidateFunction[] | null)}
     * @memberof OpenAPIValidator
     */
    getRequestValidatorsForOperation(operationId: string): ValidateFunction<unknown>[];
    /**
     * Compiles a schema with Ajv instance and handles circular references.
     *
     * @param ajv The Ajv instance
     * @param schema The schema to compile
     */
    private static compileSchema;
    /**
     * Produces a deep clone which replaces object reference cycles with JSONSchema refs.
     * This function is based on [cycle.js]{@link https://github.com/douglascrockford/JSON-js/blob/master/cycle.js}, which was referred by
     * the [MDN]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value}.
     * @param object An object for which to remove cycles
     */
    private static decycle;
    /**
     * Builds Ajv request validation functions for an operation and registers them to requestValidators
     *
     * @param {Operation<D>} operation
     * @returns {*}  {(ValidateFunction[] | null)}
     * @memberof OpenAPIValidator
     */
    buildRequestValidatorsForOperation(operation: Operation<D>): ValidateFunction[] | null;
    /**
     * Get response validator function for an operation by operationId
     *
     * @param {string} operationId
     * @returns {*}  {(ValidateFunction | null)}
     * @memberof OpenAPIValidator
     */
    getResponseValidatorForOperation(operationId: string): ValidateFunction<unknown>;
    /**
     * Builds an ajv response validator function for an operation and registers it to responseValidators
     *
     * @param {Operation<D>} operation
     * @returns {*}  {(ValidateFunction | null)}
     * @memberof OpenAPIValidator
     */
    buildResponseValidatorForOperation(operation: Operation<D>): ValidateFunction | null;
    /**
     * Get response validator function for an operation by operationId
     *
     * @param {string} operationId
     * @returns {*}  {(StatusBasedResponseValidatorsFunctionMap | null)}
     * @memberof OpenAPIRequestValidator
     */
    getStatusBasedResponseValidatorForOperation(operationId: string): StatusBasedResponseValidatorsFunctionMap;
    /**
     * Builds an ajv response validator function for an operation and registers it to responseHeadersValidators
     *
     * @param {Operation<D>} operation
     * @returns {*}  {(StatusBasedResponseValidatorsFunctionMap | null)}
     * @memberof OpenAPIValidator
     */
    buildStatusBasedResponseValidatorForOperation(operation: Operation<D>): StatusBasedResponseValidatorsFunctionMap | null;
    /**
     * Get response validator function for an operation by operationId
     *
     * @param {string} operationId
     * @returns {*}  {(ResponseHeadersValidateFunctionMap | null)}
     * @memberof OpenAPIRequestValidator
     */
    getResponseHeadersValidatorForOperation(operationId: string): ResponseHeadersValidateFunctionMap;
    /**
     * Builds an ajv response validator function for an operation and returns it
     *
     * @param {Operation<D>} operation
     * @returns {*}  {(ResponseHeadersValidateFunctionMap | null)}
     * @memberof OpenAPIValidator
     */
    buildResponseHeadersValidatorForOperation(operation: Operation<D>): ResponseHeadersValidateFunctionMap | null;
    /**
     * Get Ajv options
     *
     * @param {ValidationContext} validationContext
     * @param {AjvOpts} [opts={}]
     * @returns Ajv
     * @memberof OpenAPIValidator
     */
    getAjv(validationContext: ValidationContext, opts?: AjvOpts): Ajv;
}
export {};
