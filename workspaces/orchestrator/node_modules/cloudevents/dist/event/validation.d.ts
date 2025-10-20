/// <reference types="node" />
import { ErrorObject } from "ajv";
export declare type TypeArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array;
/**
 * An Error class that will be thrown when a CloudEvent
 * cannot be properly validated against a specification.
 */
export declare class ValidationError extends TypeError {
    errors?: string[] | ErrorObject[] | null;
    constructor(message: string, errors?: string[] | ErrorObject[] | null);
}
export declare const isString: (v: unknown) => boolean;
export declare const isObject: (v: unknown) => boolean;
export declare const isDefined: (v: unknown) => boolean;
export declare const isBoolean: (v: unknown) => boolean;
export declare const isInteger: (v: unknown) => boolean;
export declare const isDate: (v: unknown) => v is Date;
export declare const isBinary: (v: unknown) => boolean;
export declare const isStringOrThrow: (v: unknown, t: Error) => boolean;
export declare const isDefinedOrThrow: (v: unknown, t: Error) => boolean;
export declare const isStringOrObjectOrThrow: (v: unknown, t: Error) => boolean;
export declare const equalsOrThrow: (v1: unknown, v2: unknown, t: Error) => boolean;
export declare const isBase64: (value: unknown) => boolean;
export declare const isBuffer: (value: unknown) => boolean;
export declare const asBuffer: (value: string | Buffer | TypeArray) => Buffer;
export declare const base64AsBinary: (base64String: string) => Uint8Array;
export declare const asBase64: (value: string | Buffer | TypeArray) => string;
export declare const clone: (o: Record<string, unknown>) => Record<string, unknown>;
export declare const isJsonContentType: (contentType: string) => "" | RegExpMatchArray | null;
export declare const asData: (data: unknown, contentType: string) => string;
export declare const isValidType: (v: boolean | number | string | Date | TypeArray | unknown) => boolean;
