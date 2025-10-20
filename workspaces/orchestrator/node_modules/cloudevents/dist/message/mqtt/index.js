"use strict";
/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.MQTTMessageFactory = exports.MQTT = void 0;
const __1 = require("../..");
const validation_1 = require("../../event/validation");
/**
 * Binding for MQTT transport support
 * @implements @linkcode Binding
 */
const MQTT = {
    binary,
    structured,
    toEvent: toEvent,
    isEvent
};
exports.MQTT = MQTT;
/**
 * Converts a CloudEvent into an MQTTMessage<T> with the event's data as the message payload
 * @param {CloudEventV1} event a CloudEvent
 * @returns {MQTTMessage<T>} the event serialized as an MQTTMessage<T> with binary encoding
 * @implements {Serializer}
 */
function binary(event) {
    const properties = { ...event };
    let body = properties.data;
    if (!body && properties.data_base64) {
        body = (0, validation_1.base64AsBinary)(properties.data_base64);
    }
    delete properties.data;
    delete properties.data_base64;
    return MQTTMessageFactory(event.datacontenttype, properties, body);
}
/**
 * Converts a CloudEvent into an MQTTMessage<T> with the event as the message payload
 * @param {CloudEventV1} event a CloudEvent
 * @returns {MQTTMessage<T>} the event serialized as an MQTTMessage<T> with structured encoding
 * @implements {Serializer}
 */
function structured(event) {
    let body;
    if (event instanceof __1.CloudEvent) {
        body = event.toJSON();
    }
    else {
        body = event;
    }
    return MQTTMessageFactory(__1.CONSTANTS.DEFAULT_CE_CONTENT_TYPE, {}, body);
}
/**
 * A helper function to create an MQTTMessage<T> object, with "User Properties" as an alias
 * for "headers" and "payload" an alias for body, and a "PUBLISH" record with a "Content Type"
 * property.
 * @param {string} contentType the "Content Type" attribute on PUBLISH
 * @param {Record<string, unknown>} headers the headers and "User Properties"
 * @param {T} body the message body/payload
 * @returns {MQTTMessage<T>} a message initialized with the provided attributes
 */
function MQTTMessageFactory(contentType, headers, body) {
    return {
        PUBLISH: {
            "Content Type": contentType
        },
        body,
        get payload() {
            return this.body;
        },
        headers: headers,
        get "User Properties"() {
            return this.headers;
        }
    };
}
exports.MQTTMessageFactory = MQTTMessageFactory;
/**
 * Converts an MQTTMessage<T> into a CloudEvent
 * @param {Message<T>} message the message to deserialize
 * @param {boolean} strict determines if a ValidationError will be thrown on bad input - defaults to false
 * @returns {CloudEventV1<T>} an event
 * @implements {Deserializer}
 */
function toEvent(message, strict = false) {
    if (strict && !isEvent(message)) {
        throw new __1.ValidationError("No CloudEvent detected");
    }
    if (isStructuredMessage(message)) {
        const evt = (typeof message.body === "string") ? JSON.parse(message.body) : message.body;
        return new __1.CloudEvent({
            ...evt
        }, false);
    }
    else {
        return new __1.CloudEvent({
            ...message.headers,
            data: message.body,
        }, false);
    }
}
/**
 * Determine if the message is a CloudEvent
 * @param {Message<T>} message an MQTTMessage
 * @returns {boolean} true if the message contains an event
 */
function isEvent(message) {
    return isBinaryMessage(message) || isStructuredMessage(message);
}
function isBinaryMessage(message) {
    return (!!message.headers.id && !!message.headers.source
        && !!message.headers.type && !!message.headers.specversion);
}
function isStructuredMessage(message) {
    if (!message) {
        return false;
    }
    return (message.PUBLISH && message?.PUBLISH["Content Type"]?.startsWith(__1.CONSTANTS.MIME_CE_JSON)) || false;
}
