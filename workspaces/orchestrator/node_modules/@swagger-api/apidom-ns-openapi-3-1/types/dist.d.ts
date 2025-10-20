import { MediaTypes, NamespacePluginOptions, ObjectElement, Meta, Attributes, StringElement, ArrayElement, Element, NumberElement, BooleanElement, ElementPredicate, isElement, isStringElement, isArrayElement, isObjectElement, isMemberElement, includesClasses, hasElementSourceMap, Namespace } from '@swagger-api/apidom-core';
export { isArrayElement, isBooleanElement, isElement, isLinkElement as isLinkPrimitiveElement, isMemberElement, isNullElement, isNumberElement, isObjectElement, isRefElement, isStringElement } from '@swagger-api/apidom-core';
import * as minim from 'minim';
import * as _swagger_api_apidom_ns_openapi_3_0 from '@swagger-api/apidom-ns-openapi-3-0';
import { CallbackElement, ComponentsElement, ContactElement, ExampleElement, ExternalDocumentationElement, XmlElement, DiscriminatorElement, HeaderElement, LicenseElement, InfoElement, LinkElement, OpenapiElement, PathsElement, RequestBodyElement, ReferenceElement, OperationElement, ParameterElement, PathItemElement, ResponseElement, ResponsesElement, SecurityRequirementElement, SecuritySchemeElement, ServerElement, ServerVariableElement, MediaTypeElement, isServersElement, FixedFieldsVisitorOptions, FallbackVisitorOptions, SpecPath, FixedFieldsVisitor, FallbackVisitor, InfoVisitorOptions, ContactVisitorOptions, LicenseVisitorOptions, LinkVisitorOptions, SpecificationVisitorOptions, SpecificationVisitor, ServerVisitorOptions, ServerVariableVisitorOptions, MediaTypeVisitorOptions, SecurityRequirementVisitorOptions, ComponentsVisitorOptions, TagElement, TagVisitorOptions, ReferenceVisitorOptions, ParameterVisitorOptions, HeaderVisitorOptions, MapVisitorOptions, MapVisitor, DiscriminatorVisitorOptions, XmlVisitorOptions, ComponentsSchemasElement, ExampleVisitorOptions, ExternalDocumentationVisitorOptions, EncodingElement, EncodingVisitorOptions, PathsVisitorOptions, RequestBodyVisitorOptions, CallbackVisitorOptions, ResponseVisitorOptions, ResponsesVisitorOptions, OperationVisitorOptions, PathItemVisitorOptions, SecuritySchemeVisitorOptions, OAuthFlowsElement, OAuthFlowsVisitorOptions, OAuthFlowElement, OAuthFlowVisitorOptions } from '@swagger-api/apidom-ns-openapi-3-0';
export { AlternatingVisitor, AlternatingVisitorOptions, CallbackVisitorOptions, ComponentsCallbacksElement, ComponentsCallbacksVisitor, ComponentsCallbacksVisitorOptions, ComponentsExamplesElement, ComponentsExamplesVisitor, ComponentsExamplesVisitorOptions, ComponentsHeadersElement, ComponentsHeadersVisitor, ComponentsHeadersVisitorOptions, ComponentsLinksElement, ComponentsLinksVisitor, ComponentsLinksVisitorOptions, ComponentsParametersElement, ComponentsParametersVisitor, ComponentsParametersVisitorOptions, ComponentsRequestBodiesElement, ComponentsRequestBodiesVisitor, ComponentsRequestBodiesVisitorOptions, ComponentsResponsesElement, ComponentsResponsesVisitor, ComponentsResponsesVisitorOptions, ComponentsSchemasElement, ComponentsSecuritySchemesElement, ComponentsSecuritySchemesVisitor, ComponentsSecuritySchemesVisitorOptions, ComponentsVisitorOptions, ContactVisitorOptions, ContentVisitor, ContentVisitorOptions, DiscriminatorMappingElement, DiscriminatorMappingVisitor, DiscriminatorMappingVisitorOptions, DiscriminatorVisitorOptions, EncodingHeadersElement, EncodingHeadersVisitor, EncodingHeadersVisitorOptions, EncodingVisitorOptions, ExampleExternalValueVisitor, ExampleExternalValueVisitorOptions, ExampleVisitorOptions, ExamplesVisitor, ExamplesVisitorOptions, ExternalDocumentationVisitorOptions, FallbackVisitor, FallbackVisitorOptions, FixedFieldsVisitor, FixedFieldsVisitorOptions, HeaderContentElement, HeaderContentVisitor, HeaderContentVisitorOptions, HeaderExamplesElement, HeaderExamplesVisitor, HeaderExamplesVisitorOptions, HeaderSchemaVisitor, HeaderSchemaVisitorOptions, HeaderVisitorOptions, InfoVersionVisitor, InfoVersionVisitorOptions, InfoVisitorOptions, LicenseVisitorOptions, LinkOperationIdVisitor, LinkOperationIdVisitorOptions, LinkOperationRefVisitor, LinkOperationRefVisitorOptions, LinkParametersElement, LinkParametersVisitor, LinkParametersVisitorOptions, LinkVisitorOptions, MapVisitor, MapVisitorOptions, MediaTypeEncodingElement, MediaTypeEncodingVisitor, MediaTypeEncodingVisitorOptions, MediaTypeExamplesElement, MediaTypeExamplesVisitor, MediaTypeExamplesVisitorOptions, MediaTypeSchemaVisitor, MediaTypeSchemaVisitorOptions, MediaTypeVisitorOptions, MixedFieldsVisitor, MixedFieldsVisitorOptions, OAuthFlowScopesElement, OAuthFlowScopesVisitor, OAuthFlowScopesVisitorOptions, OAuthFlowVisitorOptions, OAuthFlowsVisitorOptions, OpenapiVisitor, OpenapiVisitorOptions, OperationCallbacksElement, OperationCallbacksVisitor, OperationCallbacksVisitorOptions, OperationParametersElement, OperationParametersVisitor, OperationParametersVisitorOptions, OperationRequestBodyVisitor, OperationRequestBodyVisitorOptions, OperationSecurityElement, OperationSecurityVisitor, OperationSecurityVisitorOptions, OperationServersElement, OperationServersVisitor, OperationServersVisitorOptions, OperationTagsElement, OperationTagsVisitor, OperationTagsVisitorOptions, OperationVisitorOptions, ParameterContentElement, ParameterContentVisitor, ParameterContentVisitorOptions, ParameterExampleVisitor, ParameterExamplesElement, ParameterExamplesVisitorOptions, ParameterSchemaVisitor, ParameterSchemaVisitorOptions, ParameterVisitorOptions, ParametersVisitor, ParametersVisitorOptions, PathItem$RefVisitor, PathItem$RefVisitorOptions, PathItemParametersElement, PathItemParametersVisitor, PathItemParametersVisitorOptions, PathItemServersElement, PathItemServersVisitor, PathItemServersVisitorOptions, PathItemVisitorOptions, PathsVisitorOptions, PatternedFieldsVisitor, PatternedFieldsVisitorOptions, Reference$RefVisitor, Reference$RefVisitorOptions, ReferenceVisitorOptions, RequestBodyContentElement, RequestBodyContentVisitor, RequestBodyContentVisitorOptions, RequestBodyVisitorOptions, ResponseContentElement, ResponseContentVisitor, ResponseContentVisitorOptions, ResponseHeadersElement, ResponseHeadersVisitor, ResponseHeadersVisitorOptions, ResponseLinksElement, ResponseLinksVisitor, ResponseLinksVisitorOptions, ResponseVisitorOptions, ResponsesDefaultVisitor, ResponsesDefaultVisitorOptions, ResponsesVisitorOptions, FallbackVisitorOptions as Schema$refVisitorOptions, FallbackVisitorOptions as Schema$vocabularyVisitorOptions, FallbackVisitorOptions as SchemaDependentRequiredVisitorOptions, FallbackVisitorOptions as SchemaEnumVisitorOptions, FallbackVisitorOptions as SchemaExamplesVisitorOptions, FallbackVisitorOptions as SchemaRequiredVisitorOptions, FallbackVisitorOptions as SchemaTypeVisitorOptions, SecurityElement, SecurityRequirementVisitorOptions, SecuritySchemeVisitorOptions, SecurityVisitor, SecurityVisitorOptions, ServerVariableUrlVisitor, ServerVariableUrlVisitorOptions, ServerVariableVariablesVisitor, ServerVariableVariablesVisitorOptions, ServerVariableVisitorOptions, ServerVariablesElement, ServerVisitorOptions, ServersElement, ServersVisitor, ServersVisitorOptions, SpecPath, SpecificationExtensionVisitor, SpecificationExtensionVisitorOptions, SpecificationVisitor, SpecificationVisitorOptions, TagVisitorOptions, TagsElement, TagsVisitor, TagsVisitorOptions, Visitor, VisitorOptions, XmlVisitorOptions, isOpenApiExtension, isReferenceLikeElement, isServerLikeElement, isServersElement } from '@swagger-api/apidom-ns-openapi-3-0';
import * as ts_mixer_dist_types_types from 'ts-mixer/dist/types/types';

type Format = 'generic' | 'json' | 'yaml';
declare class OpenAPIMediaTypes extends MediaTypes<string> {
    filterByFormat(format?: Format): string[];
    findBy(version?: string, format?: Format): string;
    latest(format?: Format): string;
}
declare const mediaTypes: OpenAPIMediaTypes;

declare const openApi3_1: {
    namespace: (options: NamespacePluginOptions) => minim.Namespace;
};

declare class Callback extends CallbackElement {
}

declare class Components extends ComponentsElement {
    get pathItems(): ObjectElement | undefined;
    set pathItems(pathItems: ObjectElement | undefined);
}

declare class Contact extends ContactElement {
}

declare class Example extends ExampleElement {
}

declare class ExternalDocumentation extends ExternalDocumentationElement {
}

declare class Xml extends XmlElement {
}

declare class Discriminator extends DiscriminatorElement {
}

declare class Schema extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    /**
     * Core vocabulary
     *
     * URI: https://json-schema.org/draft/2020-12/vocab/core
     */
    get $schema(): StringElement | undefined;
    set $schema($schema: StringElement | undefined);
    get $vocabulary(): ObjectElement | undefined;
    set $vocabulary($vocabulary: ObjectElement | undefined);
    get $id(): StringElement | undefined;
    set $id($id: StringElement | undefined);
    get $anchor(): StringElement | undefined;
    set $anchor($anchor: StringElement | undefined);
    get $dynamicAnchor(): StringElement | undefined;
    set $dynamicAnchor($dynamicAnchor: StringElement | undefined);
    get $dynamicRef(): StringElement | undefined;
    set $dynamicRef($dynamicRef: StringElement | undefined);
    get $ref(): StringElement | undefined;
    set $ref($ref: StringElement | undefined);
    get $defs(): ObjectElement | undefined;
    set $defs($defs: ObjectElement | undefined);
    get $comment(): StringElement | undefined;
    set $comment($comment: StringElement | undefined);
    /**
     * Applicator vocabulary
     *
     * URI: https://json-schema.org/draft/2020-12/vocab/applicator
     */
    get allOf(): ArrayElement | undefined;
    set allOf(allOf: ArrayElement | undefined);
    get anyOf(): ArrayElement | undefined;
    set anyOf(anyOf: ArrayElement | undefined);
    get oneOf(): ArrayElement | undefined;
    set oneOf(oneOf: ArrayElement | undefined);
    get not(): Schema | undefined;
    set not(not: Schema | undefined);
    get if(): Schema | undefined;
    set if(ifSchema: Schema | undefined);
    get then(): Schema | undefined;
    set then(thenSchema: Schema | undefined);
    get else(): Schema | undefined;
    set else(elseSchema: Schema | undefined);
    get dependentSchemas(): ObjectElement | undefined;
    set dependentSchemas(dependentSchemas: ObjectElement | undefined);
    get prefixItems(): ArrayElement | undefined;
    set prefixItems(prefixItems: ArrayElement | undefined);
    get items(): Schema | undefined;
    set items(items: Schema | undefined);
    get containsProp(): Schema | undefined;
    set containsProp(containsProp: Schema | undefined);
    get properties(): ObjectElement | undefined;
    set properties(properties: ObjectElement | undefined);
    get patternProperties(): ObjectElement | undefined;
    set patternProperties(patternProperties: ObjectElement | undefined);
    get additionalProperties(): Schema | undefined;
    set additionalProperties(additionalProperties: Schema | undefined);
    get propertyNames(): Schema | undefined;
    set propertyNames(propertyNames: Schema | undefined);
    /**
     * Unevaluated Locations vocabulary
     *
     * URI: https://json-schema.org/draft/2020-12/vocab/unevaluated
     */
    get unevaluatedItems(): Schema | undefined;
    set unevaluatedItems(unevaluatedItems: Schema | undefined);
    get unevaluatedProperties(): Schema | undefined;
    set unevaluatedProperties(unevaluatedProperties: Schema | undefined);
    /**
     * Validation vocabulary
     *
     * URI: https://json-schema.org/draft/2020-12/vocab/validation
     */
    /**
     *  Validation Keywords for Any Instance Type
     *
     *  URI: https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.1
     */
    get type(): ArrayElement | StringElement | undefined;
    set type(type: ArrayElement | StringElement | undefined);
    get enum(): ArrayElement | undefined;
    set enum(enumVal: ArrayElement | undefined);
    get const(): Element | undefined;
    set const(constVal: Element | undefined);
    /**
     * Validation Keywords for Numeric Instances (number and integer)
     *
     * URI: https://json-schema.org/draft/2020-12/json-schema-validation.html#numeric
     */
    get multipleOf(): NumberElement | undefined;
    set multipleOf(multipleOf: NumberElement | undefined);
    get maximum(): NumberElement | undefined;
    set maximum(maximum: NumberElement | undefined);
    get exclusiveMaximum(): NumberElement | undefined;
    set exclusiveMaximum(exclusiveMaximum: NumberElement | undefined);
    get minimum(): NumberElement | undefined;
    set minimum(minimum: NumberElement | undefined);
    get exclusiveMinimum(): NumberElement | undefined;
    set exclusiveMinimum(exclusiveMinimum: NumberElement | undefined);
    /**
     * Validation Keywords for Strings
     *
     * URI: https://json-schema.org/draft/2020-12/json-schema-validation.html#string
     */
    get maxLength(): NumberElement | undefined;
    set maxLength(maxLength: NumberElement | undefined);
    get minLength(): NumberElement | undefined;
    set minLength(minLength: NumberElement | undefined);
    get pattern(): StringElement | undefined;
    set pattern(pattern: StringElement | undefined);
    /**
     * Validation Keywords for Arrays
     *
     * URI: https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.4
     */
    get maxItems(): NumberElement | undefined;
    set maxItems(maxItems: NumberElement | undefined);
    get minItems(): NumberElement | undefined;
    set minItems(minItems: NumberElement | undefined);
    get uniqueItems(): BooleanElement | undefined;
    set uniqueItems(uniqueItems: BooleanElement | undefined);
    get maxContains(): NumberElement | undefined;
    set maxContains(maxContains: NumberElement | undefined);
    get minContains(): NumberElement | undefined;
    set minContains(minContains: NumberElement | undefined);
    /**
     * Validation Keywords for Objects
     *
     * URI: https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.5
     */
    get maxProperties(): NumberElement | undefined;
    set maxProperties(maxProperties: NumberElement | undefined);
    get minProperties(): NumberElement | undefined;
    set minProperties(minProperties: NumberElement | undefined);
    get required(): ArrayElement | undefined;
    set required(required: ArrayElement | undefined);
    get dependentRequired(): ObjectElement | undefined;
    set dependentRequired(dependentRequired: ObjectElement | undefined);
    /**
     * Vocabulary for Basic Meta-Data Annotations
     *
     * URI: https://json-schema.org/draft/2020-12/vocab/meta-data
     */
    get title(): StringElement | undefined;
    set title(title: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get default(): Element | undefined;
    set default(defaultVal: Element | undefined);
    get deprecated(): BooleanElement | undefined;
    set deprecated(deprecated: BooleanElement | undefined);
    get readOnly(): BooleanElement | undefined;
    set readOnly(readOnly: BooleanElement | undefined);
    get writeOnly(): BooleanElement | undefined;
    set writeOnly(writeOnly: BooleanElement | undefined);
    get examples(): ArrayElement | undefined;
    set examples(examples: ArrayElement | undefined);
    /**
     * Vocabularies for Semantic Content With "format"
     *
     * URI: https://json-schema.org/draft/2020-12/vocab/format-annotation
     */
    get format(): StringElement | undefined;
    set format(format: StringElement | undefined);
    /**
     * Vocabulary for the Contents of String-Encoded Data
     *
     * URI: https://json-schema.org/draft/2020-12/vocab/content
     */
    get contentEncoding(): StringElement | undefined;
    set contentEncoding(contentEncoding: StringElement | undefined);
    get contentMediaType(): StringElement | undefined;
    set contentMediaType(contentMediaType: StringElement | undefined);
    get contentSchema(): Schema | undefined;
    set contentSchema(contentSchema: Schema | undefined);
    /**
     * OAS base vocabulary
     *
     * URI: https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.1.0.md#baseVocabulary
     */
    get discriminator(): Discriminator | undefined;
    set discriminator(discriminator: Discriminator | undefined);
    get xml(): Xml | undefined;
    set xml(xml: Xml | undefined);
    get externalDocs(): ExternalDocumentation | undefined;
    set externalDocs(externalDocs: ExternalDocumentation | undefined);
    /**
     * @deprecated The example property has been deprecated in favor of the JSON Schema examples keyword. Use of example is discouraged, and later versions of this specification may remove it.
     */
    get example(): Element | undefined;
    /**
     * @deprecated The example property has been deprecated in favor of the JSON Schema examples keyword. Use of example is discouraged, and later versions of this specification may remove it.
     */
    set example(example: Element | undefined);
}

declare class Header extends HeaderElement {
    get schema(): Schema | undefined;
    set schema(schema: Schema | undefined);
}

declare class License extends LicenseElement {
    get identifier(): StringElement | undefined;
    set identifier(name: StringElement | undefined);
}

declare class Info extends InfoElement {
    get license(): License | undefined;
    set license(licenseElement: License | undefined);
    get summary(): StringElement | undefined;
    set summary(summary: StringElement | undefined);
}

declare class JsonSchemaDialect extends StringElement {
    static default: JsonSchemaDialect;
    constructor(content?: string, meta?: Meta, attributes?: Attributes);
}

declare class Link extends LinkElement {
}

declare class Openapi extends OpenapiElement {
}

declare class Paths extends PathsElement {
}

declare class OpenApi3_1 extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get openapi(): Openapi | undefined;
    set openapi(openapi: Openapi | undefined);
    get info(): Info | undefined;
    set info(info: Info | undefined);
    get jsonSchemaDialect(): StringElement | undefined;
    set jsonSchemaDialect(jsonSchemaDialect: StringElement | undefined);
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
    get webhooks(): ObjectElement | undefined;
    set webhooks(webhooks: ObjectElement | undefined);
}

declare class RequestBody extends RequestBodyElement {
}

declare class Reference extends ReferenceElement {
}

declare class Operation extends OperationElement {
    get requestBody(): RequestBody | Reference | undefined;
    set requestBody(requestBody: RequestBody | Reference | undefined);
}

declare class Parameter extends ParameterElement {
    get schema(): Schema | undefined;
    set schema(schema: Schema | undefined);
}

declare class PathItem extends PathItemElement {
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
}

declare class Response extends ResponseElement {
}

declare class Responses extends ResponsesElement {
}

declare class SecurityRequirement extends SecurityRequirementElement {
}

declare class SecurityScheme extends SecuritySchemeElement {
}

declare class Server extends ServerElement {
}

declare class ServerVariable extends ServerVariableElement {
}

declare class MediaType extends MediaTypeElement {
    get schema(): Schema | undefined;
    set schema(schema: Schema | undefined);
}

declare const isCallbackElement: ElementPredicate<Callback>;
declare const isComponentsElement: ElementPredicate<Components>;
declare const isContactElement: ElementPredicate<Contact>;
declare const isExampleElement: ElementPredicate<Example>;
declare const isExternalDocumentationElement: ElementPredicate<ExternalDocumentation>;
declare const isHeaderElement: ElementPredicate<Header>;
declare const isInfoElement: ElementPredicate<Info>;
declare const isJsonSchemaDialectElement: ElementPredicate<JsonSchemaDialect>;
declare const isLicenseElement: ElementPredicate<License>;
declare const isLinkElement: ElementPredicate<Link>;
declare const isOpenapiElement: ElementPredicate<Openapi>;
declare const isOpenApi3_1Element: ElementPredicate<OpenApi3_1>;
declare const isOperationElement: ElementPredicate<Operation>;
declare const isParameterElement: ElementPredicate<Parameter>;
declare const isPathItemElement: ElementPredicate<PathItem>;
/**
 * @deprecated
 * Determining whether a PathItemElement is external or internal is not possible by just looking
 * at value of the $ref fixed field. The value of the $ref field needs to be resolved in runtime
 * using the referring document as the Base URI.
 */
declare const isPathItemElementExternal: ElementPredicate<PathItem>;
declare const isPathsElement: ElementPredicate<Paths>;
declare const isReferenceElement: ElementPredicate<Reference>;
/**
 * @deprecated
 * Determining whether a ReferenceElement is external or internal is not possible by just looking
 * at value of the $ref fixed field. The value of the $ref field needs to be resolved in runtime
 * using the referring document as the Base URI.
 */
declare const isReferenceElementExternal: ElementPredicate<Reference>;
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

declare const openApi3_1Predicates_isBooleanJsonSchemaElement: typeof isBooleanJsonSchemaElement;
declare const openApi3_1Predicates_isCallbackElement: typeof isCallbackElement;
declare const openApi3_1Predicates_isComponentsElement: typeof isComponentsElement;
declare const openApi3_1Predicates_isContactElement: typeof isContactElement;
declare const openApi3_1Predicates_isExampleElement: typeof isExampleElement;
declare const openApi3_1Predicates_isExternalDocumentationElement: typeof isExternalDocumentationElement;
declare const openApi3_1Predicates_isHeaderElement: typeof isHeaderElement;
declare const openApi3_1Predicates_isInfoElement: typeof isInfoElement;
declare const openApi3_1Predicates_isJsonSchemaDialectElement: typeof isJsonSchemaDialectElement;
declare const openApi3_1Predicates_isLicenseElement: typeof isLicenseElement;
declare const openApi3_1Predicates_isLinkElement: typeof isLinkElement;
declare const openApi3_1Predicates_isMediaTypeElement: typeof isMediaTypeElement;
declare const openApi3_1Predicates_isOpenApi3_1Element: typeof isOpenApi3_1Element;
declare const openApi3_1Predicates_isOpenapiElement: typeof isOpenapiElement;
declare const openApi3_1Predicates_isOperationElement: typeof isOperationElement;
declare const openApi3_1Predicates_isParameterElement: typeof isParameterElement;
declare const openApi3_1Predicates_isPathItemElement: typeof isPathItemElement;
declare const openApi3_1Predicates_isPathItemElementExternal: typeof isPathItemElementExternal;
declare const openApi3_1Predicates_isPathsElement: typeof isPathsElement;
declare const openApi3_1Predicates_isReferenceElement: typeof isReferenceElement;
declare const openApi3_1Predicates_isReferenceElementExternal: typeof isReferenceElementExternal;
declare const openApi3_1Predicates_isRequestBodyElement: typeof isRequestBodyElement;
declare const openApi3_1Predicates_isResponseElement: typeof isResponseElement;
declare const openApi3_1Predicates_isResponsesElement: typeof isResponsesElement;
declare const openApi3_1Predicates_isSchemaElement: typeof isSchemaElement;
declare const openApi3_1Predicates_isSecurityRequirementElement: typeof isSecurityRequirementElement;
declare const openApi3_1Predicates_isSecuritySchemeElement: typeof isSecuritySchemeElement;
declare const openApi3_1Predicates_isServerElement: typeof isServerElement;
declare const openApi3_1Predicates_isServerVariableElement: typeof isServerVariableElement;
declare namespace openApi3_1Predicates {
  export { openApi3_1Predicates_isBooleanJsonSchemaElement as isBooleanJsonSchemaElement, openApi3_1Predicates_isCallbackElement as isCallbackElement, openApi3_1Predicates_isComponentsElement as isComponentsElement, openApi3_1Predicates_isContactElement as isContactElement, openApi3_1Predicates_isExampleElement as isExampleElement, openApi3_1Predicates_isExternalDocumentationElement as isExternalDocumentationElement, openApi3_1Predicates_isHeaderElement as isHeaderElement, openApi3_1Predicates_isInfoElement as isInfoElement, openApi3_1Predicates_isJsonSchemaDialectElement as isJsonSchemaDialectElement, openApi3_1Predicates_isLicenseElement as isLicenseElement, openApi3_1Predicates_isLinkElement as isLinkElement, openApi3_1Predicates_isMediaTypeElement as isMediaTypeElement, openApi3_1Predicates_isOpenApi3_1Element as isOpenApi3_1Element, openApi3_1Predicates_isOpenapiElement as isOpenapiElement, openApi3_1Predicates_isOperationElement as isOperationElement, openApi3_1Predicates_isParameterElement as isParameterElement, openApi3_1Predicates_isPathItemElement as isPathItemElement, openApi3_1Predicates_isPathItemElementExternal as isPathItemElementExternal, openApi3_1Predicates_isPathsElement as isPathsElement, openApi3_1Predicates_isReferenceElement as isReferenceElement, openApi3_1Predicates_isReferenceElementExternal as isReferenceElementExternal, openApi3_1Predicates_isRequestBodyElement as isRequestBodyElement, openApi3_1Predicates_isResponseElement as isResponseElement, openApi3_1Predicates_isResponsesElement as isResponsesElement, openApi3_1Predicates_isSchemaElement as isSchemaElement, openApi3_1Predicates_isSecurityRequirementElement as isSecurityRequirementElement, openApi3_1Predicates_isSecuritySchemeElement as isSecuritySchemeElement, openApi3_1Predicates_isServerElement as isServerElement, openApi3_1Predicates_isServerVariableElement as isServerVariableElement };
}

type Predicates = typeof openApi3_1Predicates & {
    isElement: typeof isElement;
    isStringElement: typeof isStringElement;
    isArrayElement: typeof isArrayElement;
    isObjectElement: typeof isObjectElement;
    isMemberElement: typeof isMemberElement;
    isServersElement: typeof isServersElement;
    includesClasses: typeof includesClasses;
    hasElementSourceMap: typeof hasElementSourceMap;
};
interface Toolbox {
    predicates: Predicates;
    ancestorLineageToJSONPointer: typeof ancestorLineageToJSONPointer;
    namespace: Namespace;
}
/**
 * Translates visitor ancestor lineage to a JSON Pointer tokens.
 * Ancestor lineage is constructed of following visitor method arguments:
 *
 *  - ancestors
 *  - parent
 *  - element
 */
declare const ancestorLineageToJSONPointer: <T extends (Element | Element[])[]>(elementPath: T) => string;
declare const createToolbox: () => Toolbox;

declare const plugin$6: () => ({ predicates }: {
    predicates: Predicates;
}) => {
    visitor: {
        StringElement(element: StringElement, key: any, parent: any, path: any, ancestors: any[]): any;
    };
};

/**
 * Inheritance of Parameter Objects.
 *
 * OpenAPI 3.1 specification excerpt that defines the inheritance behavior:
 *
 * A list of parameters that are applicable for this operation. If a parameter is already defined at the Path Item,
 * the new definition will override it but can never remove it. The list MUST NOT include duplicated parameters.
 * A unique parameter is defined by a combination of a name and location.
 *
 * NOTE: this plugin is idempotent
 */
interface PluginOptions$5 {
    storageField?: string;
}
declare const plugin$5: ({ storageField }?: PluginOptions$5) => (toolbox: Toolbox) => {
    visitor: {
        OpenApi3_1Element: {
            enter(element: OpenApi3_1): void;
            leave(): void;
        };
        PathItemElement: {
            enter(pathItemElement: PathItem, key: string | number, parent: Element | undefined, path: (string | number)[], ancestors: [Element | Element[]]): void;
            leave(): void;
        };
        OperationElement: {
            leave(operationElement: Operation, key: string | number, parent: Element | undefined, path: (string | number)[], ancestors: [Element | Element[]]): void;
        };
    };
};

/**
 * Override of Security Requirement Objects.
 *
 * OpenAPI 3.1 specification excerpt that defines the override behavior:
 *
 * Operation.security definition overrides any declared top-level security.
 * To remove a top-level security declaration, an empty array can be used.
 * When a list of Security Requirement Objects is defined on the OpenAPI Object or Operation Object,
 * only one of the Security Requirement Objects in the list needs to be satisfied to authorize the request.
 *
 * NOTE: this plugin is idempotent
 */
interface PluginOptions$4 {
    storageField?: string;
}
declare const plugin$4: ({ storageField }?: PluginOptions$4) => (toolbox: Toolbox) => {
    visitor: {
        OpenApi3_1Element: {
            enter(openapiElement: OpenApi3_1): void;
            leave(): void;
        };
        OperationElement: {
            leave(operationElement: Operation, key: string | number, parent: Element | undefined, path: (string | number)[], ancestors: [Element | Element[]]): void;
        };
    };
};

/**
 * Override of Server Objects.
 *
 * List of Server Objects can be defined in OpenAPI 3.1 on multiple levels:
 *
 *  - OpenAPI.servers
 *  - PathItem.servers
 *  - Operation.servers
 *
 * If an alternative server object is specified at the Path Item Object level, it will override OpenAPI.servers.
 * If an alternative server object is specified at the Operation Object level, it will override PathItem.servers and OpenAPI.servers respectively.
 */
interface PluginOptions$3 {
    storageField?: string;
}
declare const plugin$3: ({ storageField }?: PluginOptions$3) => (toolbox: Toolbox) => {
    visitor: {
        OpenApi3_1Element: {
            enter(openapiElement: OpenApi3_1): void;
            leave(): void;
        };
        PathItemElement(pathItemElement: PathItem, key: string | number, parent: Element | undefined, path: (string | number)[], ancestors: [Element | Element[]]): void;
        OperationElement(operationElement: Operation, key: string | number, parent: Element | undefined, path: (string | number)[], ancestors: [Element | Element[]]): void;
    };
};

/**
 * Normalization of Operation.operationId field.
 *
 * This normalization is not guided by OpenAPI 3.1 specification.
 *
 * Existing Operation.operationId fields are normalized into snake case form.
 *
 * Operation Objects, that do not define operationId field, are left untouched.
 *
 * Original operationId is stored in meta and as new `__originalOperationId` field.
 *
 * This plugin also guarantees the uniqueness of all defined Operation.operationId fields,
 * and make sure Link.operationId fields are pointing to correct and normalized Operation.operationId fields.
 *
 * NOTE: this plugin is idempotent
 */
interface PluginOptions$2 {
    storageField?: string;
    operationIdNormalizer?: (operationId: string, path: string, method: string) => string;
}
declare const plugin$2: ({ storageField, operationIdNormalizer, }?: PluginOptions$2) => (toolbox: Toolbox) => {
    visitor: {
        OpenApi3_1Element: {
            enter(element: OpenApi3_1): void;
            leave(): void;
        };
        PathItemElement: {
            enter(pathItemElement: PathItem): void;
            leave(): void;
        };
        OperationElement: {
            enter(operationElement: Operation, key: string | number, parent: Element | undefined, path: (string | number)[], ancestors: [Element | Element[]]): void;
        };
        LinkElement: {
            leave(linkElement: Link): void;
        };
    };
};

/**
 * Override of Schema.example and Schema.examples field inside the Parameter Objects.
 *
 * Parameter Object has two fixed fields:
 *  - `example` of type `Any`
 *  - `examples` of type `Map[string, Example Object | Reference Object]`
 *
 * OpenAPI 3.1 specification excerpt that defines the override behavior:
 *
 * The example value SHALL override the example provided by the schema.
 * Furthermore, if referencing a schema that contains an example, the examples value SHALL override the example provided by the schema.
 *
 * NOTE: this plugin is idempotent
 */
interface PluginOptions$1 {
    storageField?: string;
}
declare const plugin$1: ({ storageField }?: PluginOptions$1) => (toolbox: Toolbox) => {
    visitor: {
        OpenApi3_1Element: {
            enter(element: OpenApi3_1): void;
            leave(): void;
        };
        ParameterElement: {
            leave(parameterElement: Parameter, key: string | number, parent: Element | undefined, path: (string | number)[], ancestors: [Element | Element[]]): void;
        };
    };
};

/**
 * Override of Schema.example and Schema.examples field inside the Header Objects.
 *
 * Header Object has two fixed fields:
 *  - `example` of type `Any`
 *  - `examples` of type `Map[string, Example Object | Reference Object]`
 *
 * OpenAPI 3.1 specification excerpt that defines the override behavior:
 *
 * The example value SHALL override the example provided by the schema.
 * Furthermore, if referencing a schema that contains an example, the examples value SHALL override the example provided by the schema.
 *
 * NOTE: this plugin is idempotent
 */
interface PluginOptions {
    storageField?: string;
}
declare const plugin: ({ storageField }?: PluginOptions) => (toolbox: Toolbox) => {
    visitor: {
        OpenApi3_1Element: {
            enter(element: OpenApi3_1): void;
            leave(): void;
        };
        HeaderElement: {
            leave(headerElement: Header, key: string | number, parent: Element | undefined, path: (string | number)[], ancestors: [Element | Element[]]): void;
        };
    };
};

interface OpenApi3_1VisitorOptions extends FixedFieldsVisitorOptions, FallbackVisitorOptions {
}
declare const OpenApi3_1Visitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class OpenApi3_1Visitor extends OpenApi3_1Visitor_base {
    readonly element: OpenApi3_1;
    protected readonly specPath: SpecPath<['document', 'objects', 'OpenApi']>;
    protected readonly canSupportSpecificationExtensions: true;
    protected readonly openApiSemanticElement: OpenApi3_1;
    constructor(options: OpenApi3_1VisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare const BaseInfoVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.InfoVisitor;

declare class InfoVisitor extends BaseInfoVisitor {
    readonly element: Info;
    constructor(options: InfoVisitorOptions);
}

declare const BaseContactVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.ContactVisitor;

declare class ContactVisitor extends BaseContactVisitor {
    readonly element: Contact;
    constructor(options: ContactVisitorOptions);
}

declare const BaseLicenseVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.LicenseVisitor;

declare class LicenseVisitor extends BaseLicenseVisitor {
    readonly element: License;
    constructor(options: LicenseVisitorOptions);
}

declare const BaseLinkVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.LinkVisitor;

declare class LinkVisitor extends BaseLinkVisitor {
    readonly element: Link;
    constructor(options: LinkVisitorOptions);
}

interface JsonSchemaDialectVisitorOptions extends SpecificationVisitorOptions, FallbackVisitorOptions {
}
declare const JsonSchemaDialectVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class JsonSchemaDialectVisitor extends JsonSchemaDialectVisitor_base {
    element: JsonSchemaDialect;
    StringElement(stringElement: StringElement): {};
}

declare const BaseServerVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.ServerVisitor;

declare class ServerVisitor extends BaseServerVisitor {
    readonly element: Server;
    constructor(options: ServerVisitorOptions);
}

declare const BaseServerVariableVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.ServerVariableVisitor;

declare class ServerVariableVisitor extends BaseServerVariableVisitor {
    readonly element: ServerVariable;
    constructor(options: ServerVariableVisitorOptions);
}

declare const BaseMediaTypeVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.MediaTypeVisitor;

declare class MediaTypeVisitor extends BaseMediaTypeVisitor {
    readonly element: MediaType;
    constructor(options: MediaTypeVisitorOptions);
}

declare const BaseSecurityRequirementVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.SecurityRequirementVisitor;

declare class SecurityRequirementVisitor extends BaseSecurityRequirementVisitor {
    readonly element: SecurityRequirement;
    constructor(options: SecurityRequirementVisitorOptions);
}

declare const BaseComponentsVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.ComponentsVisitor;

declare class ComponentsVisitor extends BaseComponentsVisitor {
    readonly element: Components;
    constructor(options: ComponentsVisitorOptions);
}

declare class Tag extends TagElement {
}

declare const BaseTagVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.TagVisitor;

declare class TagVisitor extends BaseTagVisitor {
    readonly element: Tag;
    constructor(options: TagVisitorOptions);
}

declare const BaseReferenceVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.ReferenceVisitor;

declare class ReferenceVisitor extends BaseReferenceVisitor {
    readonly element: Reference;
    constructor(options: ReferenceVisitorOptions);
}

declare const BaseParameterVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.ParameterVisitor;

declare class ParameterVisitor extends BaseParameterVisitor {
    readonly element: Parameter;
    constructor(options: ParameterVisitorOptions);
}

declare const BaseHeaderVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.HeaderVisitor;

declare class HeaderVisitor extends BaseHeaderVisitor {
    readonly element: Header;
    constructor(options: HeaderVisitorOptions);
}

interface ParentSchemaAwareVisitorOptions {
    readonly parent: Element;
}
declare class ParentSchemaAwareVisitor {
    parent: Element;
    constructor({ parent }: ParentSchemaAwareVisitorOptions);
}

interface SchemaVisitorOptions extends FixedFieldsVisitorOptions, ParentSchemaAwareVisitorOptions, FallbackVisitorOptions {
}
declare const SchemaVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & ParentSchemaAwareVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof ParentSchemaAwareVisitor & typeof FallbackVisitor>;
declare class SchemaVisitor extends SchemaVisitor_base {
    readonly element: Schema;
    protected readonly jsonSchemaDefaultDialect: JsonSchemaDialect;
    constructor(options: SchemaVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
    BooleanElement(booleanElement: BooleanElement): {};
    /**
     * This function depends on some external context, so we need to make sure this function
     * works even when no context is provided like when directly refracting generic Object Element
     * into Schema Element: SchemaElement.refract(new ObjectElement({ type: 'object' });
     */
    getJsonSchemaDialect(): JsonSchemaDialect;
    handle$schema(objectElement: ObjectElement): void;
    handle$id(objectElement: ObjectElement): void;
}

declare class $vocabularyVisitor extends FallbackVisitor {
    readonly element: ObjectElement;
    ObjectElement(objectElement: ObjectElement): {};
}

declare class $refVisitor extends FallbackVisitor {
    readonly element: StringElement;
    StringElement(stringElement: StringElement): {};
}

interface $defsVisitorOptions extends MapVisitorOptions, ParentSchemaAwareVisitorOptions, FallbackVisitorOptions {
}
declare const $defsVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & ParentSchemaAwareVisitor & FallbackVisitor, typeof MapVisitor & typeof ParentSchemaAwareVisitor & typeof FallbackVisitor>;
declare class $defsVisitor extends $defsVisitor_base {
    readonly element: ObjectElement;
    protected readonly specPath: SpecPath<['document', 'objects', 'Schema']>;
    constructor(options: $defsVisitorOptions);
}

interface AllOfVisitorOptions extends SpecificationVisitorOptions, ParentSchemaAwareVisitorOptions, FallbackVisitorOptions {
}
declare const AllOfVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & ParentSchemaAwareVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof ParentSchemaAwareVisitor & typeof FallbackVisitor>;
declare class AllOfVisitor extends AllOfVisitor_base {
    readonly element: ArrayElement;
    constructor(options: AllOfVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

interface AnyOfVisitorOptions extends SpecificationVisitorOptions, ParentSchemaAwareVisitorOptions, FallbackVisitorOptions {
}
declare const AnyOfVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & ParentSchemaAwareVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof ParentSchemaAwareVisitor & typeof FallbackVisitor>;
declare class AnyOfVisitor extends AnyOfVisitor_base {
    readonly element: ArrayElement;
    constructor(options: AnyOfVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

interface OneOfVisitorOptions extends SpecificationVisitorOptions, ParentSchemaAwareVisitorOptions, FallbackVisitorOptions {
}
declare const OneOfVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & ParentSchemaAwareVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof ParentSchemaAwareVisitor & typeof FallbackVisitor>;
declare class OneOfVisitor extends OneOfVisitor_base {
    readonly element: ArrayElement;
    constructor(options: OneOfVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

interface DependentSchemasVisitorOptions extends MapVisitorOptions, ParentSchemaAwareVisitorOptions, FallbackVisitorOptions {
}
declare const DependentSchemasVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & ParentSchemaAwareVisitor & FallbackVisitor, typeof MapVisitor & typeof ParentSchemaAwareVisitor & typeof FallbackVisitor>;
declare class DependentSchemasVisitor extends DependentSchemasVisitor_base {
    readonly element: ObjectElement;
    protected readonly specPath: SpecPath<['document', 'objects', 'Schema']>;
    constructor(options: DependentSchemasVisitorOptions);
}

interface PrefixItemsVisitorOptions extends SpecificationVisitorOptions, ParentSchemaAwareVisitorOptions, FallbackVisitorOptions {
}
declare const PrefixItemsVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & ParentSchemaAwareVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof ParentSchemaAwareVisitor & typeof FallbackVisitor>;
declare class PrefixItemsVisitor extends PrefixItemsVisitor_base {
    readonly element: ArrayElement;
    constructor(options: PrefixItemsVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

interface PropertiesVisitorOptions extends MapVisitorOptions, ParentSchemaAwareVisitorOptions, FallbackVisitorOptions {
}
declare const PropertiesVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & ParentSchemaAwareVisitor & FallbackVisitor, typeof MapVisitor & typeof ParentSchemaAwareVisitor & typeof FallbackVisitor>;
declare class PropertiesVisitor extends PropertiesVisitor_base {
    readonly element: ObjectElement;
    protected readonly specPath: SpecPath<['document', 'objects', 'Schema']>;
    constructor(options: PropertiesVisitorOptions);
}

interface PatternPropertiesVisitorOptions extends MapVisitorOptions, ParentSchemaAwareVisitorOptions, FallbackVisitorOptions {
}
declare const PatternPropertiesVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & ParentSchemaAwareVisitor & FallbackVisitor, typeof MapVisitor & typeof ParentSchemaAwareVisitor & typeof FallbackVisitor>;
declare class PatternPropertiesVisitor extends PatternPropertiesVisitor_base {
    readonly element: ObjectElement;
    protected readonly specPath: SpecPath<['document', 'objects', 'Schema']>;
    constructor(options: PatternPropertiesVisitorOptions);
}

declare class TypeVisitor extends FallbackVisitor {
    readonly element: StringElement | ArrayElement;
    StringElement(stringElement: StringElement): {};
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class EnumVisitor extends FallbackVisitor {
    readonly element: ArrayElement;
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class DependentRequiredVisitor extends FallbackVisitor {
    readonly element: ObjectElement;
    ObjectElement(objectElement: ObjectElement): {};
}

declare class ExamplesVisitor extends FallbackVisitor {
    readonly element: ArrayElement;
    ArrayElement(arrayElement: ArrayElement): {};
}

declare const BaseDiscriminatorVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.DiscriminatorVisitor;

declare class DiscriminatorVisitor extends BaseDiscriminatorVisitor {
    readonly element: Discriminator;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: DiscriminatorVisitorOptions);
}

declare const BaseXMLVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.XmlVisitor;

declare class XmlVisitor extends BaseXMLVisitor {
    readonly element: Xml;
    constructor(options: XmlVisitorOptions);
}

interface SchemasVisitorOptions extends MapVisitorOptions, FallbackVisitorOptions {
}
declare const SchemasVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class SchemasVisitor extends SchemasVisitor_base {
    readonly element: ComponentsSchemasElement;
    protected readonly specPath: SpecPath<['document', 'objects', 'Schema']>;
    constructor(options: SchemasVisitorOptions);
}

declare class ComponentsPathItems extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface PathItemsVisitorOptions extends MapVisitorOptions, FallbackVisitorOptions {
}
declare const PathItemsVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class PathItemsVisitor extends PathItemsVisitor_base {
    readonly element: ComponentsPathItems;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'PathItem']>;
    constructor(options: PathItemsVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare const BaseExampleVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.ExampleVisitor;

declare class ExampleVisitor extends BaseExampleVisitor {
    readonly element: Example;
    constructor(options: ExampleVisitorOptions);
}

declare const BaseExternalDocumentationVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.ExternalDocumentationVisitor;

declare class ExternalDocumentationVisitor extends BaseExternalDocumentationVisitor {
    readonly element: ExternalDocumentation;
    constructor(options: ExternalDocumentationVisitorOptions);
}

declare class Encoding extends EncodingElement {
}

declare const BaseEncodingVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.EncodingVisitor;

declare class EncodingVisitor extends BaseEncodingVisitor {
    readonly element: Encoding;
    constructor(options: EncodingVisitorOptions);
}

declare const BasePathsVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.PathsVisitor;

declare class PathsVisitor extends BasePathsVisitor {
    readonly element: Paths;
    constructor(options: PathsVisitorOptions);
}

declare const BaseRequestBodyVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.RequestBodyVisitor;

declare class RequestBodyVisitor extends BaseRequestBodyVisitor {
    readonly element: RequestBody;
    constructor(options: RequestBodyVisitorOptions);
}

declare const BaseCallbackVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.CallbackVisitor;

declare class CallbackVisitor extends BaseCallbackVisitor {
    readonly element: Callback;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'PathItem']>;
    constructor(options: CallbackVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare const BaseResponseVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.ResponseVisitor;

declare class ResponseVisitor extends BaseResponseVisitor {
    readonly element: Response;
    constructor(options: ResponseVisitorOptions);
}

declare const BaseResponsesVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.ResponsesVisitor;

declare class ResponsesVisitor extends BaseResponsesVisitor {
    readonly element: Responses;
    constructor(options: ResponsesVisitorOptions);
}

declare const BaseOperationVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.OperationVisitor;

declare class OperationVisitor extends BaseOperationVisitor {
    readonly element: Operation;
    constructor(options: OperationVisitorOptions);
}

declare const BasePathItemVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.PathItemVisitor;

declare class PathItemVisitor extends BasePathItemVisitor {
    readonly element: PathItem;
    constructor(options: PathItemVisitorOptions);
}

declare const BaseSecuritySchemeVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.SecuritySchemeVisitor;

declare class SecuritySchemeVisitor extends BaseSecuritySchemeVisitor {
    readonly element: SecurityScheme;
    constructor(options: SecuritySchemeVisitorOptions);
}

declare class OAuthFlows extends OAuthFlowsElement {
}

declare const BaseOAuthFlowsVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.OAuthFlowsVisitor;

declare class OAuthFlowsVisitor extends BaseOAuthFlowsVisitor {
    readonly element: OAuthFlows;
    constructor(options: OAuthFlowsVisitorOptions);
}

declare class OAuthFlow extends OAuthFlowElement {
}

declare const BaseOAuthFlowVisitor: typeof _swagger_api_apidom_ns_openapi_3_0.OAuthFlowVisitor;

declare class OAuthFlowVisitor extends BaseOAuthFlowVisitor {
    readonly element: OAuthFlow;
    constructor(options: OAuthFlowVisitorOptions);
}

declare class Webhooks extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface WebhooksVisitorOptions extends MapVisitorOptions, FallbackVisitorOptions {
}
declare const WebhooksVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class WebhooksVisitor extends WebhooksVisitor_base {
    readonly element: Webhooks;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'Reference'
    ] | ['document', 'objects', 'PathItem']>;
    constructor(options: WebhooksVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

/**
 * Specification object allows us to have complete control over visitors
 * when traversing the ApiDOM.
 * Specification also allows us to create amended refractors from
 * existing ones by manipulating it.
 *
 * Note: Specification object allows to use absolute internal JSON pointers.
 */
declare const specification: {
    readonly visitors: {
        readonly value: typeof _swagger_api_apidom_ns_openapi_3_0.FallbackVisitor;
        readonly document: {
            readonly objects: {
                readonly OpenApi: {
                    readonly $visitor: typeof OpenApi3_1Visitor;
                    readonly fixedFields: {
                        readonly openapi: typeof _swagger_api_apidom_ns_openapi_3_0.OpenapiVisitor;
                        readonly info: {
                            readonly $ref: "#/visitors/document/objects/Info";
                        };
                        readonly jsonSchemaDialect: typeof JsonSchemaDialectVisitor;
                        readonly servers: typeof _swagger_api_apidom_ns_openapi_3_0.ServersVisitor;
                        readonly paths: {
                            readonly $ref: "#/visitors/document/objects/Paths";
                        };
                        readonly webhooks: typeof WebhooksVisitor;
                        readonly components: {
                            readonly $ref: "#/visitors/document/objects/Components";
                        };
                        readonly security: typeof _swagger_api_apidom_ns_openapi_3_0.SecurityVisitor;
                        readonly tags: typeof _swagger_api_apidom_ns_openapi_3_0.TagsVisitor;
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
                        readonly summary: {
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
                        readonly version: typeof _swagger_api_apidom_ns_openapi_3_0.InfoVersionVisitor;
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
                        readonly identifier: {
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
                        readonly url: typeof _swagger_api_apidom_ns_openapi_3_0.ServerVariableUrlVisitor;
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly variables: typeof _swagger_api_apidom_ns_openapi_3_0.ServerVariableVariablesVisitor;
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
                        readonly responses: typeof _swagger_api_apidom_ns_openapi_3_0.ComponentsResponsesVisitor;
                        readonly parameters: typeof _swagger_api_apidom_ns_openapi_3_0.ComponentsParametersVisitor;
                        readonly examples: typeof _swagger_api_apidom_ns_openapi_3_0.ComponentsExamplesVisitor;
                        readonly requestBodies: typeof _swagger_api_apidom_ns_openapi_3_0.ComponentsRequestBodiesVisitor;
                        readonly headers: typeof _swagger_api_apidom_ns_openapi_3_0.ComponentsHeadersVisitor;
                        readonly securitySchemes: typeof _swagger_api_apidom_ns_openapi_3_0.ComponentsSecuritySchemesVisitor;
                        readonly links: typeof _swagger_api_apidom_ns_openapi_3_0.ComponentsLinksVisitor;
                        readonly callbacks: typeof _swagger_api_apidom_ns_openapi_3_0.ComponentsCallbacksVisitor;
                        readonly pathItems: typeof PathItemsVisitor;
                    };
                };
                readonly Paths: {
                    readonly $visitor: typeof PathsVisitor;
                };
                readonly PathItem: {
                    readonly $visitor: typeof PathItemVisitor;
                    readonly fixedFields: {
                        readonly $ref: typeof _swagger_api_apidom_ns_openapi_3_0.PathItem$RefVisitor;
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
                        readonly servers: typeof _swagger_api_apidom_ns_openapi_3_0.PathItemServersVisitor;
                        readonly parameters: typeof _swagger_api_apidom_ns_openapi_3_0.PathItemParametersVisitor;
                    };
                };
                readonly Operation: {
                    readonly $visitor: typeof OperationVisitor;
                    readonly fixedFields: {
                        readonly tags: typeof _swagger_api_apidom_ns_openapi_3_0.OperationTagsVisitor;
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
                        readonly parameters: typeof _swagger_api_apidom_ns_openapi_3_0.OperationParametersVisitor;
                        readonly requestBody: typeof _swagger_api_apidom_ns_openapi_3_0.OperationRequestBodyVisitor;
                        readonly responses: {
                            readonly $ref: "#/visitors/document/objects/Responses";
                        };
                        readonly callbacks: typeof _swagger_api_apidom_ns_openapi_3_0.OperationCallbacksVisitor;
                        readonly deprecated: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly security: typeof _swagger_api_apidom_ns_openapi_3_0.OperationSecurityVisitor;
                        readonly servers: typeof _swagger_api_apidom_ns_openapi_3_0.OperationServersVisitor;
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
                        readonly schema: {
                            readonly $ref: "#/visitors/document/objects/Schema";
                        };
                        readonly example: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly examples: typeof _swagger_api_apidom_ns_openapi_3_0.ParameterExampleVisitor;
                        readonly content: typeof _swagger_api_apidom_ns_openapi_3_0.ParameterContentVisitor;
                    };
                };
                readonly RequestBody: {
                    readonly $visitor: typeof RequestBodyVisitor;
                    readonly fixedFields: {
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly content: typeof _swagger_api_apidom_ns_openapi_3_0.RequestBodyContentVisitor;
                        readonly required: {
                            readonly $ref: "#/visitors/value";
                        };
                    };
                };
                readonly MediaType: {
                    readonly $visitor: typeof MediaTypeVisitor;
                    readonly fixedFields: {
                        readonly schema: {
                            readonly $ref: "#/visitors/document/objects/Schema";
                        };
                        readonly example: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly examples: typeof _swagger_api_apidom_ns_openapi_3_0.MediaTypeExamplesVisitor;
                        readonly encoding: typeof _swagger_api_apidom_ns_openapi_3_0.MediaTypeEncodingVisitor;
                    };
                };
                readonly Encoding: {
                    readonly $visitor: typeof EncodingVisitor;
                    readonly fixedFields: {
                        readonly contentType: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly headers: typeof _swagger_api_apidom_ns_openapi_3_0.EncodingHeadersVisitor;
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
                        readonly default: typeof _swagger_api_apidom_ns_openapi_3_0.ResponsesDefaultVisitor;
                    };
                };
                readonly Response: {
                    readonly $visitor: typeof ResponseVisitor;
                    readonly fixedFields: {
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly headers: typeof _swagger_api_apidom_ns_openapi_3_0.ResponseHeadersVisitor;
                        readonly content: typeof _swagger_api_apidom_ns_openapi_3_0.ResponseContentVisitor;
                        readonly links: typeof _swagger_api_apidom_ns_openapi_3_0.ResponseLinksVisitor;
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
                        readonly externalValue: typeof _swagger_api_apidom_ns_openapi_3_0.ExampleExternalValueVisitor;
                    };
                };
                readonly Link: {
                    readonly $visitor: typeof LinkVisitor;
                    readonly fixedFields: {
                        readonly operationRef: typeof _swagger_api_apidom_ns_openapi_3_0.LinkOperationRefVisitor;
                        readonly operationId: typeof _swagger_api_apidom_ns_openapi_3_0.LinkOperationIdVisitor;
                        readonly parameters: typeof _swagger_api_apidom_ns_openapi_3_0.LinkParametersVisitor;
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
                        readonly schema: {
                            readonly $ref: "#/visitors/document/objects/Schema";
                        };
                        readonly example: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly examples: typeof _swagger_api_apidom_ns_openapi_3_0.HeaderExamplesVisitor;
                        readonly content: typeof _swagger_api_apidom_ns_openapi_3_0.HeaderContentVisitor;
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
                        readonly $ref: typeof _swagger_api_apidom_ns_openapi_3_0.Reference$RefVisitor;
                        readonly summary: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                    };
                };
                readonly Schema: {
                    readonly $visitor: typeof SchemaVisitor;
                    readonly fixedFields: {
                        readonly $schema: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly $vocabulary: typeof $vocabularyVisitor;
                        readonly $id: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly $anchor: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly $dynamicAnchor: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly $dynamicRef: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly $ref: typeof $refVisitor;
                        readonly $defs: typeof $defsVisitor;
                        readonly $comment: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly allOf: typeof AllOfVisitor;
                        readonly anyOf: typeof AnyOfVisitor;
                        readonly oneOf: typeof OneOfVisitor;
                        readonly not: {
                            readonly $ref: "#/visitors/document/objects/Schema";
                        };
                        readonly if: {
                            readonly $ref: "#/visitors/document/objects/Schema";
                        };
                        readonly then: {
                            readonly $ref: "#/visitors/document/objects/Schema";
                        };
                        readonly else: {
                            readonly $ref: "#/visitors/document/objects/Schema";
                        };
                        readonly dependentSchemas: typeof DependentSchemasVisitor;
                        readonly prefixItems: typeof PrefixItemsVisitor;
                        readonly items: {
                            readonly $ref: "#/visitors/document/objects/Schema";
                        };
                        readonly contains: {
                            readonly $ref: "#/visitors/document/objects/Schema";
                        };
                        readonly properties: typeof PropertiesVisitor;
                        readonly patternProperties: typeof PatternPropertiesVisitor;
                        readonly additionalProperties: {
                            readonly $ref: "#/visitors/document/objects/Schema";
                        };
                        readonly propertyNames: {
                            readonly $ref: "#/visitors/document/objects/Schema";
                        };
                        readonly unevaluatedItems: {
                            readonly $ref: "#/visitors/document/objects/Schema";
                        };
                        readonly unevaluatedProperties: {
                            readonly $ref: "#/visitors/document/objects/Schema";
                        };
                        readonly type: typeof TypeVisitor;
                        readonly enum: typeof EnumVisitor;
                        readonly const: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly multipleOf: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly maximum: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly exclusiveMaximum: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly minimum: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly exclusiveMinimum: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly maxLength: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly minLength: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly pattern: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly maxItems: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly minItems: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly uniqueItems: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly maxContains: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly minContains: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly maxProperties: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly minProperties: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly required: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly dependentRequired: typeof DependentRequiredVisitor;
                        readonly title: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly default: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly deprecated: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly readOnly: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly writeOnly: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly examples: typeof ExamplesVisitor;
                        readonly format: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly contentEncoding: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly contentMediaType: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly contentSchema: {
                            readonly $ref: "#/visitors/document/objects/Schema";
                        };
                        readonly discriminator: {
                            readonly $ref: "#/visitors/document/objects/Discriminator";
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
                    };
                };
                readonly Discriminator: {
                    readonly $visitor: typeof DiscriminatorVisitor;
                    readonly fixedFields: {
                        readonly propertyName: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly mapping: typeof _swagger_api_apidom_ns_openapi_3_0.DiscriminatorMappingVisitor;
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
                        readonly scopes: typeof _swagger_api_apidom_ns_openapi_3_0.OAuthFlowScopesVisitor;
                    };
                };
                readonly SecurityRequirement: {
                    readonly $visitor: typeof SecurityRequirementVisitor;
                };
            };
            readonly extension: {
                readonly $visitor: typeof _swagger_api_apidom_ns_openapi_3_0.SpecificationExtensionVisitor;
            };
        };
    };
};

declare class RequiredVisitor extends FallbackVisitor {
    readonly element: ArrayElement;
    ArrayElement(arrayElement: ArrayElement): {};
}

declare const getNodeType: <T extends Element>(element: T) => string | undefined;
/**
 * There are unfortunately two `LinkElement` types. One is from base namespace
 * and the other one if from this namespace. `LinkElement` from base namespace
 * is used extremely rarely so it's almost always safe during traversing
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
    OpenApi3_1Element: string[];
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

export { Callback as CallbackElement, CallbackVisitor, Components as ComponentsElement, ComponentsPathItems as ComponentsPathItemsElement, PathItemsVisitor as ComponentsPathItemsVisitor, type PathItemsVisitorOptions as ComponentsPathItemsVisitorOptions, SchemasVisitor as ComponentsSchemasVisitor, type SchemasVisitorOptions as ComponentsSchemasVisitorOptions, ComponentsVisitor, Contact as ContactElement, ContactVisitor, Discriminator as DiscriminatorElement, DiscriminatorVisitor, Encoding as EncodingElement, EncodingVisitor, Example as ExampleElement, ExampleVisitor, ExternalDocumentation as ExternalDocumentationElement, ExternalDocumentationVisitor, Header as HeaderElement, HeaderVisitor, Info as InfoElement, InfoVisitor, JsonSchemaDialect as JsonSchemaDialectElement, JsonSchemaDialectVisitor, type JsonSchemaDialectVisitorOptions, License as LicenseElement, LicenseVisitor, Link as LinkElement, LinkVisitor, MediaType as MediaTypeElement, MediaTypeVisitor, OAuthFlow as OAuthFlowElement, OAuthFlowVisitor, OAuthFlows as OAuthFlowsElement, OAuthFlowsVisitor, OpenAPIMediaTypes, OpenApi3_1 as OpenApi3_1Element, OpenApi3_1Visitor, type OpenApi3_1VisitorOptions, Openapi as OpenapiElement, Operation as OperationElement, OperationVisitor, Parameter as ParameterElement, ParameterVisitor, PathItem as PathItemElement, PathItemVisitor, Paths as PathsElement, PathsVisitor, Reference as ReferenceElement, ReferenceVisitor, RequestBody as RequestBodyElement, RequestBodyVisitor, Response as ResponseElement, ResponseVisitor, Responses as ResponsesElement, ResponsesVisitor, $defsVisitor as Schema$defsVisitor, type $defsVisitorOptions as Schema$defsVisitorOptions, $refVisitor as Schema$refVisitor, $vocabularyVisitor as Schema$vocabularyVisitor, AllOfVisitor as SchemaAllOfVisitor, type AllOfVisitorOptions as SchemaAllOfVisitorOptions, AnyOfVisitor as SchemaAnyOfVisitor, type AnyOfVisitorOptions as SchemaAnyOfVisitorOptions, DependentRequiredVisitor as SchemaDependentRequiredVisitor, DependentSchemasVisitor as SchemaDependentSchemasVisitor, type DependentSchemasVisitorOptions as SchemaDependentSchemasVisitorOptions, Schema as SchemaElement, EnumVisitor as SchemaEnumVisitor, ExamplesVisitor as SchemaExamplesVisitor, OneOfVisitor as SchemaOneOfVisitor, type OneOfVisitorOptions as SchemaOneOfVisitorOptions, PatternPropertiesVisitor as SchemaPatternPropertiesVisitor, type PatternPropertiesVisitorOptions as SchemaPatternPropertiesVisitorOptions, PrefixItemsVisitor as SchemaPrefixItemsVisitor, type PrefixItemsVisitorOptions as SchemaPrefixItemsVisitorOptions, PropertiesVisitor as SchemaPropertiesVisitor, type PropertiesVisitorOptions as SchemaPropertiesVisitorOptions, RequiredVisitor as SchemaRequiredVisitor, TypeVisitor as SchemaTypeVisitor, SchemaVisitor, type SchemaVisitorOptions, SecurityRequirement as SecurityRequirementElement, SecurityRequirementVisitor, SecurityScheme as SecuritySchemeElement, SecuritySchemeVisitor, Server as ServerElement, ServerVariable as ServerVariableElement, ServerVariableVisitor, ServerVisitor, Tag as TagElement, TagVisitor, type Predicates as ToolboxPredicates, Webhooks as WebhooksElement, WebhooksVisitor, type WebhooksVisitorOptions, Xml as XmlElement, XmlVisitor, createToolbox, openApi3_1 as default, getNodeType, isBooleanJsonSchemaElement, isCallbackElement, isComponentsElement, isContactElement, isExampleElement, isExternalDocumentationElement, isInfoElement, isJsonSchemaDialectElement, isLicenseElement, isLinkElement, isMediaTypeElement, isOpenApi3_1Element, isOpenapiElement, isOperationElement, isParameterElement, isPathItemElement, isPathItemElementExternal, isPathsElement, isReferenceElement, isReferenceElementExternal, isRequestBodyElement, isResponseElement, isResponsesElement, isSchemaElement, isSecurityRequirementElement, isSecuritySchemeElement, isServerElement, isServerVariableElement, keyMap, mediaTypes, plugin as refractorPluginNormalizeHeaderExamples, plugin$2 as refractorPluginNormalizeOperationIds, plugin$1 as refractorPluginNormalizeParameterExamples, plugin$5 as refractorPluginNormalizeParameters, plugin$4 as refractorPluginNormalizeSecurityRequirements, plugin$3 as refractorPluginNormalizeServers, plugin$6 as refractorPluginReplaceEmptyElement, specification as specificationObj };
