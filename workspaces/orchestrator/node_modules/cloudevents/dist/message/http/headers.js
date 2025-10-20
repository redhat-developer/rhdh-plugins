"use strict";
/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.v03structuredParsers = exports.v03binaryParsers = exports.v03headerMap = exports.v1structuredParsers = exports.v1binaryParsers = exports.v1headerMap = exports.sanitize = exports.headersFor = exports.requiredHeaders = exports.allowedContentTypes = void 0;
const parsers_1 = require("../../parsers");
const cloudevent_1 = require("../../event/cloudevent");
const constants_1 = __importDefault(require("../../constants"));
exports.allowedContentTypes = [constants_1.default.DEFAULT_CONTENT_TYPE, constants_1.default.MIME_JSON, constants_1.default.MIME_OCTET_STREAM];
exports.requiredHeaders = [
    constants_1.default.CE_HEADERS.ID,
    constants_1.default.CE_HEADERS.SOURCE,
    constants_1.default.CE_HEADERS.TYPE,
    constants_1.default.CE_HEADERS.SPEC_VERSION,
];
/**
 * Returns the HTTP headers that will be sent for this event when the HTTP transmission
 * mode is "binary". Events sent over HTTP in structured mode only have a single CE header
 * and that is "ce-id", corresponding to the event ID.
 * @param {CloudEvent} event a CloudEvent
 * @returns {Object} the headers that will be sent for the event
 */
function headersFor(event) {
    const headers = {};
    let headerMap;
    if (event.specversion === cloudevent_1.V1) {
        headerMap = exports.v1headerMap;
    }
    else {
        headerMap = exports.v03headerMap;
    }
    // iterate over the event properties - generate a header for each
    Object.getOwnPropertyNames(event).forEach((property) => {
        const value = event[property];
        if (value !== undefined) {
            const map = headerMap[property];
            if (map) {
                headers[map.name] = map.parser.parse(value);
            }
            else if (property !== constants_1.default.DATA_ATTRIBUTE && property !== `${constants_1.default.DATA_ATTRIBUTE}_base64`) {
                headers[`${constants_1.default.EXTENSIONS_PREFIX}${property}`] = value;
            }
        }
    });
    // Treat time specially, since it's handled with getters and setters in CloudEvent
    if (event.time) {
        headers[constants_1.default.CE_HEADERS.TIME] = new Date(event.time).toISOString();
    }
    return headers;
}
exports.headersFor = headersFor;
/**
 * Sanitizes incoming headers by lowercasing them and potentially removing
 * encoding from the content-type header.
 * @param {Headers} headers HTTP headers as key/value pairs
 * @returns {Headers} the sanitized headers
 */
function sanitize(headers) {
    const sanitized = {};
    Array.from(Object.keys(headers))
        .filter((header) => Object.hasOwnProperty.call(headers, header))
        .forEach((header) => (sanitized[header.toLowerCase()] = headers[header]));
    return sanitized;
}
exports.sanitize = sanitize;
function parser(name, parser = new parsers_1.PassThroughParser()) {
    return { name: name, parser: parser };
}
/**
 * A utility Map used to retrieve the header names for a CloudEvent
 * using the CloudEvent getter function.
 */
exports.v1headerMap = Object.freeze({
    [constants_1.default.CE_ATTRIBUTES.CONTENT_TYPE]: parser(constants_1.default.HEADER_CONTENT_TYPE),
    [constants_1.default.CE_ATTRIBUTES.SUBJECT]: parser(constants_1.default.CE_HEADERS.SUBJECT),
    [constants_1.default.CE_ATTRIBUTES.TYPE]: parser(constants_1.default.CE_HEADERS.TYPE),
    [constants_1.default.CE_ATTRIBUTES.SPEC_VERSION]: parser(constants_1.default.CE_HEADERS.SPEC_VERSION),
    [constants_1.default.CE_ATTRIBUTES.SOURCE]: parser(constants_1.default.CE_HEADERS.SOURCE),
    [constants_1.default.CE_ATTRIBUTES.ID]: parser(constants_1.default.CE_HEADERS.ID),
    [constants_1.default.CE_ATTRIBUTES.TIME]: parser(constants_1.default.CE_HEADERS.TIME),
    [constants_1.default.STRUCTURED_ATTRS_1.DATA_SCHEMA]: parser(constants_1.default.BINARY_HEADERS_1.DATA_SCHEMA),
});
exports.v1binaryParsers = Object.freeze({
    [constants_1.default.CE_HEADERS.TYPE]: parser(constants_1.default.CE_ATTRIBUTES.TYPE),
    [constants_1.default.CE_HEADERS.SPEC_VERSION]: parser(constants_1.default.CE_ATTRIBUTES.SPEC_VERSION),
    [constants_1.default.CE_HEADERS.SOURCE]: parser(constants_1.default.CE_ATTRIBUTES.SOURCE),
    [constants_1.default.CE_HEADERS.ID]: parser(constants_1.default.CE_ATTRIBUTES.ID),
    [constants_1.default.CE_HEADERS.TIME]: parser(constants_1.default.CE_ATTRIBUTES.TIME, new parsers_1.DateParser()),
    [constants_1.default.BINARY_HEADERS_1.DATA_SCHEMA]: parser(constants_1.default.STRUCTURED_ATTRS_1.DATA_SCHEMA),
    [constants_1.default.CE_HEADERS.SUBJECT]: parser(constants_1.default.CE_ATTRIBUTES.SUBJECT),
    [constants_1.default.CE_ATTRIBUTES.CONTENT_TYPE]: parser(constants_1.default.CE_ATTRIBUTES.CONTENT_TYPE),
    [constants_1.default.HEADER_CONTENT_TYPE]: parser(constants_1.default.CE_ATTRIBUTES.CONTENT_TYPE),
});
exports.v1structuredParsers = Object.freeze({
    [constants_1.default.CE_ATTRIBUTES.TYPE]: parser(constants_1.default.CE_ATTRIBUTES.TYPE),
    [constants_1.default.CE_ATTRIBUTES.SPEC_VERSION]: parser(constants_1.default.CE_ATTRIBUTES.SPEC_VERSION),
    [constants_1.default.CE_ATTRIBUTES.SOURCE]: parser(constants_1.default.CE_ATTRIBUTES.SOURCE),
    [constants_1.default.CE_ATTRIBUTES.ID]: parser(constants_1.default.CE_ATTRIBUTES.ID),
    [constants_1.default.CE_ATTRIBUTES.TIME]: parser(constants_1.default.CE_ATTRIBUTES.TIME, new parsers_1.DateParser()),
    [constants_1.default.STRUCTURED_ATTRS_1.DATA_SCHEMA]: parser(constants_1.default.STRUCTURED_ATTRS_1.DATA_SCHEMA),
    [constants_1.default.CE_ATTRIBUTES.CONTENT_TYPE]: parser(constants_1.default.CE_ATTRIBUTES.CONTENT_TYPE),
    [constants_1.default.CE_ATTRIBUTES.SUBJECT]: parser(constants_1.default.CE_ATTRIBUTES.SUBJECT),
    [constants_1.default.CE_ATTRIBUTES.DATA]: parser(constants_1.default.CE_ATTRIBUTES.DATA),
    [constants_1.default.STRUCTURED_ATTRS_1.DATA_BASE64]: parser(constants_1.default.STRUCTURED_ATTRS_1.DATA_BASE64),
});
/**
 * A utility Map used to retrieve the header names for a CloudEvent
 * using the CloudEvent getter function.
 */
exports.v03headerMap = Object.freeze({
    [constants_1.default.CE_ATTRIBUTES.CONTENT_TYPE]: parser(constants_1.default.HEADER_CONTENT_TYPE),
    [constants_1.default.CE_ATTRIBUTES.SUBJECT]: parser(constants_1.default.CE_HEADERS.SUBJECT),
    [constants_1.default.CE_ATTRIBUTES.TYPE]: parser(constants_1.default.CE_HEADERS.TYPE),
    [constants_1.default.CE_ATTRIBUTES.SPEC_VERSION]: parser(constants_1.default.CE_HEADERS.SPEC_VERSION),
    [constants_1.default.CE_ATTRIBUTES.SOURCE]: parser(constants_1.default.CE_HEADERS.SOURCE),
    [constants_1.default.CE_ATTRIBUTES.ID]: parser(constants_1.default.CE_HEADERS.ID),
    [constants_1.default.CE_ATTRIBUTES.TIME]: parser(constants_1.default.CE_HEADERS.TIME),
    [constants_1.default.STRUCTURED_ATTRS_03.CONTENT_ENCODING]: parser(constants_1.default.BINARY_HEADERS_03.CONTENT_ENCODING),
    [constants_1.default.STRUCTURED_ATTRS_03.SCHEMA_URL]: parser(constants_1.default.BINARY_HEADERS_03.SCHEMA_URL),
});
exports.v03binaryParsers = Object.freeze({
    [constants_1.default.CE_HEADERS.TYPE]: parser(constants_1.default.CE_ATTRIBUTES.TYPE),
    [constants_1.default.CE_HEADERS.SPEC_VERSION]: parser(constants_1.default.CE_ATTRIBUTES.SPEC_VERSION),
    [constants_1.default.CE_HEADERS.SOURCE]: parser(constants_1.default.CE_ATTRIBUTES.SOURCE),
    [constants_1.default.CE_HEADERS.ID]: parser(constants_1.default.CE_ATTRIBUTES.ID),
    [constants_1.default.CE_HEADERS.TIME]: parser(constants_1.default.CE_ATTRIBUTES.TIME, new parsers_1.DateParser()),
    [constants_1.default.BINARY_HEADERS_03.SCHEMA_URL]: parser(constants_1.default.STRUCTURED_ATTRS_03.SCHEMA_URL),
    [constants_1.default.CE_HEADERS.SUBJECT]: parser(constants_1.default.CE_ATTRIBUTES.SUBJECT),
    [constants_1.default.BINARY_HEADERS_03.CONTENT_ENCODING]: parser(constants_1.default.STRUCTURED_ATTRS_03.CONTENT_ENCODING),
    [constants_1.default.HEADER_CONTENT_TYPE]: parser(constants_1.default.CE_ATTRIBUTES.CONTENT_TYPE),
});
exports.v03structuredParsers = Object.freeze({
    [constants_1.default.CE_ATTRIBUTES.TYPE]: parser(constants_1.default.CE_ATTRIBUTES.TYPE),
    [constants_1.default.CE_ATTRIBUTES.SPEC_VERSION]: parser(constants_1.default.CE_ATTRIBUTES.SPEC_VERSION),
    [constants_1.default.CE_ATTRIBUTES.SOURCE]: parser(constants_1.default.CE_ATTRIBUTES.SOURCE),
    [constants_1.default.CE_ATTRIBUTES.ID]: parser(constants_1.default.CE_ATTRIBUTES.ID),
    [constants_1.default.CE_ATTRIBUTES.TIME]: parser(constants_1.default.CE_ATTRIBUTES.TIME, new parsers_1.DateParser()),
    [constants_1.default.STRUCTURED_ATTRS_03.SCHEMA_URL]: parser(constants_1.default.STRUCTURED_ATTRS_03.SCHEMA_URL),
    [constants_1.default.STRUCTURED_ATTRS_03.CONTENT_ENCODING]: parser(constants_1.default.STRUCTURED_ATTRS_03.CONTENT_ENCODING),
    [constants_1.default.CE_ATTRIBUTES.CONTENT_TYPE]: parser(constants_1.default.CE_ATTRIBUTES.CONTENT_TYPE),
    [constants_1.default.CE_ATTRIBUTES.SUBJECT]: parser(constants_1.default.CE_ATTRIBUTES.SUBJECT),
    [constants_1.default.CE_ATTRIBUTES.DATA]: parser(constants_1.default.CE_ATTRIBUTES.DATA),
});
