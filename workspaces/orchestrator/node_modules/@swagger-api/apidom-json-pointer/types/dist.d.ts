import { ApiDOMStructuredError, ApiDOMErrorOptions } from '@swagger-api/apidom-error';
import { Element } from '@swagger-api/apidom-core';

declare class JsonPointerError extends ApiDOMStructuredError {
}

interface InvalidJsonPointerErrorOptions extends ApiDOMErrorOptions {
    readonly pointer: string;
}
declare class InvalidJsonPointerError extends JsonPointerError {
    readonly pointer: string;
    constructor(message?: string, structuredOptions?: InvalidJsonPointerErrorOptions);
}

interface CompilationJsonPointerErrorOptions extends ApiDOMErrorOptions {
    readonly tokens: string[];
}
declare class CompilationJsonPointerError extends JsonPointerError {
    readonly tokens: string[];
    constructor(message?: string, structuredOptions?: CompilationJsonPointerErrorOptions);
}

interface EvaluationJsonPointerErrorOptions<T extends Element> extends ApiDOMErrorOptions {
    readonly pointer: string;
    readonly tokens?: string[];
    readonly failedToken?: string;
    readonly failedTokenPosition?: number;
    readonly element: T;
}
declare class EvaluationJsonPointerError<T extends Element> extends JsonPointerError {
    readonly pointer: string;
    readonly tokens?: string[];
    readonly failedToken?: string;
    readonly failedTokenPosition?: number;
    readonly element: T;
    constructor(message?: string, structuredOptions?: EvaluationJsonPointerErrorOptions<T>);
}

declare const escape: (str: string) => string;

declare const unescape: (str: string) => string;

declare const parse: (pointer: string) => string[];
declare const uriToPointer: (uri: string) => string;

declare const compile: (tokens: string[]) => string;

declare const evaluate: <T extends Element>(pointer: string, element: T) => Element;

export { CompilationJsonPointerError, type CompilationJsonPointerErrorOptions, EvaluationJsonPointerError, type EvaluationJsonPointerErrorOptions, InvalidJsonPointerError, type InvalidJsonPointerErrorOptions, JsonPointerError, compile, escape, evaluate, parse, unescape, uriToPointer };
