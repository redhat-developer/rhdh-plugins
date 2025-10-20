import * as _swagger_api_apidom_core from '@swagger-api/apidom-core';
import { MediaTypes, NamespacePluginOptions, StringElement, Element, Meta, Attributes, BooleanElement, ObjectElement, ArrayElement } from '@swagger-api/apidom-core';
export { isArrayElement, isBooleanElement, isElement, isLinkElement, isMemberElement, isNullElement, isNumberElement, isObjectElement, isRefElement, isStringElement } from '@swagger-api/apidom-core';
import * as minim from 'minim';
import * as _swagger_api_apidom_ns_json_schema_draft_4 from '@swagger-api/apidom-ns-json-schema-draft-4';
import { specificationObj, JSONSchemaElement, JSONReferenceElement, MediaElement, LinkDescriptionElement, FixedFieldsVisitorOptions, FallbackVisitorOptions, SpecPath, FixedFieldsVisitor, FallbackVisitor } from '@swagger-api/apidom-ns-json-schema-draft-6';
export { AllOfVisitorOptions, AlternatingVisitor, AlternatingVisitorOptions, AnyOfVisitorOptions, DefinitionsVisitorOptions, DependenciesVisitorOptions, FallbackVisitor, FallbackVisitorOptions, FixedFieldsVisitor, FixedFieldsVisitorOptions, ItemsVisitorOptions, JSONReferenceElement, MapVisitor, MapVisitorOptions, OneOfVisitorOptions, ParentSchemaAwareVisitor, ParentSchemaAwareVisitorOptions, PatternPropertiesVisitorOptions, PatternedFieldsVisitor, PatternedFieldsVisitorOptions, PropertiesVisitorOptions, SchemaOrReferenceVisitorOptions, SpecPath, SpecificationVisitor, SpecificationVisitorOptions, Visitor, VisitorOptions, isJSONReferenceElement, isJSONReferenceLikeElement } from '@swagger-api/apidom-ns-json-schema-draft-6';
import * as ts_mixer_dist_types_types from 'ts-mixer/dist/types/types';

type Format = 'generic' | 'json' | 'yaml';
declare class JSONSchemaDraft7MediaTypes extends MediaTypes<string> {
    filterByFormat(format?: Format): string[];
    findBy(version?: string, format?: Format): string;
    latest(format?: Format): string;
}
declare const mediaTypes: JSONSchemaDraft7MediaTypes;

declare const jsonSchemaDraft7: {
    namespace: (options: NamespacePluginOptions) => minim.Namespace;
};

declare const plugin: () => () => {
    visitor: {
        StringElement(element: StringElement, key: any, parent: any, path: any, ancestors: any[]): any;
    };
};

declare const refract: <T extends Element>(value: unknown, { specPath, plugins, specificationObj, }?: {
    specPath?: string[] | undefined;
    plugins?: never[] | undefined;
    specificationObj?: {
        visitors: {
            value: typeof _swagger_api_apidom_ns_json_schema_draft_4.FallbackVisitor;
            JSONSchemaOrJSONReferenceVisitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor;
            document: {
                objects: {
                    JSONSchema: {
                        $visitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.JSONSchemaVisitor;
                        fixedFields: {
                            id: {
                                $ref: string;
                            };
                            $schema: {
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
                            additionalItems: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor;
                            items: typeof _swagger_api_apidom_ns_json_schema_draft_4.ItemsVisitor;
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
                            properties: typeof _swagger_api_apidom_ns_json_schema_draft_4.PropertiesVisitor;
                            additionalProperties: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor;
                            patternProperties: typeof _swagger_api_apidom_ns_json_schema_draft_4.PatternPropertiesVisitor;
                            dependencies: typeof _swagger_api_apidom_ns_json_schema_draft_4.DependenciesVisitor;
                            enum: typeof _swagger_api_apidom_ns_json_schema_draft_4.EnumVisitor;
                            type: typeof _swagger_api_apidom_ns_json_schema_draft_4.TypeVisitor;
                            allOf: typeof _swagger_api_apidom_ns_json_schema_draft_4.AllOfVisitor;
                            anyOf: typeof _swagger_api_apidom_ns_json_schema_draft_4.AnyOfVisitor;
                            oneOf: typeof _swagger_api_apidom_ns_json_schema_draft_4.OneOfVisitor;
                            not: typeof _swagger_api_apidom_ns_json_schema_draft_4.SchemaOrReferenceVisitor;
                            definitions: typeof _swagger_api_apidom_ns_json_schema_draft_4.DefinitionsVisitor;
                            title: {
                                $ref: string;
                            };
                            description: {
                                $ref: string;
                            };
                            default: {
                                $ref: string;
                            };
                            format: {
                                $ref: string;
                            };
                            base: {
                                $ref: string;
                            };
                            links: typeof _swagger_api_apidom_ns_json_schema_draft_4.LinksVisitor;
                            media: {
                                $ref: string;
                            };
                            readOnly: {
                                $ref: string;
                            };
                        };
                    };
                    JSONReference: {
                        $visitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.JSONReferenceVisitor;
                        fixedFields: {
                            $ref: typeof _swagger_api_apidom_ns_json_schema_draft_4.JSONReference$RefVisitor;
                        };
                    };
                    Media: {
                        $visitor: typeof _swagger_api_apidom_ns_json_schema_draft_4.MediaVisitor;
                        fixedFields: {
                            binaryEncoding: {
                                $ref: string;
                            };
                            type: {
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
                };
            };
        };
    } | undefined;
}) => T;
declare const createRefractor: (specPath: string[]) => (value: unknown, options?: {}) => Element;

declare const _default: typeof specificationObj;

declare class JSONSchema extends JSONSchemaElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    /**
     * Core vocabulary
     *
     * URI: https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-01
     */
    get $comment(): StringElement | undefined;
    set $comment($comment: StringElement | undefined);
    /**
     * Validation vocabulary
     *
     * URI: https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01
     */
    /**
     * Keywords for Applying Subschemas Conditionally
     *
     * URI: https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.6
     */
    get if(): this | BooleanElement | JSONReferenceElement | undefined;
    set if(ifValue: this | BooleanElement | JSONReferenceElement | undefined);
    get then(): this | BooleanElement | JSONReferenceElement | undefined;
    set then(then: this | BooleanElement | JSONReferenceElement | undefined);
    get else(): this | BooleanElement | JSONReferenceElement | undefined;
    set else(elseValue: this | BooleanElement | JSONReferenceElement | undefined);
    /**
     * String-Encoding Non-JSON Data
     *
     * URI: https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-00#section-8
     */
    get contentEncoding(): StringElement | undefined;
    set contentEncoding(contentEncoding: StringElement | undefined);
    get contentMediaType(): StringElement | undefined;
    set contentMediaType(contentMediaType: StringElement | undefined);
    get media(): MediaElement | undefined;
    set media(media: MediaElement | undefined);
    /**
     * Schema annotations
     *
     * URI: https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-10
     */
    get writeOnly(): BooleanElement | undefined;
    set writeOnly(writeOnly: BooleanElement | undefined);
}

/**
 * URI: https://datatracker.ietf.org/doc/html/draft-wright-json-schema-hyperschema-01#section-6
 */
declare class LinkDescription extends LinkDescriptionElement {
    /**
     * Link context.
     *
     * URI: https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-hyperschema-01#section-6.1
     */
    get anchor(): StringElement | undefined;
    set anchor(anchor: StringElement | undefined);
    get anchorPointer(): StringElement | undefined;
    set anchorPointer(anchorPointer: StringElement | undefined);
    /**
     * Adjusting URI Template Resolution.
     *
     * URI: https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-hyperschema-01#section-6.4
     */
    get templatePointers(): ObjectElement | undefined;
    set templatePointers(templatePointers: ObjectElement | undefined);
    get templateRequired(): ArrayElement | undefined;
    set templateRequired(templateRequired: ArrayElement | undefined);
    /**
     * Link Target Attributes.
     *
     * URI: https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-hyperschema-01#section-6.5
     */
    get mediaType(): StringElement | undefined;
    set mediaType(mediaType: StringElement | undefined);
    get targetMediaType(): StringElement | undefined;
    set targetMediaType(targetMediaType: StringElement | undefined);
    get targetHints(): ObjectElement | undefined;
    set targetHints(targetHints: ObjectElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get $comment(): StringElement | undefined;
    set $comment($comment: StringElement | undefined);
    /**
     *  Submitting Data for Processing.
     *
     *  URI: https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-hyperschema-01#section-6.6.4
     */
    get submissionEncType(): StringElement | undefined;
    set submissionEncType(submissionEncType: StringElement | undefined);
    get submissionMediaType(): StringElement | undefined;
    set submissionMediaType(submissionMediaType: StringElement | undefined);
}

declare const isJSONSchemaElement: _swagger_api_apidom_core.ElementPredicate<JSONSchema>;
declare const isLinkDescriptionElement: _swagger_api_apidom_core.ElementPredicate<LinkDescription>;

interface JSONSchemaVisitorOptions extends FixedFieldsVisitorOptions, FallbackVisitorOptions {
}
declare const JSONSchemaVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class JSONSchemaVisitor extends JSONSchemaVisitor_base {
    element: JSONSchema;
    protected readonly specPath: SpecPath<['document', 'objects', 'JSONSchema']>;
    constructor(options: JSONSchemaVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
    BooleanElement(booleanElement: BooleanElement): {};
}

interface LinkDescriptionVisitorOptions extends FixedFieldsVisitorOptions, FallbackVisitorOptions {
}
declare const LinkDescriptionVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class LinkDescriptionVisitor extends LinkDescriptionVisitor_base {
    readonly element: LinkDescription;
    protected readonly specPath: SpecPath<['document', 'objects', 'LinkDescription']>;
    constructor(options: LinkDescriptionVisitorOptions);
}

declare const getNodeType: <T extends Element>(element: T) => string | undefined;
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
    JSONSchemaDraft7Element: string[];
    JSONReferenceElement: string[];
    LinkDescriptionElement: string[];
};

export { JSONSchemaDraft7MediaTypes, JSONSchema as JSONSchemaElement, JSONSchemaVisitor, type JSONSchemaVisitorOptions, LinkDescription as LinkDescriptionElement, LinkDescriptionVisitor, type LinkDescriptionVisitorOptions, createRefractor, jsonSchemaDraft7 as default, getNodeType, isJSONSchemaElement, isLinkDescriptionElement, keyMap, mediaTypes, refract, plugin as refractorPluginReplaceEmptyElement, _default as specificationObj };
