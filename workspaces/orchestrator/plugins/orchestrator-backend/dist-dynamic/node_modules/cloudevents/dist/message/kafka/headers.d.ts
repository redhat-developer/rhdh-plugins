import { CloudEventV1, Headers } from "../..";
declare type KafkaHeaders = Readonly<{
    ID: string;
    TYPE: string;
    SOURCE: string;
    SPEC_VERSION: string;
    TIME: string;
    SUBJECT: string;
    DATACONTENTTYPE: string;
    DATASCHEMA: string;
    [key: string]: string;
}>;
/**
 * The set of CloudEvent headers that may exist on a Kafka message
 */
export declare const KAFKA_CE_HEADERS: KafkaHeaders;
export declare const HEADER_MAP: {
    [key: string]: string;
};
/**
 * A conveninece function to convert a CloudEvent into headers
 * @param {CloudEvent} event a CloudEvent object
 * @returns {Headers} the CloudEvent attribute as Kafka headers
 */
export declare function headersFor<T>(event: CloudEventV1<T>): Headers;
export {};
