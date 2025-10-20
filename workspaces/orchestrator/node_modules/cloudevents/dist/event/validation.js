"use strict";
/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidType = exports.asData = exports.isJsonContentType = exports.clone = exports.asBase64 = exports.base64AsBinary = exports.asBuffer = exports.isBuffer = exports.isBase64 = exports.equalsOrThrow = exports.isStringOrObjectOrThrow = exports.isDefinedOrThrow = exports.isStringOrThrow = exports.isBinary = exports.isDate = exports.isInteger = exports.isBoolean = exports.isDefined = exports.isObject = exports.isString = exports.ValidationError = void 0;
const globalThisPolyfill = (function () {
    try {
        return globalThis;
    }
    catch (e) {
        try {
            return self;
        }
        catch (e) {
            return global;
        }
    }
}());
/**
 * An Error class that will be thrown when a CloudEvent
 * cannot be properly validated against a specification.
 */
class ValidationError extends TypeError {
    constructor(message, errors) {
        const messageString = errors instanceof Array
            ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                errors?.reduce((accum, err) => accum.concat(`
  ${err instanceof Object ? JSON.stringify(err) : err}`), message)
            : message;
        super(messageString);
        this.errors = errors ? errors : [];
    }
}
exports.ValidationError = ValidationError;
const isString = (v) => typeof v === "string";
exports.isString = isString;
const isObject = (v) => typeof v === "object";
exports.isObject = isObject;
const isDefined = (v) => v !== null && typeof v !== "undefined";
exports.isDefined = isDefined;
const isBoolean = (v) => typeof v === "boolean";
exports.isBoolean = isBoolean;
const isInteger = (v) => Number.isInteger(v);
exports.isInteger = isInteger;
const isDate = (v) => v instanceof Date;
exports.isDate = isDate;
const isBinary = (v) => ArrayBuffer.isView(v);
exports.isBinary = isBinary;
const isStringOrThrow = (v, t) => (0, exports.isString)(v)
    ? true
    : (() => {
        throw t;
    })();
exports.isStringOrThrow = isStringOrThrow;
const isDefinedOrThrow = (v, t) => (0, exports.isDefined)(v)
    ? true
    : (() => {
        throw t;
    })();
exports.isDefinedOrThrow = isDefinedOrThrow;
const isStringOrObjectOrThrow = (v, t) => (0, exports.isString)(v)
    ? true
    : (0, exports.isObject)(v)
        ? true
        : (() => {
            throw t;
        })();
exports.isStringOrObjectOrThrow = isStringOrObjectOrThrow;
const equalsOrThrow = (v1, v2, t) => v1 === v2
    ? true
    : (() => {
        throw t;
    })();
exports.equalsOrThrow = equalsOrThrow;
const isBase64 = (value) => Buffer.from(value, "base64").toString("base64") === value;
exports.isBase64 = isBase64;
const isBuffer = (value) => value instanceof Buffer;
exports.isBuffer = isBuffer;
const asBuffer = (value) => (0, exports.isBinary)(value)
    ? Buffer.from(value)
    : (0, exports.isBuffer)(value)
        ? value
        : (() => {
            throw new TypeError("is not buffer or a valid binary");
        })();
exports.asBuffer = asBuffer;
const base64AsBinary = (base64String) => {
    const toBinaryString = (base64Str) => globalThisPolyfill.atob
        ? globalThisPolyfill.atob(base64Str)
        : Buffer.from(base64Str, "base64").toString("binary");
    return Uint8Array.from(toBinaryString(base64String), (c) => c.charCodeAt(0));
};
exports.base64AsBinary = base64AsBinary;
const asBase64 = (value) => (0, exports.asBuffer)(value).toString("base64");
exports.asBase64 = asBase64;
const clone = (o) => JSON.parse(JSON.stringify(o));
exports.clone = clone;
const isJsonContentType = (contentType) => contentType && contentType.match(/(json)/i);
exports.isJsonContentType = isJsonContentType;
const asData = (data, contentType) => {
    // pattern matching alike
    const maybeJson = (0, exports.isString)(data) && !(0, exports.isBase64)(data) && (0, exports.isJsonContentType)(contentType) ? JSON.parse(data) : data;
    return (0, exports.isBinary)(maybeJson) ? (0, exports.asBase64)(maybeJson) : maybeJson;
};
exports.asData = asData;
const isValidType = (v) => (0, exports.isBoolean)(v) || (0, exports.isInteger)(v) || (0, exports.isString)(v) || (0, exports.isDate)(v) || (0, exports.isBinary)(v) || (0, exports.isObject)(v);
exports.isValidType = isValidType;
