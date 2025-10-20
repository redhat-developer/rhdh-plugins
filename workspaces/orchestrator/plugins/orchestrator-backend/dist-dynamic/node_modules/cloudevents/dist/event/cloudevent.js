"use strict";
/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudEvent = exports.V03 = exports.V1 = void 0;
const uuid_1 = require("uuid");
const __1 = require("..");
const spec_1 = require("./spec");
const validation_1 = require("./validation");
/**
 * Constants representing the CloudEvent specification version
 */
exports.V1 = "1.0";
exports.V03 = "0.3";
/**
 * A CloudEvent describes event data in common formats to provide
 * interoperability across services, platforms and systems.
 * @see https://github.com/cloudevents/spec/blob/v1.0/spec.md
 */
class CloudEvent {
    /**
     * Creates a new CloudEvent object with the provided properties. If there is a chance that the event
     * properties will not conform to the CloudEvent specification, you may pass a boolean `false` as a
     * second parameter to bypass event validation.
     *
     * @param {object} event the event properties
     * @param {boolean?} strict whether to perform event validation when creating the object - default: true
     */
    constructor(event, strict = true) {
        // copy the incoming event so that we can delete properties as we go
        // everything left after we have deleted know properties becomes an extension
        const properties = { ...event };
        this.id = properties.id || (0, uuid_1.v4)();
        delete properties.id;
        this.time = properties.time || new Date().toISOString();
        delete properties.time;
        this.type = properties.type;
        delete properties.type;
        this.source = properties.source;
        delete properties.source;
        this.specversion = (properties.specversion) || exports.V1;
        delete properties.specversion;
        this.datacontenttype = properties.datacontenttype;
        delete properties.datacontenttype;
        this.subject = properties.subject;
        delete properties.subject;
        this.datacontentencoding = properties.datacontentencoding;
        delete properties.datacontentencoding;
        this.dataschema = properties.dataschema;
        delete properties.dataschema;
        this.data_base64 = properties.data_base64;
        if (this.data_base64) {
            this.data = (0, validation_1.base64AsBinary)(this.data_base64);
        }
        delete properties.data_base64;
        this.schemaurl = properties.schemaurl;
        delete properties.schemaurl;
        if ((0, validation_1.isBinary)(properties.data)) {
            this.data_base64 = (0, validation_1.asBase64)(properties.data);
        }
        this.data = typeof properties.data !== "undefined" ? properties.data : this.data;
        delete properties.data;
        // sanity checking
        if (this.specversion === exports.V1 && this.schemaurl) {
            throw new TypeError("cannot set schemaurl on version 1.0 event");
        }
        else if (this.specversion === exports.V03 && this.dataschema) {
            throw new TypeError("cannot set dataschema on version 0.3 event");
        }
        // finally process any remaining properties - these are extensions
        for (const [key, value] of Object.entries(properties)) {
            // Extension names must only allow lowercase a-z and 0-9 in the name
            // names should not exceed 20 characters in length
            if (!key.match(/^[a-z0-9]+$/) && strict) {
                throw new validation_1.ValidationError(`invalid extension name: ${key}
CloudEvents attribute names MUST consist of lower-case letters ('a' to 'z')
or digits ('0' to '9') from the ASCII character set. Attribute names SHOULD
be descriptive and terse and SHOULD NOT exceed 20 characters in length.`);
            }
            // Value should be spec compliant
            // https://github.com/cloudevents/spec/blob/master/spec.md#type-system
            if (!(0, validation_1.isValidType)(value) && strict) {
                throw new validation_1.ValidationError(`invalid extension value: ${value}
Extension values must conform to the CloudEvent type system.
See: https://github.com/cloudevents/spec/blob/v1.0/spec.md#type-system`);
            }
            this[key] = value;
        }
        strict ? this.validate() : undefined;
        Object.freeze(this);
    }
    /**
     * Used by JSON.stringify(). The name is confusing, but this method is called by
     * JSON.stringify() when converting this object to JSON.
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
     * @return {object} this event as a plain object
     */
    toJSON() {
        const event = { ...this };
        event.time = new Date(this.time).toISOString();
        if (event.data_base64 && event.data) {
            delete event.data;
        }
        return event;
    }
    toString() {
        return JSON.stringify(this);
    }
    /**
     * Validates this CloudEvent against the schema
     * @throws if the CloudEvent does not conform to the schema
     * @return {boolean} true if this event is valid
     */
    validate() {
        try {
            return (0, spec_1.validateCloudEvent)(this);
        }
        catch (e) {
            if (e instanceof validation_1.ValidationError) {
                throw e;
            }
            else {
                throw new validation_1.ValidationError("invalid payload", [e]);
            }
        }
    }
    /**
     * Emit this CloudEvent through the application
     *
     * @param {boolean} ensureDelivery fail the promise if one listener fail
     * @return {Promise<CloudEvent>} this
     */
    async emit(ensureDelivery = true) {
        await __1.Emitter.emitEvent(this, ensureDelivery);
        return this;
    }
    /**
     * Clone a CloudEvent with new/updated attributes and possibly different data types
     * @param {object} options attributes to augment the CloudEvent
     * @param {boolean} strict whether or not to use strict validation when cloning (default: true)
     * @throws if the CloudEvent does not conform to the schema
     * @return {CloudEvent} returns a new CloudEvent
     */
    cloneWith(options, strict = true) {
        return CloudEvent.cloneWith(this, options, strict);
    }
    /**
     * The native `console.log` value of the CloudEvent.
     * @return {string} The string representation of the CloudEvent.
     */
    [Symbol.for("nodejs.util.inspect.custom")]() {
        return this.toString();
    }
    /**
     * Clone a CloudEvent with new or updated attributes.
     * @param {CloudEventV1<any>} event an object that implements the {@linkcode CloudEventV1} interface
     * @param {Partial<CloudEventV1<any>>} options an object with new or updated attributes
     * @param {boolean} strict `true` if the resulting event should be valid per the CloudEvent specification
     * @throws {ValidationError} if `strict` is `true` and the resulting event is invalid
     * @returns {CloudEvent<any>} a CloudEvent cloned from `event` with `options` applied.
     */
    static cloneWith(event, options, strict = true) {
        return new CloudEvent(Object.assign({}, event, options), strict);
    }
}
exports.CloudEvent = CloudEvent;
