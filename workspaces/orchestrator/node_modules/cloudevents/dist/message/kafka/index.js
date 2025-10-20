"use strict";
/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Kafka = void 0;
const __1 = require("../..");
const headers_1 = require("./headers");
const headers_2 = require("../http/headers");
/**
 * Bindings for Kafka transport
 * @implements {@linkcode Binding}
 */
const Kafka = {
    binary: toBinaryKafkaMessage,
    structured: toStructuredKafkaMessage,
    toEvent: deserializeKafkaMessage,
    isEvent: isKafkaEvent,
};
exports.Kafka = Kafka;
/**
 * Serialize a CloudEvent for Kafka in binary mode
 * @implements {Serializer}
 * @see https://github.com/cloudevents/spec/blob/v1.0.1/kafka-protocol-binding.md#32-binary-content-mode
 *
 * @param {KafkaEvent<T>} event The event to serialize
 * @returns {KafkaMessage<T>} a KafkaMessage instance
 */
function toBinaryKafkaMessage(event) {
    // 3.2.1. Content Type
    // For the binary mode, the header content-type property MUST be mapped directly
    // to the CloudEvents datacontenttype attribute.
    const headers = {
        ...{ [__1.CONSTANTS.HEADER_CONTENT_TYPE]: event.datacontenttype },
        ...(0, headers_1.headersFor)(event)
    };
    return {
        headers,
        key: event.partitionkey,
        value: event.data,
        body: event.data,
        timestamp: timestamp(event.time)
    };
}
/**
 * Serialize a CloudEvent for Kafka in structured mode
 * @implements {Serializer}
 * @see https://github.com/cloudevents/spec/blob/v1.0.1/kafka-protocol-binding.md#33-structured-content-mode
 *
 * @param {CloudEvent<T>} event the CloudEvent to be serialized
 * @returns {KafkaMessage<T>} a KafkaMessage instance
 */
function toStructuredKafkaMessage(event) {
    if ((event instanceof __1.CloudEvent) && event.data_base64) {
        // The event's data is binary - delete it
        event = event.cloneWith({ data: undefined });
    }
    const value = event.toString();
    return {
        // All events may not have a partitionkey set, but if they do,
        // use it for the KafkaMessage#key per
        // https://github.com/cloudevents/spec/blob/v1.0.1/kafka-protocol-binding.md#31-key-mapping
        key: event.partitionkey,
        value,
        headers: {
            [__1.CONSTANTS.HEADER_CONTENT_TYPE]: __1.CONSTANTS.DEFAULT_CE_CONTENT_TYPE,
        },
        body: value,
        timestamp: timestamp(event.time)
    };
}
/**
 * Converts a Message to a CloudEvent
 * @implements {Deserializer}
 *
 * @param {Message} message the incoming message
 * @return {KafkaEvent} A new {KafkaEvent} instance
 */
function deserializeKafkaMessage(message) {
    if (!isKafkaEvent(message)) {
        throw new __1.ValidationError("No CloudEvent detected");
    }
    const m = message;
    if (!m.value) {
        throw new __1.ValidationError("Value is null or undefined");
    }
    if (!m.headers) {
        throw new __1.ValidationError("Headers are null or undefined");
    }
    const cleanHeaders = (0, headers_2.sanitize)(m.headers);
    const mode = getMode(cleanHeaders);
    switch (mode) {
        case __1.Mode.BINARY:
            return parseBinary(m);
        case __1.Mode.STRUCTURED:
            return parseStructured(m);
        case __1.Mode.BATCH:
            return parseBatched(m);
        default:
            throw new __1.ValidationError("Unknown Message mode");
    }
}
/**
 * Determine if a Message is a CloudEvent via Kafka headers
 * @implements {Detector}
 *
 * @param {Message} message an incoming Message object
 * @returns {boolean} true if this Message is a CloudEvent
 */
function isKafkaEvent(message) {
    const headers = (0, headers_2.sanitize)(message.headers);
    return !!headers[headers_1.KAFKA_CE_HEADERS.ID] || // A binary mode event
        headers[__1.CONSTANTS.HEADER_CONTENT_TYPE]?.startsWith(__1.CONSTANTS.MIME_CE) || // A structured mode event
        headers[__1.CONSTANTS.HEADER_CONTENT_TYPE]?.startsWith(__1.CONSTANTS.MIME_CE_BATCH); // A batch of events
}
/**
 * Determines what content mode a Kafka message is in given the provided headers
 * @param {Headers} headers the headers
 * @returns {Mode} the content mode of the KafkaMessage
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
    return __1.Mode.BINARY;
}
/**
 * Parses a binary kafka CE message and returns a CloudEvent
 * @param {KafkaMessage} message the message
 * @returns {CloudEvent<T>} a CloudEvent<T>
 */
function parseBinary(message) {
    const eventObj = {};
    const headers = { ...message.headers };
    eventObj.datacontenttype = headers[__1.CONSTANTS.HEADER_CONTENT_TYPE];
    for (const key in headers_1.KAFKA_CE_HEADERS) {
        const h = headers_1.KAFKA_CE_HEADERS[key];
        if (!!headers[h]) {
            eventObj[headers_1.HEADER_MAP[h]] = headers[h];
            if (h === headers_1.KAFKA_CE_HEADERS.TIME) {
                eventObj.time = new Date(eventObj.time).toISOString();
            }
            delete headers[h];
        }
    }
    // Any remaining headers are extension attributes
    // TODO: The spec is unlear on whether these should
    // be prefixed with 'ce_' as headers. We assume it is
    for (const key in headers) {
        if (key.startsWith("ce_")) {
            eventObj[key.replace("ce_", "")] = headers[key];
        }
    }
    return new __1.CloudEvent({
        ...eventObj,
        data: extractBinaryData(message),
        partitionkey: message.key,
    }, false);
}
/**
 * Parses a structured kafka CE message and returns a CloudEvent
 * @param {KafkaMessage<T>} message the message
 * @returns {CloudEvent<T>} a KafkaEvent<T>
 */
function parseStructured(message) {
    // Although the format of a structured encoded event could be something
    // other than JSON, e.g. XML, we currently only support JSON
    // encoded structured events.
    if (!message.headers[__1.CONSTANTS.HEADER_CONTENT_TYPE]?.startsWith(__1.CONSTANTS.MIME_CE_JSON)) {
        throw new __1.ValidationError(`Unsupported event encoding ${message.headers[__1.CONSTANTS.HEADER_CONTENT_TYPE]}`);
    }
    const eventObj = JSON.parse(message.value);
    eventObj.time = new Date(eventObj.time).toISOString();
    return new __1.CloudEvent({
        ...eventObj,
        partitionkey: message.key,
    }, false);
}
/**
 * Parses a batch kafka CE message and returns a CloudEvent[]
 * @param {KafkaMessage<T>} message the message
 * @returns {CloudEvent<T>[]} an array of KafkaEvent<T>
 */
function parseBatched(message) {
    // Although the format of batch encoded events could be something
    // other than JSON, e.g. XML, we currently only support JSON
    // encoded structured events.
    if (!message.headers[__1.CONSTANTS.HEADER_CONTENT_TYPE]?.startsWith(__1.CONSTANTS.MIME_CE_BATCH)) {
        throw new __1.ValidationError(`Unsupported event encoding ${message.headers[__1.CONSTANTS.HEADER_CONTENT_TYPE]}`);
    }
    const events = JSON.parse(message.value);
    return events.map((e) => new __1.CloudEvent({ ...e, partitionkey: message.key }, false));
}
/**
 * Gets the data from a binary kafka ce message as T
 * @param {KafkaMessage} message a KafkaMessage
 * @returns {string | undefined} the data in the message
 */
function extractBinaryData(message) {
    let data = message.value;
    // If the event data is JSON, go ahead and parse it
    const datacontenttype = message.headers[__1.CONSTANTS.HEADER_CONTENT_TYPE];
    if (!!datacontenttype && datacontenttype.startsWith(__1.CONSTANTS.MIME_JSON)) {
        if (typeof message.value === "string") {
            data = JSON.parse(message.value);
        }
        else if (typeof message.value === "object" && Buffer.isBuffer(message.value)) {
            data = JSON.parse(message.value.toString());
        }
    }
    return data;
}
/**
 * Converts a possible date string into a correctly formatted
 * (for CloudEvents) ISO date string.
 * @param {string | undefined} t a possible date string
 * @returns {string | undefined} a properly formatted ISO date string or undefined
 */
function timestamp(t) {
    return !!t ? `${Date.parse(t)}` : undefined;
}
