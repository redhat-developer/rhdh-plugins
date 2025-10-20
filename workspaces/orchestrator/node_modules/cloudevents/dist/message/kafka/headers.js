"use strict";
/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.headersFor = exports.HEADER_MAP = exports.KAFKA_CE_HEADERS = void 0;
const __1 = require("../..");
/**
 * The set of CloudEvent headers that may exist on a Kafka message
 */
exports.KAFKA_CE_HEADERS = Object.freeze({
    /** corresponds to the CloudEvent#id */
    ID: "ce_id",
    /** corresponds to the CloudEvent#type */
    TYPE: "ce_type",
    /** corresponds to the CloudEvent#source */
    SOURCE: "ce_source",
    /** corresponds to the CloudEvent#specversion */
    SPEC_VERSION: "ce_specversion",
    /** corresponds to the CloudEvent#time */
    TIME: "ce_time",
    /** corresponds to the CloudEvent#subject */
    SUBJECT: "ce_subject",
    /** corresponds to the CloudEvent#datacontenttype */
    DATACONTENTTYPE: "ce_datacontenttype",
    /** corresponds to the CloudEvent#dataschema */
    DATASCHEMA: "ce_dataschema",
});
exports.HEADER_MAP = {
    [exports.KAFKA_CE_HEADERS.ID]: "id",
    [exports.KAFKA_CE_HEADERS.TYPE]: "type",
    [exports.KAFKA_CE_HEADERS.SOURCE]: "source",
    [exports.KAFKA_CE_HEADERS.SPEC_VERSION]: "specversion",
    [exports.KAFKA_CE_HEADERS.TIME]: "time",
    [exports.KAFKA_CE_HEADERS.SUBJECT]: "subject",
    [exports.KAFKA_CE_HEADERS.DATACONTENTTYPE]: "datacontenttype",
    [exports.KAFKA_CE_HEADERS.DATASCHEMA]: "dataschema"
};
/**
 * A conveninece function to convert a CloudEvent into headers
 * @param {CloudEvent} event a CloudEvent object
 * @returns {Headers} the CloudEvent attribute as Kafka headers
 */
function headersFor(event) {
    const headers = {};
    Object.getOwnPropertyNames(event).forEach((property) => {
        // Ignore the 'data' property
        // it becomes the Kafka message's 'value' field
        if (property != __1.CONSTANTS.CE_ATTRIBUTES.DATA && property != __1.CONSTANTS.STRUCTURED_ATTRS_1.DATA_BASE64) {
            // all CloudEvent property names get prefixed with 'ce_'
            // https://github.com/cloudevents/spec/blob/v1.0.1/kafka-protocol-binding.md#3231-property-names
            headers[`ce_${property}`] = event[property];
        }
    });
    return headers;
}
exports.headersFor = headersFor;
