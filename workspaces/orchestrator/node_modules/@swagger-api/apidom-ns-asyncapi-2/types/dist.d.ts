import { MediaTypes, NamespacePluginOptions, StringElement, Meta, Attributes, ObjectElement, ArrayElement, BooleanElement, NumberElement, ElementPredicate, MemberElement, Element as Element$1 } from '@swagger-api/apidom-core';
export { isArrayElement, isBooleanElement, isElement, isLinkElement, isMemberElement, isNullElement, isNumberElement, isObjectElement, isRefElement, isStringElement } from '@swagger-api/apidom-core';
import * as minim from 'minim';
import { ObjectElement as ObjectElement$1 } from 'minim';
import { JSONSchemaElement } from '@swagger-api/apidom-ns-json-schema-draft-7';
export { AllOfVisitorOptions as SchemaAllOfVisitorOptions, AnyOfVisitorOptions as SchemaAnyOfVisitorOptions, DefinitionsVisitorOptions as SchemaDefinitionsVisitorOptions, DependenciesVisitorOptions as SchemaDependenciesVisitorOptions, ItemsVisitorOptions as SchemaItemsVisitorOptions, OneOfVisitorOptions as SchemaOneOfVisitorOptions, SchemaOrReferenceVisitorOptions, PatternPropertiesVisitorOptions as SchemaPatternPropertiesVisitorOptions, PropertiesVisitorOptions as SchemaPropertiesVisitorOptions } from '@swagger-api/apidom-ns-json-schema-draft-7';
import * as _swagger_api_apidom_ns_json_schema_draft_4 from '@swagger-api/apidom-ns-json-schema-draft-4';
import * as ts_mixer_dist_types_types from 'ts-mixer/dist/types/types';

type Format = 'generic' | 'json' | 'yaml';
declare class AsyncAPIMediaTypes extends MediaTypes<string> {
    filterByFormat(format?: Format): string[];
    findBy(version?: string, format?: Format): string;
    latest(format?: Format): string;
}
declare const mediaTypes: AsyncAPIMediaTypes;

declare const asyncApi2: {
    namespace: (options: NamespacePluginOptions) => minim.Namespace;
};

declare const plugin: () => () => {
    visitor: {
        StringElement(element: StringElement, key: any, parent: any, path: any, ancestors: any[]): any;
    };
};

declare class AsyncApiVersion extends StringElement {
    constructor(content?: string, meta?: Meta, attributes?: Attributes);
}

declare class DefaultContentType extends StringElement {
    constructor(content?: string, meta?: Meta, attributes?: Attributes);
}

declare class Identifier extends StringElement {
    constructor(content?: string, meta?: Meta, attributes?: Attributes);
}

declare class Components extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get schemas(): ObjectElement | undefined;
    set schemas(schemas: ObjectElement | undefined);
    get servers(): ObjectElement | undefined;
    set servers(servers: ObjectElement | undefined);
    get serverVariables(): ObjectElement | undefined;
    set serverVariables(serverVariables: ObjectElement | undefined);
    get messages(): ObjectElement | undefined;
    set messages(messages: ObjectElement | undefined);
    get securitySchemes(): ObjectElement | undefined;
    set securitySchemes(securitySchemes: ObjectElement | undefined);
    get parameters(): ObjectElement | undefined;
    set parameters(parameters: ObjectElement | undefined);
    get correlationIds(): ObjectElement | undefined;
    set correlationIds(correlationIds: ObjectElement | undefined);
    get operationTraits(): ObjectElement | undefined;
    set operationTraits(operationTraits: ObjectElement | undefined);
    get messageTraits(): ObjectElement | undefined;
    set messageTraits(messageTraits: ObjectElement | undefined);
    get serverBindings(): ObjectElement | undefined;
    set serverBindings(serverBindings: ObjectElement | undefined);
    get channelBindings(): ObjectElement | undefined;
    set channelBindings(channelBindings: ObjectElement | undefined);
    get operationBindings(): ObjectElement | undefined;
    set operationBindings(operationBindings: ObjectElement | undefined);
    get messageBindings(): ObjectElement | undefined;
    set messageBindings(messageBindings: ObjectElement | undefined);
}

declare class Contact extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get name(): StringElement | undefined;
    set name(name: StringElement | undefined);
    get url(): StringElement | undefined;
    set url(url: StringElement | undefined);
    get email(): StringElement | undefined;
    set email(email: StringElement | undefined);
}

declare class License extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get name(): StringElement | undefined;
    set name(name: StringElement | undefined);
    get url(): StringElement | undefined;
    set url(url: StringElement | undefined);
}

declare class Info extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get title(): StringElement | undefined;
    set title(title: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get termsOfService(): StringElement | undefined;
    set termsOfService(tos: StringElement | undefined);
    get version(): StringElement | undefined;
    set version(version: StringElement | undefined);
    get license(): License | undefined;
    set license(licenseElement: License | undefined);
    get contact(): Contact | undefined;
    set contact(contactElement: Contact | undefined);
}

declare class Channels extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class Servers extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class Tags extends ArrayElement {
    constructor(content?: unknown[], meta?: Meta, attributes?: Attributes);
}

declare class ExternalDocumentation extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get url(): StringElement | undefined;
    set url(url: StringElement | undefined);
}

declare class AsyncApi2 extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get asyncapi(): AsyncApiVersion | undefined;
    set asyncapi(asyncapi: AsyncApiVersion | undefined);
    get idProp(): Identifier | undefined;
    set idProp(id: Identifier | undefined);
    get info(): Info | undefined;
    set info(info: Info | undefined);
    get servers(): Servers | undefined;
    set servers(servers: Servers | undefined);
    get defaultContentType(): DefaultContentType | undefined;
    set defaultContentType(defaultContentType: DefaultContentType | undefined);
    get channels(): Channels | undefined;
    set channels(channels: Channels | undefined);
    get components(): Components | undefined;
    set components(components: Components | undefined);
    get tags(): Tags | undefined;
    set tags(tags: Tags | undefined);
    get externalDocs(): ExternalDocumentation | undefined;
    set externalDocs(externalDocs: ExternalDocumentation | undefined);
}

declare class HttpChannelBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class Reference extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    set $ref($ref: StringElement | undefined);
    get $ref(): StringElement | undefined;
}

declare class Schema extends JSONSchemaElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    /**
     * Validation vocabulary
     *
     * URI: https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01
     */
    /**
     *  Validation Keywords for Applying Subschemas With Boolean Logic
     *
     *  URI: https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.7
     */
    get not(): this | BooleanElement | Reference | undefined | any;
    /**
     *  Validation Keywords for Applying Subschemas Conditionally
     *
     *  URI: https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.6
     */
    get if(): this | BooleanElement | Reference | undefined;
    set if(ifValue: this | BooleanElement | Reference | undefined);
    get then(): this | BooleanElement | Reference | undefined;
    set then(then: this | BooleanElement | Reference | undefined);
    get else(): this | BooleanElement | Reference | undefined;
    set else(elseValue: this | BooleanElement | Reference | undefined);
    /**
     * Validation Keywords for Arrays
     *
     * URI: https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.4
     */
    get items(): this | BooleanElement | Reference | ArrayElement | undefined | any;
    set items(items: this | BooleanElement | Reference | ArrayElement | undefined | any);
    get additionalItems(): this | BooleanElement | Reference | undefined;
    set additionalItems(additionalItems: this | BooleanElement | Reference | undefined);
    get containsProp(): this | BooleanElement | Reference | undefined;
    set containsProp(contains: this | BooleanElement | Reference | undefined);
    /**
     * Validation Keywords for Objects
     *
     * URI: https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.5
     */
    get propertyNames(): this | BooleanElement | Reference | undefined;
    set propertyNames(propertyNames: this | BooleanElement | Reference | undefined);
    /**
     * AsyncAPI vocabulary
     *
     * URI: https://github.com/asyncapi/spec/blob/master/spec/asyncapi.md#fixed-fields-21
     */
    get discriminator(): StringElement | undefined;
    get externalDocs(): ExternalDocumentation | undefined;
    get deprecated(): BooleanElement | undefined;
}

declare class WebSocketChannelBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get method(): StringElement | undefined;
    set method(method: StringElement | undefined);
    get query(): Schema | Reference | undefined;
    set query(query: Schema | Reference | undefined);
    get headers(): Schema | Reference | undefined;
    set headers(headers: Schema | Reference | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

declare class KafkaChannelBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get topic(): StringElement | undefined;
    set topic(topic: StringElement | undefined);
    get partitions(): NumberElement | undefined;
    set partitions(partitions: NumberElement | undefined);
    get replicas(): NumberElement | undefined;
    set replicas(replicas: NumberElement | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

declare class AnypointmqChannelBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get destination(): StringElement | undefined;
    set destination(destination: StringElement | undefined);
    get destinationType(): StringElement | undefined;
    set destinationType(destinationType: StringElement | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

declare class AmqpChannelBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get is(): StringElement | undefined;
    set is(is: StringElement | undefined);
    get exchange(): ObjectElement | undefined;
    set exchange(exchange: ObjectElement | undefined);
    get queue(): ObjectElement | undefined;
    set queue(queue: ObjectElement | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

declare class Amqp1ChannelBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class MqttChannelBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class Mqtt5ChannelBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class NatsChannelBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class JmsChannelBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class SnsChannelBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class SolaceChannelBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class SqsChannelBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class StompChannelBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class RedisChannelBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class MercureChannelBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class IbmmqChannelBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get destinationType(): StringElement | undefined;
    set destinationType(destinationType: StringElement | undefined);
    get queue(): ObjectElement | undefined;
    set queue(queue: ObjectElement | undefined);
    get topic(): ObjectElement | undefined;
    set topic(topic: ObjectElement | undefined);
    get maxMsgLength(): NumberElement | undefined;
    set maxMsgLength(maxMsgLength: NumberElement | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

declare class GooglepubsubChannelBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
    get labels(): ObjectElement | undefined;
    set labels(labels: ObjectElement | undefined);
    get messageRetentionDuration(): StringElement | undefined;
    set messageRetentionDuration(messageRetentionDuration: StringElement | undefined);
    get messageStoragePolicy(): ObjectElement | undefined;
    set messageStoragePolicy(messageStoragePolicy: ObjectElement | undefined);
    get schemaSettings(): ObjectElement | undefined;
    set schemaSettings(schemaSettings: ObjectElement | undefined);
    get topic(): StringElement | undefined;
    set topic(topic: StringElement | undefined);
}

declare class ChannelBindings extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get http(): HttpChannelBinding | undefined;
    set http(http: HttpChannelBinding | undefined);
    get ws(): WebSocketChannelBinding | undefined;
    set ws(ws: WebSocketChannelBinding | undefined);
    get kafka(): KafkaChannelBinding | undefined;
    set kafka(kafka: KafkaChannelBinding | undefined);
    get anypointmq(): AnypointmqChannelBinding | undefined;
    set anypointmq(anypointmq: AnypointmqChannelBinding | undefined);
    get amqp(): AmqpChannelBinding | undefined;
    set amqp(amqp: AmqpChannelBinding | undefined);
    get amqp1(): Amqp1ChannelBinding | undefined;
    set amqp1(amqp1: Amqp1ChannelBinding | undefined);
    get mqtt(): MqttChannelBinding | undefined;
    set mqtt(mqtt: MqttChannelBinding | undefined);
    get mqtt5(): Mqtt5ChannelBinding | undefined;
    set mqtt5(mqtt5: Mqtt5ChannelBinding | undefined);
    get nats(): NatsChannelBinding | undefined;
    set nats(nats: NatsChannelBinding | undefined);
    get jms(): JmsChannelBinding | undefined;
    set jms(jms: JmsChannelBinding | undefined);
    get sns(): SnsChannelBinding | undefined;
    set sns(sns: SnsChannelBinding | undefined);
    get solace(): SolaceChannelBinding | undefined;
    set solace(solace: SolaceChannelBinding | undefined);
    get sqs(): SqsChannelBinding | undefined;
    set sqs(sqs: SqsChannelBinding | undefined);
    get stomp(): StompChannelBinding | undefined;
    set stomp(stomp: StompChannelBinding | undefined);
    get redis(): RedisChannelBinding | undefined;
    set redis(redis: RedisChannelBinding | undefined);
    get mercure(): MercureChannelBinding | undefined;
    set mercure(mercure: MercureChannelBinding | undefined);
    get googlepubsub(): GooglepubsubChannelBinding | undefined;
    set googlepubsub(googlepubsub: GooglepubsubChannelBinding | undefined);
    get ibmmq(): IbmmqChannelBinding | undefined;
    set ibmmq(ibmmq: IbmmqChannelBinding | undefined);
}

declare class HttpOperationBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get type(): StringElement | undefined;
    set type(type: StringElement | undefined);
    get method(): StringElement | undefined;
    set method(method: StringElement | undefined);
    get query(): Schema | Reference | undefined;
    set query(query: Schema | Reference | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

declare class WebSocketOperationBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class KafkaOperationBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get groupId(): Schema | Reference | undefined;
    set groupId(groupId: Schema | Reference | undefined);
    get clientId(): Schema | Reference | undefined;
    set clientId(clientId: Schema | Reference | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

declare class AnypointmqOperationBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class AmqpOperationBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get expiration(): NumberElement | undefined;
    set expiration(expiration: NumberElement | undefined);
    get userId(): StringElement | undefined;
    set userId(userId: StringElement | undefined);
    get cc(): ArrayElement | undefined;
    set cc(cc: ArrayElement | undefined);
    get priority(): NumberElement | undefined;
    set priority(priority: NumberElement | undefined);
    get deliveryMode(): NumberElement | undefined;
    set deliveryMode(deliveryMode: NumberElement | undefined);
    get mandatory(): BooleanElement | undefined;
    set mandatory(mandatory: BooleanElement | undefined);
    get bcc(): ArrayElement | undefined;
    set bcc(bcc: ArrayElement | undefined);
    get replyTo(): StringElement | undefined;
    set replyTo(replyTo: StringElement | undefined);
    get timestamp(): BooleanElement | undefined;
    set timestamp(timestamp: BooleanElement | undefined);
    get ack(): BooleanElement | undefined;
    set ack(ack: BooleanElement | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

declare class Amqp1OperationBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class MqttOperationBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get qos(): NumberElement | undefined;
    set qos(qos: NumberElement | undefined);
    get retain(): BooleanElement | undefined;
    set retain(retain: BooleanElement | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

declare class Mqtt5OperationBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class NatsOperationBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get queue(): StringElement | undefined;
    set queue(queue: StringElement | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

declare class JmsOperationBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class SnsOperationBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class SolaceOperationBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
    get destinations(): ArrayElement | undefined;
    set destinations(destinations: ArrayElement | undefined);
}

declare class SqsOperationBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class StompOperationBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class RedisOperationBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class MercureOperationBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class IbmmqOperationBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class GooglepubsubOperationBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class OperationBindings extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get http(): HttpOperationBinding | undefined;
    set http(http: HttpOperationBinding | undefined);
    get ws(): WebSocketOperationBinding | undefined;
    set ws(ws: WebSocketOperationBinding | undefined);
    get kafka(): KafkaOperationBinding | undefined;
    set kafka(kafka: KafkaOperationBinding | undefined);
    get anypointmq(): AnypointmqOperationBinding | undefined;
    set anypointmq(anypointmq: AnypointmqOperationBinding | undefined);
    get amqp(): AmqpOperationBinding | undefined;
    set amqp(amqp: AmqpOperationBinding | undefined);
    get amqp1(): Amqp1OperationBinding | undefined;
    set amqp1(amqp1: Amqp1OperationBinding | undefined);
    get mqtt(): MqttOperationBinding | undefined;
    set mqtt(mqtt: MqttOperationBinding | undefined);
    get mqtt5(): Mqtt5OperationBinding | undefined;
    set mqtt5(mqtt5: Mqtt5OperationBinding | undefined);
    get nats(): NatsOperationBinding | undefined;
    set nats(nats: NatsOperationBinding | undefined);
    get jms(): JmsOperationBinding | undefined;
    set jms(jms: JmsOperationBinding | undefined);
    get sns(): SnsOperationBinding | undefined;
    set sns(sns: SnsOperationBinding | undefined);
    get solace(): SolaceOperationBinding | undefined;
    set solace(solace: SolaceOperationBinding | undefined);
    get sqs(): SqsOperationBinding | undefined;
    set sqs(sqs: SqsOperationBinding | undefined);
    get stomp(): StompOperationBinding | undefined;
    set stomp(stomp: StompOperationBinding | undefined);
    get redis(): RedisOperationBinding | undefined;
    set redis(redis: RedisOperationBinding | undefined);
    get mercure(): MercureOperationBinding | undefined;
    set mercure(mercure: MercureOperationBinding | undefined);
    get googlepubsub(): GooglepubsubOperationBinding | undefined;
    set googlepubsub(googlepubsub: GooglepubsubOperationBinding | undefined);
    get ibmmq(): IbmmqOperationBinding | undefined;
    set ibmmq(ibmmq: IbmmqOperationBinding | undefined);
}

declare class CorrelationID extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get location(): StringElement | undefined;
    set location(location: StringElement | undefined);
}

declare class HttpMessageBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get headers(): Schema | Reference | undefined;
    set headers(headers: Schema | Reference | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

declare class WebSocketMessageBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class KafkaMessageBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get key(): Schema | Reference | undefined;
    set key(key: Schema | Reference | undefined);
    get schemaIdLocation(): StringElement | undefined;
    set schemaIdLocation(schemaIdLocation: StringElement | undefined);
    get schemaIdPayloadEncoding(): StringElement | undefined;
    set schemaIdPayloadEncoding(schemaIdPayloadEncoding: StringElement | undefined);
    get schemaLookupStrategy(): StringElement | undefined;
    set schemaLookupStrategy(schemaLookupStrategy: StringElement | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

declare class AnypointmqMessageBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get headers(): Schema | Reference | undefined;
    set headers(headers: Schema | Reference | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

declare class AmqpMessageBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get contentEncoding(): StringElement | undefined;
    set contentEncoding(contentEncoding: StringElement | undefined);
    get messageType(): StringElement | undefined;
    set messageType(messageType: StringElement | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

declare class Amqp1MessageBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class MqttMessageBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

declare class Mqtt5MessageBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class NatsMessageBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class JmsMessageBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class SnsMessageBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class SolaceMessageBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class SqsMessageBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class StompMessageBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class RedisMessageBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class MercureMessageBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class IbmmqMessageBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get type(): StringElement | undefined;
    set type(type: StringElement | undefined);
    get headers(): StringElement | undefined;
    set headers(headers: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get expiry(): NumberElement | undefined;
    set expiry(expiry: NumberElement | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

declare class GooglepubsubMessageBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
    get attributesProp(): ObjectElement | undefined;
    set attributesProp(attributes: ObjectElement | undefined);
    get orderingKey(): StringElement | undefined;
    set orderingKey(orderingKey: StringElement | undefined);
    get schema(): ObjectElement | undefined;
    set schema(schema: ObjectElement | undefined);
}

declare class MessageBindings extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get http(): HttpMessageBinding | undefined;
    set http(http: HttpMessageBinding | undefined);
    get ws(): WebSocketMessageBinding | undefined;
    set ws(ws: WebSocketMessageBinding | undefined);
    get kafka(): KafkaMessageBinding | undefined;
    set kafka(kafka: KafkaMessageBinding | undefined);
    get anypointmq(): AnypointmqMessageBinding | undefined;
    set anypointmq(anypointmq: AnypointmqMessageBinding | undefined);
    get amqp(): AmqpMessageBinding | undefined;
    set amqp(amqp: AmqpMessageBinding | undefined);
    get amqp1(): Amqp1MessageBinding | undefined;
    set amqp1(amqp1: Amqp1MessageBinding | undefined);
    get mqtt(): MqttMessageBinding | undefined;
    set mqtt(mqtt: MqttMessageBinding | undefined);
    get mqtt5(): Mqtt5MessageBinding | undefined;
    set mqtt5(mqtt5: Mqtt5MessageBinding | undefined);
    get nats(): NatsMessageBinding | undefined;
    set nats(nats: NatsMessageBinding | undefined);
    get jms(): JmsMessageBinding | undefined;
    set jms(jms: JmsMessageBinding | undefined);
    get sns(): SnsMessageBinding | undefined;
    set sns(sns: SnsMessageBinding | undefined);
    get solace(): SolaceMessageBinding | undefined;
    set solace(solace: SolaceMessageBinding | undefined);
    get sqs(): SqsMessageBinding | undefined;
    set sqs(sqs: SqsMessageBinding | undefined);
    get stomp(): StompMessageBinding | undefined;
    set stomp(stomp: StompMessageBinding | undefined);
    get redis(): RedisMessageBinding | undefined;
    set redis(redis: RedisMessageBinding | undefined);
    get mercure(): MercureMessageBinding | undefined;
    set mercure(mercure: MercureMessageBinding | undefined);
    get googlepubsub(): GooglepubsubMessageBinding | undefined;
    set googlepubsub(googlepubsub: GooglepubsubMessageBinding | undefined);
    get ibmmq(): IbmmqMessageBinding | undefined;
    set ibmmq(ibmmq: IbmmqMessageBinding | undefined);
}

declare class Message extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get messageId(): StringElement | undefined;
    set messageId(messageId: StringElement | undefined);
    get headers(): Schema | Reference | undefined;
    set headers(headers: Schema | Reference | undefined);
    get payload(): Schema | Reference | Element | undefined;
    set payload(payload: Schema | Reference | Element | undefined);
    get correlationId(): CorrelationID | Reference | undefined;
    set correlationId(correlationId: CorrelationID | Reference | undefined);
    get schemaFormat(): StringElement;
    set schemaFormat(schemaFormat: StringElement);
    get contentType(): StringElement;
    set contentType(contentType: StringElement);
    get name(): StringElement;
    set name(name: StringElement);
    get title(): StringElement;
    set title(title: StringElement);
    get summary(): StringElement;
    set summary(summary: StringElement);
    get description(): StringElement;
    set description(description: StringElement);
    get tags(): Tags | undefined;
    set tags(tags: Tags | undefined);
    get externalDocs(): ExternalDocumentation | undefined;
    set externalDocs(externalDocs: ExternalDocumentation | undefined);
    get bindings(): MessageBindings | Reference | undefined;
    set bindings(bindings: MessageBindings | Reference | undefined);
    get examples(): ArrayElement | undefined;
    set examples(examples: ArrayElement | undefined);
    get traits(): ArrayElement | undefined;
    set traits(traits: ArrayElement | undefined);
}

declare class Operation extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get operationId(): StringElement | undefined;
    set operationId(operationId: StringElement | undefined);
    get summary(): StringElement | undefined;
    set summary(summary: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get security(): ArrayElement | undefined;
    set security(security: ArrayElement | undefined);
    get tags(): Tags | undefined;
    set tags(tags: Tags | undefined);
    get externalDocs(): ExternalDocumentation | undefined;
    set externalDocs(externalDocs: ExternalDocumentation | undefined);
    get bindings(): OperationBindings | Reference | undefined;
    set bindings(bindings: OperationBindings | Reference | undefined);
    get traits(): ArrayElement | undefined;
    set traits(traits: ArrayElement | undefined);
    get message(): Message | Reference | ObjectElement | undefined;
    set message(message: Message | Reference | ObjectElement | undefined);
}

declare class Parameters extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class ChannelItem extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get $ref(): StringElement | undefined;
    set $ref($ref: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get servers(): ArrayElement | undefined;
    set servers(servers: ArrayElement | undefined);
    get subscribe(): Operation | undefined;
    set subscribe(subscribe: Operation | undefined);
    get publish(): Operation | undefined;
    set publish(publish: Operation | undefined);
    get parameters(): Parameters | undefined;
    set parameters(parameters: Parameters | undefined);
    get bindings(): ChannelBindings | undefined;
    set bindings(bindings: ChannelBindings | undefined);
}

declare class Parameter extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get schema(): Schema | Reference | undefined;
    set schema(schema: Schema | Reference | undefined);
    get location(): StringElement | undefined;
    set location(location: StringElement | undefined);
}

declare class SecurityRequirement extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class HttpServerBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class WebSocketServerBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class KafkaServerBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get schemaRegistryUrl(): StringElement | undefined;
    set schemaRegistryUrl(schemaRegistryUrl: StringElement | undefined);
    get schemaRegistryVendor(): StringElement | undefined;
    set schemaRegistryVendor(schemaRegistryVendor: StringElement | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

declare class AnypointmqServerBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class AmqpServerBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class Amqp1ServerBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class MqttServerBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get clientId(): StringElement | undefined;
    set clientId(clientId: StringElement | undefined);
    get cleanSession(): BooleanElement | undefined;
    set cleanSession(cleanSession: BooleanElement | undefined);
    get lastWill(): ObjectElement | undefined;
    set lastWill(lastWill: ObjectElement | undefined);
    get keepAlive(): NumberElement | undefined;
    set keepAlive(keepAlive: NumberElement | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

declare class Mqtt5ServerBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class NatsServerBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class JmsServerBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class SnsServerBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class SolaceServerBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
    get msgVpn(): StringElement | undefined;
    set msgVpn(msgVpn: StringElement | undefined);
}

declare class SqsServerBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class StompServerBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class RedisServerBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class MercureServerBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class IbmmqServerBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get groupId(): StringElement | undefined;
    set groupId(groupId: StringElement | undefined);
    get ccdtQueueManagerName(): StringElement | undefined;
    set ccdtQueueManagerName(ccdtQueueManagerName: StringElement | undefined);
    get cipherSpec(): StringElement | undefined;
    set cipherSpec(cipherSpec: StringElement | undefined);
    get multiEndpointServer(): BooleanElement | undefined;
    set multiEndpointServer(multiEndpointServer: BooleanElement | undefined);
    get heartBeatInterval(): NumberElement | undefined;
    set heartBeatInterval(heartBeatInterval: NumberElement | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

declare class GooglepubsubServerBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class ServerBindings extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get http(): HttpServerBinding | undefined;
    set http(http: HttpServerBinding | undefined);
    get ws(): WebSocketServerBinding | undefined;
    set ws(ws: WebSocketServerBinding | undefined);
    get kafka(): KafkaServerBinding | undefined;
    set kafka(kafka: KafkaServerBinding | undefined);
    get anypointmq(): AnypointmqServerBinding | undefined;
    set anypointmq(anypointmq: AnypointmqServerBinding | undefined);
    get amqp(): AmqpServerBinding | undefined;
    set amqp(amqp: AmqpServerBinding | undefined);
    get amqp1(): Amqp1ServerBinding | undefined;
    set amqp1(amqp1: Amqp1ServerBinding | undefined);
    get mqtt(): MqttServerBinding | undefined;
    set mqtt(mqtt: MqttServerBinding | undefined);
    get mqtt5(): Mqtt5ServerBinding | undefined;
    set mqtt5(mqtt5: Mqtt5ServerBinding | undefined);
    get nats(): NatsServerBinding | undefined;
    set nats(nats: NatsServerBinding | undefined);
    get jms(): JmsServerBinding | undefined;
    set jms(jms: JmsServerBinding | undefined);
    get sns(): SnsServerBinding | undefined;
    set sns(sns: SnsServerBinding | undefined);
    get solace(): SolaceServerBinding | undefined;
    set solace(solace: SolaceServerBinding | undefined);
    get sqs(): SqsServerBinding | undefined;
    set sqs(sqs: SqsServerBinding | undefined);
    get stomp(): StompServerBinding | undefined;
    set stomp(stomp: StompServerBinding | undefined);
    get redis(): RedisServerBinding | undefined;
    set redis(redis: RedisServerBinding | undefined);
    get mercure(): MercureServerBinding | undefined;
    set mercure(mercure: MercureServerBinding | undefined);
    get googlepubsub(): GooglepubsubServerBinding | undefined;
    set googlepubsub(googlepubsub: GooglepubsubServerBinding | undefined);
    get ibmmq(): IbmmqServerBinding | undefined;
    set ibmmq(ibmmq: IbmmqServerBinding | undefined);
}

declare class Server extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get url(): StringElement | undefined;
    set url(url: StringElement | undefined);
    get protocol(): StringElement | undefined;
    set protocol(protocol: StringElement | undefined);
    get protocolVersion(): StringElement | undefined;
    set protocolVersion(protocolVersion: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get variables(): ObjectElement | undefined;
    set variables(variables: ObjectElement | undefined);
    get tags(): ArrayElement | undefined;
    set tags(tags: ArrayElement | undefined);
    get security(): ArrayElement | undefined;
    set security(security: ArrayElement | undefined);
    get bindings(): ServerBindings | undefined;
    set bindings(bindings: ServerBindings | undefined);
}

declare class ServerVariable extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get enum(): ArrayElement | undefined;
    set enum(value: ArrayElement | undefined);
    get default(): StringElement | undefined;
    set default(value: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get examples(): ArrayElement | undefined;
    set examples(examples: ArrayElement | undefined);
}

declare const isAsyncApi2Element: ElementPredicate<AsyncApi2>;
declare const isAsyncApiVersionElement: ElementPredicate<AsyncApiVersion>;
declare const isChannelBindingsElement: ElementPredicate<ChannelBindings>;
declare const isChannelItemElement: ElementPredicate<ChannelItem>;
declare const isChannelsElement: ElementPredicate<Channels>;
declare const isComponentsElement: ElementPredicate<Components>;
declare const isContactElement: ElementPredicate<Contact>;
declare const isIdentifierElement: ElementPredicate<Identifier>;
declare const isInfoElement: ElementPredicate<Info>;
declare const isLicenseElement: ElementPredicate<License>;
declare const isOperationElement: ElementPredicate<Operation>;
declare const isParameterElement: ElementPredicate<Parameter>;
declare const isParametersElement: ElementPredicate<Parameters>;
declare const isReferenceElement: ElementPredicate<Reference>;
declare const isSchemaElement: ElementPredicate<Schema>;
declare const isBooleanJsonSchemaElement: ElementPredicate<BooleanElement>;
declare const isSecurityRequirementElement: ElementPredicate<SecurityRequirement>;
declare const isServerElement: ElementPredicate<Server>;
declare const isServerBindingsElement: ElementPredicate<ServerBindings>;
declare const isServersElement: ElementPredicate<Servers>;
declare const isServerVariableElement: ElementPredicate<ServerVariable>;

interface ReferenceLikeElement extends ObjectElement$1 {
    hasKey: (value: '$ref') => true;
}
declare const isReferenceLikeElement: (element: unknown) => element is ReferenceLikeElement;
declare const isAsyncApiExtension: (element: MemberElement) => boolean;

interface VisitorOptions {
}
declare class Visitor {
    element: Element$1;
    constructor(options: VisitorOptions);
    copyMetaAndAttributes(from: Element$1, to: Element$1): void;
}

declare class FallbackVisitor extends Visitor {
    enter(element: Element$1): {};
}

declare class SpecificationExtensionVisitor extends SpecificationVisitor {
    element: MemberElement;
    MemberElement(memberElement: MemberElement): {};
}

type SpecPath<T = string[]> = (element: unknown) => T;
interface FixedFieldsVisitorOptions extends SpecificationVisitorOptions {
    readonly specPath: SpecPath;
    readonly ignoredFields?: string[];
    readonly canSupportSpecificationExtensions?: boolean;
    readonly specificationExtensionPredicate?: typeof isAsyncApiExtension;
}
declare class FixedFieldsVisitor extends SpecificationVisitor {
    protected specPath: SpecPath;
    protected ignoredFields: string[];
    protected canSupportSpecificationExtensions: boolean;
    protected specificationExtensionPredicate: (element: MemberElement) => boolean;
    constructor({ specPath, ignoredFields, canSupportSpecificationExtensions, specificationExtensionPredicate, ...rest }: FixedFieldsVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

interface AsyncApi2VisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const AsyncApi2Visitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class AsyncApi2Visitor extends AsyncApi2Visitor_base {
    readonly element: AsyncApi2;
    protected readonly specPath: SpecPath<['document', 'objects', 'AsyncApi']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: AsyncApi2VisitorOptions);
}

interface AsyncApiVersionVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const AsyncApiVersionVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class AsyncApiVersionVisitor extends AsyncApiVersionVisitor_base {
    element: AsyncApiVersion;
    StringElement(stringElement: StringElement): {};
}

interface IdentifierVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const IdentifierVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class IdentifierVisitor extends IdentifierVisitor_base {
    element: Identifier;
    StringElement(stringElement: StringElement): {};
}

interface InfoVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const InfoVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class InfoVisitor extends InfoVisitor_base {
    readonly element: Info;
    protected readonly specPath: SpecPath<['document', 'objects', 'Info']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: InfoVisitorOptions);
}

declare class VersionVisitor extends FallbackVisitor {
    element: StringElement;
    StringElement(stringElement: StringElement): {};
}

interface ContactVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const ContactVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class ContactVisitor extends ContactVisitor_base {
    readonly element: Contact;
    protected readonly specPath: SpecPath<['document', 'objects', 'Contact']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: ContactVisitorOptions);
}

interface CorrelationIDVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const CorrelationIDVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class CorrelationIDVisitor extends CorrelationIDVisitor_base {
    readonly element: CorrelationID;
    protected readonly specPath: SpecPath<['document', 'objects', 'CorrelationID']>;
    constructor(options: CorrelationIDVisitorOptions);
}

interface DefaultContentTypeVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const DefaultContentTypeVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class DefaultContentTypeVisitor extends DefaultContentTypeVisitor_base {
    element: DefaultContentType;
    StringElement(stringElement: StringElement): {};
}

interface LicenseVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const LicenseVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class LicenseVisitor extends LicenseVisitor_base {
    readonly element: License;
    protected readonly specPath: SpecPath<['document', 'objects', 'License']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: LicenseVisitorOptions);
}

declare class OAuthFlow extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get authorizationUrl(): StringElement | undefined;
    set authorizationUrl(authorizationUrl: StringElement | undefined);
    get tokenUrl(): StringElement | undefined;
    set tokenUrl(tokenUrl: StringElement | undefined);
    get refreshUrl(): StringElement | undefined;
    set refreshUrl(refreshUrl: StringElement | undefined);
    get scopes(): ObjectElement | undefined;
    set scopes(scopes: ObjectElement | undefined);
}

declare class OAuthFlows extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get implicit(): OAuthFlow | undefined;
    set implicit(implicit: OAuthFlow | undefined);
    get password(): OAuthFlow | undefined;
    set password(password: OAuthFlow | undefined);
    get clientCredentials(): OAuthFlow | undefined;
    set clientCredentials(clientCredentials: OAuthFlow | undefined);
    get authorizationCode(): OAuthFlow | undefined;
    set authorizationCode(authorizationCode: OAuthFlow | undefined);
}

interface OAuthFlowsVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const OAuthFlowsVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class OAuthFlowsVisitor extends OAuthFlowsVisitor_base {
    readonly element: OAuthFlows;
    protected readonly specPath: SpecPath<['document', 'objects', 'OAuthFlows']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: OAuthFlowsVisitorOptions);
}

interface OAuthFlowVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const OAuthFlowVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class OAuthFlowVisitor extends OAuthFlowVisitor_base {
    readonly element: OAuthFlow;
    protected readonly specPath: SpecPath<['document', 'objects', 'OAuthFlow']>;
    constructor(options: OAuthFlowVisitorOptions);
}

declare class OAuthFlowScopes extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface PatternedFieldsVisitorOptions extends SpecificationVisitorOptions {
    readonly specPath: SpecPath;
    readonly ignoredFields?: string[];
    readonly fieldPatternPredicate?: (...args: unknown[]) => boolean;
    readonly canSupportSpecificationExtensions?: boolean;
    readonly specificationExtensionPredicate?: typeof isAsyncApiExtension;
}
declare class PatternedFieldsVisitor extends SpecificationVisitor {
    protected specPath: SpecPath;
    protected ignoredFields: string[];
    protected fieldPatternPredicate: (value: unknown) => boolean;
    protected canSupportSpecificationExtensions: boolean;
    protected specificationExtensionPredicate: (element: MemberElement) => boolean;
    constructor({ specPath, ignoredFields, fieldPatternPredicate, canSupportSpecificationExtensions, specificationExtensionPredicate, ...rest }: PatternedFieldsVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

interface MapVisitorOptions extends PatternedFieldsVisitorOptions {
}
declare class MapVisitor extends PatternedFieldsVisitor {
    constructor(options: MapVisitorOptions);
}

interface ScopesVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const ScopesVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ScopesVisitor extends ScopesVisitor_base {
    readonly element: OAuthFlowScopes;
    protected readonly specPath: SpecPath<['value']>;
    constructor(options: ScopesVisitorOptions);
}

interface ServersVisitorOptions$2 extends PatternedFieldsVisitorOptions, VisitorOptions {
}
declare const ServersVisitor_base$2: ts_mixer_dist_types_types.Class<any[], PatternedFieldsVisitor & FallbackVisitor, typeof PatternedFieldsVisitor & typeof FallbackVisitor>;
declare class ServersVisitor$2 extends ServersVisitor_base$2 {
    readonly element: Servers;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'Server']>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: ServersVisitorOptions$2);
    ObjectElement(objectElement: ObjectElement): {};
}

interface ServerVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const ServerVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class ServerVisitor extends ServerVisitor_base {
    readonly element: Server;
    protected readonly specPath: SpecPath<['document', 'objects', 'Server']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: ServerVisitorOptions);
}

declare class UrlVisitor extends FallbackVisitor {
    readonly element: StringElement;
    StringElement(stringElement: StringElement): {};
}

interface BindingsVisitorOptions$5 extends AlternatingVisitorOptions, VisitorOptions {
}
declare const BindingsVisitor_base$5: ts_mixer_dist_types_types.Class<any[], AlternatingVisitor & FallbackVisitor, typeof AlternatingVisitor & typeof FallbackVisitor>;
declare class BindingsVisitor$5 extends BindingsVisitor_base$5 {
    constructor(options: BindingsVisitorOptions$5);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ServerVariables extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface VariablesVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const VariablesVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class VariablesVisitor extends VariablesVisitor_base {
    readonly element: ServerVariables;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'ServerVariable']>;
    constructor(options: VariablesVisitorOptions);
}

declare class ServerSecurity extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface SecurityVisitorOptions$2 extends SpecificationVisitorOptions, VisitorOptions {
}
declare const SecurityVisitor_base$2: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class SecurityVisitor$2 extends SecurityVisitor_base$2 {
    readonly element: ServerSecurity;
    constructor(options: SecurityVisitorOptions$2);
    ArrayElement(arrayElement: ArrayElement): {};
}

interface ServerVariableVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const ServerVariableVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class ServerVariableVisitor extends ServerVariableVisitor_base {
    readonly element: ServerVariable;
    protected readonly specPath: SpecPath<['document', 'objects', 'ServerVariable']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: ServerVariableVisitorOptions);
}

interface ServerBindingsVisitorOptions$1 extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const ServerBindingsVisitor_base$1: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class ServerBindingsVisitor$1 extends ServerBindingsVisitor_base$1 {
    readonly element: ServerBindings;
    protected readonly specPath: SpecPath<['document', 'objects', 'ServerBindings']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: ServerBindingsVisitorOptions$1);
}

declare class SecurityScheme extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get type(): StringElement | undefined;
    set type(type: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get name(): StringElement | undefined;
    set name(name: StringElement | undefined);
    get in(): StringElement | undefined;
    set in(inVal: StringElement | undefined);
    get scheme(): StringElement | undefined;
    set scheme(scheme: StringElement | undefined);
    get bearerFormat(): StringElement | undefined;
    set bearerFormat(bearerFormat: StringElement | undefined);
    get flows(): OAuthFlows | undefined;
    set flows(flows: OAuthFlows | undefined);
    get openIdConnectUrl(): StringElement | undefined;
    set openIdConnectUrl(openIdConnectUrl: StringElement | undefined);
}

interface SecuritySchemeVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const SecuritySchemeVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class SecuritySchemeVisitor extends SecuritySchemeVisitor_base {
    readonly element: SecurityScheme;
    protected readonly specPath: SpecPath<['document', 'objects', 'SecurityScheme']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: SecuritySchemeVisitorOptions);
}

interface SecurityRequirementVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const SecurityRequirementVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class SecurityRequirementVisitor extends SecurityRequirementVisitor_base {
    readonly element: SecurityRequirement;
    protected readonly specPath: SpecPath<['value']>;
    constructor(options: SecurityRequirementVisitorOptions);
}

interface ReferenceVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const ReferenceVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class ReferenceVisitor extends ReferenceVisitor_base {
    readonly element: Reference;
    protected readonly specPath: SpecPath<['document', 'objects', 'Reference']>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: ReferenceVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class $RefVisitor$1 extends FallbackVisitor {
    readonly element: StringElement;
    StringElement(stringElement: StringElement): {};
}

interface SchemaVisitorOptions$1 extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const SchemaVisitor_base$1: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class SchemaVisitor$1 extends SchemaVisitor_base$1 {
    element: Schema;
    protected readonly specPath: SpecPath<['document', 'objects', 'Schema']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: SchemaVisitorOptions$1);
    ObjectElement(objectElement: ObjectElement): {};
    BooleanElement(booleanElement: BooleanElement): {};
}

declare const JSONSchemaOrJSONReferenceVisitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor;
declare class SchemaOrReferenceVisitor extends JSONSchemaOrJSONReferenceVisitor {
    element: Schema | Reference;
    enter(element: Element$1): {};
}

declare const JSONSchemaAllOfVisitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.AllOfVisitor;
declare class AllOfVisitor extends JSONSchemaAllOfVisitor {
    ArrayElement(arrayElement: ArrayElement): {};
}

declare const JSONSchemaAnyOfVisitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.AnyOfVisitor;
declare class AnyOfVisitor extends JSONSchemaAnyOfVisitor {
    ArrayElement(arrayElement: ArrayElement): {};
}

declare const JSONSchemaOneOfVisitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.OneOfVisitor;
declare class OneOfVisitor extends JSONSchemaOneOfVisitor {
    ArrayElement(arrayElement: ArrayElement): {};
}

declare const JSONSchemaDefinitionsVisitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor;
declare class DefinitionsVisitor extends JSONSchemaDefinitionsVisitor {
    ObjectElement(objectElement: ObjectElement): {};
}

declare const JSONSchemaDependenciesVisitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor;
declare class DependenciesVisitor extends JSONSchemaDependenciesVisitor {
    ObjectElement(objectElement: ObjectElement): {};
}

declare const JSONSchemaItemsVisitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor;
declare class ItemsVisitor extends JSONSchemaItemsVisitor {
    ObjectElement(objectElement: ObjectElement): {};
    ArrayElement(arrayElement: ArrayElement): {};
}

declare const JSONSchemaPatternPropertiesVisitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor;
declare class PatternPropertiesVisitor extends JSONSchemaPatternPropertiesVisitor {
    ObjectElement(objectElement: ObjectElement): {};
}

declare const JSONSchemaPropertiesVisitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor;
declare class PropertiesVisitor extends JSONSchemaPropertiesVisitor {
    ObjectElement(objectElement: ObjectElement): {};
}

interface ParametersVisitorOptions$1 extends PatternedFieldsVisitorOptions, VisitorOptions {
}
declare const ParametersVisitor_base$1: ts_mixer_dist_types_types.Class<any[], PatternedFieldsVisitor & FallbackVisitor, typeof PatternedFieldsVisitor & typeof FallbackVisitor>;
declare class ParametersVisitor$1 extends ParametersVisitor_base$1 {
    readonly element: Parameters;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'Parameter'] | ['value']>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: ParametersVisitorOptions$1);
    ObjectElement(objectElement: ObjectElement): {};
}

interface ParameterVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const ParameterVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class ParameterVisitor extends ParameterVisitor_base {
    readonly element: Parameter;
    protected readonly specPath: SpecPath<['document', 'objects', 'Parameter']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: ParameterVisitorOptions);
}

interface SchemaVisitorOptions extends AlternatingVisitorOptions, VisitorOptions {
}
declare const SchemaVisitor_base: ts_mixer_dist_types_types.Class<any[], AlternatingVisitor & FallbackVisitor, typeof AlternatingVisitor & typeof FallbackVisitor>;
declare class SchemaVisitor extends SchemaVisitor_base {
    constructor(options: SchemaVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

interface ExternalDocumentationVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const ExternalDocumentationVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class ExternalDocumentationVisitor extends ExternalDocumentationVisitor_base {
    readonly element: ExternalDocumentation;
    protected readonly specPath: SpecPath<['document', 'objects', 'ExternalDocumentation']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: ExternalDocumentationVisitorOptions);
}

interface ComponentsVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const ComponentsVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class ComponentsVisitor extends ComponentsVisitor_base {
    readonly element: Components;
    protected readonly specPath: SpecPath<['document', 'objects', 'Components']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: ComponentsVisitorOptions);
}

declare class ComponentsSchemas extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface SchemasVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const SchemasVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class SchemasVisitor extends SchemasVisitor_base {
    readonly element: ComponentsSchemas;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'Schema']>;
    constructor(options: SchemasVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ComponentsServers extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface ServersVisitorOptions$1 extends MapVisitorOptions, VisitorOptions {
}
declare const ServersVisitor_base$1: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ServersVisitor$1 extends ServersVisitor_base$1 {
    readonly element: ComponentsServers;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'Server']>;
    constructor(options: ServersVisitorOptions$1);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ComponentsServerVariables extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface ServerVariablesVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const ServerVariablesVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ServerVariablesVisitor extends ServerVariablesVisitor_base {
    readonly element: ComponentsServerVariables;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'ServerVariable']>;
    constructor(options: ServerVariablesVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ComponentsChannels extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface ChannelsVisitorOptions$1 extends MapVisitorOptions, VisitorOptions {
}
declare const ChannelsVisitor_base$1: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ChannelsVisitor$1 extends ChannelsVisitor_base$1 {
    readonly element: ComponentsChannels;
    protected readonly specPath: SpecPath<['document', 'objects', 'ChannelItem']>;
    constructor(options: ChannelsVisitorOptions$1);
}

declare class ComponentsMessages extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface MessagesVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const MessagesVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class MessagesVisitor extends MessagesVisitor_base {
    readonly element: ComponentsMessages;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'Message']>;
    constructor(options: MessagesVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ComponentsSecuritySchemes extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface SecuritySchemesVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const SecuritySchemesVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class SecuritySchemesVisitor extends SecuritySchemesVisitor_base {
    element: ComponentsSecuritySchemes;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'SecurityScheme']>;
    constructor(options: SecuritySchemesVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ComponentsParameters extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface ParametersVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const ParametersVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ParametersVisitor extends ParametersVisitor_base {
    readonly element: ComponentsParameters;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'Parameter']>;
    constructor(options: ParametersVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ComponentsCorrelationIDs extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface CorrelationIdsVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const CorrelationIdsVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class CorrelationIdsVisitor extends CorrelationIdsVisitor_base {
    readonly element: ComponentsCorrelationIDs;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'CorrelationID']>;
    constructor(options: CorrelationIdsVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ComponentsOperationTraits extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface OperationTraitsVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const OperationTraitsVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class OperationTraitsVisitor extends OperationTraitsVisitor_base {
    readonly element: ComponentsOperationTraits;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'OperationTrait']>;
    constructor(options: OperationTraitsVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ComponentsMessageTraits extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface MessageTraitsVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const MessageTraitsVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class MessageTraitsVisitor extends MessageTraitsVisitor_base {
    readonly element: ComponentsMessageTraits;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'MessageTrait']>;
    constructor(options: MessageTraitsVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ComponentsServerBindings extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface ServerBindingsVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const ServerBindingsVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ServerBindingsVisitor extends ServerBindingsVisitor_base {
    element: ComponentsServerBindings;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'ServerBindings']>;
    constructor(options: ServerBindingsVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ComponentsChannelBindings extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface ChannelBindingsVisitorOptions$1 extends MapVisitorOptions, VisitorOptions {
}
declare const ChannelBindingsVisitor_base$1: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ChannelBindingsVisitor$1 extends ChannelBindingsVisitor_base$1 {
    readonly element: ComponentsChannelBindings;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'ChannelBindings']>;
    constructor(options: ChannelBindingsVisitorOptions$1);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ComponentsOperationBindings extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface OperationBindingsVisitorOptions$1 extends MapVisitorOptions, VisitorOptions {
}
declare const OperationBindingsVisitor_base$1: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class OperationBindingsVisitor$1 extends OperationBindingsVisitor_base$1 {
    readonly element: ComponentsOperationBindings;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'OperationBindings']>;
    constructor(options: OperationBindingsVisitorOptions$1);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ComponentsMessageBindings extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface MessageBindingsVisitorOptions$1 extends MapVisitorOptions, VisitorOptions {
}
declare const MessageBindingsVisitor_base$1: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class MessageBindingsVisitor$1 extends MessageBindingsVisitor_base$1 {
    element: ComponentsMessageBindings;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'MessageBindings']>;
    constructor(options: MessageBindingsVisitorOptions$1);
    ObjectElement(objectElement: ObjectElement): {};
}

interface OperationVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const OperationVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class OperationVisitor extends OperationVisitor_base {
    readonly element: Operation;
    protected readonly specPath: SpecPath<['document', 'objects', 'Operation']>;
    constructor(options: OperationVisitorOptions);
}

declare class OperationSecurity extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface SecurityVisitorOptions$1 extends SpecificationVisitorOptions, VisitorOptions {
}
declare const SecurityVisitor_base$1: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class SecurityVisitor$1 extends SecurityVisitor_base$1 {
    readonly element: OperationSecurity;
    constructor(options: SecurityVisitorOptions$1);
    ArrayElement(arrayElement: ArrayElement): {};
}

interface BindingsVisitorOptions$4 extends AlternatingVisitorOptions, VisitorOptions {
}
declare const BindingsVisitor_base$4: ts_mixer_dist_types_types.Class<any[], AlternatingVisitor & FallbackVisitor, typeof AlternatingVisitor & typeof FallbackVisitor>;
declare class BindingsVisitor$4 extends BindingsVisitor_base$4 {
    constructor(options: BindingsVisitorOptions$4);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class OperationTraits extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface TraitsVisitorOptions$1 extends SpecificationVisitorOptions, VisitorOptions {
}
declare const TraitsVisitor_base$1: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class TraitsVisitor$1 extends TraitsVisitor_base$1 {
    readonly element: OperationTraits;
    constructor(options: TraitsVisitorOptions$1);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class OperationMessageMap extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get oneOf(): ArrayElement | undefined;
    set oneOf(oneOf: ArrayElement | undefined);
}

interface MessageVisitorOptions$1 extends SpecificationVisitorOptions, VisitorOptions {
}
declare const MessageVisitor_base$1: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class MessageVisitor$1 extends MessageVisitor_base$1 {
    element: OperationMessageMap;
    ObjectElement(objectElement: ObjectElement): {};
}

interface TagsVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const TagsVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class TagsVisitor extends TagsVisitor_base {
    readonly element: Tags;
    constructor(options: TagsVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class Tag extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get name(): StringElement | undefined;
    set name(name: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get externalDocs(): ExternalDocumentation | undefined;
    set externalDocs(externalDocs: ExternalDocumentation | undefined);
}

interface TagVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const TagVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class TagVisitor extends TagVisitor_base {
    readonly element: Tag;
    protected readonly specPath: SpecPath<['document', 'objects', 'Tag']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: TagVisitorOptions);
}

interface ChannelsVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const ChannelsVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ChannelsVisitor extends ChannelsVisitor_base {
    readonly element: Channels;
    protected readonly specPath: SpecPath<['document', 'objects', 'ChannelItem']>;
    constructor(options: ChannelsVisitorOptions);
}

interface ChannelBindingsVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const ChannelBindingsVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class ChannelBindingsVisitor extends ChannelBindingsVisitor_base {
    readonly element: ChannelBindings;
    protected readonly specPath: SpecPath<['document', 'objects', 'ChannelBindings']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: ChannelBindingsVisitorOptions);
}

interface ChannelItemVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const ChannelItemVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class ChannelItemVisitor extends ChannelItemVisitor_base {
    readonly element: ChannelItem;
    protected readonly specPath: SpecPath<['document', 'objects', 'ChannelItem']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: ChannelItemVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class $RefVisitor extends FallbackVisitor {
    readonly element: StringElement;
    StringElement(stringElement: StringElement): {};
}

declare class ChannelItemServers extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface ServersVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const ServersVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class ServersVisitor extends ServersVisitor_base {
    readonly element: ChannelItemServers;
    constructor(options: ServersVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

interface BindingsVisitorOptions$3 extends AlternatingVisitorOptions, VisitorOptions {
}
declare const BindingsVisitor_base$3: ts_mixer_dist_types_types.Class<any[], AlternatingVisitor & FallbackVisitor, typeof AlternatingVisitor & typeof FallbackVisitor>;
declare class BindingsVisitor$3 extends BindingsVisitor_base$3 {
    constructor(options: BindingsVisitorOptions$3);
    ObjectElement(objectElement: ObjectElement): {};
}

interface MessageBindingsVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const MessageBindingsVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class MessageBindingsVisitor extends MessageBindingsVisitor_base {
    readonly element: MessageBindings;
    protected readonly specPath: SpecPath<['document', 'objects', 'MessageBindings']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: MessageBindingsVisitorOptions);
}

declare class MessageExample extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get headers(): ObjectElement | undefined;
    set headers(headers: ObjectElement | undefined);
    get payload(): Element | undefined;
    set payload(payload: Element | undefined);
    get name(): StringElement | undefined;
    set name(name: StringElement | undefined);
    get summary(): StringElement | undefined;
    set summary(summary: StringElement | undefined);
}

interface MessageExampleVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const MessageExampleVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class MessageExampleVisitor extends MessageExampleVisitor_base {
    readonly element: MessageExample;
    protected readonly specPath: SpecPath<['document', 'objects', 'MessageExample']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: MessageExampleVisitorOptions);
}

declare class MessageTrait extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get messageId(): StringElement | undefined;
    set messageId(messageId: StringElement | undefined);
    get headers(): Schema | Reference | undefined;
    set headers(headers: Schema | Reference | undefined);
    get correlationId(): CorrelationID | Reference | undefined;
    set correlationId(correlationId: CorrelationID | Reference | undefined);
    get schemaFormat(): StringElement | undefined;
    set schemaFormat(schemaFormat: StringElement | undefined);
    get contentType(): StringElement | undefined;
    set contentType(contentType: StringElement | undefined);
    get name(): StringElement | undefined;
    set name(name: StringElement | undefined);
    get title(): StringElement | undefined;
    set title(title: StringElement | undefined);
    get summary(): StringElement | undefined;
    set summary(summary: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get tags(): Tags | undefined;
    set tags(tags: Tags | undefined);
    get externalDocs(): ExternalDocumentation | undefined;
    set externalDocs(externalDocs: ExternalDocumentation | undefined);
    get bindings(): MessageBindings | Reference | undefined;
    set bindings(bindings: MessageBindings | Reference | undefined);
    get examples(): ArrayElement | undefined;
    set examples(examples: ArrayElement | undefined);
}

interface MessageTraitVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const MessageTraitVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class MessageTraitVisitor extends MessageTraitVisitor_base {
    readonly element: MessageTrait;
    protected readonly specPath: SpecPath<['document', 'objects', 'MessageTrait']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: MessageTraitVisitorOptions);
}

interface DefaultVisitorOptions extends AlternatingVisitorOptions, VisitorOptions {
}
declare const DefaultVisitor_base: ts_mixer_dist_types_types.Class<any[], AlternatingVisitor & FallbackVisitor, typeof AlternatingVisitor & typeof FallbackVisitor>;
declare class DefaultVisitor extends DefaultVisitor_base {
    constructor(options: DefaultVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

interface CorrelationIdVisitorOptions$1 extends AlternatingVisitorOptions, VisitorOptions {
}
declare const CorrelationIdVisitor_base$1: ts_mixer_dist_types_types.Class<any[], AlternatingVisitor & FallbackVisitor, typeof AlternatingVisitor & typeof FallbackVisitor>;
declare class CorrelationIdVisitor$1 extends CorrelationIdVisitor_base$1 {
    constructor(options: CorrelationIdVisitorOptions$1);
    ObjectElement(objectElement: ObjectElement): {};
}

interface BindingsVisitorOptions$2 extends AlternatingVisitorOptions, VisitorOptions {
}
declare const BindingsVisitor_base$2: ts_mixer_dist_types_types.Class<any[], AlternatingVisitor & FallbackVisitor, typeof AlternatingVisitor & typeof FallbackVisitor>;
declare class BindingsVisitor$2 extends BindingsVisitor_base$2 {
    constructor(options: BindingsVisitorOptions$2);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class MessageTraitExamples extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface ExamplesVisitorOptions$1 extends SpecificationVisitorOptions, VisitorOptions {
}
declare const ExamplesVisitor_base$1: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class ExamplesVisitor$1 extends ExamplesVisitor_base$1 {
    readonly element: MessageTraitExamples;
    constructor(options: ExamplesVisitorOptions$1);
    ArrayElement(arrayElement: ArrayElement): {};
}

/**
 * Implementation of refracting according `schemaFormat` fixed field is now limited,
 * and currently only supports AsyncAPI Schema Object >= 2.0.0 <=2.6.0.
 */
interface MessageVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const MessageVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class MessageVisitor extends MessageVisitor_base {
    readonly element: Message;
    protected readonly specPath: SpecPath<['document', 'objects', 'Message']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: MessageVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

interface HeadersVisitorOptions extends AlternatingVisitorOptions, VisitorOptions {
}
declare const HeadersVisitor_base: ts_mixer_dist_types_types.Class<any[], AlternatingVisitor & FallbackVisitor, typeof AlternatingVisitor & typeof FallbackVisitor>;
declare class HeadersVisitor extends HeadersVisitor_base {
    constructor(options: HeadersVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

interface CorrelationIdVisitorOptions extends AlternatingVisitorOptions, VisitorOptions {
}
declare const CorrelationIdVisitor_base: ts_mixer_dist_types_types.Class<any[], AlternatingVisitor & FallbackVisitor, typeof AlternatingVisitor & typeof FallbackVisitor>;
declare class CorrelationIdVisitor extends CorrelationIdVisitor_base {
    constructor(options: CorrelationIdVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

interface BindingsVisitorOptions$1 extends AlternatingVisitorOptions, VisitorOptions {
}
declare const BindingsVisitor_base$1: ts_mixer_dist_types_types.Class<any[], AlternatingVisitor & FallbackVisitor, typeof AlternatingVisitor & typeof FallbackVisitor>;
declare class BindingsVisitor$1 extends BindingsVisitor_base$1 {
    constructor(options: BindingsVisitorOptions$1);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class MessageExamples extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface ExamplesVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const ExamplesVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class ExamplesVisitor extends ExamplesVisitor_base {
    readonly element: MessageExamples;
    constructor(options: ExamplesVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class MessageTraits extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface TraitsVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const TraitsVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class TraitsVisitor extends TraitsVisitor_base {
    readonly element: MessageTraits;
    constructor(options: TraitsVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

interface OperationBindingsVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const OperationBindingsVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class OperationBindingsVisitor extends OperationBindingsVisitor_base {
    readonly element: OperationBindings;
    protected readonly specPath: SpecPath<['document', 'objects', 'OperationBindings']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: OperationBindingsVisitorOptions);
}

declare class OperationTrait extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get operationId(): StringElement | undefined;
    set operationId(operationId: StringElement | undefined);
    get summary(): StringElement | undefined;
    set summary(summary: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get security(): ArrayElement | undefined;
    set security(security: ArrayElement | undefined);
    get tags(): Tags | undefined;
    set tags(tags: Tags | undefined);
    get externalDocs(): ExternalDocumentation | undefined;
    set externalDocs(externalDocs: ExternalDocumentation | undefined);
    get bindings(): OperationBindings | Reference | undefined;
    set bindings(bindings: OperationBindings | Reference | undefined);
}

interface OperationTraitVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const OperationTraitVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class OperationTraitVisitor extends OperationTraitVisitor_base {
    readonly element: OperationTrait;
    protected readonly specPath: SpecPath<['document', 'objects', 'OperationTrait']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: OperationTraitVisitorOptions);
}

declare class OperationTraitSecurity extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface SecurityVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const SecurityVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class SecurityVisitor extends SecurityVisitor_base {
    readonly element: OperationTraitSecurity;
    constructor(options: SecurityVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

interface BindingsVisitorOptions extends AlternatingVisitorOptions, VisitorOptions {
}
declare const BindingsVisitor_base: ts_mixer_dist_types_types.Class<any[], AlternatingVisitor & FallbackVisitor, typeof AlternatingVisitor & typeof FallbackVisitor>;
declare class BindingsVisitor extends BindingsVisitor_base {
    constructor(options: BindingsVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

interface AmqpChannelBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const AmqpChannelBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class AmqpChannelBindingVisitor extends AmqpChannelBindingVisitor_base {
    readonly element: AmqpChannelBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'amqp',
        'ChannelBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: AmqpChannelBindingVisitorOptions);
}

interface AmqpMessageBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const AmqpMessageBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class AmqpMessageBindingVisitor extends AmqpMessageBindingVisitor_base {
    readonly element: AmqpMessageBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'amqp',
        'MessageBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: AmqpMessageBindingVisitorOptions);
}

interface AmqpOperationBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const AmqpOperationBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class AmqpOperationBindingVisitor extends AmqpOperationBindingVisitor_base {
    readonly element: AmqpOperationBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'amqp',
        'OperationBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: AmqpOperationBindingVisitorOptions);
}

interface AmqpServerBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const AmqpServerBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class AmqpServerBindingVisitor extends AmqpServerBindingVisitor_base {
    readonly element: AmqpServerBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'amqp',
        'ServerBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: AmqpServerBindingVisitorOptions);
}

interface Amqp1ChannelBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const Amqp1ChannelBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class Amqp1ChannelBindingVisitor extends Amqp1ChannelBindingVisitor_base {
    readonly element: Amqp1ChannelBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'amqp1',
        'ChannelBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: Amqp1ChannelBindingVisitorOptions);
}

interface Amqp1MessageBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const Amqp1MessageBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class Amqp1MessageBindingVisitor extends Amqp1MessageBindingVisitor_base {
    readonly element: Amqp1MessageBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'amqp1',
        'MessageBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: Amqp1MessageBindingVisitorOptions);
}

interface Amqp1OperationBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const Amqp1OperationBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class Amqp1OperationBindingVisitor extends Amqp1OperationBindingVisitor_base {
    readonly element: Amqp1OperationBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'amqp1',
        'OperationBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: Amqp1OperationBindingVisitorOptions);
}

interface Amqp1ServerBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const Amqp1ServerBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class Amqp1ServerBindingVisitor extends Amqp1ServerBindingVisitor_base {
    readonly element: Amqp1ServerBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'amqp1',
        'ServerBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: Amqp1ServerBindingVisitorOptions);
}

interface AnypointmqChannelBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const AnypointmqChannelBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class AnypointmqChannelBindingVisitor extends AnypointmqChannelBindingVisitor_base {
    readonly element: AnypointmqChannelBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'anypointmq',
        'ChannelBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: AnypointmqChannelBindingVisitorOptions);
}

interface AnypointmqMessageBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const AnypointmqMessageBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class AnypointmqMessageBindingVisitor extends AnypointmqMessageBindingVisitor_base {
    readonly element: AnypointmqMessageBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'anypointmq',
        'MessageBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: AnypointmqMessageBindingVisitorOptions);
}

interface AnypointmqOperationBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const AnypointmqOperationBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class AnypointmqOperationBindingVisitor extends AnypointmqOperationBindingVisitor_base {
    readonly element: AnypointmqOperationBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'anypointmq',
        'OperationBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: AnypointmqOperationBindingVisitorOptions);
}

interface AnypointmqServerBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const AnypointmqServerBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class AnypointmqServerBindingVisitor extends AnypointmqServerBindingVisitor_base {
    readonly element: AnypointmqServerBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'anypointmq',
        'ServerBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: AnypointmqServerBindingVisitorOptions);
}

interface HttpChannelBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const HttpChannelBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class HttpChannelBindingVisitor extends HttpChannelBindingVisitor_base {
    readonly element: HttpChannelBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'http',
        'ChannelBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: HttpChannelBindingVisitorOptions);
}

interface HttpMessageBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const HttpMessageBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class HttpMessageBindingVisitor extends HttpMessageBindingVisitor_base {
    readonly element: HttpMessageBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'http',
        'MessageBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: HttpMessageBindingVisitorOptions);
}

interface HttpOperationBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const HttpOperationBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class HttpOperationBindingVisitor extends HttpOperationBindingVisitor_base {
    readonly element: HttpOperationBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'http',
        'OperationBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: HttpOperationBindingVisitorOptions);
}

interface HttpServerBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const HttpServerBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class HttpServerBindingVisitor extends HttpServerBindingVisitor_base {
    readonly element: HttpServerBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'http',
        'ServerBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: HttpServerBindingVisitorOptions);
}

interface GooglepubsubChannelBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const GooglepubsubChannelBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class GooglepubsubChannelBindingVisitor extends GooglepubsubChannelBindingVisitor_base {
    readonly element: GooglepubsubChannelBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'googlepubsub',
        'ChannelBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: GooglepubsubChannelBindingVisitorOptions);
}

interface GooglepubsubMessageBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const GooglepubsubMessageBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class GooglepubsubMessageBindingVisitor extends GooglepubsubMessageBindingVisitor_base {
    readonly element: GooglepubsubMessageBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'googlepubusb',
        'MessageBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: GooglepubsubMessageBindingVisitorOptions);
}

interface GooglepubsubOperationBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const GooglepubsubOperationBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class GooglepubsubOperationBindingVisitor extends GooglepubsubOperationBindingVisitor_base {
    readonly element: GooglepubsubOperationBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'googlepubsub',
        'OperationBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: GooglepubsubOperationBindingVisitorOptions);
}

interface GooglepubsubServerBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const GooglepubsubServerBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class GooglepubsubServerBindingVisitor extends GooglepubsubServerBindingVisitor_base {
    readonly element: GooglepubsubServerBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'googlepubsub',
        'ServerBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: GooglepubsubServerBindingVisitorOptions);
}

interface IbmmqChannelBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const IbmmqChannelBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class IbmmqChannelBindingVisitor extends IbmmqChannelBindingVisitor_base {
    readonly element: IbmmqChannelBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'ibmmq',
        'ChannelBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: IbmmqChannelBindingVisitorOptions);
}

interface IbmmqMessageBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const IbmmqMessageBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class IbmmqMessageBindingVisitor extends IbmmqMessageBindingVisitor_base {
    readonly element: IbmmqMessageBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'ibmmq',
        'MessageBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: IbmmqMessageBindingVisitorOptions);
}

interface IbmmqOperationBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const IbmmqOperationBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class IbmmqOperationBindingVisitor extends IbmmqOperationBindingVisitor_base {
    readonly element: IbmmqOperationBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'ibmmq',
        'OperationBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: IbmmqOperationBindingVisitorOptions);
}

interface IbmmqServerBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const IbmmqServerBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class IbmmqServerBindingVisitor extends IbmmqServerBindingVisitor_base {
    readonly element: IbmmqServerBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'ibmmq',
        'ServerBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: IbmmqServerBindingVisitorOptions);
}

interface JmsChannelBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const JmsChannelBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class JmsChannelBindingVisitor extends JmsChannelBindingVisitor_base {
    readonly element: JmsChannelBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'jms',
        'ChannelBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: JmsChannelBindingVisitorOptions);
}

interface JmsMessageBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const JmsMessageBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class JmsMessageBindingVisitor extends JmsMessageBindingVisitor_base {
    readonly element: JmsMessageBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'jms',
        'MessageBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: JmsMessageBindingVisitorOptions);
}

interface JmsOperationBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const JmsOperationBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class JmsOperationBindingVisitor extends JmsOperationBindingVisitor_base {
    readonly element: JmsOperationBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'jms',
        'OperationBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: JmsOperationBindingVisitorOptions);
}

interface JmsServerBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const JmsServerBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class JmsServerBindingVisitor extends JmsServerBindingVisitor_base {
    readonly element: JmsServerBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'jms',
        'ServerBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: JmsServerBindingVisitorOptions);
}

interface KafkaChannelBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const KafkaChannelBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class KafkaChannelBindingVisitor extends KafkaChannelBindingVisitor_base {
    readonly element: KafkaChannelBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'kafka',
        'ChannelBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: KafkaChannelBindingVisitorOptions);
}

interface KafkaMessageBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const KafkaMessageBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class KafkaMessageBindingVisitor extends KafkaMessageBindingVisitor_base {
    readonly element: KafkaMessageBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'kafka',
        'MessageBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: KafkaMessageBindingVisitorOptions);
}

interface KafkaOperationBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const KafkaOperationBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class KafkaOperationBindingVisitor extends KafkaOperationBindingVisitor_base {
    readonly element: KafkaOperationBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'kafka',
        'OperationBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: KafkaOperationBindingVisitorOptions);
}

interface KafkaServerBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const KafkaServerBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class KafkaServerBindingVisitor extends KafkaServerBindingVisitor_base {
    readonly element: KafkaServerBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'kafka',
        'ServerBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: KafkaServerBindingVisitorOptions);
}

interface MercureChannelBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const MercureChannelBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class MercureChannelBindingVisitor extends MercureChannelBindingVisitor_base {
    readonly element: MercureChannelBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'mercure',
        'ChannelBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: MercureChannelBindingVisitorOptions);
}

interface MercureMessageBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const MercureMessageBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class MercureMessageBindingVisitor extends MercureMessageBindingVisitor_base {
    readonly element: MercureMessageBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'mercure',
        'MessageBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: MercureMessageBindingVisitorOptions);
}

interface MercureOperationBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const MercureOperationBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class MercureOperationBindingVisitor extends MercureOperationBindingVisitor_base {
    readonly element: MercureOperationBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'mercure',
        'OperationBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: MercureOperationBindingVisitorOptions);
}

interface MercureServerBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const MercureServerBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class MercureServerBindingVisitor extends MercureServerBindingVisitor_base {
    readonly element: MercureServerBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'mercure',
        'ServerBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: MercureServerBindingVisitorOptions);
}

interface MqttChannelBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const MqttChannelBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class MqttChannelBindingVisitor extends MqttChannelBindingVisitor_base {
    readonly element: MqttChannelBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'mqtt',
        'ChannelBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: MqttChannelBindingVisitorOptions);
}

interface MqttMessageBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const MqttMessageBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class MqttMessageBindingVisitor extends MqttMessageBindingVisitor_base {
    readonly element: MqttMessageBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'mqtt',
        'MessageBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: MqttMessageBindingVisitorOptions);
}

interface MqttOperationBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const MqttOperationBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class MqttOperationBindingVisitor extends MqttOperationBindingVisitor_base {
    readonly element: MqttOperationBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'mqtt',
        'OperationBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: MqttOperationBindingVisitorOptions);
}

interface MqttServerBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const MqttServerBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class MqttServerBindingVisitor extends MqttServerBindingVisitor_base {
    readonly element: MqttServerBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'mqtt',
        'ServerBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: MqttServerBindingVisitorOptions);
}

interface Mqtt5ChannelBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const Mqtt5ChannelBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class Mqtt5ChannelBindingVisitor extends Mqtt5ChannelBindingVisitor_base {
    readonly element: Mqtt5ChannelBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'mqtt5',
        'ChannelBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: Mqtt5ChannelBindingVisitorOptions);
}

interface Mqtt5MessageBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const Mqtt5MessageBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class Mqtt5MessageBindingVisitor extends Mqtt5MessageBindingVisitor_base {
    readonly element: Mqtt5MessageBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'mqtt5',
        'MessageBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: Mqtt5MessageBindingVisitorOptions);
}

interface Mqtt5OperationBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const Mqtt5OperationBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class Mqtt5OperationBindingVisitor extends Mqtt5OperationBindingVisitor_base {
    readonly element: Mqtt5OperationBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'mqtt5',
        'OperationBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: Mqtt5OperationBindingVisitorOptions);
}

interface Mqtt5ServerBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const Mqtt5ServerBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class Mqtt5ServerBindingVisitor extends Mqtt5ServerBindingVisitor_base {
    readonly element: Mqtt5ServerBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'mqtt5',
        'ServerBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: Mqtt5ServerBindingVisitorOptions);
}

interface NatsChannelBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const NatsChannelBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class NatsChannelBindingVisitor extends NatsChannelBindingVisitor_base {
    readonly element: NatsChannelBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'nats',
        'ChannelBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: NatsChannelBindingVisitorOptions);
}

interface NatsMessageBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const NatsMessageBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class NatsMessageBindingVisitor extends NatsMessageBindingVisitor_base {
    readonly element: NatsMessageBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'nats',
        'MessageBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: NatsMessageBindingVisitorOptions);
}

interface NatsOperationBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const NatsOperationBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class NatsOperationBindingVisitor extends NatsOperationBindingVisitor_base {
    readonly element: NatsOperationBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'nats',
        'OperationBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: NatsOperationBindingVisitorOptions);
}

interface NatsServerBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const NatsServerBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class NatsServerBindingVisitor extends NatsServerBindingVisitor_base {
    readonly element: NatsServerBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'nats',
        'ServerBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: NatsServerBindingVisitorOptions);
}

declare class PulsarChannelBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get namespace(): StringElement | undefined;
    set namespace(namespace: StringElement | undefined);
    get persistence(): StringElement | undefined;
    set persistence(persistence: StringElement | undefined);
    get compaction(): NumberElement | undefined;
    set compaction(compaction: NumberElement | undefined);
    get ['geo-replication'](): ArrayElement | undefined;
    set ['geo-replication'](geoReplication: ArrayElement | undefined);
    get retention(): ObjectElement | undefined;
    set retention(retention: ObjectElement | undefined);
    get ttl(): NumberElement | undefined;
    set ttl(ttl: NumberElement | undefined);
    get deduplication(): BooleanElement | undefined;
    set deduplication(deduplication: BooleanElement | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

interface PulsarChannelBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const PulsarChannelBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class PulsarChannelBindingVisitor extends PulsarChannelBindingVisitor_base {
    readonly element: PulsarChannelBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'pulsar',
        'ChannelBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: PulsarChannelBindingVisitorOptions);
}

declare class PulsarMessageBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface PulsarMessageBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const PulsarMessageBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class PulsarMessageBindingVisitor extends PulsarMessageBindingVisitor_base {
    readonly element: PulsarMessageBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'pulsar',
        'MessageBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: PulsarMessageBindingVisitorOptions);
}

declare class PulsarOperationBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface PulsarOperationBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const PulsarOperationBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class PulsarOperationBindingVisitor extends PulsarOperationBindingVisitor_base {
    readonly element: PulsarOperationBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'pulsar',
        'OperationBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: PulsarOperationBindingVisitorOptions);
}

declare class PulsarServerBinding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get tenant(): StringElement | undefined;
    set tenant(tenant: StringElement | undefined);
    get bindingVersion(): StringElement | undefined;
    set bindingVersion(bindingVersion: StringElement | undefined);
}

interface PulsarServerBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const PulsarServerBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class PulsarServerBindingVisitor extends PulsarServerBindingVisitor_base {
    readonly element: PulsarServerBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'pulsar',
        'ServerBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: PulsarServerBindingVisitorOptions);
}

interface RedisChannelBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const RedisChannelBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class RedisChannelBindingVisitor extends RedisChannelBindingVisitor_base {
    readonly element: RedisChannelBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'redis',
        'ChannelBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: RedisChannelBindingVisitorOptions);
}

interface RedisMessageBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const RedisMessageBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class RedisMessageBindingVisitor extends RedisMessageBindingVisitor_base {
    readonly element: RedisMessageBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'redis',
        'MessageBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: RedisMessageBindingVisitorOptions);
}

interface RedisOperationBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const RedisOperationBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class RedisOperationBindingVisitor extends RedisOperationBindingVisitor_base {
    readonly element: RedisOperationBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'redis',
        'OperationBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: RedisOperationBindingVisitorOptions);
}

interface RedisServerBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const RedisServerBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class RedisServerBindingVisitor extends RedisServerBindingVisitor_base {
    readonly element: RedisServerBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'redis',
        'ServerBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: RedisServerBindingVisitorOptions);
}

interface SnsChannelBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const SnsChannelBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class SnsChannelBindingVisitor extends SnsChannelBindingVisitor_base {
    readonly element: SnsChannelBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'sns',
        'ChannelBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: SnsChannelBindingVisitorOptions);
}

interface SnsMessageBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const SnsMessageBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class SnsMessageBindingVisitor extends SnsMessageBindingVisitor_base {
    readonly element: SnsMessageBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'sns',
        'MessageBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: SnsMessageBindingVisitorOptions);
}

interface SnsOperationBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const SnsOperationBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class SnsOperationBindingVisitor extends SnsOperationBindingVisitor_base {
    readonly element: SnsOperationBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'sns',
        'OperationBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: SnsOperationBindingVisitorOptions);
}

interface SnsServerBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const SnsServerBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class SnsServerBindingVisitor extends SnsServerBindingVisitor_base {
    readonly element: SnsServerBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'sns',
        'ServerBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: SnsServerBindingVisitorOptions);
}

interface SolaceChannelBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const SolaceChannelBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class SolaceChannelBindingVisitor extends SolaceChannelBindingVisitor_base {
    readonly element: SolaceChannelBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'solace',
        'ChannelBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: SolaceChannelBindingVisitorOptions);
}

interface SolaceMessageBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const SolaceMessageBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class SolaceMessageBindingVisitor extends SolaceMessageBindingVisitor_base {
    readonly element: SolaceMessageBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'solace',
        'MessageBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: SolaceMessageBindingVisitor);
}

interface SolaceOperationBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const SolaceOperationBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class SolaceOperationBindingVisitor extends SolaceOperationBindingVisitor_base {
    readonly element: SolaceOperationBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'solace',
        'OperationBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: SolaceOperationBindingVisitorOptions);
}

interface SolaceServerBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const SolaceServerBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class SolaceServerBindingVisitor extends SolaceServerBindingVisitor_base {
    readonly element: SolaceServerBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'solace',
        'ServerBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: SolaceServerBindingVisitorOptions);
}

interface SqsChannelBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const SqsChannelBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class SqsChannelBindingVisitor extends SqsChannelBindingVisitor_base {
    readonly element: SqsChannelBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'sqs',
        'ChannelBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: SqsChannelBindingVisitorOptions);
}

interface SqsMessageBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const SqsMessageBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class SqsMessageBindingVisitor extends SqsMessageBindingVisitor_base {
    readonly element: SqsMessageBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'sqs',
        'MessageBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: SqsMessageBindingVisitorOptions);
}

interface SqsOperationBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const SqsOperationBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class SqsOperationBindingVisitor extends SqsOperationBindingVisitor_base {
    readonly element: SqsOperationBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'sqs',
        'OperationBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: SqsOperationBindingVisitorOptions);
}

interface SqsServerBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const SqsServerBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class SqsServerBindingVisitor extends SqsServerBindingVisitor_base {
    readonly element: SqsServerBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'sqs',
        'ServerBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: SqsServerBindingVisitorOptions);
}

interface StompChannelBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const StompChannelBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class StompChannelBindingVisitor extends StompChannelBindingVisitor_base {
    readonly element: StompChannelBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'stomp',
        'ChannelBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: StompChannelBindingVisitorOptions);
}

interface StompMessageBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const StompMessageBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class StompMessageBindingVisitor extends StompMessageBindingVisitor_base {
    readonly element: StompMessageBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'stomp',
        'MessageBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: StompMessageBindingVisitorOptions);
}

interface StompOperationBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const StompOperationBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class StompOperationBindingVisitor extends StompOperationBindingVisitor_base {
    readonly element: StompOperationBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'stomp',
        'OperationBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: StompOperationBindingVisitorOptions);
}

interface StompServerBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const StompServerBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class StompServerBindingVisitor extends StompServerBindingVisitor_base {
    readonly element: StompServerBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'stomp',
        'ServerBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: StompServerBindingVisitorOptions);
}

interface WebSocketChannelBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const WebSocketChannelBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class WebSocketChannelBindingVisitor extends WebSocketChannelBindingVisitor_base {
    readonly element: WebSocketChannelBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'ws',
        'ChannelBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: WebSocketChannelBindingVisitorOptions);
}

interface WebSocketMessageBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const WebSocketMessageBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class WebSocketMessageBindingVisitor extends WebSocketMessageBindingVisitor_base {
    readonly element: WebSocketMessageBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'ws',
        'MessageBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: WebSocketMessageBindingVisitorOptions);
}

interface WebSocketOperationBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const WebSocketOperationBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class WebSocketOperationBindingVisitor extends WebSocketOperationBindingVisitor_base {
    readonly element: WebSocketOperationBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'ws',
        'OperationBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: WebSocketOperationBindingVisitor);
}

interface WebSocketServerBindingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const WebSocketServerBindingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class WebSocketServerBindingVisitor extends WebSocketServerBindingVisitor_base {
    readonly element: WebSocketServerBinding;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'bindings',
        'ws',
        'ServerBinding'
    ]>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: WebSocketServerBindingVisitorOptions);
}

declare const specification: {
    visitors: {
        value: typeof FallbackVisitor;
        document: {
            objects: {
                /**
                 * AsyncApi >= 2.0.0 <=2.6.0 specification elements.
                 */
                AsyncApi: {
                    $visitor: typeof AsyncApi2Visitor;
                    fixedFields: {
                        asyncapi: {
                            $ref: string;
                        };
                        id: {
                            $ref: string;
                        };
                        info: {
                            $ref: string;
                        };
                        servers: {
                            $ref: string;
                        };
                        defaultContentType: {
                            $ref: string;
                        };
                        channels: {
                            $ref: string;
                        };
                        components: {
                            $ref: string;
                        };
                        tags: {
                            $ref: string;
                        };
                        externalDocs: {
                            $ref: string;
                        };
                    };
                };
                AsyncApiVersion: {
                    $visitor: typeof AsyncApiVersionVisitor;
                };
                Identifier: {
                    $visitor: typeof IdentifierVisitor;
                };
                Info: {
                    $visitor: typeof InfoVisitor;
                    fixedFields: {
                        title: {
                            $ref: string;
                        };
                        description: {
                            $ref: string;
                        };
                        termsOfService: {
                            $ref: string;
                        };
                        version: typeof VersionVisitor;
                        contact: {
                            $ref: string;
                        };
                        license: {
                            $ref: string;
                        };
                    };
                };
                Contact: {
                    $visitor: typeof ContactVisitor;
                    fixedFields: {
                        name: {
                            $ref: string;
                        };
                        url: {
                            $ref: string;
                        };
                        email: {
                            $ref: string;
                        };
                    };
                };
                License: {
                    $visitor: typeof LicenseVisitor;
                    fixedFields: {
                        name: {
                            $ref: string;
                        };
                        url: {
                            $ref: string;
                        };
                    };
                };
                Servers: {
                    $visitor: typeof ServersVisitor$2;
                };
                Server: {
                    $visitor: typeof ServerVisitor;
                    fixedFields: {
                        url: typeof UrlVisitor;
                        protocol: {
                            $ref: string;
                        };
                        protocolVersion: {
                            $ref: string;
                        };
                        description: {
                            $ref: string;
                        };
                        variables: typeof VariablesVisitor;
                        security: typeof SecurityVisitor$2;
                        tags: {
                            $ref: string;
                        };
                        bindings: typeof BindingsVisitor$5;
                    };
                };
                ServerVariable: {
                    $visitor: typeof ServerVariableVisitor;
                    fixedFields: {
                        enum: {
                            $ref: string;
                        };
                        default: {
                            $ref: string;
                        };
                        description: {
                            $ref: string;
                        };
                        examples: {
                            $ref: string;
                        };
                    };
                };
                DefaultContentType: {
                    $visitor: typeof DefaultContentTypeVisitor;
                };
                Channels: {
                    $visitor: typeof ChannelsVisitor;
                };
                ChannelItem: {
                    $visitor: typeof ChannelItemVisitor;
                    fixedFields: {
                        $ref: typeof $RefVisitor;
                        description: {
                            $ref: string;
                        };
                        servers: typeof ServersVisitor;
                        subscribe: {
                            $ref: string;
                        };
                        publish: {
                            $ref: string;
                        };
                        parameters: {
                            $ref: string;
                        };
                        bindings: typeof BindingsVisitor$3;
                    };
                };
                Operation: {
                    $visitor: typeof OperationVisitor;
                    fixedFields: {
                        operationId: {
                            $ref: string;
                        };
                        summary: {
                            $ref: string;
                        };
                        description: {
                            $ref: string;
                        };
                        security: typeof SecurityVisitor$1;
                        tags: {
                            $ref: string;
                        };
                        externalDocs: {
                            $ref: string;
                        };
                        bindings: typeof BindingsVisitor$4;
                        traits: typeof TraitsVisitor$1;
                        message: typeof MessageVisitor$1;
                    };
                };
                OperationTrait: {
                    $visitor: typeof OperationTraitVisitor;
                    fixedFields: {
                        operationId: {
                            $ref: string;
                        };
                        summary: {
                            $ref: string;
                        };
                        description: {
                            $ref: string;
                        };
                        security: typeof SecurityVisitor;
                        tags: {
                            $ref: string;
                        };
                        externalDocs: {
                            $ref: string;
                        };
                        bindings: typeof BindingsVisitor;
                    };
                };
                Message: {
                    $visitor: typeof MessageVisitor;
                    fixedFields: {
                        messageId: {
                            $ref: string;
                        };
                        headers: typeof HeadersVisitor;
                        payload: {
                            $ref: string;
                        };
                        correlationId: typeof CorrelationIdVisitor;
                        schemaFormat: {
                            $ref: string;
                        };
                        contentType: {
                            $ref: string;
                        };
                        name: {
                            $ref: string;
                        };
                        title: {
                            $ref: string;
                        };
                        summary: {
                            $ref: string;
                        };
                        description: {
                            $ref: string;
                        };
                        tags: {
                            $ref: string;
                        };
                        externalDocs: {
                            $ref: string;
                        };
                        bindings: typeof BindingsVisitor$1;
                        examples: typeof ExamplesVisitor;
                        traits: typeof TraitsVisitor;
                    };
                };
                MessageTrait: {
                    $visitor: typeof MessageTraitVisitor;
                    fixedFields: {
                        messageId: {
                            $ref: string;
                        };
                        headers: typeof DefaultVisitor;
                        correlationId: typeof CorrelationIdVisitor$1;
                        schemaFormat: {
                            $ref: string;
                        };
                        contentType: {
                            $ref: string;
                        };
                        name: {
                            $ref: string;
                        };
                        title: {
                            $ref: string;
                        };
                        summary: {
                            $ref: string;
                        };
                        description: {
                            $ref: string;
                        };
                        tags: {
                            $ref: string;
                        };
                        externalDocs: {
                            $ref: string;
                        };
                        bindings: typeof BindingsVisitor$2;
                        examples: typeof ExamplesVisitor$1;
                    };
                };
                MessageExample: {
                    $visitor: typeof MessageExampleVisitor;
                    fixedFields: {
                        headers: {
                            $ref: string;
                        };
                        payload: {
                            $ref: string;
                        };
                        name: {
                            $ref: string;
                        };
                        summary: {
                            $ref: string;
                        };
                    };
                };
                Tags: {
                    $visitor: typeof TagsVisitor;
                };
                Tag: {
                    $visitor: typeof TagVisitor;
                    fixedFields: {
                        name: {
                            $ref: string;
                        };
                        description: {
                            $ref: string;
                        };
                        externalDocs: {
                            $ref: string;
                        };
                    };
                };
                ExternalDocumentation: {
                    $visitor: typeof ExternalDocumentationVisitor;
                    fixedFields: {
                        description: {
                            $ref: string;
                        };
                        url: {
                            $ref: string;
                        };
                    };
                };
                Components: {
                    $visitor: typeof ComponentsVisitor;
                    fixedFields: {
                        schemas: typeof SchemasVisitor;
                        servers: typeof ServersVisitor$1;
                        serverVariables: typeof ServerVariablesVisitor;
                        channels: typeof ChannelsVisitor$1;
                        messages: typeof MessagesVisitor;
                        securitySchemes: typeof SecuritySchemesVisitor;
                        parameters: typeof ParametersVisitor;
                        correlationIds: typeof CorrelationIdsVisitor;
                        operationTraits: typeof OperationTraitsVisitor;
                        messageTraits: typeof MessageTraitsVisitor;
                        serverBindings: typeof ServerBindingsVisitor;
                        channelBindings: typeof ChannelBindingsVisitor$1;
                        operationBindings: typeof OperationBindingsVisitor$1;
                        messageBindings: typeof MessageBindingsVisitor$1;
                    };
                };
                JSONReference: {
                    $visitor: typeof ReferenceVisitor;
                    fixedFields: {
                        $ref: typeof $RefVisitor$1;
                    };
                };
                Reference: {
                    $visitor: typeof ReferenceVisitor;
                    fixedFields: {
                        $ref: typeof $RefVisitor$1;
                    };
                };
                JSONSchema: {
                    $visitor: typeof SchemaVisitor$1;
                    fixedFields: {
                        allOf: typeof AllOfVisitor;
                        anyOf: typeof AnyOfVisitor;
                        oneOf: typeof OneOfVisitor;
                        items: typeof ItemsVisitor;
                        properties: typeof PropertiesVisitor;
                        patternProperties: typeof PatternPropertiesVisitor;
                        dependencies: typeof DependenciesVisitor;
                        definitions: typeof DefinitionsVisitor;
                        discriminator: {
                            $ref: string;
                        };
                        externalDocs: {
                            $ref: string;
                        };
                        deprecated: {
                            $ref: string;
                        };
                        base: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        required: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        type: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        default: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        id: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        media: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        title: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        pattern: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        description: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        format: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        readOnly: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        $schema: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        multipleOf: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        maximum: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        exclusiveMaximum: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        minimum: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        exclusiveMinimum: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        maxLength: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        minLength: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        additionalItems: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        maxItems: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        minItems: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        uniqueItems: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        maxProperties: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        minProperties: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        additionalProperties: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        enum: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        not: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        links: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                    };
                };
                Schema: {
                    $visitor: typeof SchemaVisitor$1;
                    fixedFields: {
                        allOf: typeof AllOfVisitor;
                        anyOf: typeof AnyOfVisitor;
                        oneOf: typeof OneOfVisitor;
                        items: typeof ItemsVisitor;
                        properties: typeof PropertiesVisitor;
                        patternProperties: typeof PatternPropertiesVisitor;
                        dependencies: typeof DependenciesVisitor;
                        definitions: typeof DefinitionsVisitor;
                        discriminator: {
                            $ref: string;
                        };
                        externalDocs: {
                            $ref: string;
                        };
                        deprecated: {
                            $ref: string;
                        };
                        base: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        required: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        type: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        default: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        id: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        media: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        title: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        pattern: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        description: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        format: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        readOnly: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        $schema: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        multipleOf: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        maximum: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        exclusiveMaximum: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        minimum: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        exclusiveMinimum: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        maxLength: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        minLength: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        additionalItems: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        maxItems: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        minItems: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        uniqueItems: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        maxProperties: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        minProperties: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        additionalProperties: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        enum: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        not: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                        links: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor | typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor | {
                            $ref: string;
                        };
                    };
                };
                LinkDescription: {
                    $visitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.LinkDescriptionVisitor;
                    fixedFields: {
                        href: {
                            $ref: string;
                        };
                        rel: {
                            $ref: string;
                        };
                        title: {
                            $ref: string;
                        };
                        targetSchema: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor;
                        mediaType: {
                            $ref: string;
                        };
                        method: {
                            $ref: string;
                        };
                        encType: {
                            $ref: string;
                        };
                        schema: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor;
                    };
                };
                SecurityScheme: {
                    $visitor: typeof SecuritySchemeVisitor;
                    fixedFields: {
                        type: {
                            $ref: string;
                        };
                        description: {
                            $ref: string;
                        };
                        name: {
                            $ref: string;
                        };
                        in: {
                            $ref: string;
                        };
                        scheme: {
                            $ref: string;
                        };
                        bearerFormat: {
                            $ref: string;
                        };
                        flows: {
                            $ref: string;
                        };
                        openIdConnectUrl: {
                            $ref: string;
                        };
                    };
                };
                SecurityRequirement: {
                    $visitor: typeof SecurityRequirementVisitor;
                };
                OAuthFlows: {
                    $visitor: typeof OAuthFlowsVisitor;
                    fixedFields: {
                        implicit: {
                            $ref: string;
                        };
                        password: {
                            $ref: string;
                        };
                        clientCredentials: {
                            $ref: string;
                        };
                        authorizationCode: {
                            $ref: string;
                        };
                    };
                };
                OAuthFlow: {
                    $visitor: typeof OAuthFlowVisitor;
                    fixedFields: {
                        authorizationUrl: {
                            $ref: string;
                        };
                        tokenUrl: {
                            $ref: string;
                        };
                        refreshUrl: {
                            $ref: string;
                        };
                        scopes: typeof ScopesVisitor;
                    };
                };
                ServerBindings: {
                    $visitor: typeof ServerBindingsVisitor$1;
                    fixedFields: {
                        http: {
                            $ref: string;
                        };
                        ws: {
                            $ref: string;
                        };
                        kafka: {
                            $ref: string;
                        };
                        anypointmq: {
                            $ref: string;
                        };
                        amqp: {
                            $ref: string;
                        };
                        amqp1: {
                            $ref: string;
                        };
                        mqtt: {
                            $ref: string;
                        };
                        mqtt5: {
                            $ref: string;
                        };
                        nats: {
                            $ref: string;
                        };
                        jms: {
                            $ref: string;
                        };
                        sns: {
                            $ref: string;
                        };
                        solace: {
                            $ref: string;
                        };
                        sqs: {
                            $ref: string;
                        };
                        stomp: {
                            $ref: string;
                        };
                        redis: {
                            $ref: string;
                        };
                        mercure: {
                            $ref: string;
                        };
                        ibmmq: {
                            $ref: string;
                        };
                        googlepubsub: {
                            $ref: string;
                        };
                        pulsar: {
                            $ref: string;
                        };
                    };
                };
                Parameters: {
                    $visitor: typeof ParametersVisitor$1;
                };
                Parameter: {
                    $visitor: typeof ParameterVisitor;
                    fixedFields: {
                        description: {
                            $ref: string;
                        };
                        schema: typeof SchemaVisitor;
                        location: {
                            $ref: string;
                        };
                    };
                };
                ChannelBindings: {
                    $visitor: typeof ChannelBindingsVisitor;
                    fixedFields: {
                        http: {
                            $ref: string;
                        };
                        ws: {
                            $ref: string;
                        };
                        kafka: {
                            $ref: string;
                        };
                        anypointmq: {
                            $ref: string;
                        };
                        amqp: {
                            $ref: string;
                        };
                        amqp1: {
                            $ref: string;
                        };
                        mqtt: {
                            $ref: string;
                        };
                        mqtt5: {
                            $ref: string;
                        };
                        nats: {
                            $ref: string;
                        };
                        jms: {
                            $ref: string;
                        };
                        sns: {
                            $ref: string;
                        };
                        solace: {
                            $ref: string;
                        };
                        sqs: {
                            $ref: string;
                        };
                        stomp: {
                            $ref: string;
                        };
                        redis: {
                            $ref: string;
                        };
                        mercure: {
                            $ref: string;
                        };
                        ibmmq: {
                            $ref: string;
                        };
                        googlepubsub: {
                            $ref: string;
                        };
                        pulsar: {
                            $ref: string;
                        };
                    };
                };
                OperationBindings: {
                    $visitor: typeof OperationBindingsVisitor;
                    fixedFields: {
                        http: {
                            $ref: string;
                        };
                        ws: {
                            $ref: string;
                        };
                        kafka: {
                            $ref: string;
                        };
                        anypointmq: {
                            $ref: string;
                        };
                        amqp: {
                            $ref: string;
                        };
                        amqp1: {
                            $ref: string;
                        };
                        mqtt: {
                            $ref: string;
                        };
                        mqtt5: {
                            $ref: string;
                        };
                        nats: {
                            $ref: string;
                        };
                        jms: {
                            $ref: string;
                        };
                        sns: {
                            $ref: string;
                        };
                        solace: {
                            $ref: string;
                        };
                        sqs: {
                            $ref: string;
                        };
                        stomp: {
                            $ref: string;
                        };
                        redis: {
                            $ref: string;
                        };
                        mercure: {
                            $ref: string;
                        };
                        googlepubsub: {
                            $ref: string;
                        };
                        ibmmq: {
                            $ref: string;
                        };
                        pulsar: {
                            $ref: string;
                        };
                    };
                };
                MessageBindings: {
                    $visitor: typeof MessageBindingsVisitor;
                    fixedFields: {
                        http: {
                            $ref: string;
                        };
                        ws: {
                            $ref: string;
                        };
                        kafka: {
                            $ref: string;
                        };
                        anypointmq: {
                            $ref: string;
                        };
                        amqp: {
                            $ref: string;
                        };
                        amqp1: {
                            $ref: string;
                        };
                        mqtt: {
                            $ref: string;
                        };
                        mqtt5: {
                            $ref: string;
                        };
                        nats: {
                            $ref: string;
                        };
                        jms: {
                            $ref: string;
                        };
                        sns: {
                            $ref: string;
                        };
                        solace: {
                            $ref: string;
                        };
                        sqs: {
                            $ref: string;
                        };
                        stomp: {
                            $ref: string;
                        };
                        redis: {
                            $ref: string;
                        };
                        mercure: {
                            $ref: string;
                        };
                        ibmmq: {
                            $ref: string;
                        };
                        googlepubsub: {
                            $ref: string;
                        };
                        pulsar: {
                            $ref: string;
                        };
                    };
                };
                CorrelationID: {
                    $visitor: typeof CorrelationIDVisitor;
                    fixedFields: {
                        description: {
                            $ref: string;
                        };
                        location: {
                            $ref: string;
                        };
                    };
                };
                bindings: {
                    http: {
                        ServerBinding: {
                            $visitor: typeof HttpServerBindingVisitor;
                        };
                        ChannelBinding: {
                            $visitor: typeof HttpChannelBindingVisitor;
                        };
                        OperationBinding: {
                            $visitor: typeof HttpOperationBindingVisitor;
                            fixedFields: {
                                type: {
                                    $ref: string;
                                };
                                method: {
                                    $ref: string;
                                };
                                query: typeof SchemaOrReferenceVisitor;
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                        MessageBinding: {
                            $visitor: typeof HttpMessageBindingVisitor;
                            fixedFields: {
                                headers: typeof SchemaOrReferenceVisitor;
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    ws: {
                        ServerBinding: {
                            $visitor: typeof WebSocketServerBindingVisitor;
                        };
                        ChannelBinding: {
                            $visitor: typeof WebSocketChannelBindingVisitor;
                            fixedFields: {
                                method: {
                                    $ref: string;
                                };
                                query: typeof SchemaOrReferenceVisitor;
                                headers: typeof SchemaOrReferenceVisitor;
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                        OperationBinding: {
                            $visitor: typeof WebSocketOperationBindingVisitor;
                        };
                        MessageBinding: {
                            $visitor: typeof WebSocketMessageBindingVisitor;
                        };
                    };
                    kafka: {
                        ServerBinding: {
                            $visitor: typeof KafkaServerBindingVisitor;
                            fixedFields: {
                                schemaRegistryUrl: {
                                    $ref: string;
                                };
                                schemaRegistryVendor: {
                                    $ref: string;
                                };
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                        ChannelBinding: {
                            $visitor: typeof KafkaChannelBindingVisitor;
                            fixedFields: {
                                topic: {
                                    $ref: string;
                                };
                                partitions: {
                                    $ref: string;
                                };
                                replicas: {
                                    $ref: string;
                                };
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                        OperationBinding: {
                            $visitor: typeof KafkaOperationBindingVisitor;
                            fixedFields: {
                                groupId: typeof SchemaOrReferenceVisitor;
                                clientId: typeof SchemaOrReferenceVisitor;
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                        MessageBinding: {
                            $visitor: typeof KafkaMessageBindingVisitor;
                            fixedFields: {
                                key: typeof SchemaOrReferenceVisitor;
                                schemaIdLocation: {
                                    $ref: string;
                                };
                                schemaIdPayloadEncoding: {
                                    $ref: string;
                                };
                                schemaLookupStrategy: {
                                    $ref: string;
                                };
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    anypointmq: {
                        ServerBinding: {
                            $visitor: typeof AnypointmqServerBindingVisitor;
                        };
                        ChannelBinding: {
                            $visitor: typeof AnypointmqChannelBindingVisitor;
                            fixedFields: {
                                destination: {
                                    $ref: string;
                                };
                                destinationType: {
                                    $ref: string;
                                };
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                        OperationBinding: {
                            $visitor: typeof AnypointmqOperationBindingVisitor;
                        };
                        MessageBinding: {
                            $visitor: typeof AnypointmqMessageBindingVisitor;
                            fixedFields: {
                                headers: typeof SchemaOrReferenceVisitor;
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    amqp: {
                        ServerBinding: {
                            $visitor: typeof AmqpServerBindingVisitor;
                        };
                        ChannelBinding: {
                            $visitor: typeof AmqpChannelBindingVisitor;
                            fixedFields: {
                                is: {
                                    $ref: string;
                                };
                                exchange: {
                                    $ref: string;
                                };
                                queue: {
                                    $ref: string;
                                };
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                        OperationBinding: {
                            $visitor: typeof AmqpOperationBindingVisitor;
                            fixedFields: {
                                expiration: {
                                    $ref: string;
                                };
                                userId: {
                                    $ref: string;
                                };
                                cc: {
                                    $ref: string;
                                };
                                priority: {
                                    $ref: string;
                                };
                                deliveryMode: {
                                    $ref: string;
                                };
                                mandatory: {
                                    $ref: string;
                                };
                                bcc: {
                                    $ref: string;
                                };
                                replyTo: {
                                    $ref: string;
                                };
                                timestamp: {
                                    $ref: string;
                                };
                                ack: {
                                    $ref: string;
                                };
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                        MessageBinding: {
                            $visitor: typeof AmqpMessageBindingVisitor;
                            fixedFields: {
                                contentEncoding: {
                                    $ref: string;
                                };
                                messageType: {
                                    $ref: string;
                                };
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    amqp1: {
                        ServerBinding: {
                            $visitor: typeof Amqp1ServerBindingVisitor;
                        };
                        ChannelBinding: {
                            $visitor: typeof Amqp1ChannelBindingVisitor;
                        };
                        OperationBinding: {
                            $visitor: typeof Amqp1OperationBindingVisitor;
                        };
                        MessageBinding: {
                            $visitor: typeof Amqp1MessageBindingVisitor;
                        };
                    };
                    mqtt: {
                        ServerBinding: {
                            $visitor: typeof MqttServerBindingVisitor;
                            fixedFields: {
                                clientId: {
                                    $ref: string;
                                };
                                cleanSession: {
                                    $ref: string;
                                };
                                lastWill: {
                                    $ref: string;
                                };
                                keepAlive: {
                                    $ref: string;
                                };
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                        ChannelBinding: {
                            $visitor: typeof MqttChannelBindingVisitor;
                        };
                        OperationBinding: {
                            $visitor: typeof MqttOperationBindingVisitor;
                            fixedFields: {
                                qos: {
                                    $ref: string;
                                };
                                retain: {
                                    $ref: string;
                                };
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                        MessageBinding: {
                            $visitor: typeof MqttMessageBindingVisitor;
                            fixedFields: {
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    mqtt5: {
                        ServerBinding: {
                            $visitor: typeof Mqtt5ServerBindingVisitor;
                        };
                        ChannelBinding: {
                            $visitor: typeof Mqtt5ChannelBindingVisitor;
                        };
                        OperationBinding: {
                            $visitor: typeof Mqtt5OperationBindingVisitor;
                        };
                        MessageBinding: {
                            $visitor: typeof Mqtt5MessageBindingVisitor;
                        };
                    };
                    nats: {
                        ServerBinding: {
                            $visitor: typeof NatsServerBindingVisitor;
                        };
                        ChannelBinding: {
                            $visitor: typeof NatsChannelBindingVisitor;
                        };
                        OperationBinding: {
                            $visitor: typeof NatsOperationBindingVisitor;
                            fixedFields: {
                                queue: {
                                    $ref: string;
                                };
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                        MessageBinding: {
                            $visitor: typeof NatsMessageBindingVisitor;
                        };
                    };
                    pulsar: {
                        ServerBinding: {
                            $visitor: typeof PulsarServerBindingVisitor;
                            fixedFields: {
                                tenant: {
                                    $ref: string;
                                };
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                        ChannelBinding: {
                            $visitor: typeof PulsarChannelBindingVisitor;
                            fixedFields: {
                                namespace: {
                                    $ref: string;
                                };
                                persistence: {
                                    $ref: string;
                                };
                                compaction: {
                                    $ref: string;
                                };
                                'geo-replication': {
                                    $ref: string;
                                };
                                retention: {
                                    $ref: string;
                                };
                                ttl: {
                                    $ref: string;
                                };
                                deduplication: {
                                    $ref: string;
                                };
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                        OperationBinding: {
                            $visitor: typeof PulsarOperationBindingVisitor;
                        };
                        MessageBinding: {
                            $visitor: typeof PulsarMessageBindingVisitor;
                        };
                    };
                    jms: {
                        ServerBinding: {
                            $visitor: typeof JmsServerBindingVisitor;
                        };
                        ChannelBinding: {
                            $visitor: typeof JmsChannelBindingVisitor;
                        };
                        OperationBinding: {
                            $visitor: typeof JmsOperationBindingVisitor;
                        };
                        MessageBinding: {
                            $visitor: typeof JmsMessageBindingVisitor;
                        };
                    };
                    sns: {
                        ServerBinding: {
                            $visitor: typeof SnsServerBindingVisitor;
                        };
                        ChannelBinding: {
                            $visitor: typeof SnsChannelBindingVisitor;
                        };
                        OperationBinding: {
                            $visitor: typeof SnsOperationBindingVisitor;
                        };
                        MessageBinding: {
                            $visitor: typeof SnsMessageBindingVisitor;
                        };
                    };
                    solace: {
                        ServerBinding: {
                            $visitor: typeof SolaceServerBindingVisitor;
                            fixedFields: {
                                bindingVersion: {
                                    $ref: string;
                                };
                                msgVpn: {
                                    $ref: string;
                                };
                            };
                        };
                        ChannelBinding: {
                            $visitor: typeof SolaceChannelBindingVisitor;
                        };
                        OperationBinding: {
                            $visitor: typeof SolaceOperationBindingVisitor;
                            fixedFields: {
                                bindingVersion: {
                                    $ref: string;
                                };
                                destinations: {
                                    $ref: string;
                                };
                            };
                        };
                        MessageBinding: {
                            $visitor: typeof SolaceMessageBindingVisitor;
                        };
                    };
                    sqs: {
                        ServerBinding: {
                            $visitor: typeof SqsServerBindingVisitor;
                        };
                        ChannelBinding: {
                            $visitor: typeof SqsChannelBindingVisitor;
                        };
                        OperationBinding: {
                            $visitor: typeof SqsOperationBindingVisitor;
                        };
                        MessageBinding: {
                            $visitor: typeof SqsMessageBindingVisitor;
                        };
                    };
                    stomp: {
                        ServerBinding: {
                            $visitor: typeof StompServerBindingVisitor;
                        };
                        ChannelBinding: {
                            $visitor: typeof StompChannelBindingVisitor;
                        };
                        OperationBinding: {
                            $visitor: typeof StompOperationBindingVisitor;
                        };
                        MessageBinding: {
                            $visitor: typeof StompMessageBindingVisitor;
                        };
                    };
                    redis: {
                        ServerBinding: {
                            $visitor: typeof RedisServerBindingVisitor;
                        };
                        ChannelBinding: {
                            $visitor: typeof RedisChannelBindingVisitor;
                        };
                        OperationBinding: {
                            $visitor: typeof RedisOperationBindingVisitor;
                        };
                        MessageBinding: {
                            $visitor: typeof RedisMessageBindingVisitor;
                        };
                    };
                    mercure: {
                        ServerBinding: {
                            $visitor: typeof MercureServerBindingVisitor;
                        };
                        ChannelBinding: {
                            $visitor: typeof MercureChannelBindingVisitor;
                        };
                        OperationBinding: {
                            $visitor: typeof MercureOperationBindingVisitor;
                        };
                        MessageBinding: {
                            $visitor: typeof MercureMessageBindingVisitor;
                        };
                    };
                    googlepubsub: {
                        ServerBinding: {
                            $visitor: typeof GooglepubsubServerBindingVisitor;
                        };
                        ChannelBinding: {
                            $visitor: typeof GooglepubsubChannelBindingVisitor;
                            fixedFields: {
                                bindingVersion: {
                                    $ref: string;
                                };
                                labels: {
                                    $ref: string;
                                };
                                messageRetentionDuration: {
                                    $ref: string;
                                };
                                messageStoragePolicy: {
                                    $ref: string;
                                };
                                schemaSettings: {
                                    $ref: string;
                                };
                                topic: {
                                    $ref: string;
                                };
                            };
                        };
                        OperationBinding: {
                            $visitor: typeof GooglepubsubOperationBindingVisitor;
                        };
                        MessageBinding: {
                            $visitor: typeof GooglepubsubMessageBindingVisitor;
                            fixedFields: {
                                bindingVersion: {
                                    $ref: string;
                                };
                                attributes: {
                                    $ref: string;
                                };
                                orderingKey: {
                                    $ref: string;
                                };
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    ibmmq: {
                        ServerBinding: {
                            $visitor: typeof IbmmqServerBindingVisitor;
                            fixedFields: {
                                groupId: {
                                    $ref: string;
                                };
                                ccdtQueueManagerName: {
                                    $ref: string;
                                };
                                cipherSpec: {
                                    $ref: string;
                                };
                                multiEndpointServer: {
                                    $ref: string;
                                };
                                heartBeatInterval: {
                                    $ref: string;
                                };
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                        ChannelBinding: {
                            $visitor: typeof IbmmqChannelBindingVisitor;
                            fixedFields: {
                                destinationType: {
                                    $ref: string;
                                };
                                queue: {
                                    $ref: string;
                                };
                                topic: {
                                    $ref: string;
                                };
                                maxMsgLength: {
                                    $ref: string;
                                };
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                        MessageBinding: {
                            $visitor: typeof IbmmqMessageBindingVisitor;
                            fixedFields: {
                                type: {
                                    $ref: string;
                                };
                                headers: {
                                    $ref: string;
                                };
                                description: {
                                    $ref: string;
                                };
                                expiry: {
                                    $ref: string;
                                };
                                bindingVersion: {
                                    $ref: string;
                                };
                            };
                        };
                        OperationBinding: {
                            $visitor: typeof IbmmqOperationBindingVisitor;
                        };
                    };
                };
            };
            extension: {
                $visitor: typeof SpecificationExtensionVisitor;
            };
        };
    };
};

/**
 * This is a base Type for every visitor that does
 * internal look-ups to retrieve other child visitors.
 */
interface SpecificationVisitorOptions extends VisitorOptions {
    readonly specObj: typeof specification;
}
declare class SpecificationVisitor extends Visitor {
    protected readonly specObj: typeof specification;
    protected readonly passingOptionsNames: string[];
    constructor({ specObj, ...rest }: SpecificationVisitorOptions);
    retrievePassingOptions(): string[];
    retrieveFixedFields(specPath: string[]): string[];
    retrieveVisitor(specPath: string[]): unknown;
    retrieveVisitorInstance(specPath: string[], options?: {}): Visitor;
    toRefractedElement(specPath: string[], element: any, options?: {}): any;
}

type Alternator = {
    predicate: (element: unknown) => boolean;
    specPath: string[];
};
interface AlternatingVisitorOptions extends SpecificationVisitorOptions {
    readonly alternator: Alternator[];
}
declare class AlternatingVisitor extends SpecificationVisitor {
    protected alternator: Alternator[];
    constructor({ alternator, ...rest }: AlternatingVisitorOptions);
    enter(element: Element$1): {};
}

interface MixedFieldsVisitorOptions extends FixedFieldsVisitorOptions, PatternedFieldsVisitorOptions {
    readonly specPathFixedFields: SpecPath;
    readonly specPathPatternedFields: SpecPath;
}
declare const MixedFieldsVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & PatternedFieldsVisitor, typeof FixedFieldsVisitor & typeof PatternedFieldsVisitor>;
declare class MixedFieldsVisitor extends MixedFieldsVisitor_base {
    protected specPathFixedFields: SpecPath;
    protected specPathPatternedFields: SpecPath;
    constructor({ specPathFixedFields, specPathPatternedFields, ...rest }: MixedFieldsVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare const getNodeType: <T extends Element$1>(element: T) => string | undefined;
declare const keyMap: {
    ObjectElement: string[];
    ArrayElement: string[];
    MemberElement: string[];
    StringElement: never[];
    BooleanElement: never[];
    NumberElement: never[];
    NullElement: never[];
    RefElement: never[];
    LinkElement: never[];
    Annotation: never[];
    Comment: never[];
    ParseResultElement: string[];
    SourceMap: string[];
    /**
     * AsyncApi >= 2.0.0 <=2.6.0 specification elements.
     */
    AsyncApi2Element: string[];
    AsyncApiVersionElement: never[];
    ChannelBindingsElement: string[];
    ChannelItemElement: string[];
    ChannelsElement: string[];
    ComponentsElement: string[];
    ContactElement: string[];
    CorrelationIDElement: string[];
    DefaultContentType: never[];
    ExternalDocumentationElement: string[];
    InfoElement: string[];
    LicenseElement: string[];
    MessageElement: string[];
    MessageBindingsElement: string[];
    MessageTraitElement: string[];
    OAuthFlowElement: string[];
    OAuthFlowsElement: string[];
    OperationElement: string[];
    OperationBindingsElement: string[];
    OperationTraitElement: string[];
    ParameterElement: string[];
    ParametersElement: string[];
    ReferenceElement: string[];
    SchemaElement: string[];
    SecurityRequirementElement: string[];
    SecuritySchemeElement: string[];
    ServerElement: string[];
    ServerBindingsElement: string[];
    ServersElement: string[];
    ServerVariableElement: string[];
    TagElement: string[];
    TagsElement: string[];
    /**
     * Binding elements.
     */
    AmqpChannelBindingElement: string[];
    AmqpMessageBindingElement: string[];
    AmqpOperationBindingElement: string[];
    AmqpServerBindingElement: string[];
    Amqp1ChannelBindingElement: string[];
    Amqp1MessageBindingElement: string[];
    Amqp1OperationBindingElement: string[];
    Amqp1ServerBindingElement: string[];
    AnypointmqChannelBindingElement: string[];
    AnypointmqMessageBindingElement: string[];
    AnypointmqOperationBindingElement: string[];
    AnypointmqServerBindingElement: string[];
    GooglepubsubChannelBindingElement: string[];
    GooglepubsubMessageBindingElement: string[];
    GooglepubsubOperationBindingElement: string[];
    GooglepubsubServerBindingElement: string[];
    HttpChannelBindingElement: string[];
    HttpMessageBindingElement: string[];
    HttpOperationBindingElement: string[];
    HttpServerBindingElement: string[];
    IbmmqChannelBindingElement: string[];
    IbmmqMessageBindingElement: string[];
    IbmmqChannelOperationElement: string[];
    IbmmqServerBindingElement: string[];
    JmsChannelBindingElement: string[];
    JmsMessageBindingElement: string[];
    JmsOperationBindingElement: string[];
    JmsServerBindingElement: string[];
    KafkaChannelBindingElement: string[];
    KafkaMessageBindingElement: string[];
    KafkaOperationBindingElement: string[];
    KafkaServerBindingElement: string[];
    MercureChannelBindingElement: string[];
    MercureMessageBindingElement: string[];
    MercureOperationBindingElement: string[];
    MercureServerBindingElement: string[];
    MqttChannelBindingElement: string[];
    MqttMessageBindingElement: string[];
    MqttOperationBindingElement: string[];
    MqttServerBindingElement: string[];
    Mqtt5ChannelBindingElement: string[];
    Mqtt5MessageBindingElement: string[];
    Mqtt5OperationBindingElement: string[];
    Mqtt5ServerBindingElement: string[];
    NatsChannelBindingElement: string[];
    NatsMessageBindingElement: string[];
    NatsOperationBindingElement: string[];
    NatsServerBindingElement: string[];
    PulsarChannelBindingElement: string[];
    PulsarMessageBindingElement: string[];
    PulsarOperationBindingElement: string[];
    PulsarServerBindingElement: string[];
    RedisChannelBindingElement: string[];
    RedisMessageBindingElement: string[];
    RedisOperationBindingElement: string[];
    RedisServerBindingElement: string[];
    SnsChannelBindingElement: string[];
    SnsMessageBindingElement: string[];
    SnsOperationBindingElement: string[];
    SnsServerBindingElement: string[];
    SolaceChannelBindingElement: string[];
    SolaceMessageBindingElement: string[];
    SolaceOperationBindingElement: string[];
    SolaceServerBindingElement: string[];
    SqsChannelBindingElement: string[];
    SqsMessageBindingElement: string[];
    SqsOperationBindingElement: string[];
    SqsServerBindingElement: string[];
    StompChannelBindingElement: string[];
    StompMessageBindingElement: string[];
    StompOperationBindingElement: string[];
    StompServerBindingElement: string[];
    WebSocketChannelBindingElement: string[];
    WebSocketMessageBindingElement: string[];
    WebSocketOperationBindingElement: string[];
    WebSocketServerBindingElement: string[];
};

export { AlternatingVisitor, type AlternatingVisitorOptions, Amqp1ChannelBinding as Amqp1ChannelBindingElement, Amqp1ChannelBindingVisitor, type Amqp1ChannelBindingVisitorOptions, Amqp1MessageBinding as Amqp1MessageBindingElement, Amqp1MessageBindingVisitor, type Amqp1MessageBindingVisitorOptions, Amqp1OperationBinding as Amqp1OperationBindingElement, Amqp1OperationBindingVisitor, type Amqp1OperationBindingVisitorOptions, Amqp1ServerBinding as Amqp1ServerBindingElement, Amqp1ServerBindingVisitor, type Amqp1ServerBindingVisitorOptions, AmqpChannelBinding as AmqpChannelBindingElement, AmqpChannelBindingVisitor, type AmqpChannelBindingVisitorOptions, AmqpMessageBinding as AmqpMessageBindingElement, AmqpMessageBindingVisitor, type AmqpMessageBindingVisitorOptions, AmqpOperationBinding as AmqpOperationBindingElement, AmqpOperationBindingVisitor, type AmqpOperationBindingVisitorOptions, AmqpServerBinding as AmqpServerBindingElement, AmqpServerBindingVisitor, type AmqpServerBindingVisitorOptions, AnypointmqChannelBinding as AnypointmqChannelBindingElement, AnypointmqChannelBindingVisitor, type AnypointmqChannelBindingVisitorOptions, AnypointmqMessageBinding as AnypointmqMessageBindingElement, AnypointmqMessageBindingVisitor, type AnypointmqMessageBindingVisitorOptions, AnypointmqOperationBinding as AnypointmqOperationBindingElement, AnypointmqOperationBindingVisitor, type AnypointmqOperationBindingVisitorOptions, AnypointmqServerBinding as AnypointmqServerBindingElement, AnypointmqServerBindingVisitor, type AnypointmqServerBindingVisitorOptions, AsyncAPIMediaTypes, AsyncApi2 as AsyncApi2Element, AsyncApi2Visitor, type AsyncApi2VisitorOptions, AsyncApiVersion as AsyncApiVersionElement, AsyncApiVersionVisitor, type AsyncApiVersionVisitorOptions, ChannelBindings as ChannelBindingsElement, ChannelBindingsVisitor, type ChannelBindingsVisitorOptions, $RefVisitor as ChannelItem$RefVisitor, type VisitorOptions as ChannelItem$RefVisitorOptions, BindingsVisitor$3 as ChannelItemBindingsVisitor, type BindingsVisitorOptions$3 as ChannelItemBindingsVisitorOptions, ChannelItem as ChannelItemElement, ServersVisitor as ChannelItemServersVisitor, type ServersVisitorOptions as ChannelItemServersVisitorOptions, ChannelItemVisitor, type ChannelItemVisitorOptions, Channels as ChannelsElement, ChannelsVisitor, type ChannelsVisitorOptions, ChannelBindingsVisitor$1 as ComponentsChannelBindingsVisitor, type ChannelBindingsVisitorOptions$1 as ComponentsChannelBindingsVisitorOptions, ChannelsVisitor$1 as ComponentsChannelsVisitor, type ChannelsVisitorOptions$1 as ComponentsChannelsVisitorOptions, CorrelationIdsVisitor as ComponentsCorrelationIdsVisitor, type CorrelationIdsVisitorOptions as ComponentsCorrelationIdsVisitorOptions, Components as ComponentsElement, MessageBindingsVisitor$1 as ComponentsMessageBindingsVisitor, type MessageBindingsVisitorOptions$1 as ComponentsMessageBindingsVisitorOptions, MessageTraitsVisitor as ComponentsMessageTraitsVisitor, type MessageTraitsVisitorOptions as ComponentsMessageTraitsVisitorOptions, MessagesVisitor as ComponentsMessagesVisitor, type MessagesVisitorOptions as ComponentsMessagesVisitorOptions, OperationBindingsVisitor$1 as ComponentsOperationBindingsVisitor, type OperationBindingsVisitorOptions$1 as ComponentsOperationBindingsVisitorOptions, OperationTraitsVisitor as ComponentsOperationTraitsVisitor, type OperationTraitsVisitorOptions as ComponentsOperationTraitsVisitorOptions, ParametersVisitor as ComponentsParametersVisitor, type ParametersVisitorOptions as ComponentsParametersVisitorOptions, SchemasVisitor as ComponentsSchemasVisitor, type SchemasVisitorOptions as ComponentsSchemasVisitorOptions, SecuritySchemesVisitor as ComponentsSecuritySchemesVisitor, type SecuritySchemesVisitorOptions as ComponentsSecuritySchemesVisitorOptions, ServerBindingsVisitor as ComponentsServerBindingsVisitor, type ServerBindingsVisitorOptions as ComponentsServerBindingsVisitorOptions, ServerVariablesVisitor as ComponentsServerVariablesVisitor, type ServerVariablesVisitorOptions as ComponentsServerVariablesVisitorOptions, ServersVisitor$1 as ComponentsServersVisitor, type ServersVisitorOptions$1 as ComponentsServersVisitorOptions, ComponentsVisitor, type ComponentsVisitorOptions, Contact as ContactElement, ContactVisitor, type ContactVisitorOptions, CorrelationID as CorrelationIDElement, CorrelationIDVisitor, type CorrelationIDVisitorOptions, DefaultContentType as DefaultContentTypeElement, DefaultContentTypeVisitor, type DefaultContentTypeVisitorOptions, ExternalDocumentation as ExternalDocumentationElement, ExternalDocumentationVisitor, type ExternalDocumentationVisitorOptions, FallbackVisitor, type VisitorOptions as FallbackVisitorOptions, FixedFieldsVisitor, type FixedFieldsVisitorOptions, GooglepubsubChannelBinding as GooglepubsubChannelBindingElement, GooglepubsubChannelBindingVisitor, type GooglepubsubChannelBindingVisitorOptions, GooglepubsubMessageBinding as GooglepubsubMessageBindingElement, GooglepubsubMessageBindingVisitor, type GooglepubsubMessageBindingVisitorOptions, GooglepubsubOperationBinding as GooglepubsubOperationBindingElement, GooglepubsubOperationBindingVisitor, type GooglepubsubOperationBindingVisitorOptions, GooglepubsubServerBinding as GooglepubsubServerBindingElement, GooglepubsubServerBindingVisitor, type GooglepubsubServerBindingVisitorOptions, HttpChannelBinding as HttpChannelBindingElement, HttpChannelBindingVisitor, type HttpChannelBindingVisitorOptions, HttpMessageBinding as HttpMessageBindingElement, HttpMessageBindingVisitor, type HttpMessageBindingVisitorOptions, HttpOperationBinding as HttpOperationBindingElement, HttpOperationBindingVisitor, type HttpOperationBindingVisitorOptions, HttpServerBinding as HttpServerBindingElement, HttpServerBindingVisitor, type HttpServerBindingVisitorOptions, IbmmqChannelBinding as IbmmqChannelBindingElement, IbmmqChannelBindingVisitor, type IbmmqChannelBindingVisitorOptions, IbmmqMessageBinding as IbmmqMessageBindingElement, IbmmqMessageBindingVisitor, type IbmmqMessageBindingVisitorOptions, IbmmqOperationBinding as IbmmqOperationBindingElement, IbmmqOperationBindingVisitor, type IbmmqOperationBindingVisitorOptions, IbmmqServerBinding as IbmmqServerBindingElement, IbmmqServerBindingVisitor, type IbmmqServerBindingVisitorOptions, Identifier as IdentifierElement, IdentifierVisitor, type IdentifierVisitorOptions, Info as InfoElement, VersionVisitor as InfoVersionVisitor, type VisitorOptions as InfoVersionVisitorOptions, InfoVisitor, type InfoVisitorOptions, JmsChannelBinding as JmsChannelBindingElement, JmsChannelBindingVisitor, type JmsChannelBindingVisitorOptions, JmsMessageBinding as JmsMessageBindingElement, JmsMessageBindingVisitor, type JmsMessageBindingVisitorOptions, JmsOperationBinding as JmsOperationBindingElement, JmsOperationBindingVisitor, type JmsOperationBindingVisitorOptions, JmsServerBinding as JmsServerBindingElement, JmsServerBindingVisitor, type JmsServerBindingVisitorOptions, KafkaChannelBinding as KafkaChannelBindingElement, KafkaChannelBindingVisitor, type KafkaChannelBindingVisitorOptions, KafkaMessageBinding as KafkaMessageBindingElement, KafkaMessageBindingVisitor, type KafkaMessageBindingVisitorOptions, KafkaOperationBinding as KafkaOperationBindingElement, KafkaOperationBindingVisitor, type KafkaOperationBindingVisitorOptions, KafkaServerBinding as KafkaServerBindingElement, KafkaServerBindingVisitor, type KafkaServerBindingVisitorOptions, License as LicenseElement, LicenseVisitor, type LicenseVisitorOptions, MapVisitor, type MapVisitorOptions, MercureChannelBinding as MercureChannelBindingElement, MercureChannelBindingVisitor, type MercureChannelBindingVisitorOptions, MercureMessageBinding as MercureMessageBindingElement, MercureMessageBindingVisitor, type MercureMessageBindingVisitorOptions, MercureOperationBinding as MercureOperationBindingElement, MercureOperationBindingVisitor, type MercureOperationBindingVisitorOptions, MercureServerBinding as MercureServerBindingElement, MercureServerBindingVisitor, type MercureServerBindingVisitorOptions, MessageBindings as MessageBindingsElement, BindingsVisitor$1 as MessageBindingsFieldVisitor, type BindingsVisitorOptions$1 as MessageBindingsFieldVisitorOptions, MessageBindingsVisitor, type MessageBindingsVisitorOptions, CorrelationIdVisitor as MessageCorrelationIdVisitor, type CorrelationIdVisitorOptions as MessageCorrelationIdVisitorOptions, Message as MessageElement, MessageExample as MessageExampleElement, MessageExampleVisitor, type MessageExampleVisitorOptions, ExamplesVisitor as MessageExamplesVisitor, type ExamplesVisitorOptions as MessageExamplesVisitorOptions, HeadersVisitor as MessageHeadersVisitor, type HeadersVisitorOptions as MessageHeadersVisitorOptions, BindingsVisitor$2 as MessageTraitBindingsVisitor, type BindingsVisitorOptions$2 as MessageTraitBindingsVisitorOptions, CorrelationIdVisitor$1 as MessageTraitCorrelationIdVisitor, type CorrelationIdVisitorOptions$1 as MessageTraitCorrelationIdVisitorOptions, MessageTrait as MessageTraitElement, ExamplesVisitor$1 as MessageTraitExamplesVisitor, type ExamplesVisitorOptions$1 as MessageTraitExamplesVisitorOptions, DefaultVisitor as MessageTraitHeadersVisitor, type DefaultVisitorOptions as MessageTraitHeadersVisitorOptions, MessageTraitVisitor, type MessageTraitVisitorOptions, TraitsVisitor as MessageTraitsVisitor, type TraitsVisitorOptions as MessageTraitsVisitorOptions, MessageVisitor, type MessageVisitorOptions, MixedFieldsVisitor, type MixedFieldsVisitorOptions, Mqtt5ChannelBinding as Mqtt5ChannelBindingElement, Mqtt5ChannelBindingVisitor, type Mqtt5ChannelBindingVisitorOptions, Mqtt5MessageBinding as Mqtt5MessageBindingElement, Mqtt5MessageBindingVisitor, type Mqtt5MessageBindingVisitorOptions, Mqtt5OperationBinding as Mqtt5OperationBindingElement, Mqtt5OperationBindingVisitor, type Mqtt5OperationBindingVisitorOptions, Mqtt5ServerBinding as Mqtt5ServerBindingElement, Mqtt5ServerBindingVisitor, type Mqtt5ServerBindingVisitorOptions, MqttChannelBinding as MqttChannelBindingElement, MqttChannelBindingVisitor, type MqttChannelBindingVisitorOptions, MqttMessageBinding as MqttMessageBindingElement, MqttMessageBindingVisitor, type MqttMessageBindingVisitorOptions, MqttOperationBinding as MqttOperationBindingElement, MqttOperationBindingVisitor, type MqttOperationBindingVisitorOptions, MqttServerBinding as MqttServerBindingElement, MqttServerBindingVisitor, type MqttServerBindingVisitorOptions, NatsChannelBinding as NatsChannelBindingElement, NatsChannelBindingVisitor, type NatsChannelBindingVisitorOptions, NatsMessageBinding as NatsMessageBindingElement, NatsMessageBindingVisitor, type NatsMessageBindingVisitorOptions, NatsOperationBinding as NatsOperationBindingElement, NatsOperationBindingVisitor, type NatsOperationBindingVisitorOptions, NatsServerBinding as NatsServerBindingElement, NatsServerBindingVisitor, type NatsServerBindingVisitorOptions, OAuthFlow as OAuthFlowElement, ScopesVisitor as OAuthFlowScopesVisitor, type ScopesVisitorOptions as OAuthFlowScopesVisitorOptions, OAuthFlowVisitor, type OAuthFlowVisitorOptions, OAuthFlows as OAuthFlowsElement, OAuthFlowsVisitor, type OAuthFlowsVisitorOptions, OperationBindings as OperationBindingsElement, BindingsVisitor$4 as OperationBindingsFieldVisitor, type BindingsVisitorOptions$4 as OperationBindingsFieldVisitorOptions, OperationBindingsVisitor, type OperationBindingsVisitorOptions, Operation as OperationElement, MessageVisitor$1 as OperationMessageVisitor, type MessageVisitorOptions$1 as OperationMessageVisitorOptions, SecurityVisitor$1 as OperationSecurityVisitor, type SecurityVisitorOptions$1 as OperationSecurityVisitorOptions, BindingsVisitor as OperationTraitBindingsVisitor, type BindingsVisitorOptions as OperationTraitBindingsVisitorOptions, OperationTrait as OperationTraitElement, SecurityVisitor as OperationTraitSecurityVisitor, type SecurityVisitorOptions as OperationTraitSecurityVisitorOptions, OperationTraitVisitor, type OperationTraitVisitorOptions, TraitsVisitor$1 as OperationTraitsVisitor, type TraitsVisitorOptions$1 as OperationTraitsVisitorOptions, OperationVisitor, type OperationVisitorOptions, Parameter as ParameterElement, SchemaVisitor as ParameterSchemaVisitor, type SchemaVisitorOptions as ParameterSchemaVisitorOptions, ParameterVisitor, type ParameterVisitorOptions, Parameters as ParametersElement, ParametersVisitor$1 as ParametersVisitor, type ParametersVisitorOptions$1 as ParametersVisitorOptions, PatternedFieldsVisitor, type PatternedFieldsVisitorOptions, PulsarChannelBinding as PulsarChannelBindingElement, PulsarChannelBindingVisitor, type PulsarChannelBindingVisitorOptions, PulsarMessageBinding as PulsarMessageBindingElement, PulsarMessageBindingVisitor, type PulsarMessageBindingVisitorOptions, PulsarOperationBinding as PulsarOperationBindingElement, PulsarOperationBindingVisitor, type PulsarOperationBindingVisitorOptions, PulsarServerBinding as PulsarServerBindingElement, PulsarServerBindingVisitor, type PulsarServerBindingVisitorOptions, RedisChannelBinding as RedisChannelBindingElement, RedisChannelBindingVisitor, type RedisChannelBindingVisitorOptions, RedisMessageBinding as RedisMessageBindingElement, RedisMessageBindingVisitor, type RedisMessageBindingVisitorOptions, RedisOperationBinding as RedisOperationBindingElement, RedisOperationBindingVisitor, type RedisOperationBindingVisitorOptions, RedisServerBinding as RedisServerBindingElement, RedisServerBindingVisitor, type RedisServerBindingVisitorOptions, $RefVisitor$1 as Reference$RefVisitor, type VisitorOptions as Reference$RefVisitorOptions, Reference as ReferenceElement, ReferenceVisitor, type ReferenceVisitorOptions, AllOfVisitor as SchemaAllOfVisitor, AnyOfVisitor as SchemaAnyOfVisitor, DefinitionsVisitor as SchemaDefinitionsVisitor, DependenciesVisitor as SchemaDependenciesVisitor, Schema as SchemaElement, ItemsVisitor as SchemaItemsVisitor, OneOfVisitor as SchemaOneOfVisitor, SchemaOrReferenceVisitor, PatternPropertiesVisitor as SchemaPatternPropertiesVisitor, PropertiesVisitor as SchemaPropertiesVisitor, SchemaVisitor$1 as SchemaVisitor, type SchemaVisitorOptions$1 as SchemaVisitorOptions, SecurityRequirement as SecurityRequirementElement, SecurityRequirementVisitor, type SecurityRequirementVisitorOptions, SecurityScheme as SecuritySchemeElement, SecuritySchemeVisitor, type SecuritySchemeVisitorOptions, ServerBindings as ServerBindingsElement, BindingsVisitor$5 as ServerBindingsFieldVisitor, type BindingsVisitorOptions$5 as ServerBindingsFieldVisitorOptions, ServerBindingsVisitor$1 as ServerBindingsVisitor, type ServerBindingsVisitorOptions$1 as ServerBindingsVisitorOptions, Server as ServerElement, SecurityVisitor$2 as ServerSecurityVisitor, type SecurityVisitorOptions$2 as ServerSecurityVisitorOptions, UrlVisitor as ServerUrlVisitor, type VisitorOptions as ServerUrlVisitorOptions, ServerVariable as ServerVariableElement, ServerVariableVisitor, type ServerVariableVisitorOptions, VariablesVisitor as ServerVariablesVisitor, type VariablesVisitorOptions as ServerVariablesVisitorOptions, ServerVisitor, type ServerVisitorOptions, Servers as ServersElement, ServersVisitor$2 as ServersVisitor, type ServersVisitorOptions$2 as ServersVisitorOptions, SnsChannelBinding as SnsChannelBindingElement, SnsChannelBindingVisitor, type SnsChannelBindingVisitorOptions, SnsMessageBinding as SnsMessageBindingElement, SnsMessageBindingVisitor, type SnsMessageBindingVisitorOptions, SnsOperationBinding as SnsOperationBindingElement, SnsOperationBindingVisitor, type SnsOperationBindingVisitorOptions, SnsServerBinding as SnsServerBindingElement, SnsServerBindingVisitor, type SnsServerBindingVisitorOptions, SolaceChannelBinding as SolaceChannelBindingElement, SolaceChannelBindingVisitor, type SolaceChannelBindingVisitorOptions, SolaceMessageBinding as SolaceMessageBindingElement, SolaceMessageBindingVisitor, type SolaceMessageBindingVisitorOptions, SolaceOperationBinding as SolaceOperationBindingElement, SolaceOperationBindingVisitor, type SolaceOperationBindingVisitorOptions, SolaceServerBinding as SolaceServerBindingElement, SolaceServerBindingVisitor, type SolaceServerBindingVisitorOptions, type SpecPath, SpecificationExtensionVisitor, type SpecificationVisitorOptions as SpecificationExtensionVisitorOptions, SpecificationVisitor, type SpecificationVisitorOptions, SqsChannelBinding as SqsChannelBindingElement, SqsChannelBindingVisitor, type SqsChannelBindingVisitorOptions, SqsMessageBinding as SqsMessageBindingElement, SqsMessageBindingVisitor, type SqsMessageBindingVisitorOptions, SqsOperationBinding as SqsOperationBindingElement, SqsOperationBindingVisitor, type SqsOperationBindingVisitorOptions, SqsServerBinding as SqsServerBindingElement, SqsServerBindingVisitor, type SqsServerBindingVisitorOptions, StompChannelBinding as StompChannelBindingElement, StompChannelBindingVisitor, type StompChannelBindingVisitorOptions, StompMessageBinding as StompMessageBindingElement, StompMessageBindingVisitor, type StompMessageBindingVisitorOptions, StompOperationBinding as StompOperationBindingElement, StompOperationBindingVisitor, type StompOperationBindingVisitorOptions, StompServerBinding as StompServerBindingElement, StompServerBindingVisitor, type StompServerBindingVisitorOptions, Tag as TagElement, TagVisitor, type TagVisitorOptions, Tags as TagsElement, TagsVisitor, type TagsVisitorOptions, Visitor, type VisitorOptions, WebSocketChannelBinding as WebSocketChannelBindingElement, WebSocketChannelBindingVisitor, type WebSocketChannelBindingVisitorOptions, WebSocketMessageBinding as WebSocketMessageBindingElement, WebSocketMessageBindingVisitor, type WebSocketMessageBindingVisitorOptions, WebSocketOperationBinding as WebSocketOperationBindingElement, WebSocketOperationBindingVisitor, type WebSocketOperationBindingVisitorOptions, WebSocketServerBinding as WebSocketServerBindingElement, WebSocketServerBindingVisitor, type WebSocketServerBindingVisitorOptions, asyncApi2 as default, getNodeType, isAsyncApi2Element, isAsyncApiExtension, isAsyncApiVersionElement, isBooleanJsonSchemaElement, isChannelBindingsElement, isChannelItemElement, isChannelsElement, isComponentsElement, isContactElement, isIdentifierElement, isInfoElement, isLicenseElement, isOperationElement, isParameterElement, isParametersElement, isReferenceElement, isReferenceLikeElement, isSchemaElement, isSecurityRequirementElement, isServerBindingsElement, isServerElement, isServerVariableElement, isServersElement, keyMap, mediaTypes, plugin as refractorPluginReplaceEmptyElement };
