interface ApiDOMErrorOptions extends ErrorOptions {
  readonly cause?: unknown;
  readonly [key: string]: unknown;
}

declare class ApiDOMError extends Error {
    static [Symbol.hasInstance](instance: unknown): boolean;
    constructor(message?: string, options?: ApiDOMErrorOptions);
}

declare class ApiDOMAggregateError extends AggregateError {
    constructor(errors: Iterable<unknown>, message?: string, options?: ApiDOMErrorOptions);
}

declare class ApiDOMStructuredError extends ApiDOMError {
    constructor(message?: string, structuredOptions?: ApiDOMErrorOptions);
}

declare class UnsupportedOperationError extends ApiDOMError {
}

declare class NotImplementedError extends UnsupportedOperationError {
}

export { ApiDOMAggregateError, ApiDOMError, type ApiDOMErrorOptions, ApiDOMStructuredError, NotImplementedError, UnsupportedOperationError };
