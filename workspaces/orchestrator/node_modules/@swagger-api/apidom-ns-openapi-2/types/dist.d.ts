import * as _swagger_api_apidom_core from '@swagger-api/apidom-core';
import { MediaTypes, NamespacePluginOptions, StringElement, Element, Meta, Attributes, ObjectElement, ArrayElement, MemberElement, BooleanElement, NumberElement } from '@swagger-api/apidom-core';
export { isArrayElement, isBooleanElement, isElement, isLinkElement as isLinkPrimitiveElement, isMemberElement, isNullElement, isNumberElement, isObjectElement, isRefElement, isStringElement } from '@swagger-api/apidom-core';
import * as _swagger_api_apidom_ns_json_schema_draft_4 from '@swagger-api/apidom-ns-json-schema-draft-4';
import { JSONSchemaElement, JSONReferenceElement, MediaElement } from '@swagger-api/apidom-ns-json-schema-draft-4';
export { JSONReferenceElement, AllOfVisitorOptions as SchemaAllOfVisitorOptions, ItemsVisitorOptions as SchemaItemsVisitorOptions, SchemaOrReferenceVisitorOptions as SchemaOrJSONReferenceVisitorOptions, PropertiesVisitorOptions as SchemaPropertiesVisitorOptions, isJSONReferenceElement, isJSONReferenceLikeElement } from '@swagger-api/apidom-ns-json-schema-draft-4';
import * as minim from 'minim';
import * as ts_mixer_dist_types_types from 'ts-mixer/dist/types/types';

type Format = 'generic' | 'json' | 'yaml';
declare class OpenAPIMediaTypes extends MediaTypes<string> {
    filterByFormat(format?: Format): string[];
    findBy(version?: string, format?: Format): string;
    latest(format?: Format): string;
}
declare const mediaTypes: OpenAPIMediaTypes;

declare const openApi2: {
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

interface VisitorOptions {
}
declare class Visitor {
    element: Element;
    constructor(options?: VisitorOptions);
    copyMetaAndAttributes(from: Element, to: Element): void;
}

declare class FallbackVisitor extends Visitor {
    enter(element: Element): {};
}

declare class SwaggerVersion extends StringElement {
    constructor(content?: string, meta?: Meta, attributes?: Attributes);
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
    get contact(): Contact | undefined;
    set contact(contactElement: Contact | undefined);
    get license(): License | undefined;
    set license(licenseElement: License | undefined);
    get version(): StringElement | undefined;
    set version(version: StringElement | undefined);
}

declare class Paths extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class Definitions extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class ParametersDefinitions extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class ResponsesDefinitions extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class SecurityDefinitions extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class ExternalDocumentation extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get url(): StringElement | undefined;
    set url(url: StringElement | undefined);
}

declare class Swagger extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get swagger(): SwaggerVersion | undefined;
    set swagger(swagger: SwaggerVersion | undefined);
    get info(): Info | undefined;
    set info(info: Info | undefined);
    get host(): StringElement | undefined;
    set host(host: StringElement | undefined);
    get basePath(): StringElement | undefined;
    set basePath(basePath: StringElement | undefined);
    get schemes(): ArrayElement | undefined;
    set schemes(schemes: ArrayElement | undefined);
    get consumes(): ArrayElement | undefined;
    set consumes(consumes: ArrayElement | undefined);
    get produces(): ArrayElement | undefined;
    set produces(produces: ArrayElement | undefined);
    get paths(): Paths | undefined;
    set paths(paths: Paths | undefined);
    get definitions(): Definitions | undefined;
    set definitions(definitions: Definitions | undefined);
    get parameters(): ParametersDefinitions | undefined;
    set parameters(parameters: ParametersDefinitions | undefined);
    get responses(): ResponsesDefinitions | undefined;
    set responses(responses: ResponsesDefinitions | undefined);
    get securityDefinitions(): SecurityDefinitions | undefined;
    set securityDefinitions(securityDefinitions: SecurityDefinitions | undefined);
    get security(): ArrayElement | undefined;
    set security(security: ArrayElement | undefined);
    get tags(): ArrayElement | undefined;
    set tags(tags: ArrayElement | undefined);
    get externalDocs(): ExternalDocumentation | undefined;
    set externalDocs(externalDocs: ExternalDocumentation | undefined);
}

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
    retrievePassingOptions(): Pick<this, keyof this>;
    retrieveFixedFields(specPath: string[]): string[];
    retrieveVisitor(specPath: string[]): unknown;
    retrieveVisitorInstance(specPath: string[], options?: {}): Visitor;
    toRefractedElement(specPath: string[], element: any, options?: {}): any;
}

interface ReferenceLikeElement extends ObjectElement {
    hasKey: (value: '$ref') => true;
}
declare const isSwaggerExtension: (element: MemberElement) => boolean;
declare const isReferenceLikeElement: (element: unknown) => element is ReferenceLikeElement;

type SpecPath<T = string[]> = (element: unknown) => T;
interface FixedFieldsVisitorOptions extends SpecificationVisitorOptions {
    readonly specPath: SpecPath;
    readonly ignoredFields?: string[];
    readonly canSupportSpecificationExtensions?: boolean;
    readonly specificationExtensionPredicate?: typeof isSwaggerExtension;
}
declare class FixedFieldsVisitor extends SpecificationVisitor {
    protected specPath: SpecPath;
    protected ignoredFields: string[];
    protected canSupportSpecificationExtensions: boolean;
    protected specificationExtensionPredicate: (element: MemberElement) => boolean;
    constructor({ specPath, ignoredFields, canSupportSpecificationExtensions, specificationExtensionPredicate, ...rest }: FixedFieldsVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

interface SwaggerVisitorOptions$1 extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const SwaggerVisitor_base$1: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class SwaggerVisitor$1 extends SwaggerVisitor_base$1 {
    readonly element: Swagger;
    protected readonly specPath: SpecPath<['document', 'objects', 'Swagger']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: SwaggerVisitorOptions$1);
}

interface SwaggerVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const SwaggerVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class SwaggerVisitor extends SwaggerVisitor_base {
    element: SwaggerVersion;
    StringElement(stringElement: StringElement): {};
}

declare class HostVisitor extends FallbackVisitor {
    readonly element: StringElement;
    StringElement(stringElement: StringElement): {};
}

declare class BasePathVisitor extends FallbackVisitor {
    readonly element: StringElement;
    StringElement(stringElement: StringElement): {};
}

declare class SwaggerSchemes extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

declare class SchemesVisitor$1 extends FallbackVisitor {
    element: SwaggerSchemes;
    constructor(options: VisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class SwaggerConsumes extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

declare class ConsumesVisitor$1 extends FallbackVisitor {
    element: SwaggerConsumes;
    constructor(options: VisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class SwaggerProduces extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

declare class ProducesVisitor$1 extends FallbackVisitor {
    element: SwaggerProduces;
    constructor(options: VisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class SwaggerSecurity extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface SecurityVisitorOptions$1 extends SpecificationVisitorOptions, VisitorOptions {
}
declare const SecurityVisitor_base$1: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class SecurityVisitor$1 extends SecurityVisitor_base$1 {
    readonly element: SwaggerSecurity;
    constructor(options: SecurityVisitorOptions$1);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class SwaggerTags extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface TagsVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const TagsVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class TagsVisitor$1 extends TagsVisitor_base {
    readonly element: SwaggerTags;
    constructor(options: TagsVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
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

interface PatternedFieldsVisitorOptions extends SpecificationVisitorOptions {
    readonly specPath: SpecPath;
    readonly ignoredFields?: string[];
    readonly fieldPatternPredicate?: (...args: unknown[]) => boolean;
    readonly canSupportSpecificationExtensions?: boolean;
    readonly specificationExtensionPredicate?: typeof isSwaggerExtension;
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
    get additionalItems(): this | JSONReferenceElement | BooleanElement | undefined;
    set additionalItems(additionalItems: this | JSONReferenceElement | BooleanElement | undefined);
    /**
     * Validation keywords for objects
     */
    get patternProperties(): ObjectElement | undefined;
    set patternProperties(patternProperties: ObjectElement | undefined);
    get dependencies(): ObjectElement | undefined;
    set dependencies(dependencies: ObjectElement | undefined);
    /**
     *  Validation keywords for any instance type
     */
    get anyOf(): ArrayElement | undefined;
    set anyOf(anyOf: ArrayElement | undefined);
    get oneOf(): ArrayElement | undefined;
    set oneOf(oneOf: ArrayElement | undefined);
    get not(): this | JSONReferenceElement | undefined;
    set not(not: this | JSONReferenceElement | undefined);
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
}

declare class Headers extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class Example extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

declare class Response extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get schema(): Schema | undefined;
    set schema(schema: Schema | undefined);
    get headers(): Headers | undefined;
    set headers(headers: Headers | undefined);
    get examples(): Example | undefined;
    set examples(examples: Example | undefined);
}

declare class Reference extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get $ref(): StringElement | undefined;
    set $ref($ref: StringElement | undefined);
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
    get responses(): Responses | undefined;
    set responses(responses: Responses | undefined);
    get schemes(): ArrayElement | undefined;
    set schemes(schemes: ArrayElement | undefined);
    get deprecated(): BooleanElement;
    set deprecated(deprecated: BooleanElement);
    get security(): ArrayElement | undefined;
    set security(security: ArrayElement | undefined);
}

declare class PathItem extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get $ref(): StringElement | undefined;
    set $ref($ref: StringElement | undefined);
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
    get parameters(): ArrayElement;
    set parameters(parameters: ArrayElement | undefined);
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

declare class $RefVisitor$1 extends FallbackVisitor {
    readonly element: StringElement;
    StringElement(stringElement: StringElement): {};
}

declare class PathItemParameters extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface ParametersVisitorOptions$1 extends SpecificationVisitorOptions, VisitorOptions {
}
declare const ParametersVisitor_base$1: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class ParametersVisitor$1 extends ParametersVisitor_base$1 {
    readonly element: PathItemParameters;
    constructor(options: ParametersVisitorOptions$1);
    ArrayElement(arrayElement: ArrayElement): {};
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

declare class TagsVisitor extends FallbackVisitor {
    element: OperationTags;
    constructor(options: VisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class OperationConsumes extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

declare class ConsumesVisitor extends FallbackVisitor {
    element: OperationConsumes;
    constructor(options: VisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class OperationProduces extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

declare class ProducesVisitor extends FallbackVisitor {
    element: OperationProduces;
    constructor(options: VisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class OperationParameters extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface ParametersVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const ParametersVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class ParametersVisitor extends ParametersVisitor_base {
    readonly element: OperationParameters;
    constructor(options: ParametersVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class OperationSchemes extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

declare class SchemesVisitor extends FallbackVisitor {
    element: OperationSchemes;
    constructor(options: VisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
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

interface ExternalDocumentationVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const ExternalDocumentationVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class ExternalDocumentationVisitor extends ExternalDocumentationVisitor_base {
    readonly element: ExternalDocumentation;
    protected readonly specPath: SpecPath<['document', 'objects', 'ExternalDocumentation']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: ExternalDocumentationVisitorOptions);
}

declare class Parameter extends JSONSchemaElement {
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
    get additionalItems(): this | JSONReferenceElement | BooleanElement | undefined;
    set additionalItems(additionalItems: this | JSONReferenceElement | BooleanElement | undefined);
    get items(): this | undefined;
    set items(items: this | undefined);
    /**
     * Validation keywords for objects
     */
    get maxProperties(): NumberElement | undefined;
    set maxProperties(maxProperties: NumberElement | undefined);
    get minProperties(): NumberElement | undefined;
    set minProperties(minProperties: NumberElement | undefined);
    get required(): BooleanElement | undefined | any;
    set required(required: BooleanElement | undefined | any);
    get properties(): ObjectElement | undefined;
    set properties(properties: ObjectElement | undefined);
    get additionalProperties(): this | JSONReferenceElement | BooleanElement | undefined;
    set additionalProperties(additionalProperties: this | JSONReferenceElement | BooleanElement | undefined);
    get patternProperties(): ObjectElement | undefined;
    set patternProperties(patternProperties: ObjectElement | undefined);
    get dependencies(): ObjectElement | undefined;
    set dependencies(dependencies: ObjectElement | undefined);
    /**
     *  Validation keywords for any instance type
     */
    get type(): StringElement | undefined;
    set type(type: StringElement | undefined);
    get allOf(): ArrayElement | undefined;
    set allOf(allOf: ArrayElement | undefined);
    get anyOf(): ArrayElement | undefined;
    set anyOf(anyOf: ArrayElement | undefined);
    get oneOf(): ArrayElement | undefined;
    set oneOf(oneOf: ArrayElement | undefined);
    get not(): this | JSONReferenceElement | undefined;
    set not(not: this | JSONReferenceElement | undefined);
    get definitions(): ObjectElement | undefined;
    set definitions(definitions: ObjectElement | undefined);
    /**
     * Metadata keywords
     *
     * URI: https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-6
     */
    get title(): StringElement | undefined;
    set title(title: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    /**
     * Semantic validation with "format"
     *
     * URI: https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-7
     */
    get format(): StringElement | undefined;
    set format(format: StringElement | undefined);
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
    get readOnly(): BooleanElement | undefined;
    set readOnly(readOnly: BooleanElement | undefined);
    /**
     * OpenAPI vocabulary
     */
    get name(): StringElement | undefined;
    set name(name: StringElement | undefined);
    get in(): StringElement | undefined;
    set in(val: StringElement | undefined);
    get schema(): Schema | undefined;
    set schema(schema: Schema | undefined);
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

declare class Items extends JSONSchemaElement {
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
    get additionalItems(): this | JSONReferenceElement | BooleanElement | undefined;
    set additionalItems(additionalItems: this | JSONReferenceElement | BooleanElement | undefined);
    get items(): this | undefined;
    set items(items: this | undefined);
    /**
     * Validation keywords for objects
     */
    get maxProperties(): NumberElement | undefined;
    set maxProperties(maxProperties: NumberElement | undefined);
    get minProperties(): NumberElement | undefined;
    set minProperties(minProperties: NumberElement | undefined);
    get required(): ArrayElement | undefined;
    set required(required: ArrayElement | undefined);
    get properties(): ObjectElement | undefined;
    set properties(properties: ObjectElement | undefined);
    get additionalProperties(): this | JSONReferenceElement | BooleanElement | undefined;
    set additionalProperties(additionalProperties: this | JSONReferenceElement | BooleanElement | undefined);
    get patternProperties(): ObjectElement | undefined;
    set patternProperties(patternProperties: ObjectElement | undefined);
    get dependencies(): ObjectElement | undefined;
    set dependencies(dependencies: ObjectElement | undefined);
    /**
     *  Validation keywords for any instance type
     */
    get type(): StringElement | undefined;
    set type(type: StringElement | undefined);
    get allOf(): ArrayElement | undefined;
    set allOf(allOf: ArrayElement | undefined);
    get anyOf(): ArrayElement | undefined;
    set anyOf(anyOf: ArrayElement | undefined);
    get oneOf(): ArrayElement | undefined;
    set oneOf(oneOf: ArrayElement | undefined);
    get not(): this | JSONReferenceElement | undefined;
    set not(not: this | JSONReferenceElement | undefined);
    get definitions(): ObjectElement | undefined;
    set definitions(definitions: ObjectElement | undefined);
    /**
     * Metadata keywords
     *
     * URI: https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-6
     */
    get title(): StringElement | undefined;
    set title(title: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
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
    get readOnly(): BooleanElement | undefined;
    set readOnly(readOnly: BooleanElement | undefined);
}

interface ItemsVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const ItemsVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class ItemsVisitor$1 extends ItemsVisitor_base {
    readonly element: Items;
    protected readonly specPath: SpecPath<['document', 'objects', 'Items']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: ItemsVisitorOptions);
}

interface MixedFieldsVisitorOptions extends PatternedFieldsVisitorOptions {
    readonly specPathFixedFields: SpecPath;
    readonly specPathPatternedFields: SpecPath;
}
declare const MixedFieldsVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & PatternedFieldsVisitor, typeof FixedFieldsVisitor & typeof PatternedFieldsVisitor>;
declare class MixedFieldsVisitor extends MixedFieldsVisitor_base {
    protected readonly specPathFixedFields: SpecPath;
    protected readonly specPathPatternedFields: SpecPath;
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

type Alternator = {
    predicate: (element: unknown) => boolean;
    specPath: string[];
};
interface AlternatingVisitorOptions extends SpecificationVisitorOptions {
    readonly alternator?: Alternator[];
}
declare class AlternatingVisitor extends SpecificationVisitor {
    protected alternator: Alternator[];
    constructor({ alternator, ...rest }: AlternatingVisitorOptions);
    enter(element: Element): {};
}

interface DefaultVisitorOptions extends AlternatingVisitorOptions, VisitorOptions {
}
declare const DefaultVisitor_base: ts_mixer_dist_types_types.Class<any[], AlternatingVisitor & FallbackVisitor, typeof AlternatingVisitor & typeof FallbackVisitor>;
declare class DefaultVisitor extends DefaultVisitor_base {
    constructor(options: DefaultVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

interface ResponseVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const ResponseVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class ResponseVisitor extends ResponseVisitor_base {
    readonly element: Response;
    protected readonly specPath: SpecPath<['document', 'objects', 'Response']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: ResponseVisitorOptions);
}

interface MapVisitorOptions extends PatternedFieldsVisitorOptions {
}
declare class MapVisitor extends PatternedFieldsVisitor {
    constructor(options: MapVisitorOptions);
}

interface HeadersVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const HeadersVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class HeadersVisitor extends HeadersVisitor_base {
    readonly element: Headers;
    protected readonly specPath: SpecPath<['document', 'objects', 'Header']>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: HeadersVisitorOptions);
}

interface ExampleVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const ExampleVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ExampleVisitor extends ExampleVisitor_base {
    readonly element: Example;
    protected readonly specPath: SpecPath<['value']>;
    protected readonly canSupportSpecificationExtensions: false;
    constructor(options: ExampleVisitorOptions);
}

declare class Header extends JSONSchemaElement {
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
    get additionalItems(): this | JSONReferenceElement | BooleanElement | undefined;
    set additionalItems(additionalItems: this | JSONReferenceElement | BooleanElement | undefined);
    get items(): this | undefined;
    set items(items: this | undefined);
    /**
     * Validation keywords for objects
     */
    get maxProperties(): NumberElement | undefined;
    set maxProperties(maxProperties: NumberElement | undefined);
    get minProperties(): NumberElement | undefined;
    set minProperties(minProperties: NumberElement | undefined);
    get required(): ArrayElement | undefined;
    set required(required: ArrayElement | undefined);
    get properties(): ObjectElement | undefined;
    set properties(properties: ObjectElement | undefined);
    get additionalProperties(): this | JSONReferenceElement | BooleanElement | undefined;
    set additionalProperties(additionalProperties: this | JSONReferenceElement | BooleanElement | undefined);
    get patternProperties(): ObjectElement | undefined;
    set patternProperties(patternProperties: ObjectElement | undefined);
    get dependencies(): ObjectElement | undefined;
    set dependencies(dependencies: ObjectElement | undefined);
    /**
     *  Validation keywords for any instance type
     */
    get type(): StringElement | undefined;
    set type(type: StringElement | undefined);
    get allOf(): ArrayElement | undefined;
    set allOf(allOf: ArrayElement | undefined);
    get anyOf(): ArrayElement | undefined;
    set anyOf(anyOf: ArrayElement | undefined);
    get oneOf(): ArrayElement | undefined;
    set oneOf(oneOf: ArrayElement | undefined);
    get not(): this | JSONReferenceElement | undefined;
    set not(not: this | JSONReferenceElement | undefined);
    get definitions(): ObjectElement | undefined;
    set definitions(definitions: ObjectElement | undefined);
    /**
     * Metadata keywords
     *
     * URI: https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-6
     */
    get title(): StringElement | undefined;
    set title(title: StringElement | undefined);
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
    get readOnly(): BooleanElement | undefined;
    set readOnly(readOnly: BooleanElement | undefined);
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

declare class $RefVisitor extends FallbackVisitor {
    readonly element: StringElement;
    StringElement(stringElement: StringElement): {};
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

declare const JSONSchemaItemsVisitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor;
declare class ItemsVisitor extends JSONSchemaItemsVisitor {
    ObjectElement(objectElement: ObjectElement): {};
    ArrayElement(arrayElement: ArrayElement): {};
}

declare const JSONSchemaPropertiesVisitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor;
declare class PropertiesVisitor extends JSONSchemaPropertiesVisitor {
    ObjectElement(objectElement: ObjectElement): {};
}

declare const JSONSchemaOrJSONReferenceVisitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor;
declare class SchemaOrJSONReferenceVisitor extends JSONSchemaOrJSONReferenceVisitor {
    element: Schema | JSONReferenceElement;
    ObjectElement(objectElement: ObjectElement): {};
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

interface XmlVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const XmlVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class XmlVisitor extends XmlVisitor_base {
    readonly element: Xml;
    protected readonly specPath: SpecPath<['document', 'objects', 'XML']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: XmlVisitorOptions);
}

interface DefinitionsVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const DefinitionsVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class DefinitionsVisitor extends DefinitionsVisitor_base {
    readonly element: Definitions;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'JSONReference'
    ] | ['document', 'objects', 'Schema']>;
    constructor(options: DefinitionsVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

interface ResponsesDefinitionsVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const ResponsesDefinitionsVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ResponsesDefinitionsVisitor extends ResponsesDefinitionsVisitor_base {
    readonly element: ResponsesDefinitions;
    protected readonly specPath: SpecPath<['document', 'objects', 'Response']>;
    constructor(options: ResponsesDefinitionsVisitorOptions);
}

interface ParametersDefinitionsVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const ParametersDefinitionsVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ParametersDefinitionsVisitor extends ParametersDefinitionsVisitor_base {
    readonly element: ParametersDefinitions;
    protected readonly specPath: SpecPath<['document', 'objects', 'Parameter']>;
    constructor(options: ParametersDefinitionsVisitorOptions);
}

interface SecurityDefinitionsVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const SecurityDefinitionsVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class SecurityDefinitionsVisitor extends SecurityDefinitionsVisitor_base {
    readonly element: SecurityDefinitions;
    protected readonly specPath: SpecPath<['document', 'objects', 'SecurityScheme']>;
    constructor(options: SecurityDefinitionsVisitorOptions);
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
    get flow(): StringElement | undefined;
    set flow(flow: StringElement | undefined);
    get authorizationUrl(): StringElement | undefined;
    set authorizationUrl(authorizationUrl: StringElement | undefined);
    get tokenUrl(): StringElement | undefined;
    set tokenUrl(tokenUrl: StringElement | undefined);
    get scopes(): ArrayElement | undefined;
    set scopes(scopes: ArrayElement | undefined);
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

declare class Scopes extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface ScopesVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const ScopesVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ScopesVisitor extends ScopesVisitor_base {
    readonly element: Scopes;
    protected readonly specPath: SpecPath<['value']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: ScopesVisitorOptions);
}

declare class SecurityRequirement extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface SecurityRequirementVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const SecurityRequirementVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class SecurityRequirementVisitor extends SecurityRequirementVisitor_base {
    readonly element: SecurityRequirement;
    protected readonly specPath: SpecPath<['value']>;
    constructor(options: SecurityRequirementVisitorOptions);
}

declare class SpecificationExtensionVisitor extends SpecificationVisitor {
    element: MemberElement;
    MemberElement(memberElement: MemberElement): {};
}

declare const specification: {
    visitors: {
        value: typeof FallbackVisitor;
        document: {
            objects: {
                JSONReference: {
                    $visitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.JSONReferenceVisitor;
                    fixedFields: {
                        $ref: typeof _swagger_api_apidom_ns_json_schema_draft_4.JSONReference$RefVisitor;
                    };
                };
                JSONSchema: {
                    $ref: string;
                };
                Swagger: {
                    $visitor: typeof SwaggerVisitor$1;
                    fixedFields: {
                        swagger: typeof SwaggerVisitor;
                        info: {
                            $ref: string;
                        };
                        host: typeof HostVisitor;
                        basePath: typeof BasePathVisitor;
                        schemes: typeof SchemesVisitor$1;
                        consumes: typeof ConsumesVisitor$1;
                        produces: typeof ProducesVisitor$1;
                        paths: {
                            $ref: string;
                        };
                        definitions: {
                            $ref: string;
                        };
                        parameters: {
                            $ref: string;
                        };
                        responses: {
                            $ref: string;
                        };
                        securityDefinitions: {
                            $ref: string;
                        };
                        security: typeof SecurityVisitor$1;
                        tags: typeof TagsVisitor$1;
                        externalDocs: {
                            $ref: string;
                        };
                    };
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
                        contact: {
                            $ref: string;
                        };
                        license: {
                            $ref: string;
                        };
                        version: typeof VersionVisitor;
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
                Paths: {
                    $visitor: typeof PathsVisitor;
                };
                PathItem: {
                    $visitor: typeof PathItemVisitor;
                    fixedFields: {
                        $ref: typeof $RefVisitor$1;
                        get: {
                            $ref: string;
                        };
                        put: {
                            $ref: string;
                        };
                        post: {
                            $ref: string;
                        };
                        delete: {
                            $ref: string;
                        };
                        options: {
                            $ref: string;
                        };
                        head: {
                            $ref: string;
                        };
                        patch: {
                            $ref: string;
                        };
                        parameters: typeof ParametersVisitor$1;
                    };
                };
                Operation: {
                    $visitor: typeof OperationVisitor;
                    fixedFields: {
                        tags: typeof TagsVisitor;
                        summary: {
                            $ref: string;
                        };
                        description: {
                            $ref: string;
                        };
                        externalDocs: {
                            $ref: string;
                        };
                        operationId: {
                            $ref: string;
                        };
                        consumes: typeof ConsumesVisitor;
                        produces: typeof ProducesVisitor;
                        parameters: typeof ParametersVisitor;
                        responses: {
                            $ref: string;
                        };
                        schemes: typeof SchemesVisitor;
                        deprecated: {
                            $ref: string;
                        };
                        security: typeof SecurityVisitor;
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
                Parameter: {
                    $visitor: typeof ParameterVisitor;
                    fixedFields: {
                        name: {
                            $ref: string;
                        };
                        in: {
                            $ref: string;
                        };
                        description: {
                            $ref: string;
                        };
                        required: typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor;
                        schema: typeof SchemaOrJSONReferenceVisitor;
                        type: typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor;
                        format: {
                            $ref: string;
                        };
                        items: {
                            $ref: string;
                        };
                        collectionFormat: {
                            $ref: string;
                        };
                        default: {
                            $ref: string;
                        };
                        maximum: {
                            $ref: string;
                        };
                        exclusiveMaximum: {
                            $ref: string;
                        };
                        minimum: {
                            $ref: string;
                        };
                        exclusiveMinimum: {
                            $ref: string;
                        };
                        maxLength: {
                            $ref: string;
                        };
                        minLength: {
                            $ref: string;
                        };
                        pattern: {
                            $ref: string;
                        };
                        maxItems: {
                            $ref: string;
                        };
                        minItems: {
                            $ref: string;
                        };
                        uniqueItems: {
                            $ref: string;
                        };
                        enum: typeof _swagger_api_apidom_ns_json_schema_draft_4.EnumVisitor;
                        multipleOf: {
                            $ref: string;
                        };
                    };
                };
                Items: {
                    $visitor: typeof ItemsVisitor$1;
                    fixedFields: {
                        type: typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor;
                        format: {
                            $ref: string;
                        };
                        items: {
                            $ref: string;
                        };
                        collectionFormat: {
                            $ref: string;
                        };
                        default: {
                            $ref: string;
                        };
                        maximum: {
                            $ref: string;
                        };
                        exclusiveMaximum: {
                            $ref: string;
                        };
                        minimum: {
                            $ref: string;
                        };
                        exclusiveMinimum: {
                            $ref: string;
                        };
                        maxLength: {
                            $ref: string;
                        };
                        minLength: {
                            $ref: string;
                        };
                        pattern: {
                            $ref: string;
                        };
                        maxItems: {
                            $ref: string;
                        };
                        minItems: {
                            $ref: string;
                        };
                        uniqueItems: {
                            $ref: string;
                        };
                        enum: typeof _swagger_api_apidom_ns_json_schema_draft_4.EnumVisitor;
                        multipleOf: {
                            $ref: string;
                        };
                    };
                };
                Responses: {
                    $visitor: typeof ResponsesVisitor;
                    fixedFields: {
                        default: typeof DefaultVisitor;
                    };
                };
                Response: {
                    $visitor: typeof ResponseVisitor;
                    fixedFields: {
                        description: {
                            $ref: string;
                        };
                        schema: typeof SchemaOrJSONReferenceVisitor;
                        headers: {
                            $ref: string;
                        };
                        examples: {
                            $ref: string;
                        };
                    };
                };
                Headers: {
                    $visitor: typeof HeadersVisitor;
                };
                Example: {
                    $visitor: typeof ExampleVisitor;
                };
                Header: {
                    $visitor: typeof HeaderVisitor;
                    fixedFields: {
                        description: {
                            $ref: string;
                        };
                        type: typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor;
                        format: {
                            $ref: string;
                        };
                        items: {
                            $ref: string;
                        };
                        collectionFormat: {
                            $ref: string;
                        };
                        default: {
                            $ref: string;
                        };
                        maximum: {
                            $ref: string;
                        };
                        exclusiveMaximum: {
                            $ref: string;
                        };
                        minimum: {
                            $ref: string;
                        };
                        exclusiveMinimum: {
                            $ref: string;
                        };
                        maxLength: {
                            $ref: string;
                        };
                        minLength: {
                            $ref: string;
                        };
                        pattern: {
                            $ref: string;
                        };
                        maxItems: {
                            $ref: string;
                        };
                        minItems: {
                            $ref: string;
                        };
                        uniqueItems: {
                            $ref: string;
                        };
                        enum: typeof _swagger_api_apidom_ns_json_schema_draft_4.EnumVisitor;
                        multipleOf: {
                            $ref: string;
                        };
                    };
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
                Reference: {
                    $visitor: typeof ReferenceVisitor;
                    fixedFields: {
                        $ref: typeof $RefVisitor;
                    };
                };
                Schema: {
                    $visitor: typeof SchemaVisitor;
                    fixedFields: {
                        format: {
                            $ref: string;
                        };
                        title: {
                            $ref: string;
                        };
                        description: {
                            $ref: string;
                        };
                        default: {
                            $ref: string;
                        };
                        multipleOf: {
                            $ref: string;
                        };
                        maximum: {
                            $ref: string;
                        };
                        exclusiveMaximum: {
                            $ref: string;
                        };
                        minimum: {
                            $ref: string;
                        };
                        exclusiveMinimum: {
                            $ref: string;
                        };
                        maxLength: {
                            $ref: string;
                        };
                        minLength: {
                            $ref: string;
                        };
                        pattern: {
                            $ref: string;
                        };
                        maxItems: {
                            $ref: string;
                        };
                        minItems: {
                            $ref: string;
                        };
                        uniqueItems: {
                            $ref: string;
                        };
                        maxProperties: {
                            $ref: string;
                        };
                        minProperties: {
                            $ref: string;
                        };
                        required: typeof _swagger_api_apidom_ns_json_schema_draft_4.RequiredVisitor;
                        enum: typeof _swagger_api_apidom_ns_json_schema_draft_4.EnumVisitor;
                        type: typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor;
                        readOnly: {
                            $ref: string;
                        };
                        items: typeof ItemsVisitor;
                        allOf: typeof AllOfVisitor;
                        properties: typeof PropertiesVisitor;
                        additionalProperties: typeof SchemaOrJSONReferenceVisitor;
                        discriminator: {
                            $ref: string;
                        };
                        xml: {
                            $ref: string;
                        };
                        externalDocs: {
                            $ref: string;
                        };
                        example: {
                            $ref: string;
                        };
                    };
                };
                XML: {
                    $visitor: typeof XmlVisitor;
                    fixedFields: {
                        name: {
                            $ref: string;
                        };
                        namespace: {
                            $ref: string;
                        };
                        prefix: {
                            $ref: string;
                        };
                        attribute: {
                            $ref: string;
                        };
                        wrapped: {
                            $ref: string;
                        };
                    };
                };
                Definitions: {
                    $visitor: typeof DefinitionsVisitor;
                };
                ParametersDefinitions: {
                    $visitor: typeof ParametersDefinitionsVisitor;
                };
                ResponsesDefinitions: {
                    $visitor: typeof ResponsesDefinitionsVisitor;
                };
                SecurityDefinitions: {
                    $visitor: typeof SecurityDefinitionsVisitor;
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
                        flow: {
                            $ref: string;
                        };
                        authorizationUrl: {
                            $ref: string;
                        };
                        token: {
                            $ref: string;
                        };
                        scopes: {
                            $ref: string;
                        };
                    };
                };
                Scopes: {
                    $visitor: typeof ScopesVisitor;
                };
                SecurityRequirement: {
                    $visitor: typeof SecurityRequirementVisitor;
                };
            };
            extension: {
                $visitor: typeof SpecificationExtensionVisitor;
            };
        };
    };
};

declare const isSwaggerElement: _swagger_api_apidom_core.ElementPredicate<Swagger>;
declare const isSwaggerVersionElement: _swagger_api_apidom_core.ElementPredicate<SwaggerVersion>;
declare const isInfoElement: _swagger_api_apidom_core.ElementPredicate<Info>;
declare const isLicenseElement: _swagger_api_apidom_core.ElementPredicate<License>;
declare const isContactElement: _swagger_api_apidom_core.ElementPredicate<Contact>;
declare const isPathsElement: _swagger_api_apidom_core.ElementPredicate<Paths>;
declare const isPathItemElement: _swagger_api_apidom_core.ElementPredicate<PathItem>;
declare const isOperationElement: _swagger_api_apidom_core.ElementPredicate<Operation>;
declare const isExternalDocumentationElement: _swagger_api_apidom_core.ElementPredicate<ExternalDocumentation>;
declare const isParameterElement: _swagger_api_apidom_core.ElementPredicate<Parameter>;
declare const isItemsElement: _swagger_api_apidom_core.ElementPredicate<Items>;
declare const isResponsesElement: _swagger_api_apidom_core.ElementPredicate<Responses>;
declare const isResponseElement: _swagger_api_apidom_core.ElementPredicate<Response>;
declare const isHeadersElement: _swagger_api_apidom_core.ElementPredicate<Headers>;
declare const isExampleElement: _swagger_api_apidom_core.ElementPredicate<Example>;
declare const isHeaderElement: _swagger_api_apidom_core.ElementPredicate<Header>;
declare const isTagElement: _swagger_api_apidom_core.ElementPredicate<Tag>;
declare const isReferenceElement: _swagger_api_apidom_core.ElementPredicate<Reference>;
declare const isSchemaElement: _swagger_api_apidom_core.ElementPredicate<Schema>;
declare const isXmlElement: _swagger_api_apidom_core.ElementPredicate<Xml>;
declare const isResponsesDefinitionsElement: _swagger_api_apidom_core.ElementPredicate<ResponsesDefinitions>;
declare const isSecurityDefinitionsElement: _swagger_api_apidom_core.ElementPredicate<SecurityDefinitions>;
declare const isDefinitionsElement: _swagger_api_apidom_core.ElementPredicate<Definitions>;
declare const isParametersDefinitionsElement: _swagger_api_apidom_core.ElementPredicate<ParametersDefinitions>;
declare const isSecuritySchemeElement: _swagger_api_apidom_core.ElementPredicate<SecurityScheme>;
declare const isScopesElement: _swagger_api_apidom_core.ElementPredicate<Scopes>;
declare const isSecurityRequirementElement: _swagger_api_apidom_core.ElementPredicate<SecurityRequirement>;

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
    SwaggerElement: string[];
    InfoElement: string[];
    ContactElement: string[];
    LicenseElement: string[];
    PathsElement: string[];
    PathItemElement: string[];
    OperationElement: string[];
    ExternalDocumentationElement: string[];
    ParameterElement: string[];
    ItemsElement: string[];
    ExampleElement: string[];
    ResponsesElement: string[];
    ResponseElement: string[];
    HeadersElement: string[];
    HeaderElement: string[];
    TagElement: string[];
    ReferenceElement: string[];
    JSONReferenceElement: string[];
    SchemaElement: string[];
    XmlElement: string[];
    DefinitionsElement: string[];
    ParametersDefinitionsElement: string[];
    ResponsesDefinitionsElement: string[];
    SecurityDefinitionsElement: string[];
    SecuritySchemeElement: string[];
    ScopesElement: string[];
    SecurityRequirementElement: string[];
};

export { AlternatingVisitor, type AlternatingVisitorOptions, BasePathVisitor, type VisitorOptions as BasePathVisitorOptions, ConsumesVisitor$1 as ConsumesVisitor, type VisitorOptions as ConsumesVisitorOptions, Contact as ContactElement, ContactVisitor, type ContactVisitorOptions, Definitions as DefinitionsElement, DefinitionsVisitor, type DefinitionsVisitorOptions, Example as ExampleElement, ExampleVisitor, type ExampleVisitorOptions, ExternalDocumentation as ExternalDocumentationElement, ExternalDocumentationVisitor, type ExternalDocumentationVisitorOptions, FallbackVisitor, type VisitorOptions as FallbackVisitorOptions, FixedFieldsVisitor, type FixedFieldsVisitorOptions, Header as HeaderElement, HeaderVisitor, type HeaderVisitorOptions, Headers as HeadersElement, HeadersVisitor, type HeadersVisitorOptions, HostVisitor, type VisitorOptions as HostVisitorOptions, Info as InfoElement, VersionVisitor as InfoVersionVisitor, type VisitorOptions as InfoVersionVisitorOptions, InfoVisitor, type InfoVisitorOptions, Items as ItemsElement, ItemsVisitor$1 as ItemsVisitor, type ItemsVisitorOptions, License as LicenseElement, LicenseVisitor, type LicenseVisitorOptions, MapVisitor, type MapVisitorOptions, MixedFieldsVisitor, type MixedFieldsVisitorOptions, OpenAPIMediaTypes, OperationConsumes as OperationConsumesElement, ConsumesVisitor as OperationConsumesVisitor, type VisitorOptions as OperationConsumesVisitorOptions, Operation as OperationElement, OperationParameters as OperationParametersElement, ParametersVisitor as OperationParametersVisitor, type ParametersVisitorOptions as OperationParametersVisitorOptions, OperationProduces as OperationProducesElement, ProducesVisitor as OperationProducesVisitor, type VisitorOptions as OperationProducesVisitorOptions, OperationSchemes as OperationSchemesElement, SchemesVisitor as OperationSchemesVisitor, type VisitorOptions as OperationSchemesVisitorOptions, OperationSecurity as OperationSecurityElement, SecurityVisitor as OperationSecurityVisitor, type SecurityVisitorOptions as OperationSecurityVisitorOptions, OperationTags as OperationTagsElement, TagsVisitor as OperationTagsVisitor, type VisitorOptions as OperationTagsVisitorOptions, OperationVisitor, type OperationVisitorOptions, Parameter as ParameterElement, ParameterVisitor, type ParameterVisitorOptions, ParametersDefinitions as ParametersDefinitionsElement, ParametersDefinitionsVisitor, type ParametersDefinitionsVisitorOptions, $RefVisitor$1 as PathItem$RefVisitor, type VisitorOptions as PathItem$RefVisitorOptions, PathItem as PathItemElement, PathItemParameters as PathItemParametersElement, ParametersVisitor$1 as PathItemParametersVisitor, type ParametersVisitorOptions$1 as PathItemParametersVisitorOptions, PathItemVisitor, type PathItemVisitorOptions, Paths as PathsElement, PathsVisitor, type PathsVisitorOptions, PatternedFieldsVisitor, type PatternedFieldsVisitorOptions, ProducesVisitor$1 as ProducesVisitor, type VisitorOptions as ProducesVisitorOptions, $RefVisitor as Reference$RefVisitor, type VisitorOptions as Reference$RefVisitorOptions, Reference as ReferenceElement, ReferenceVisitor, type ReferenceVisitorOptions, Response as ResponseElement, ResponseVisitor, type ResponseVisitorOptions, DefaultVisitor as ResponsesDefaultVisitor, type DefaultVisitorOptions as ResponsesDefaultVisitorOptions, ResponsesDefinitions as ResponsesDefinitionsElement, ResponsesDefinitionsVisitor, type ResponsesDefinitionsVisitorOptions, Responses as ResponsesElement, ResponsesVisitor, type ResponsesVisitorOptions, AllOfVisitor as SchemaAllOfVisitor, Schema as SchemaElement, ItemsVisitor as SchemaItemsVisitor, SchemaOrJSONReferenceVisitor, PropertiesVisitor as SchemaPropertiesVisitor, SchemaVisitor, type SchemaVisitorOptions, SchemesVisitor$1 as SchemesVisitor, type VisitorOptions as SchemesVisitorOptions, Scopes as ScopesElement, ScopesVisitor, type ScopesVisitorOptions, SecurityDefinitions as SecurityDefinitionsElement, SecurityDefinitionsVisitor, type SecurityDefinitionsVisitorOptions, SecurityRequirement as SecurityRequirementElement, SecurityRequirementVisitor, type SecurityRequirementVisitorOptions, SecurityScheme as SecuritySchemeElement, SecuritySchemeVisitor, type SecuritySchemeVisitorOptions, SecurityVisitor$1 as SecurityVisitor, type SecurityVisitorOptions$1 as SecurityVisitorOptions, type SpecPath, SpecificationVisitor, type SpecificationVisitorOptions, SwaggerConsumes as SwaggerConsumesElement, Swagger as SwaggerElement, SwaggerProduces as SwaggerProducesElement, SwaggerSchemes as SwaggerSchemesElement, SwaggerSecurity as SwaggerSecurityElement, SwaggerTags as SwaggerTagsElement, SwaggerVersion as SwaggerVersionElement, SwaggerVisitor as SwaggerVersionVisitor, type SwaggerVisitorOptions as SwaggerVersionVisitorOptions, SwaggerVisitor$1 as SwaggerVisitor, type SwaggerVisitorOptions$1 as SwaggerVisitorOptions, Tag as TagElement, TagVisitor, type TagVisitorOptions, Visitor, type VisitorOptions, Xml as XmlElement, XmlVisitor, type XmlVisitorOptions, createRefractor, openApi2 as default, getNodeType, isContactElement, isDefinitionsElement, isExampleElement, isExternalDocumentationElement, isHeaderElement, isHeadersElement, isInfoElement, isItemsElement, isLicenseElement, isOperationElement, isParameterElement, isParametersDefinitionsElement, isPathItemElement, isPathsElement, isReferenceElement, isReferenceLikeElement, isResponseElement, isResponsesDefinitionsElement, isResponsesElement, isSchemaElement, isScopesElement, isSecurityDefinitionsElement, isSecurityRequirementElement, isSecuritySchemeElement, isSwaggerElement, isSwaggerExtension, isSwaggerVersionElement, isTagElement, isXmlElement, keyMap, mediaTypes, refract, plugin as refractorPluginReplaceEmptyElement, specification as specificationObj };
