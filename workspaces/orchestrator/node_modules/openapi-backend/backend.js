"use strict";
// library code, any is fine
/* eslint-disable @typescript-eslint/no-explicit-any */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAPIBackend = exports.SetMatchType = void 0;
const _ = __importStar(require("lodash"));
const openapi_schema_validator_1 = __importDefault(require("openapi-schema-validator"));
const refparser_1 = require("./refparser");
const dereference_json_schema_1 = require("dereference-json-schema");
const mock_json_schema_1 = require("mock-json-schema");
const router_1 = require("./router");
const validation_1 = require("./validation");
const utils_1 = __importDefault(require("./utils"));
/**
 * The different possibilities for set matching.
 *
 * @enum {string}
 */
var SetMatchType;
(function (SetMatchType) {
    SetMatchType["Any"] = "any";
    SetMatchType["Superset"] = "superset";
    SetMatchType["Subset"] = "subset";
    SetMatchType["Exact"] = "exact";
})(SetMatchType || (exports.SetMatchType = SetMatchType = {}));
/**
 * Main class and the default export of the 'openapi-backend' module
 *
 * @export
 * @class OpenAPIBackend
 */
class OpenAPIBackend {
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
    constructor(opts) {
        var _a, _b;
        this.allowedHandlers = [
            '404',
            'notFound',
            '405',
            'methodNotAllowed',
            '501',
            'notImplemented',
            '400',
            'validationFail',
            'unauthorizedHandler',
            'postResponseHandler',
        ];
        const optsWithDefaults = {
            apiRoot: '/',
            validate: true,
            strict: false,
            quick: false,
            ignoreTrailingSlashes: true,
            handlers: {},
            securityHandlers: {},
            ...opts,
        };
        this.apiRoot = (_a = optsWithDefaults.apiRoot) !== null && _a !== void 0 ? _a : '/';
        this.inputDocument = optsWithDefaults.definition;
        this.strict = !!optsWithDefaults.strict;
        this.quick = !!optsWithDefaults.quick;
        this.validate = !!optsWithDefaults.validate;
        this.ignoreTrailingSlashes = !!optsWithDefaults.ignoreTrailingSlashes;
        this.handlers = { ...optsWithDefaults.handlers }; // Copy to avoid mutating passed object
        this.securityHandlers = { ...optsWithDefaults.securityHandlers }; // Copy to avoid mutating passed object
        this.ajvOpts = (_b = optsWithDefaults.ajvOpts) !== null && _b !== void 0 ? _b : {};
        this.customizeAjv = optsWithDefaults.customizeAjv;
    }
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
    async init() {
        try {
            // parse the document
            if (this.quick) {
                // in quick mode we don't care when the document is ready
                this.loadDocument();
            }
            else {
                await this.loadDocument();
            }
            if (!this.quick) {
                // validate the document
                this.validateDefinition();
            }
            // dereference the document into definition (make sure not to copy)
            if (typeof this.inputDocument === 'string') {
                this.definition = (await (0, refparser_1.dereference)(this.inputDocument));
            }
            else if (this.quick && typeof this.inputDocument === 'object') {
                // use sync dereference in quick mode
                this.definition = (0, dereference_json_schema_1.dereferenceSync)(this.inputDocument);
            }
            else {
                this.definition = (await (0, refparser_1.dereference)(this.document || this.inputDocument));
            }
        }
        catch (err) {
            if (this.strict) {
                // in strict-mode, fail hard and re-throw the error
                throw err;
            }
            else {
                // just emit a warning about the validation errors
                console.warn(err);
            }
        }
        // initalize router with dereferenced definition
        this.router = new router_1.OpenAPIRouter({
            definition: this.definition,
            apiRoot: this.apiRoot,
            ignoreTrailingSlashes: this.ignoreTrailingSlashes,
        });
        // initalize validator with dereferenced definition
        if (this.validate !== false) {
            this.validator = new validation_1.OpenAPIValidator({
                definition: this.definition,
                ajvOpts: this.ajvOpts,
                customizeAjv: this.customizeAjv,
                router: this.router,
                lazyCompileValidators: Boolean(this.quick), // optimise startup by lazily compiling Ajv validators
            });
        }
        // we are initalized
        this.initalized = true;
        // register all handlers
        if (this.handlers) {
            this.register(this.handlers);
        }
        // register all security handlers
        if (this.securityHandlers) {
            for (const [name, handler] of Object.entries(this.securityHandlers)) {
                if (handler) {
                    this.registerSecurityHandler(name, handler);
                }
            }
        }
        // return this instance
        return this;
    }
    /**
     * Loads the input document asynchronously and sets this.document
     *
     * @memberof OpenAPIBackend
     */
    async loadDocument() {
        this.document = (await (0, refparser_1.parse)(this.inputDocument));
        return this.document;
    }
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
    async handleRequest(req, ...handlerArgs) {
        if (!this.initalized) {
            // auto-initalize if not yet initalized
            await this.init();
        }
        // initalize context object with a reference to this OpenAPIBackend instance
        const context = { api: this };
        // handle request with correct handler
        const response = await (async () => {
            // parse request
            context.request = this.router.parseRequest(req);
            // match operation (routing)
            try {
                context.operation = this.router.matchOperation(req, true);
            }
            catch (err) {
                let handler = this.handlers['404'] || this.handlers['notFound'];
                if (err instanceof Error && err.message.startsWith('405')) {
                    // 405 method not allowed
                    handler = this.handlers['405'] || this.handlers['methodNotAllowed'] || handler;
                }
                if (!handler) {
                    throw err;
                }
                return handler(context, ...handlerArgs);
            }
            const operationId = context.operation.operationId;
            // parse request again now with matched operation
            context.request = this.router.parseRequest(req, context.operation);
            // get security requirements for the matched operation
            // global requirements are already included in the router
            const securityRequirements = context.operation.security || [];
            const securitySchemes = _.flatMap(securityRequirements, _.keys);
            // run registered security handlers for all security requirements
            const securityHandlerResults = {};
            await Promise.all(securitySchemes.map(async (name) => {
                securityHandlerResults[name] = undefined;
                if (this.securityHandlers[name]) {
                    const securityHandler = this.securityHandlers[name];
                    // return a promise that will set the security handler result
                    return await Promise.resolve()
                        .then(() => securityHandler(context, ...handlerArgs))
                        .then((result) => {
                        securityHandlerResults[name] = result;
                    })
                        // save rejected error as result, if thrown
                        .catch((error) => {
                        securityHandlerResults[name] = { error };
                    });
                }
                else {
                    // if no handler is found for scheme, set to undefined
                    securityHandlerResults[name] = undefined;
                }
            }));
            // auth logic
            const requirementsSatisfied = securityRequirements.map((requirementObject) => {
                /*
                 * Security Requirement Objects that contain multiple schemes require
                 * that all schemes MUST be satisfied for a request to be authorized.
                 */
                for (const requirement of Object.keys(requirementObject)) {
                    const requirementResult = securityHandlerResults[requirement];
                    // falsy return values are treated as auth fail
                    if (Boolean(requirementResult) === false) {
                        return false;
                    }
                    // handle error object passed earlier
                    if (typeof requirementResult === 'object' &&
                        Object.keys(requirementResult).includes('error') &&
                        Object.keys(requirementResult).length === 1) {
                        return false;
                    }
                }
                return true;
            });
            /*
             * When a list of Security Requirement Objects is defined on the Open API
             * object or Operation Object, only one of Security Requirement Objects
             * in the list needs to be satisfied to authorize the request.
             */
            const authorized = requirementsSatisfied.some((securityResult) => securityResult === true);
            // add the results and authorized state to the context object
            context.security = {
                authorized,
                ...securityHandlerResults,
            };
            // call unauthorizedHandler handler if auth fails
            if (!authorized && securityRequirements.length > 0) {
                const unauthorizedHandler = this.handlers['unauthorizedHandler'];
                if (unauthorizedHandler) {
                    return unauthorizedHandler(context, ...handlerArgs);
                }
            }
            // check whether this request should be validated
            const validate = typeof this.validate === 'function'
                ? this.validate(context, ...handlerArgs)
                : Boolean(this.validate);
            // validate request
            const validationFailHandler = this.handlers['validationFail'];
            if (validate) {
                context.validation = this.validator.validateRequest(req, context.operation);
                if (context.validation.errors) {
                    // 400 request validation fail
                    if (validationFailHandler) {
                        return validationFailHandler(context, ...handlerArgs);
                    }
                    // if no validation handler is specified, just ignore it and proceed to route handler
                }
            }
            // get operation handler
            const routeHandler = this.handlers[operationId];
            if (!routeHandler) {
                // 501 not implemented
                const notImplementedHandler = this.handlers['501'] || this.handlers['notImplemented'];
                if (!notImplementedHandler) {
                    throw Error(`501-notImplemented: ${operationId} no handler registered`);
                }
                return notImplementedHandler(context, ...handlerArgs);
            }
            // handle route
            return routeHandler(context, ...handlerArgs);
        }).bind(this)();
        // post response handler
        const postResponseHandler = this.handlers['postResponseHandler'];
        if (postResponseHandler) {
            // pass response to postResponseHandler
            context.response = response;
            return postResponseHandler(context, ...handlerArgs);
        }
        // return response
        return response;
    }
    /**
     * Registers a handler for an operation
     *
     * @param {string} operationId
     * @param {Handler} handler
     * @memberof OpenAPIBackend
     */
    registerHandler(operationId, handler) {
        // make sure we are registering a function and not anything else
        if (typeof handler !== 'function') {
            throw new Error('Handler should be a function');
        }
        // if initalized, check that operation matches an operationId or is one of our allowed handlers
        if (this.initalized) {
            const operation = this.router.getOperation(operationId);
            if (!operation && !_.includes(this.allowedHandlers, operationId)) {
                const err = `Unknown operationId ${operationId}`;
                // in strict mode, throw Error, otherwise just emit a warning
                if (this.strict) {
                    throw new Error(`${err}. Refusing to register handler`);
                }
                else {
                    console.warn(err);
                }
            }
        }
        // register the handler
        this.handlers[operationId] = handler;
    }
    /**
     * Overloaded register() implementation
     *
     * @param {...any[]} args
     * @memberof OpenAPIBackend
     */
    register(...args) {
        if (typeof args[0] === 'string') {
            // register a single handler
            const operationId = args[0];
            const handler = args[1];
            this.registerHandler(operationId, handler);
        }
        else {
            // register multiple handlers
            const handlers = args[0];
            for (const operationId in handlers) {
                if (handlers[operationId]) {
                    this.registerHandler(operationId, handlers[operationId]);
                }
            }
        }
    }
    /**
     * Registers a security handler for a security scheme
     *
     * @param {string} name - security scheme name
     * @param {Handler} handler - security handler
     * @memberof OpenAPIBackend
     */
    registerSecurityHandler(name, handler) {
        var _a;
        // make sure we are registering a function and not anything else
        if (typeof handler !== 'function') {
            throw new Error('Security handler should be a function');
        }
        // if initialized, check that operation matches a security scheme
        if (this.initalized) {
            const securitySchemes = ((_a = this.definition.components) === null || _a === void 0 ? void 0 : _a.securitySchemes) || {};
            if (!securitySchemes[name]) {
                const err = `Unknown security scheme ${name}`;
                // in strict mode, throw Error, otherwise just emit a warning
                if (this.strict) {
                    throw new Error(`${err}. Refusing to register security handler`);
                }
                else {
                    console.warn(err);
                }
            }
        }
        // register the handler
        this.securityHandlers[name] = handler;
    }
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
    mockResponseForOperation(operationId, opts = {}) {
        let status = 200;
        const defaultMock = {};
        const operation = this.router.getOperation(operationId);
        if (!operation || !operation.responses) {
            return { status, mock: defaultMock };
        }
        // resolve status code
        const { responses } = operation;
        let response;
        if (opts.code && responses[opts.code]) {
            // 1. check for provided code opt (default: 200)
            status = Number(opts.code);
            response = responses[opts.code];
        }
        else {
            // 2. check for a default response
            const res = utils_1.default.findDefaultStatusCodeMatch(responses);
            status = res.status;
            response = res.res;
        }
        if (!response || !response.content) {
            return { status, mock: defaultMock };
        }
        const { content } = response;
        // resolve media type
        // 1. check for mediaType opt in content (default: application/json)
        // 2. pick first media type in content
        const mediaType = opts.mediaType || 'application/json';
        const mediaResponse = content[mediaType] || content[Object.keys(content)[0]];
        if (!mediaResponse) {
            return { status, mock: defaultMock };
        }
        const { examples, schema } = mediaResponse;
        // if example argument was provided, locate and return its value
        if (opts.example && examples) {
            const exampleObject = examples[opts.example];
            if (exampleObject && exampleObject.value) {
                return { status, mock: exampleObject.value };
            }
        }
        // if operation has an example, return its value
        if (mediaResponse.example) {
            return { status, mock: mediaResponse.example };
        }
        // pick the first example from examples
        if (examples) {
            const exampleObject = examples[Object.keys(examples)[0]];
            return { status, mock: exampleObject.value };
        }
        // mock using json schema
        if (schema) {
            return { status, mock: (0, mock_json_schema_1.mock)(schema) };
        }
        // we should never get here, schema or an example must be provided
        return { status, mock: defaultMock };
    }
    /**
     * Validates this.document, which is the parsed OpenAPI document. Throws an error if validation fails.
     *
     * @returns {D} parsed document
     * @memberof OpenAPIBackend
     */
    validateDefinition() {
        const validateOpenAPI = new openapi_schema_validator_1.default({ version: 3 });
        const { errors } = validateOpenAPI.validate(this.document);
        if (errors.length) {
            const prettyErrors = JSON.stringify(errors, null, 2);
            throw new Error(`Document is not valid OpenAPI. ${errors.length} validation errors:\n${prettyErrors}`);
        }
        return this.document;
    }
    /**
     * Flattens operations into a simple array of Operation objects easy to work with
     *
     * Alias for: router.getOperations()
     *
     * @returns {Operation<D>[]}
     * @memberof OpenAPIBackend
     */
    getOperations() {
        return this.router.getOperations();
    }
    /**
     * Gets a single operation based on operationId
     *
     * Alias for: router.getOperation(operationId)
     *
     * @param {string} operationId
     * @returns {Operation<D>}
     * @memberof OpenAPIBackend
     */
    getOperation(operationId) {
        return this.router.getOperation(operationId);
    }
    /**
     * Matches a request to an API operation (router)
     *
     * Alias for: router.matchOperation(req)
     *
     * @param {Request} req
     * @returns {Operation<D>}
     * @memberof OpenAPIBackend
     */
    matchOperation(req) {
        return this.router.matchOperation(req);
    }
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
    validateRequest(req, operation) {
        return this.validator.validateRequest(req, operation);
    }
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
    validateResponse(res, operation, statusCode) {
        return this.validator.validateResponse(res, operation, statusCode);
    }
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
    validateResponseHeaders(headers, operation, opts) {
        return this.validator.validateResponseHeaders(headers, operation, opts);
    }
}
exports.OpenAPIBackend = OpenAPIBackend;
//# sourceMappingURL=backend.js.map