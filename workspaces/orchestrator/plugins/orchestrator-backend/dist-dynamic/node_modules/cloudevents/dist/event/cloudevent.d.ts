import { CloudEventV1 } from "./interfaces";
/**
 * Constants representing the CloudEvent specification version
 */
export declare const V1 = "1.0";
export declare const V03 = "0.3";
/**
 * A CloudEvent describes event data in common formats to provide
 * interoperability across services, platforms and systems.
 * @see https://github.com/cloudevents/spec/blob/v1.0/spec.md
 */
export declare class CloudEvent<T = undefined> implements CloudEventV1<T> {
    id: string;
    type: string;
    source: string;
    specversion: string;
    datacontenttype?: string;
    dataschema?: string;
    subject?: string;
    time?: string;
    data?: T;
    data_base64?: string;
    [key: string]: unknown;
    schemaurl?: string;
    datacontentencoding?: string;
    /**
     * Creates a new CloudEvent object with the provided properties. If there is a chance that the event
     * properties will not conform to the CloudEvent specification, you may pass a boolean `false` as a
     * second parameter to bypass event validation.
     *
     * @param {object} event the event properties
     * @param {boolean?} strict whether to perform event validation when creating the object - default: true
     */
    constructor(event: Partial<CloudEventV1<T>>, strict?: boolean);
    /**
     * Used by JSON.stringify(). The name is confusing, but this method is called by
     * JSON.stringify() when converting this object to JSON.
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
     * @return {object} this event as a plain object
     */
    toJSON(): Record<string, unknown>;
    toString(): string;
    /**
     * Validates this CloudEvent against the schema
     * @throws if the CloudEvent does not conform to the schema
     * @return {boolean} true if this event is valid
     */
    validate(): boolean;
    /**
     * Emit this CloudEvent through the application
     *
     * @param {boolean} ensureDelivery fail the promise if one listener fail
     * @return {Promise<CloudEvent>} this
     */
    emit(ensureDelivery?: boolean): Promise<this>;
    /**
     * Clone a CloudEvent with new/updated attributes
     * @param {object} options attributes to augment the CloudEvent without a `data` property
     * @param {boolean} strict whether or not to use strict validation when cloning (default: true)
     * @throws if the CloudEvent does not conform to the schema
     * @return {CloudEvent} returns a new CloudEvent<T>
     */
    cloneWith(options: Partial<Exclude<CloudEventV1<never>, "data">>, strict?: boolean): CloudEvent<T>;
    /**
     * Clone a CloudEvent with new/updated attributes and new data
     * @param {object} options attributes to augment the CloudEvent with a `data` property and type
     * @param {boolean} strict whether or not to use strict validation when cloning (default: true)
     * @throws if the CloudEvent does not conform to the schema
     * @return {CloudEvent} returns a new CloudEvent<D>
     */
    cloneWith<D>(options: Partial<CloudEventV1<D>>, strict?: boolean): CloudEvent<D>;
    /**
     * Clone a CloudEvent with new or updated attributes.
     * @param {CloudEventV1<any>} event an object that implements the {@linkcode CloudEventV1} interface
     * @param {Partial<CloudEventV1<any>>} options an object with new or updated attributes
     * @param {boolean} strict `true` if the resulting event should be valid per the CloudEvent specification
     * @throws {ValidationError} if `strict` is `true` and the resulting event is invalid
     * @returns {CloudEvent<any>} a CloudEvent cloned from `event` with `options` applied.
     */
    static cloneWith(event: CloudEventV1<any>, options: Partial<CloudEventV1<any>>, strict?: boolean): CloudEvent<any>;
}
