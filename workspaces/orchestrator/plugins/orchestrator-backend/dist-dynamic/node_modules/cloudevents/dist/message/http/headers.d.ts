import { MappedParser } from "../../parsers";
import { CloudEventV1 } from "../..";
import { Headers } from "../";
export declare const allowedContentTypes: ("application/json" | "application/octet-stream" | "application/json; charset=utf-8")[];
export declare const requiredHeaders: ("ce-type" | "ce-specversion" | "ce-source" | "ce-id")[];
/**
 * Returns the HTTP headers that will be sent for this event when the HTTP transmission
 * mode is "binary". Events sent over HTTP in structured mode only have a single CE header
 * and that is "ce-id", corresponding to the event ID.
 * @param {CloudEvent} event a CloudEvent
 * @returns {Object} the headers that will be sent for the event
 */
export declare function headersFor<T>(event: CloudEventV1<T>): Headers;
/**
 * Sanitizes incoming headers by lowercasing them and potentially removing
 * encoding from the content-type header.
 * @param {Headers} headers HTTP headers as key/value pairs
 * @returns {Headers} the sanitized headers
 */
export declare function sanitize(headers: Headers): Headers;
/**
 * A utility Map used to retrieve the header names for a CloudEvent
 * using the CloudEvent getter function.
 */
export declare const v1headerMap: Readonly<{
    [key: string]: MappedParser;
}>;
export declare const v1binaryParsers: Record<string, MappedParser>;
export declare const v1structuredParsers: Record<string, MappedParser>;
/**
 * A utility Map used to retrieve the header names for a CloudEvent
 * using the CloudEvent getter function.
 */
export declare const v03headerMap: Readonly<{
    [key: string]: MappedParser;
}>;
export declare const v03binaryParsers: Record<string, MappedParser>;
export declare const v03structuredParsers: Record<string, MappedParser>;
