import * as _swagger_api_apidom_core from '@swagger-api/apidom-core';
import { MediaTypes, NamespacePluginOptions, StringElement, Element, ObjectElement, Meta, Attributes, BooleanElement, ArrayElement, ElementPredicate, isElement, isStringElement, isArrayElement, isObjectElement, isMemberElement, includesClasses, hasElementSourceMap, MemberElement } from '@swagger-api/apidom-core';
export { isArrayElement, isBooleanElement, isElement, isLinkElement as isLinkPrimitiveElement, isMemberElement, isNullElement, isNumberElement, isObjectElement, isRefElement, isStringElement } from '@swagger-api/apidom-core';
import * as minim from 'minim';
import { ObjectElement as ObjectElement$1 } from 'minim';
import * as _swagger_api_apidom_ns_json_schema_draft_4 from '@swagger-api/apidom-ns-json-schema-draft-4';
import { JSONSchemaElement, MediaElement, JSONReferenceElement } from '@swagger-api/apidom-ns-json-schema-draft-4';
export { AllOfVisitorOptions as SchemaAllOfVisitorOptions, AnyOfVisitorOptions as SchemaAnyOfVisitorOptions, ItemsVisitorOptions as SchemaItemsVisitorOptions, OneOfVisitorOptions as SchemaOneOfVisitorOptions, SchemaOrReferenceVisitorOptions, PropertiesVisitorOptions as SchemaPropertiesVisitorOptions, TypeVisitorOptions as SchemaTypeVisitorOptions } from '@swagger-api/apidom-ns-json-schema-draft-4';
import * as ts_mixer_dist_types_types from 'ts-mixer/dist/types/types';

type Format = 'generic' | 'json' | 'yaml';
declare class OpenAPIMediaTypes extends MediaTypes<string> {
    filterByFormat(format?: Format): string[];
    findBy(version?: string, format?: Format): string;
    latest(format?: Format): string;
}
declare const mediaTypes: OpenAPIMediaTypes;

declare const openApi3_0: {
    namespace: (options: NamespacePluginOptions) => minim.Namespace;
};

declare const plugin: () => () => {
    visitor: {
        StringElement(element: StringElement, key: any, parent: any, path: any, ancestors: any[]): any;
    };
};

declare const refract: <T extends Element>(value: unknown, { specPath, plugins }?: {
    specPath?: string[] | undefined;
    plugins?: never[] | undefined;
}) => T;
declare const createRefractor: (specPath: string[]) => (value: unknown, options?: {}) => Element;

declare class Callback extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class Components extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get schemas(): ObjectElement | undefined;
    set schemas(schemas: ObjectElement | undefined);
    get responses(): ObjectElement | undefined;
    set responses(responses: ObjectElement | undefined);
    get parameters(): ObjectElement | undefined;
    set parameters(parameters: ObjectElement | undefined);
    get examples(): ObjectElement | undefined;
    set examples(examples: ObjectElement | undefined);
    get requestBodies(): ObjectElement | undefined;
    set requestBodies(requestBodies: ObjectElement | undefined);
    get headers(): ObjectElement | undefined;
    set headers(headers: ObjectElement | undefined);
    get securitySchemes(): ObjectElement | undefined;
    set securitySchemes(securitySchemes: ObjectElement | undefined);
    get links(): ObjectElement | undefined;
    set links(links: ObjectElement | undefined);
    get callbacks(): ObjectElement | undefined;
    set callbacks(callbacks: ObjectElement | undefined);
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

declare class Example extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get summary(): StringElement | undefined;
    set summary(summary: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get value(): Element | undefined;
    set value(value: Element | undefined);
    get externalValue(): StringElement | undefined;
    set externalValue(externalValue: StringElement | undefined);
}

declare class ExternalDocumentation extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get url(): StringElement | undefined;
    set url(url: StringElement | undefined);
}

declare class Reference extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get $ref(): StringElement | undefined;
    set $ref($ref: StringElement | undefined);
}

declare class Discriminator extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get propertyName(): StringElement | undefined;
    set propertyName(propertyName: StringElement | undefined);
    get mapping(): ObjectElement | undefined;
    set mapping(mapping: ObjectElement | undefined);
}

declare class Xml extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get name(): StringElement | undefined;
    set name(name: StringElement | undefined);
    get namespace(): StringElement | undefined;
    set namespace(namespace: StringElement | undefined);
    get prefix(): StringElement | undefined;
    set prefix(prefix: StringElement | undefined);
    get attribute(): BooleanElement | undefined;
    set attribute(attribute: BooleanElement | undefined);
    get wrapped(): BooleanElement | undefined;
    set wrapped(wrapped: BooleanElement | undefined);
}

declare class Schema extends JSONSchemaElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    /**
     * Core vocabulary
     *
     * URI: https://tools.ietf.org/html/draft-wright-json-schema-00
     */
    get idProp(): StringElement | undefined;
    set idProp(idProps: StringElement | undefined);
    get $schema(): StringElement | undefined;
    set $schema($schema: StringElement | undefined);
    /**
     * Validation keywords for arrays
     */
    get additionalItems(): this | Reference | BooleanElement | undefined;
    set additionalItems(additionalItems: this | Reference | BooleanElement | undefined);
    get items(): this | Reference | undefined;
    set items(items: this | Reference | undefined);
    /**
     * Validation keywords for objects
     */
    get additionalProperties(): this | Reference | BooleanElement | undefined;
    set additionalProperties(additionalProperties: this | Reference | BooleanElement | undefined);
    get patternProperties(): ObjectElement | undefined;
    set patternProperties(patternProperties: ObjectElement | undefined);
    get dependencies(): ObjectElement | undefined;
    set dependencies(dependencies: ObjectElement | undefined);
    /**
     *  Validation keywords for any instance type
     */
    get type(): StringElement | undefined;
    set type(type: StringElement | undefined);
    get not(): this | Reference | undefined;
    set not(not: this | Reference | undefined);
    get definitions(): ObjectElement | undefined;
    set definitions(definitions: ObjectElement | undefined);
    /**
     * JSON Hyper-Schema
     *
     * URI: https://datatracker.ietf.org/doc/html/draft-wright-json-schema-hyperschema-00
     */
    get base(): StringElement | undefined;
    set base(base: StringElement | undefined);
    get links(): ArrayElement | undefined;
    set links(links: ArrayElement | undefined);
    get media(): MediaElement | undefined;
    set media(media: MediaElement | undefined);
    /**
     * OpenAPI vocabulary
     */
    get nullable(): BooleanElement | undefined;
    set nullable(nullable: BooleanElement | undefined);
    get discriminator(): Discriminator | undefined;
    set discriminator(discriminator: Discriminator | undefined);
    get writeOnly(): BooleanElement | undefined;
    set writeOnly(writeOnly: BooleanElement | undefined);
    get xml(): Xml | undefined;
    set xml(xml: Xml | undefined);
    get externalDocs(): ExternalDocumentation | undefined;
    set externalDocs(externalDocs: ExternalDocumentation | undefined);
    get example(): Element | undefined;
    set example(example: Element | undefined);
    get deprecated(): BooleanElement | undefined;
    set deprecated(deprecated: BooleanElement | undefined);
}

declare class Header extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get required(): BooleanElement;
    set required(required: BooleanElement | undefined);
    get deprecated(): BooleanElement | undefined;
    set deprecated(deprecated: BooleanElement | undefined);
    get allowEmptyValue(): BooleanElement | undefined;
    set allowEmptyValue(allowEmptyValue: BooleanElement | undefined);
    get style(): StringElement | undefined;
    set style(style: StringElement | undefined);
    get explode(): BooleanElement | undefined;
    set explode(explode: BooleanElement | undefined);
    get allowReserved(): BooleanElement | undefined;
    set allowReserved(allowReserved: BooleanElement | undefined);
    get schema(): Schema | Reference | undefined;
    set schema(schema: Schema | Reference | undefined);
    get example(): Element | undefined;
    set example(example: Element | undefined);
    get examples(): ObjectElement | undefined;
    set examples(examples: ObjectElement | undefined);
    get contentProp(): ObjectElement | undefined;
    set contentProp(content: ObjectElement | undefined);
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
    get contact(): Contact | undefined;
    set contact(contactElement: Contact | undefined);
    get license(): License | undefined;
    set license(licenseElement: License | undefined);
    get version(): StringElement | undefined;
    set version(version: StringElement | undefined);
}

declare class Server extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get url(): StringElement | undefined;
    set url(url: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get variables(): ObjectElement | undefined;
    set variables(variables: ObjectElement | undefined);
}

declare class RequestBody extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get contentProp(): ObjectElement | undefined;
    set contentProp(content: ObjectElement | undefined);
    get required(): BooleanElement;
    set required(required: BooleanElement);
}

declare class Response extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get headers(): ObjectElement | undefined;
    set headers(headers: ObjectElement | undefined);
    get contentProp(): ObjectElement | undefined;
    set contentProp(contentProp: ObjectElement | undefined);
    get links(): ObjectElement | undefined;
    set links(links: ObjectElement | undefined);
}

declare class Responses extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get default(): Response | Reference | undefined;
    set default(defaultValue: Response | Reference | undefined);
}

declare class Operation extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get tags(): ArrayElement | undefined;
    set tags(tags: ArrayElement | undefined);
    get summary(): StringElement | undefined;
    set summary(description: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    set externalDocs(externalDocs: ExternalDocumentation | undefined);
    get externalDocs(): ExternalDocumentation | undefined;
    get operationId(): StringElement | undefined;
    set operationId(operationId: StringElement | undefined);
    get parameters(): ArrayElement | undefined;
    set parameters(parameters: ArrayElement | undefined);
    get requestBody(): RequestBody | Reference | undefined;
    set requestBody(requestBody: RequestBody | Reference | undefined);
    get responses(): Responses | undefined;
    set responses(responses: Responses | undefined);
    get callbacks(): ObjectElement | undefined;
    set callbacks(callbacks: ObjectElement | undefined);
    get deprecated(): BooleanElement;
    set deprecated(deprecated: BooleanElement);
    get security(): ArrayElement | undefined;
    set security(security: ArrayElement | undefined);
    get servers(): ArrayElement | undefined;
    set servers(servers: ArrayElement | undefined);
}

declare class Link extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get operationRef(): StringElement | undefined;
    set operationRef(operationRef: StringElement | undefined);
    get operationId(): StringElement | undefined;
    set operationId(operationId: StringElement | undefined);
    get operation(): Operation | undefined;
    set operation(operation: Operation | undefined);
    get parameters(): ObjectElement | undefined;
    set parameters(parameters: ObjectElement | undefined);
    get requestBody(): Element | undefined;
    set requestBody(requestBody: Element | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get server(): Server | undefined;
    set server(server: Server | undefined);
}

declare class Openapi extends StringElement {
    constructor(content?: string, meta?: Meta, attributes?: Attributes);
}

declare class Paths extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class OpenApi3_0 extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get openapi(): Openapi | undefined;
    set openapi(openapi: Openapi | undefined);
    get info(): Info | undefined;
    set info(info: Info | undefined);
    get servers(): ArrayElement | undefined;
    set servers(servers: ArrayElement | undefined);
    get paths(): Paths | undefined;
    set paths(paths: Paths | undefined);
    get components(): Components | undefined;
    set components(components: Components | undefined);
    get security(): ArrayElement | undefined;
    set security(security: ArrayElement | undefined);
    get tags(): ArrayElement | undefined;
    set tags(tags: ArrayElement | undefined);
    get externalDocs(): ExternalDocumentation | undefined;
    set externalDocs(externalDocs: ExternalDocumentation | undefined);
}

declare class Parameter extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get name(): StringElement | undefined;
    set name(name: StringElement | undefined);
    get in(): StringElement | undefined;
    set in(val: StringElement | undefined);
    get required(): BooleanElement;
    set required(required: BooleanElement);
    get deprecated(): BooleanElement;
    set deprecated(deprecated: BooleanElement);
    get allowEmptyValue(): BooleanElement | undefined;
    set allowEmptyValue(allowEmptyValue: BooleanElement | undefined);
    get style(): StringElement | undefined;
    set style(style: StringElement | undefined);
    get explode(): BooleanElement | undefined;
    set explode(explode: BooleanElement | undefined);
    get allowReserved(): BooleanElement | undefined;
    set allowReserved(allowReserved: BooleanElement | undefined);
    get schema(): Schema | Reference | undefined;
    set schema(schema: Schema | Reference | undefined);
    get example(): Element | undefined;
    set example(example: Element | undefined);
    get examples(): ObjectElement | undefined;
    set examples(examples: ObjectElement | undefined);
    get contentProp(): ObjectElement | undefined;
    set contentProp(content: ObjectElement | undefined);
}

declare class PathItem extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get $ref(): StringElement | undefined;
    set $ref($ref: StringElement | undefined);
    get summary(): StringElement | undefined;
    set summary(summary: StringElement | undefined);
    get description(): StringElement;
    set description(description: StringElement | undefined);
    get GET(): Operation;
    set GET(operation: Operation | undefined);
    get PUT(): Operation;
    set PUT(operation: Operation | undefined);
    get POST(): Operation;
    set POST(operation: Operation | undefined);
    get DELETE(): Operation;
    set DELETE(operation: Operation | undefined);
    get OPTIONS(): Operation;
    set OPTIONS(operation: Operation | undefined);
    get HEAD(): Operation;
    set HEAD(operation: Operation | undefined);
    get PATCH(): Operation;
    set PATCH(operation: Operation | undefined);
    get TRACE(): Operation;
    set TRACE(operation: Operation | undefined);
    get servers(): ArrayElement | undefined;
    set servers(servers: ArrayElement | undefined);
    get parameters(): ArrayElement;
    set parameters(parameters: ArrayElement | undefined);
}

declare class SecurityRequirement extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
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

declare class ServerVariable extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get enum(): ArrayElement | undefined;
    set enum(value: ArrayElement | undefined);
    get default(): StringElement | undefined;
    set default(value: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
}

declare class MediaType extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get schema(): Schema | Reference | undefined;
    set schema(schema: Schema | Reference | undefined);
    get example(): Element | undefined;
    set example(example: Element | undefined);
    get examples(): ObjectElement | undefined;
    set examples(examples: ObjectElement | undefined);
    get encoding(): ObjectElement | undefined;
    set encoding(encoding: ObjectElement | undefined);
}

declare class Servers extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

declare const isCallbackElement: ElementPredicate<Callback>;
declare const isComponentsElement: ElementPredicate<Components>;
declare const isContactElement: ElementPredicate<Contact>;
declare const isExampleElement: ElementPredicate<Example>;
declare const isExternalDocumentationElement: ElementPredicate<ExternalDocumentation>;
declare const isHeaderElement: ElementPredicate<Header>;
declare const isInfoElement: ElementPredicate<Info>;
declare const isLicenseElement: ElementPredicate<License>;
declare const isLinkElement: ElementPredicate<Link>;
declare const isOpenapiElement: ElementPredicate<Openapi>;
declare const isOpenApi3_0Element: ElementPredicate<OpenApi3_0>;
declare const isOperationElement: ElementPredicate<Operation>;
declare const isParameterElement: ElementPredicate<Parameter>;
declare const isPathItemElement: ElementPredicate<PathItem>;
declare const isPathsElement: ElementPredicate<Paths>;
declare const isReferenceElement: ElementPredicate<Reference>;
declare const isRequestBodyElement: ElementPredicate<RequestBody>;
declare const isResponseElement: ElementPredicate<Response>;
declare const isResponsesElement: ElementPredicate<Responses>;
declare const isSchemaElement: ElementPredicate<Schema>;
declare const isBooleanJsonSchemaElement: ElementPredicate<BooleanElement>;
declare const isSecurityRequirementElement: ElementPredicate<SecurityRequirement>;
declare const isSecuritySchemeElement: ElementPredicate<SecurityScheme>;
declare const isServerElement: ElementPredicate<Server>;
declare const isServerVariableElement: ElementPredicate<ServerVariable>;
declare const isMediaTypeElement: ElementPredicate<MediaType>;
declare const isServersElement: ElementPredicate<Servers>;

declare const openApi3_0Predicates_isBooleanJsonSchemaElement: typeof isBooleanJsonSchemaElement;
declare const openApi3_0Predicates_isCallbackElement: typeof isCallbackElement;
declare const openApi3_0Predicates_isComponentsElement: typeof isComponentsElement;
declare const openApi3_0Predicates_isContactElement: typeof isContactElement;
declare const openApi3_0Predicates_isExampleElement: typeof isExampleElement;
declare const openApi3_0Predicates_isExternalDocumentationElement: typeof isExternalDocumentationElement;
declare const openApi3_0Predicates_isHeaderElement: typeof isHeaderElement;
declare const openApi3_0Predicates_isInfoElement: typeof isInfoElement;
declare const openApi3_0Predicates_isLicenseElement: typeof isLicenseElement;
declare const openApi3_0Predicates_isLinkElement: typeof isLinkElement;
declare const openApi3_0Predicates_isMediaTypeElement: typeof isMediaTypeElement;
declare const openApi3_0Predicates_isOpenApi3_0Element: typeof isOpenApi3_0Element;
declare const openApi3_0Predicates_isOpenapiElement: typeof isOpenapiElement;
declare const openApi3_0Predicates_isOperationElement: typeof isOperationElement;
declare const openApi3_0Predicates_isParameterElement: typeof isParameterElement;
declare const openApi3_0Predicates_isPathItemElement: typeof isPathItemElement;
declare const openApi3_0Predicates_isPathsElement: typeof isPathsElement;
declare const openApi3_0Predicates_isReferenceElement: typeof isReferenceElement;
declare const openApi3_0Predicates_isRequestBodyElement: typeof isRequestBodyElement;
declare const openApi3_0Predicates_isResponseElement: typeof isResponseElement;
declare const openApi3_0Predicates_isResponsesElement: typeof isResponsesElement;
declare const openApi3_0Predicates_isSchemaElement: typeof isSchemaElement;
declare const openApi3_0Predicates_isSecurityRequirementElement: typeof isSecurityRequirementElement;
declare const openApi3_0Predicates_isSecuritySchemeElement: typeof isSecuritySchemeElement;
declare const openApi3_0Predicates_isServerElement: typeof isServerElement;
declare const openApi3_0Predicates_isServerVariableElement: typeof isServerVariableElement;
declare const openApi3_0Predicates_isServersElement: typeof isServersElement;
declare namespace openApi3_0Predicates {
  export { openApi3_0Predicates_isBooleanJsonSchemaElement as isBooleanJsonSchemaElement, openApi3_0Predicates_isCallbackElement as isCallbackElement, openApi3_0Predicates_isComponentsElement as isComponentsElement, openApi3_0Predicates_isContactElement as isContactElement, openApi3_0Predicates_isExampleElement as isExampleElement, openApi3_0Predicates_isExternalDocumentationElement as isExternalDocumentationElement, openApi3_0Predicates_isHeaderElement as isHeaderElement, openApi3_0Predicates_isInfoElement as isInfoElement, openApi3_0Predicates_isLicenseElement as isLicenseElement, openApi3_0Predicates_isLinkElement as isLinkElement, openApi3_0Predicates_isMediaTypeElement as isMediaTypeElement, openApi3_0Predicates_isOpenApi3_0Element as isOpenApi3_0Element, openApi3_0Predicates_isOpenapiElement as isOpenapiElement, openApi3_0Predicates_isOperationElement as isOperationElement, openApi3_0Predicates_isParameterElement as isParameterElement, openApi3_0Predicates_isPathItemElement as isPathItemElement, openApi3_0Predicates_isPathsElement as isPathsElement, openApi3_0Predicates_isReferenceElement as isReferenceElement, openApi3_0Predicates_isRequestBodyElement as isRequestBodyElement, openApi3_0Predicates_isResponseElement as isResponseElement, openApi3_0Predicates_isResponsesElement as isResponsesElement, openApi3_0Predicates_isSchemaElement as isSchemaElement, openApi3_0Predicates_isSecurityRequirementElement as isSecurityRequirementElement, openApi3_0Predicates_isSecuritySchemeElement as isSecuritySchemeElement, openApi3_0Predicates_isServerElement as isServerElement, openApi3_0Predicates_isServerVariableElement as isServerVariableElement, openApi3_0Predicates_isServersElement as isServersElement };
}

type Predicates = typeof openApi3_0Predicates & {
    isElement: typeof isElement;
    isStringElement: typeof isStringElement;
    isArrayElement: typeof isArrayElement;
    isObjectElement: typeof isObjectElement;
    isMemberElement: typeof isMemberElement;
    includesClasses: typeof includesClasses;
    hasElementSourceMap: typeof hasElementSourceMap;
};
declare const createToolbox: () => {
    predicates: Predicates;
    namespace: _swagger_api_apidom_core.Namespace;
};

interface VisitorOptions {
}
declare class Visitor {
    element: Element;
    constructor(options?: VisitorOptions);
    copyMetaAndAttributes(from: Element, to: Element): void;
}

/**
 * This is a base Type for every visitor that does
 * internal look-ups to retrieve other child visitors.
 */
interface SpecificationVisitorOptions extends VisitorOptions {
    readonly specObj: typeof specification;
    readonly passingOptionsNames?: string[];
    readonly openApiGenericElement?: ObjectElement;
    readonly openApiSemanticElement?: OpenApi3_0;
}
declare class SpecificationVisitor extends Visitor {
    protected readonly specObj: typeof specification;
    protected readonly passingOptionsNames: string[];
    protected openApiGenericElement?: ObjectElement;
    protected openApiSemanticElement?: OpenApi3_0;
    constructor({ specObj, passingOptionsNames, openApiGenericElement, openApiSemanticElement, ...rest }: SpecificationVisitorOptions);
    retrievePassingOptions(): string[];
    retrieveFixedFields(specPath: string[]): string[];
    retrieveVisitor(specPath: string[]): unknown;
    retrieveVisitorInstance(specPath: string[], options?: {}): Visitor;
    toRefractedElement(specPath: string[], element: any, options?: {}): any;
}

interface ReferenceLikeElement extends ObjectElement$1 {
    hasKey: (value: '$ref') => true;
}
declare const isReferenceLikeElement: (element: unknown) => element is ReferenceLikeElement;
declare const isServerLikeElement: _swagger_api_apidom_core.ElementPredicate<ObjectElement$1>;
declare const isTagLikeElement: _swagger_api_apidom_core.ElementPredicate<ObjectElement$1>;
declare const isOpenApiExtension: (element: MemberElement) => boolean;

type SpecPath<T = string[]> = (element: unknown) => T;
interface FixedFieldsVisitorOptions extends SpecificationVisitorOptions {
    readonly specPath: SpecPath;
    readonly ignoredFields?: string[];
    readonly canSupportSpecificationExtensions?: boolean;
    readonly specificationExtensionPredicate?: typeof isOpenApiExtension;
}
declare class FixedFieldsVisitor extends SpecificationVisitor {
    protected specPath: SpecPath;
    protected ignoredFields: string[];
    protected canSupportSpecificationExtensions: boolean;
    protected specificationExtensionPredicate: (element: MemberElement) => boolean;
    constructor({ specPath, ignoredFields, canSupportSpecificationExtensions, specificationExtensionPredicate, ...rest }: FixedFieldsVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class FallbackVisitor extends Visitor {
    enter(element: Element): {};
}

interface OpenApi3_0VisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const OpenApi3_0Visitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class OpenApi3_0Visitor extends OpenApi3_0Visitor_base {
    readonly element: OpenApi3_0;
    protected readonly specPath: SpecPath<['document', 'objects', 'OpenApi']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: OpenApi3_0VisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

interface OpenapiVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const OpenapiVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class OpenapiVisitor extends OpenapiVisitor_base {
    element: Openapi;
    StringElement(stringElement: StringElement): {};
}

declare class SpecificationExtensionVisitor extends SpecificationVisitor {
    element: MemberElement;
    MemberElement(memberElement: MemberElement): {};
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
    readonly element: StringElement;
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

interface LicenseVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const LicenseVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class LicenseVisitor extends LicenseVisitor_base {
    readonly element: License;
    protected readonly specPath: SpecPath<['document', 'objects', 'License']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: LicenseVisitorOptions);
}

interface LinkVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const LinkVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class LinkVisitor extends LinkVisitor_base {
    readonly element: Link;
    protected readonly specPath: SpecPath<['document', 'objects', 'Link']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: LinkVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class OperationRefVisitor extends FallbackVisitor {
    readonly element: StringElement;
    StringElement(stringElement: StringElement): {};
}

declare class OperationIdVisitor extends FallbackVisitor {
    readonly element: StringElement;
    StringElement(stringElement: StringElement): {};
}

interface PatternedFieldsVisitorOptions extends SpecificationVisitorOptions {
    readonly specPath: SpecPath;
    readonly ignoredFields?: string[];
    readonly fieldPatternPredicate?: (...args: unknown[]) => boolean;
    readonly canSupportSpecificationExtensions?: boolean;
    readonly specificationExtensionPredicate?: typeof isOpenApiExtension;
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

declare class LinkParameters extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface ParametersVisitorOptions$2 extends MapVisitorOptions, VisitorOptions {
}
declare const ParametersVisitor_base$2: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ParametersVisitor$4 extends ParametersVisitor_base$2 {
    readonly element: LinkParameters;
    protected readonly specPath: SpecPath<['value']>;
    constructor(options: ParametersVisitorOptions$2);
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

interface ServersVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const ServersVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class ServersVisitor$2 extends ServersVisitor_base {
    readonly element: Servers;
    constructor(options: ServersVisitorOptions);
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

declare class ServerVariables extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface VariablesVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const VariablesVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class VariablesVisitor extends VariablesVisitor_base {
    readonly element: ServerVariables;
    protected readonly specPath: SpecPath<['document', 'objects', 'ServerVariable']>;
    constructor(options: VariablesVisitorOptions);
}

interface MediaTypeVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const MediaTypeVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class MediaTypeVisitor extends MediaTypeVisitor_base {
    readonly element: MediaType;
    protected readonly specPath: SpecPath<['document', 'objects', 'MediaType']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: MediaTypeVisitorOptions);
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
    enter(element: Element): {};
}

interface SchemaVisitorOptions$3 extends AlternatingVisitorOptions, VisitorOptions {
}
declare const SchemaVisitor_base$3: ts_mixer_dist_types_types.Class<any[], AlternatingVisitor & FallbackVisitor, typeof AlternatingVisitor & typeof FallbackVisitor>;
declare class SchemaVisitor$3 extends SchemaVisitor_base$3 {
    constructor(options: SchemaVisitorOptions$3);
    ObjectElement(objectElement: ObjectElement): {};
}

interface ExamplesVisitorOptions$1 extends MapVisitorOptions, VisitorOptions {
}
declare const ExamplesVisitor_base$1: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ExamplesVisitor$4 extends ExamplesVisitor_base$1 {
    readonly element: ObjectElement;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'Example']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: ExamplesVisitorOptions$1);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class MediaTypeExamples extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class ExamplesVisitor$3 extends ExamplesVisitor$4 {
    readonly element: MediaTypeExamples;
    constructor(options: ExamplesVisitorOptions$1);
}

declare class MediaTypeEncoding extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface EncodingVisitorOptions$1 extends MapVisitorOptions, VisitorOptions {
}
declare const EncodingVisitor_base$1: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class EncodingVisitor$1 extends EncodingVisitor_base$1 {
    readonly element: MediaTypeEncoding;
    protected readonly specPath: SpecPath<['document', 'objects', 'Encoding']>;
    constructor(options: EncodingVisitorOptions$1);
}

interface SecurityRequirementVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const SecurityRequirementVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class SecurityRequirementVisitor extends SecurityRequirementVisitor_base {
    readonly element: SecurityRequirement;
    protected readonly specPath: SpecPath<['value']>;
    constructor(options: SecurityRequirementVisitorOptions);
}

declare class Security extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface SecurityVisitorOptions$1 extends SpecificationVisitorOptions, VisitorOptions {
}
declare const SecurityVisitor_base$1: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class SecurityVisitor$1 extends SecurityVisitor_base$1 {
    readonly element: Security;
    constructor(options: SecurityVisitorOptions$1);
    ArrayElement(arrayElement: ArrayElement): {};
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

interface ParameterVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const ParameterVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class ParameterVisitor extends ParameterVisitor_base {
    readonly element: Parameter;
    protected readonly specPath: SpecPath<['document', 'objects', 'Parameter']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: ParameterVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

interface SchemaVisitorOptions$2 extends AlternatingVisitorOptions, VisitorOptions {
}
declare const SchemaVisitor_base$2: ts_mixer_dist_types_types.Class<any[], AlternatingVisitor & FallbackVisitor, typeof AlternatingVisitor & typeof FallbackVisitor>;
declare class SchemaVisitor$2 extends SchemaVisitor_base$2 {
    constructor(options: SchemaVisitorOptions$2);
    ObjectElement(objectElement: ObjectElement): {};
}

interface HeaderVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const HeaderVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class HeaderVisitor extends HeaderVisitor_base {
    readonly element: Header;
    protected readonly specPath: SpecPath<['document', 'objects', 'Header']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: HeaderVisitorOptions);
}

interface SchemaVisitorOptions$1 extends AlternatingVisitorOptions, VisitorOptions {
}
declare const SchemaVisitor_base$1: ts_mixer_dist_types_types.Class<any[], AlternatingVisitor & FallbackVisitor, typeof AlternatingVisitor & typeof FallbackVisitor>;
declare class SchemaVisitor$1 extends SchemaVisitor_base$1 {
    constructor(options: SchemaVisitorOptions$1);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class HeaderExamples extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class ExamplesVisitor$2 extends ExamplesVisitor$4 {
    readonly element: HeaderExamples;
    constructor(options: ExamplesVisitorOptions$1);
}

interface ContentVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const ContentVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ContentVisitor$4 extends ContentVisitor_base {
    readonly element: ObjectElement;
    protected readonly specPath: SpecPath<['document', 'objects', 'MediaType']>;
    constructor(options: ContentVisitorOptions);
}

declare class HeaderContent extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class ContentVisitor$3 extends ContentVisitor$4 {
    readonly element: HeaderContent;
    constructor(options: ContentVisitorOptions);
}

interface SchemaVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const SchemaVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class SchemaVisitor extends SchemaVisitor_base {
    readonly element: Schema;
    protected readonly specPath: SpecPath<['document', 'objects', 'Schema']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: SchemaVisitorOptions);
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

declare const JSONSchemaItemsVisitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor;
declare class ItemsVisitor extends JSONSchemaItemsVisitor {
    ObjectElement(objectElement: ObjectElement): {};
    ArrayElement(arrayElement: ArrayElement): {};
}

declare const JSONSchemaPropertiesVisitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor;
declare class PropertiesVisitor extends JSONSchemaPropertiesVisitor {
    ObjectElement(objectElement: ObjectElement): {};
}

declare const JSONSchemaTypeVisitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor;
declare class TypeVisitor extends JSONSchemaTypeVisitor {
    ArrayElement(arrayElement: ArrayElement): {};
}

declare const JSONSchemaOrJSONReferenceVisitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor;
declare class SchemaOrReferenceVisitor extends JSONSchemaOrJSONReferenceVisitor {
    element: Schema | JSONReferenceElement;
    ObjectElement(objectElement: ObjectElement): {};
}

interface DiscriminatorVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const DiscriminatorVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class DiscriminatorVisitor extends DiscriminatorVisitor_base {
    readonly element: Discriminator;
    protected readonly specPath: SpecPath<['document', 'objects', 'Discriminator']>;
    protected canSupportSpecificationExtensions: boolean;
    constructor(options: DiscriminatorVisitorOptions);
}

declare class DiscriminatorMapping extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface MappingVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const MappingVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class MappingVisitor extends MappingVisitor_base {
    readonly element: DiscriminatorMapping;
    protected readonly specPath: SpecPath<['value']>;
    constructor(options: MappingVisitorOptions);
}

interface XmlVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const XmlVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class XmlVisitor extends XmlVisitor_base {
    readonly element: Xml;
    protected readonly specPath: SpecPath<['document', 'objects', 'XML']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: XmlVisitorOptions);
}

declare class ParameterExamples extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class ExamplesVisitor$1 extends ExamplesVisitor$4 {
    readonly element: ParameterExamples;
    constructor(options: ExamplesVisitorOptions$1);
}

declare class ParameterContent extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class ContentVisitor$2 extends ContentVisitor$4 {
    readonly element: ParameterContent;
    constructor(options: ContentVisitorOptions);
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

declare class ComponentsResponses extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface ResponsesVisitorOptions$1 extends MapVisitorOptions, VisitorOptions {
}
declare const ResponsesVisitor_base$1: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ResponsesVisitor$1 extends ResponsesVisitor_base$1 {
    readonly element: ComponentsResponses;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'Response']>;
    constructor(options: ResponsesVisitorOptions$1);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ComponentsParameters extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface ParametersVisitorOptions$1 extends MapVisitorOptions, VisitorOptions {
}
declare const ParametersVisitor_base$1: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ParametersVisitor$3 extends ParametersVisitor_base$1 {
    readonly element: ComponentsParameters;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'Parameter']>;
    constructor(options: ParametersVisitorOptions$1);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ComponentsExamples extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface ExamplesVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const ExamplesVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ExamplesVisitor extends ExamplesVisitor_base {
    readonly element: ComponentsExamples;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'Example']>;
    constructor(options: ExamplesVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ComponentsRequestBodies extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface RequestBodiesVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const RequestBodiesVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class RequestBodiesVisitor extends RequestBodiesVisitor_base {
    readonly element: ComponentsRequestBodies;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'RequestBody']>;
    constructor(options: RequestBodiesVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ComponentsHeaders extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface HeadersVisitorOptions$2 extends MapVisitorOptions, VisitorOptions {
}
declare const HeadersVisitor_base$2: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class HeadersVisitor$2 extends HeadersVisitor_base$2 {
    readonly element: ComponentsHeaders;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'Header']>;
    constructor(options: HeadersVisitorOptions$2);
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
    readonly element: ComponentsSecuritySchemes;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'SecurityScheme']>;
    constructor(options: SecuritySchemesVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ComponentsLinks extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface LinksVisitorOptions$1 extends MapVisitorOptions, VisitorOptions {
}
declare const LinksVisitor_base$1: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class LinksVisitor$1 extends LinksVisitor_base$1 {
    readonly element: ComponentsLinks;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'Link']>;
    constructor(options: LinksVisitorOptions$1);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ComponentsCallbacks extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface CallbackVisitorOptions$1 extends MapVisitorOptions, VisitorOptions {
}
declare const CallbacksVisitor_base$1: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class CallbacksVisitor$1 extends CallbacksVisitor_base$1 {
    readonly element: ComponentsCallbacks;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'Callback']>;
    constructor(options: CallbackVisitorOptions$1);
    ObjectElement(objectElement: ObjectElement): {};
}

interface ExampleVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const ExampleVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class ExampleVisitor extends ExampleVisitor_base {
    readonly element: Example;
    protected readonly specPath: SpecPath<['document', 'objects', 'Example']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: ExampleVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ExternalValueVisitor extends FallbackVisitor {
    readonly element: StringElement;
    StringElement(stringElement: StringElement): {};
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

declare class Encoding extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get contentType(): StringElement | undefined;
    set contentType(contentType: StringElement | undefined);
    get headers(): ObjectElement | undefined;
    set headers(headers: ObjectElement | undefined);
    get style(): StringElement | undefined;
    set style(style: StringElement | undefined);
    get explode(): BooleanElement | undefined;
    set explode(explode: BooleanElement | undefined);
    get allowedReserved(): BooleanElement | undefined;
    set allowedReserved(allowedReserved: BooleanElement | undefined);
}

interface EncodingVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const EncodingVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class EncodingVisitor extends EncodingVisitor_base {
    readonly element: Encoding;
    protected readonly specPath: SpecPath<['document', 'objects', 'Encoding']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: EncodingVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class EncodingHeaders extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface HeadersVisitorOptions$1 extends MapVisitorOptions, VisitorOptions {
}
declare const HeadersVisitor_base$1: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class HeadersVisitor$1 extends HeadersVisitor_base$1 {
    readonly element: EncodingHeaders;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'Header']>;
    constructor(options: HeadersVisitorOptions$1);
    ObjectElement(objectElement: ObjectElement): {};
}

interface PathsVisitorOptions extends PatternedFieldsVisitorOptions, VisitorOptions {
}
declare const PathsVisitor_base: ts_mixer_dist_types_types.Class<any[], PatternedFieldsVisitor & FallbackVisitor, typeof PatternedFieldsVisitor & typeof FallbackVisitor>;
declare class PathsVisitor extends PathsVisitor_base {
    readonly element: Paths;
    protected readonly specPath: SpecPath<['document', 'objects', 'PathItem']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: PathsVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

interface RequestBodyVisitorOptions$1 extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const RequestBodyVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class RequestBodyVisitor$1 extends RequestBodyVisitor_base {
    readonly element: RequestBody;
    protected readonly specPath: SpecPath<['document', 'objects', 'RequestBody']>;
    constructor(options: RequestBodyVisitorOptions$1);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class RequestBodyContent extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class ContentVisitor$1 extends ContentVisitor$4 {
    readonly element: RequestBodyContent;
    constructor(options: ContentVisitorOptions);
}

interface CallbackVisitorOptions extends PatternedFieldsVisitorOptions, VisitorOptions {
}
declare const CallbackVisitor_base: ts_mixer_dist_types_types.Class<any[], PatternedFieldsVisitor & FallbackVisitor, typeof PatternedFieldsVisitor & typeof FallbackVisitor>;
declare class CallbackVisitor extends CallbackVisitor_base {
    readonly element: Callback;
    protected readonly specPath: SpecPath;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: CallbackVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

interface ResponseVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const ResponseVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class ResponseVisitor extends ResponseVisitor_base {
    readonly element: Response;
    protected readonly specPath: SpecPath<['document', 'objects', 'Response']>;
    constructor(options: ResponseVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ResponseHeaders extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface HeadersVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const HeadersVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class HeadersVisitor extends HeadersVisitor_base {
    readonly element: ResponseHeaders;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'Header']>;
    constructor(options: HeadersVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ResponseContent extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class ContentVisitor extends ContentVisitor$4 {
    readonly element: ResponseContent;
    constructor(options: ContentVisitorOptions);
}

declare class ResponseLinks extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface LinksVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const LinksVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class LinksVisitor extends LinksVisitor_base {
    readonly element: ResponseLinks;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'Link']>;
    constructor(options: LinksVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

interface MixedFieldsVisitorOptions extends PatternedFieldsVisitorOptions {
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

interface ResponsesVisitorOptions extends MixedFieldsVisitorOptions, VisitorOptions {
}
declare const ResponsesVisitor_base: ts_mixer_dist_types_types.Class<any[], MixedFieldsVisitor & FallbackVisitor, typeof MixedFieldsVisitor & typeof FallbackVisitor>;
declare class ResponsesVisitor extends ResponsesVisitor_base {
    readonly element: Responses;
    protected readonly specPathFixedFields: SpecPath<['document', 'objects', 'Responses']>;
    protected readonly canSupportSpecificationExtensions: true;
    protected readonly specPathPatternedFields: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'Response']>;
    constructor(options: ResponsesVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

interface DefaultVisitorOptions extends AlternatingVisitorOptions, VisitorOptions {
}
declare const DefaultVisitor_base: ts_mixer_dist_types_types.Class<any[], AlternatingVisitor & FallbackVisitor, typeof AlternatingVisitor & typeof FallbackVisitor>;
declare class DefaultVisitor extends DefaultVisitor_base {
    constructor(options: DefaultVisitorOptions);
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

declare class OperationTags extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface TagsVisitorOptions$1 extends VisitorOptions {
}
declare class TagsVisitor$1 extends FallbackVisitor {
    element: OperationTags;
    constructor(options: TagsVisitorOptions$1);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class OperationParameters extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface ParametersVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const ParametersVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class ParametersVisitor$2 extends ParametersVisitor_base {
    readonly element: ArrayElement;
    constructor(options: ParametersVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class ParametersVisitor$1 extends ParametersVisitor$2 {
    readonly element: OperationParameters;
    constructor(options: ParametersVisitorOptions);
}

interface RequestBodyVisitorOptions extends AlternatingVisitorOptions, VisitorOptions {
}
declare class RequestBodyVisitor extends AlternatingVisitor {
    constructor(options: RequestBodyVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class OperationCallbacks extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface CallbacksVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const CallbacksVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class CallbacksVisitor extends CallbacksVisitor_base {
    readonly element: OperationCallbacks;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'Callback']>;
    constructor(options: CallbacksVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class OperationSecurity extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface SecurityVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const SecurityVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class SecurityVisitor extends SecurityVisitor_base {
    readonly element: OperationSecurity;
    constructor(options: SecurityVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class OperationServers extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

declare class ServersVisitor$1 extends ServersVisitor$2 {
    readonly element: OperationServers;
    constructor(options: ServersVisitorOptions);
}

interface PathItemVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const PathItemVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class PathItemVisitor extends PathItemVisitor_base {
    readonly element: PathItem;
    protected readonly specPath: SpecPath<['document', 'objects', 'PathItem']>;
    constructor(options: PathItemVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class $RefVisitor extends FallbackVisitor {
    readonly element: StringElement;
    StringElement(stringElement: StringElement): {};
}

declare class PathItemServers extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

declare class ServersVisitor extends ServersVisitor$2 {
    readonly element: PathItemServers;
    constructor(options: ServersVisitorOptions);
}

declare class PathItemParameters extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

declare class ParametersVisitor extends ParametersVisitor$2 {
    readonly element: PathItemParameters;
    constructor(options: ParametersVisitorOptions);
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
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: OAuthFlowVisitorOptions);
}

declare class OAuthFlowScopes extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface ScopesVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const ScopesVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ScopesVisitor extends ScopesVisitor_base {
    readonly element: OAuthFlowScopes;
    protected readonly specPath: SpecPath<['value']>;
    constructor(options: ScopesVisitorOptions);
}

declare class Tags extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface TagsVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const TagsVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class TagsVisitor extends TagsVisitor_base {
    readonly element: Tags;
    constructor(options: TagsVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare const specification: {
    readonly visitors: {
        readonly value: typeof FallbackVisitor;
        readonly document: {
            readonly objects: {
                readonly OpenApi: {
                    readonly $visitor: typeof OpenApi3_0Visitor;
                    readonly fixedFields: {
                        readonly openapi: typeof OpenapiVisitor;
                        readonly info: {
                            readonly $ref: "#/visitors/document/objects/Info";
                        };
                        readonly servers: typeof ServersVisitor$2;
                        readonly paths: {
                            readonly $ref: "#/visitors/document/objects/Paths";
                        };
                        readonly components: {
                            readonly $ref: "#/visitors/document/objects/Components";
                        };
                        readonly security: typeof SecurityVisitor$1;
                        readonly tags: typeof TagsVisitor;
                        readonly externalDocs: {
                            readonly $ref: "#/visitors/document/objects/ExternalDocumentation";
                        };
                    };
                };
                readonly Info: {
                    readonly $visitor: typeof InfoVisitor;
                    readonly fixedFields: {
                        readonly title: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly termsOfService: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly contact: {
                            readonly $ref: "#/visitors/document/objects/Contact";
                        };
                        readonly license: {
                            readonly $ref: "#/visitors/document/objects/License";
                        };
                        readonly version: typeof VersionVisitor;
                    };
                };
                readonly Contact: {
                    readonly $visitor: typeof ContactVisitor;
                    readonly fixedFields: {
                        readonly name: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly url: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly email: {
                            readonly $ref: "#/visitors/value";
                        };
                    };
                };
                readonly License: {
                    readonly $visitor: typeof LicenseVisitor;
                    readonly fixedFields: {
                        readonly name: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly url: {
                            readonly $ref: "#/visitors/value";
                        };
                    };
                };
                readonly Server: {
                    readonly $visitor: typeof ServerVisitor;
                    readonly fixedFields: {
                        readonly url: typeof UrlVisitor;
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly variables: typeof VariablesVisitor;
                    };
                };
                readonly ServerVariable: {
                    readonly $visitor: typeof ServerVariableVisitor;
                    readonly fixedFields: {
                        readonly enum: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly default: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                    };
                };
                readonly Components: {
                    readonly $visitor: typeof ComponentsVisitor;
                    readonly fixedFields: {
                        readonly schemas: typeof SchemasVisitor;
                        readonly responses: typeof ResponsesVisitor$1;
                        readonly parameters: typeof ParametersVisitor$3;
                        readonly examples: typeof ExamplesVisitor;
                        readonly requestBodies: typeof RequestBodiesVisitor;
                        readonly headers: typeof HeadersVisitor$2;
                        readonly securitySchemes: typeof SecuritySchemesVisitor;
                        readonly links: typeof LinksVisitor$1;
                        readonly callbacks: typeof CallbacksVisitor$1;
                    };
                };
                readonly Paths: {
                    readonly $visitor: typeof PathsVisitor;
                };
                readonly PathItem: {
                    readonly $visitor: typeof PathItemVisitor;
                    readonly fixedFields: {
                        readonly $ref: typeof $RefVisitor;
                        readonly summary: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly get: {
                            readonly $ref: "#/visitors/document/objects/Operation";
                        };
                        readonly put: {
                            readonly $ref: "#/visitors/document/objects/Operation";
                        };
                        readonly post: {
                            readonly $ref: "#/visitors/document/objects/Operation";
                        };
                        readonly delete: {
                            readonly $ref: "#/visitors/document/objects/Operation";
                        };
                        readonly options: {
                            readonly $ref: "#/visitors/document/objects/Operation";
                        };
                        readonly head: {
                            readonly $ref: "#/visitors/document/objects/Operation";
                        };
                        readonly patch: {
                            readonly $ref: "#/visitors/document/objects/Operation";
                        };
                        readonly trace: {
                            readonly $ref: "#/visitors/document/objects/Operation";
                        };
                        readonly servers: typeof ServersVisitor;
                        readonly parameters: typeof ParametersVisitor;
                    };
                };
                readonly Operation: {
                    readonly $visitor: typeof OperationVisitor;
                    readonly fixedFields: {
                        readonly tags: typeof TagsVisitor$1;
                        readonly summary: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly externalDocs: {
                            readonly $ref: "#/visitors/document/objects/ExternalDocumentation";
                        };
                        readonly operationId: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly parameters: typeof ParametersVisitor$1;
                        readonly requestBody: typeof RequestBodyVisitor;
                        readonly responses: {
                            readonly $ref: "#/visitors/document/objects/Responses";
                        };
                        readonly callbacks: typeof CallbacksVisitor;
                        readonly deprecated: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly security: typeof SecurityVisitor;
                        readonly servers: typeof ServersVisitor$1;
                    };
                };
                readonly ExternalDocumentation: {
                    readonly $visitor: typeof ExternalDocumentationVisitor;
                    readonly fixedFields: {
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly url: {
                            readonly $ref: "#/visitors/value";
                        };
                    };
                };
                readonly Parameter: {
                    readonly $visitor: typeof ParameterVisitor;
                    readonly fixedFields: {
                        readonly name: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly in: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly required: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly deprecated: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly allowEmptyValue: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly style: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly explode: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly allowReserved: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly schema: typeof SchemaVisitor$2;
                        readonly example: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly examples: typeof ExamplesVisitor$1;
                        readonly content: typeof ContentVisitor$2;
                    };
                };
                readonly RequestBody: {
                    readonly $visitor: typeof RequestBodyVisitor$1;
                    readonly fixedFields: {
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly content: typeof ContentVisitor$1;
                        readonly required: {
                            readonly $ref: "#/visitors/value";
                        };
                    };
                };
                readonly MediaType: {
                    readonly $visitor: typeof MediaTypeVisitor;
                    readonly fixedFields: {
                        readonly schema: typeof SchemaVisitor$3;
                        readonly example: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly examples: typeof ExamplesVisitor$3;
                        readonly encoding: typeof EncodingVisitor$1;
                    };
                };
                readonly Encoding: {
                    readonly $visitor: typeof EncodingVisitor;
                    readonly fixedFields: {
                        readonly contentType: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly headers: typeof HeadersVisitor$1;
                        readonly style: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly explode: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly allowReserved: {
                            readonly $ref: "#/visitors/value";
                        };
                    };
                };
                readonly Responses: {
                    readonly $visitor: typeof ResponsesVisitor;
                    readonly fixedFields: {
                        readonly default: typeof DefaultVisitor;
                    };
                };
                readonly Response: {
                    readonly $visitor: typeof ResponseVisitor;
                    readonly fixedFields: {
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly headers: typeof HeadersVisitor;
                        readonly content: typeof ContentVisitor;
                        readonly links: typeof LinksVisitor;
                    };
                };
                readonly Callback: {
                    readonly $visitor: typeof CallbackVisitor;
                };
                readonly Example: {
                    readonly $visitor: typeof ExampleVisitor;
                    readonly fixedFields: {
                        readonly summary: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly value: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly externalValue: typeof ExternalValueVisitor;
                    };
                };
                readonly Link: {
                    readonly $visitor: typeof LinkVisitor;
                    readonly fixedFields: {
                        readonly operationRef: typeof OperationRefVisitor;
                        readonly operationId: typeof OperationIdVisitor;
                        readonly parameters: typeof ParametersVisitor$4;
                        readonly requestBody: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly server: {
                            readonly $ref: "#/visitors/document/objects/Server";
                        };
                    };
                };
                readonly Header: {
                    readonly $visitor: typeof HeaderVisitor;
                    readonly fixedFields: {
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly required: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly deprecated: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly allowEmptyValue: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly style: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly explode: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly allowReserved: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly schema: typeof SchemaVisitor$1;
                        readonly example: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly examples: typeof ExamplesVisitor$2;
                        readonly content: typeof ContentVisitor$3;
                    };
                };
                readonly Tag: {
                    readonly $visitor: typeof TagVisitor;
                    readonly fixedFields: {
                        readonly name: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly externalDocs: {
                            readonly $ref: "#/visitors/document/objects/ExternalDocumentation";
                        };
                    };
                };
                readonly Reference: {
                    readonly $visitor: typeof ReferenceVisitor;
                    readonly fixedFields: {
                        readonly $ref: typeof $RefVisitor$1;
                    };
                };
                readonly JSONSchema: {
                    readonly $ref: "#/visitors/document/objects/Schema";
                };
                readonly JSONReference: {
                    readonly $ref: "#/visitors/document/objects/Reference";
                };
                readonly Schema: {
                    readonly $visitor: typeof SchemaVisitor;
                    readonly fixedFields: {
                        readonly title: {
                            $ref: string;
                        };
                        readonly multipleOf: {
                            $ref: string;
                        };
                        readonly maximum: {
                            $ref: string;
                        };
                        readonly exclusiveMaximum: {
                            $ref: string;
                        };
                        readonly minimum: {
                            $ref: string;
                        };
                        readonly exclusiveMinimum: {
                            $ref: string;
                        };
                        readonly maxLength: {
                            $ref: string;
                        };
                        readonly minLength: {
                            $ref: string;
                        };
                        readonly pattern: {
                            $ref: string;
                        };
                        readonly maxItems: {
                            $ref: string;
                        };
                        readonly minItems: {
                            $ref: string;
                        };
                        readonly uniqueItems: {
                            $ref: string;
                        };
                        readonly maxProperties: {
                            $ref: string;
                        };
                        readonly minProperties: {
                            $ref: string;
                        };
                        readonly required: typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor;
                        readonly enum: typeof _swagger_api_apidom_ns_json_schema_draft_4.EnumVisitor;
                        readonly type: typeof TypeVisitor;
                        readonly allOf: typeof AllOfVisitor;
                        readonly anyOf: typeof AnyOfVisitor;
                        readonly oneOf: typeof OneOfVisitor;
                        readonly not: typeof SchemaOrReferenceVisitor;
                        readonly items: typeof ItemsVisitor;
                        readonly properties: typeof PropertiesVisitor;
                        readonly additionalProperties: typeof SchemaOrReferenceVisitor;
                        readonly description: {
                            $ref: string;
                        };
                        readonly format: {
                            $ref: string;
                        };
                        readonly default: {
                            $ref: string;
                        };
                        readonly nullable: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly discriminator: {
                            readonly $ref: "#/visitors/document/objects/Discriminator";
                        };
                        readonly writeOnly: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly xml: {
                            readonly $ref: "#/visitors/document/objects/XML";
                        };
                        readonly externalDocs: {
                            readonly $ref: "#/visitors/document/objects/ExternalDocumentation";
                        };
                        readonly example: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly deprecated: {
                            readonly $ref: "#/visitors/value";
                        };
                    };
                };
                readonly Discriminator: {
                    readonly $visitor: typeof DiscriminatorVisitor;
                    readonly fixedFields: {
                        readonly propertyName: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly mapping: typeof MappingVisitor;
                    };
                };
                readonly XML: {
                    readonly $visitor: typeof XmlVisitor;
                    readonly fixedFields: {
                        readonly name: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly namespace: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly prefix: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly attribute: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly wrapped: {
                            readonly $ref: "#/visitors/value";
                        };
                    };
                };
                readonly SecurityScheme: {
                    readonly $visitor: typeof SecuritySchemeVisitor;
                    readonly fixedFields: {
                        readonly type: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly name: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly in: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly scheme: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly bearerFormat: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly flows: {
                            readonly $ref: "#/visitors/document/objects/OAuthFlows";
                        };
                        readonly openIdConnectUrl: {
                            readonly $ref: "#/visitors/value";
                        };
                    };
                };
                readonly OAuthFlows: {
                    readonly $visitor: typeof OAuthFlowsVisitor;
                    readonly fixedFields: {
                        readonly implicit: {
                            readonly $ref: "#/visitors/document/objects/OAuthFlow";
                        };
                        readonly password: {
                            readonly $ref: "#/visitors/document/objects/OAuthFlow";
                        };
                        readonly clientCredentials: {
                            readonly $ref: "#/visitors/document/objects/OAuthFlow";
                        };
                        readonly authorizationCode: {
                            readonly $ref: "#/visitors/document/objects/OAuthFlow";
                        };
                    };
                };
                readonly OAuthFlow: {
                    readonly $visitor: typeof OAuthFlowVisitor;
                    readonly fixedFields: {
                        readonly authorizationUrl: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly tokenUrl: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly refreshUrl: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly scopes: typeof ScopesVisitor;
                    };
                };
                readonly SecurityRequirement: {
                    readonly $visitor: typeof SecurityRequirementVisitor;
                };
            };
            readonly extension: {
                readonly $visitor: typeof SpecificationExtensionVisitor;
            };
        };
    };
};

declare const getNodeType: <T extends Element>(element: T) => string | undefined;
/**
 * There are unfortunately two `LinkElement` types. One is from base namespace
 * and the other one if from this namespace. `LinkElement` from base namespace
 * is used extremely rarely, so it's almost always safe during traversing
 * to assume that `LinkElement` is element from this namespace.
 *
 * To be 100% sure that currently visiting `LinkElement` is from this namespace
 * use `isLinkElement` predicate from this namespace to assert for it.
 */
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
    CallbackElement: string[];
    ComponentsElement: string[];
    ContactElement: string[];
    DiscriminatorElement: string[];
    Encoding: string[];
    Example: string[];
    ExternalDocumentationElement: string[];
    HeaderElement: string[];
    InfoElement: string[];
    LicenseElement: string[];
    MediaTypeElement: string[];
    OAuthFlowElement: string[];
    OAuthFlowsElement: string[];
    OpenApi3_0Element: string[];
    OperationElement: string[];
    ParameterElement: string[];
    PathItemElement: string[];
    PathsElement: string[];
    ReferenceElement: string[];
    RequestBodyElement: string[];
    ResponseElement: string[];
    ResponsesElement: string[];
    SchemaElement: string[];
    SecurityRequirementElement: string[];
    SecuritySchemeElement: string[];
    ServerElement: string[];
    ServerVariableElement: string[];
    TagElement: string[];
};

export { AlternatingVisitor, type AlternatingVisitorOptions, Callback as CallbackElement, CallbackVisitor, type CallbackVisitorOptions, ComponentsCallbacks as ComponentsCallbacksElement, CallbacksVisitor$1 as ComponentsCallbacksVisitor, type CallbackVisitorOptions$1 as ComponentsCallbacksVisitorOptions, Components as ComponentsElement, ComponentsExamples as ComponentsExamplesElement, ExamplesVisitor as ComponentsExamplesVisitor, type ExamplesVisitorOptions as ComponentsExamplesVisitorOptions, ComponentsHeaders as ComponentsHeadersElement, HeadersVisitor$2 as ComponentsHeadersVisitor, type HeadersVisitorOptions$2 as ComponentsHeadersVisitorOptions, ComponentsLinks as ComponentsLinksElement, LinksVisitor$1 as ComponentsLinksVisitor, type LinksVisitorOptions$1 as ComponentsLinksVisitorOptions, ComponentsParameters as ComponentsParametersElement, ParametersVisitor$3 as ComponentsParametersVisitor, type ParametersVisitorOptions$1 as ComponentsParametersVisitorOptions, ComponentsRequestBodies as ComponentsRequestBodiesElement, RequestBodiesVisitor as ComponentsRequestBodiesVisitor, type RequestBodiesVisitorOptions as ComponentsRequestBodiesVisitorOptions, ComponentsResponses as ComponentsResponsesElement, ResponsesVisitor$1 as ComponentsResponsesVisitor, type ResponsesVisitorOptions$1 as ComponentsResponsesVisitorOptions, ComponentsSchemas as ComponentsSchemasElement, SchemasVisitor as ComponentsSchemasVisitor, type SchemasVisitorOptions as ComponentsSchemasVisitorOptions, ComponentsSecuritySchemes as ComponentsSecuritySchemesElement, SecuritySchemesVisitor as ComponentsSecuritySchemesVisitor, type SecuritySchemesVisitorOptions as ComponentsSecuritySchemesVisitorOptions, ComponentsVisitor, type ComponentsVisitorOptions, Contact as ContactElement, ContactVisitor, type ContactVisitorOptions, ContentVisitor$4 as ContentVisitor, type ContentVisitorOptions, Discriminator as DiscriminatorElement, DiscriminatorMapping as DiscriminatorMappingElement, MappingVisitor as DiscriminatorMappingVisitor, type MappingVisitorOptions as DiscriminatorMappingVisitorOptions, DiscriminatorVisitor, type DiscriminatorVisitorOptions, Encoding as EncodingElement, EncodingHeaders as EncodingHeadersElement, HeadersVisitor$1 as EncodingHeadersVisitor, type HeadersVisitorOptions$1 as EncodingHeadersVisitorOptions, EncodingVisitor, type EncodingVisitorOptions, Example as ExampleElement, ExternalValueVisitor as ExampleExternalValueVisitor, type VisitorOptions as ExampleExternalValueVisitorOptions, ExampleVisitor, type ExampleVisitorOptions, ExamplesVisitor$4 as ExamplesVisitor, type ExamplesVisitorOptions$1 as ExamplesVisitorOptions, ExternalDocumentation as ExternalDocumentationElement, ExternalDocumentationVisitor, type ExternalDocumentationVisitorOptions, FallbackVisitor, type VisitorOptions as FallbackVisitorOptions, FixedFieldsVisitor, type FixedFieldsVisitorOptions, HeaderContent as HeaderContentElement, ContentVisitor$3 as HeaderContentVisitor, type ContentVisitorOptions as HeaderContentVisitorOptions, Header as HeaderElement, HeaderExamples as HeaderExamplesElement, ExamplesVisitor$2 as HeaderExamplesVisitor, type ExamplesVisitorOptions$1 as HeaderExamplesVisitorOptions, SchemaVisitor$1 as HeaderSchemaVisitor, type SchemaVisitorOptions$1 as HeaderSchemaVisitorOptions, HeaderVisitor, type HeaderVisitorOptions, Info as InfoElement, VersionVisitor as InfoVersionVisitor, type VisitorOptions as InfoVersionVisitorOptions, InfoVisitor, type InfoVisitorOptions, License as LicenseElement, LicenseVisitor, type LicenseVisitorOptions, Link as LinkElement, OperationIdVisitor as LinkOperationIdVisitor, type VisitorOptions as LinkOperationIdVisitorOptions, OperationRefVisitor as LinkOperationRefVisitor, type VisitorOptions as LinkOperationRefVisitorOptions, LinkParameters as LinkParametersElement, ParametersVisitor$4 as LinkParametersVisitor, type ParametersVisitorOptions$2 as LinkParametersVisitorOptions, LinkVisitor, type LinkVisitorOptions, MapVisitor, type MapVisitorOptions, MediaType as MediaTypeElement, MediaTypeEncoding as MediaTypeEncodingElement, EncodingVisitor$1 as MediaTypeEncodingVisitor, type EncodingVisitorOptions$1 as MediaTypeEncodingVisitorOptions, MediaTypeExamples as MediaTypeExamplesElement, ExamplesVisitor$3 as MediaTypeExamplesVisitor, type ExamplesVisitorOptions$1 as MediaTypeExamplesVisitorOptions, SchemaVisitor$3 as MediaTypeSchemaVisitor, type SchemaVisitorOptions$3 as MediaTypeSchemaVisitorOptions, MediaTypeVisitor, type MediaTypeVisitorOptions, MixedFieldsVisitor, type MixedFieldsVisitorOptions, OAuthFlow as OAuthFlowElement, OAuthFlowScopes as OAuthFlowScopesElement, ScopesVisitor as OAuthFlowScopesVisitor, type ScopesVisitorOptions as OAuthFlowScopesVisitorOptions, OAuthFlowVisitor, type OAuthFlowVisitorOptions, OAuthFlows as OAuthFlowsElement, OAuthFlowsVisitor, type OAuthFlowsVisitorOptions, OpenAPIMediaTypes, OpenApi3_0 as OpenApi3_0Element, OpenApi3_0Visitor, type OpenApi3_0VisitorOptions, Openapi as OpenapiElement, OpenapiVisitor, type OpenapiVisitorOptions, OperationCallbacks as OperationCallbacksElement, CallbacksVisitor as OperationCallbacksVisitor, type CallbacksVisitorOptions as OperationCallbacksVisitorOptions, Operation as OperationElement, OperationParameters as OperationParametersElement, ParametersVisitor$1 as OperationParametersVisitor, type ParametersVisitorOptions as OperationParametersVisitorOptions, RequestBodyVisitor as OperationRequestBodyVisitor, type RequestBodyVisitorOptions as OperationRequestBodyVisitorOptions, OperationSecurity as OperationSecurityElement, SecurityVisitor as OperationSecurityVisitor, type SecurityVisitorOptions as OperationSecurityVisitorOptions, OperationServers as OperationServersElement, ServersVisitor$1 as OperationServersVisitor, type ServersVisitorOptions as OperationServersVisitorOptions, OperationTags as OperationTagsElement, TagsVisitor$1 as OperationTagsVisitor, type TagsVisitorOptions$1 as OperationTagsVisitorOptions, OperationVisitor, type OperationVisitorOptions, ParameterContent as ParameterContentElement, ContentVisitor$2 as ParameterContentVisitor, type ContentVisitorOptions as ParameterContentVisitorOptions, Parameter as ParameterElement, ExamplesVisitor$1 as ParameterExampleVisitor, ParameterExamples as ParameterExamplesElement, type ExamplesVisitorOptions$1 as ParameterExamplesVisitorOptions, SchemaVisitor$2 as ParameterSchemaVisitor, type SchemaVisitorOptions$2 as ParameterSchemaVisitorOptions, ParameterVisitor, type ParameterVisitorOptions, ParametersVisitor$2 as ParametersVisitor, type ParametersVisitorOptions, $RefVisitor as PathItem$RefVisitor, type VisitorOptions as PathItem$RefVisitorOptions, PathItem as PathItemElement, PathItemParameters as PathItemParametersElement, ParametersVisitor as PathItemParametersVisitor, type ParametersVisitorOptions as PathItemParametersVisitorOptions, PathItemServers as PathItemServersElement, ServersVisitor as PathItemServersVisitor, type ServersVisitorOptions as PathItemServersVisitorOptions, PathItemVisitor, type PathItemVisitorOptions, Paths as PathsElement, PathsVisitor, type PathsVisitorOptions, PatternedFieldsVisitor, type PatternedFieldsVisitorOptions, $RefVisitor$1 as Reference$RefVisitor, type VisitorOptions as Reference$RefVisitorOptions, Reference as ReferenceElement, ReferenceVisitor, type ReferenceVisitorOptions, RequestBodyContent as RequestBodyContentElement, ContentVisitor$1 as RequestBodyContentVisitor, type ContentVisitorOptions as RequestBodyContentVisitorOptions, RequestBody as RequestBodyElement, RequestBodyVisitor$1 as RequestBodyVisitor, type RequestBodyVisitorOptions$1 as RequestBodyVisitorOptions, ResponseContent as ResponseContentElement, ContentVisitor as ResponseContentVisitor, type ContentVisitorOptions as ResponseContentVisitorOptions, Response as ResponseElement, ResponseHeaders as ResponseHeadersElement, HeadersVisitor as ResponseHeadersVisitor, type HeadersVisitorOptions as ResponseHeadersVisitorOptions, ResponseLinks as ResponseLinksElement, LinksVisitor as ResponseLinksVisitor, type LinksVisitorOptions as ResponseLinksVisitorOptions, ResponseVisitor, type ResponseVisitorOptions, DefaultVisitor as ResponsesDefaultVisitor, type DefaultVisitorOptions as ResponsesDefaultVisitorOptions, Responses as ResponsesElement, ResponsesVisitor, type ResponsesVisitorOptions, AllOfVisitor as SchemaAllOfVisitor, AnyOfVisitor as SchemaAnyOfVisitor, Schema as SchemaElement, ItemsVisitor as SchemaItemsVisitor, OneOfVisitor as SchemaOneOfVisitor, SchemaOrReferenceVisitor, PropertiesVisitor as SchemaPropertiesVisitor, TypeVisitor as SchemaTypeVisitor, SchemaVisitor, type SchemaVisitorOptions, Security as SecurityElement, SecurityRequirement as SecurityRequirementElement, SecurityRequirementVisitor, type SecurityRequirementVisitorOptions, SecurityScheme as SecuritySchemeElement, SecuritySchemeVisitor, type SecuritySchemeVisitorOptions, SecurityVisitor$1 as SecurityVisitor, type SecurityVisitorOptions$1 as SecurityVisitorOptions, Server as ServerElement, ServerVariable as ServerVariableElement, UrlVisitor as ServerVariableUrlVisitor, type VisitorOptions as ServerVariableUrlVisitorOptions, VariablesVisitor as ServerVariableVariablesVisitor, type VariablesVisitorOptions as ServerVariableVariablesVisitorOptions, ServerVariableVisitor, type ServerVariableVisitorOptions, ServerVariables as ServerVariablesElement, ServerVisitor, type ServerVisitorOptions, Servers as ServersElement, ServersVisitor$2 as ServersVisitor, type ServersVisitorOptions, type SpecPath, SpecificationExtensionVisitor, type SpecificationVisitorOptions as SpecificationExtensionVisitorOptions, SpecificationVisitor, type SpecificationVisitorOptions, Tag as TagElement, TagVisitor, type TagVisitorOptions, Tags as TagsElement, TagsVisitor, type TagsVisitorOptions, type Predicates as ToolboxPredicates, Visitor, type VisitorOptions, Xml as XmlElement, XmlVisitor, type XmlVisitorOptions, createRefractor, createToolbox, openApi3_0 as default, getNodeType, isBooleanJsonSchemaElement, isCallbackElement, isComponentsElement, isContactElement, isExampleElement, isExternalDocumentationElement, isInfoElement, isLicenseElement, isLinkElement, isMediaTypeElement, isOpenApi3_0Element, isOpenApiExtension, isOpenapiElement, isOperationElement, isParameterElement, isPathItemElement, isPathsElement, isReferenceElement, isReferenceLikeElement, isRequestBodyElement, isResponseElement, isResponsesElement, isSchemaElement, isSecurityRequirementElement, isSecuritySchemeElement, isServerElement, isServerLikeElement, isServerVariableElement, isServersElement, isTagLikeElement, keyMap, mediaTypes, refract, plugin as refractorPluginReplaceEmptyElement, specification as specificationObj };
