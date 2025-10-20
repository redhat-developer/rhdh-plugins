"use strict";
/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP = void 0;
const util_1 = require("util");
const __1 = require("../..");
const headers_1 = require("./headers");
const validation_1 = require("../../event/validation");
const parsers_1 = require("../../parsers");
/**
 * Serialize a CloudEvent for HTTP transport in binary mode
 * @implements {Serializer}
 * @see https://github.com/cloudevents/spec/blob/v1.0.1/http-protocol-binding.md#31-binary-content-mode
 *
 * @param {CloudEvent} event The event to serialize
 * @returns {Message} a Message object with headers and body
 */
function binary(event) {
    const contentType = { [__1.CONSTANTS.HEADER_CONTENT_TYPE]: __1.CONSTANTS.DEFAULT_CONTENT_TYPE };
    const headers = { ...contentType, ...(0, headers_1.headersFor)(event) };
    let body = event.data;
    if (typeof event.data === "object" && !util_1.types.isTypedArray(event.data)) {
        // we'll stringify objects, but not binary data
        body = JSON.stringify(event.data);
    }
    return {
        headers,
        body,
    };
}
/**
 * Serialize a CloudEvent for HTTP transport in structured mode
 * @implements {Serializer}
 * @see https://github.com/cloudevents/spec/blob/v1.0.1/http-protocol-binding.md#32-structured-content-mode
 *
 * @param {CloudEvent} event the CloudEvent to be serialized
 * @returns {Message} a Message object with headers and body
 */
function structured(event) {
    if (event.data_base64) {
        // The event's data is binary - delete it
        event = event.cloneWith({ data: undefined });
    }
    return {
        headers: {
            [__1.CONSTANTS.HEADER_CONTENT_TYPE]: __1.CONSTANTS.DEFAULT_CE_CONTENT_TYPE,
        },
        body: event.toString(),
    };
}
/**
 * Determine if a Message is a CloudEvent
 * @implements {Detector}
 *
 * @param {Message} message an incoming Message object
 * @returns {boolean} true if this Message is a CloudEvent
 */
function isEvent(message) {
    // TODO: this could probably be optimized
    try {
        deserialize(message);
        return true;
    }
    catch (err) {
        return false;
    }
}
/**
 * Converts a Message to a CloudEvent
 * @implements {Deserializer}
 *
 * @param {Message} message the incoming message
 * @return {CloudEvent} A new {CloudEvent} instance
 */
function deserialize(message) {
    const cleanHeaders = (0, headers_1.sanitize)(message.headers);
    const mode = getMode(cleanHeaders);
    const version = getVersion(mode, cleanHeaders, message.body);
    switch (mode) {
        case __1.Mode.BINARY:
            return parseBinary(message, version);
        case __1.Mode.STRUCTURED:
            return parseStructured(message, version);
        case __1.Mode.BATCH:
            return parseBatched(message);
        default:
            throw new validation_1.ValidationError("Unknown Message mode");
    }
}
/**
 * Determines the HTTP transport mode (binary or structured) based
 * on the incoming HTTP headers.
 * @param {Headers} headers the incoming HTTP headers
 * @returns {Mode} the transport mode
 */
function getMode(headers) {
    const contentType = headers[__1.CONSTANTS.HEADER_CONTENT_TYPE];
    if (contentType) {
        if (contentType.startsWith(__1.CONSTANTS.MIME_CE_BATCH)) {
            return __1.Mode.BATCH;
        }
        else if (contentType.startsWith(__1.CONSTANTS.MIME_CE)) {
            return __1.Mode.STRUCTURED;
        }
    }
    if (headers[__1.CONSTANTS.CE_HEADERS.ID]) {
        return __1.Mode.BINARY;
    }
    throw new validation_1.ValidationError("no cloud event detected");
}
/**
 * Determines the version of an incoming CloudEvent based on the
 * HTTP headers or HTTP body, depending on transport mode.
 * @param {Mode} mode the HTTP transport mode
 * @param {Headers} headers the incoming HTTP headers
 * @param {Record<string, unknown>} body the HTTP request body
 * @returns {Version} the CloudEvent specification version
 */
function getVersion(mode, headers, body) {
    if (mode === __1.Mode.BINARY) {
        // Check the headers for the version
        const versionHeader = headers[__1.CONSTANTS.CE_HEADERS.SPEC_VERSION];
        if (versionHeader) {
            return versionHeader;
        }
    }
    else {
        // structured mode - the version is in the body
        if (typeof body === "string") {
            return JSON.parse(body).specversion;
        }
        else {
            return body.specversion;
        }
    }
    return __1.V1;
}
/**
 * Parses an incoming HTTP Message, converting it to a {CloudEvent}
 * instance if it conforms to the Cloud Event specification for this receiver.
 *
 * @param {Message} message the incoming HTTP Message
 * @param {string} version the spec version of the incoming event
 * @returns {CloudEvent} an instance of CloudEvent representing the incoming request
 * @throws {ValidationError} of the event does not conform to the spec
 */
function parseBinary(message, version) {
    const headers = { ...message.headers };
    let body = message.body;
    if (!headers)
        throw new validation_1.ValidationError("headers is null or undefined");
    // Clone and low case all headers names
    const sanitizedHeaders = (0, headers_1.sanitize)(headers);
    const eventObj = {};
    const parserMap = version === __1.V03 ? headers_1.v03binaryParsers : headers_1.v1binaryParsers;
    for (const header in parserMap) {
        if (sanitizedHeaders[header]) {
            const mappedParser = parserMap[header];
            eventObj[mappedParser.name] = mappedParser.parser.parse(sanitizedHeaders[header]);
            delete sanitizedHeaders[header];
            delete headers[header];
        }
    }
    // Every unprocessed header can be an extension
    for (const header in headers) {
        if (header.startsWith(__1.CONSTANTS.EXTENSIONS_PREFIX)) {
            eventObj[header.substring(__1.CONSTANTS.EXTENSIONS_PREFIX.length)] = headers[header];
        }
    }
    const parser = parsers_1.parserByContentType[eventObj.datacontenttype];
    if (parser && body) {
        body = parser.parse(body);
    }
    // At this point, if the datacontenttype is application/json and the datacontentencoding is base64
    // then the data has already been decoded as a string, then parsed as JSON. We don't need to have
    // the datacontentencoding property set - in fact, it's incorrect to do so.
    if (eventObj.datacontenttype === __1.CONSTANTS.MIME_JSON && eventObj.datacontentencoding === __1.CONSTANTS.ENCODING_BASE64) {
        delete eventObj.datacontentencoding;
    }
    return new __1.CloudEvent({ ...eventObj, data: body }, false);
}
/**
 * Creates a new CloudEvent instance based on the provided payload and headers.
 *
 * @param {Message} message the incoming Message
 * @param {string} version the spec version of this message (v1 or v03)
 * @returns {CloudEvent} a new CloudEvent instance for the provided headers and payload
 * @throws {ValidationError} if the payload and header combination do not conform to the spec
 */
function parseStructured(message, version) {
    const payload = message.body;
    const headers = message.headers;
    if (!payload)
        throw new validation_1.ValidationError("payload is null or undefined");
    if (!headers)
        throw new validation_1.ValidationError("headers is null or undefined");
    (0, validation_1.isStringOrObjectOrThrow)(payload, new validation_1.ValidationError("payload must be an object or a string"));
    // Clone and low case all headers names
    const sanitizedHeaders = (0, headers_1.sanitize)(headers);
    const contentType = sanitizedHeaders[__1.CONSTANTS.HEADER_CONTENT_TYPE];
    const parser = contentType ? parsers_1.parserByContentType[contentType] : new parsers_1.JSONParser();
    if (!parser)
        throw new validation_1.ValidationError(`invalid content type ${sanitizedHeaders[__1.CONSTANTS.HEADER_CONTENT_TYPE]}`);
    const incoming = { ...parser.parse(payload) };
    const eventObj = {};
    const parserMap = version === __1.V03 ? headers_1.v03structuredParsers : headers_1.v1structuredParsers;
    for (const key in parserMap) {
        const property = incoming[key];
        if (property) {
            const mappedParser = parserMap[key];
            eventObj[mappedParser.name] = mappedParser.parser.parse(property);
        }
        delete incoming[key];
    }
    // extensions are what we have left after processing all other properties
    for (const key in incoming) {
        eventObj[key] = incoming[key];
    }
    // data_base64 is a property that only exists on V1 events. For V03 events,
    // there will be a .datacontentencoding property, and the .data property
    // itself will be encoded as base64
    if (eventObj.data_base64 || eventObj.datacontentencoding === __1.CONSTANTS.ENCODING_BASE64) {
        const data = eventObj.data_base64 || eventObj.data;
        eventObj.data = new Uint32Array(Buffer.from(data, "base64"));
        delete eventObj.data_base64;
        delete eventObj.datacontentencoding;
    }
    return new __1.CloudEvent(eventObj, false);
}
function parseBatched(message) {
    const ret = [];
    const events = JSON.parse(message.body);
    events.forEach((element) => {
        ret.push(new __1.CloudEvent(element));
    });
    return ret;
}
/**
 * Bindings for HTTP transport support
 * @implements {@linkcode Binding}
 */
exports.HTTP = {
    binary,
    structured,
    toEvent: deserialize,
    isEvent: isEvent,
};
