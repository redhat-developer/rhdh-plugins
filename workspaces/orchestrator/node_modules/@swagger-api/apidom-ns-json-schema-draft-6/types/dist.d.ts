import * as _swagger_api_apidom_core from '@swagger-api/apidom-core';
import { MediaTypes, NamespacePluginOptions, StringElement, Element, Meta, Attributes, NumberElement, BooleanElement, ArrayElement, ObjectElement } from '@swagger-api/apidom-core';
export { isArrayElement, isBooleanElement, isElement, isLinkElement, isMemberElement, isNullElement, isNumberElement, isObjectElement, isRefElement, isStringElement } from '@swagger-api/apidom-core';
import * as minim from 'minim';
import * as _swagger_api_apidom_ns_json_schema_draft_4 from '@swagger-api/apidom-ns-json-schema-draft-4';
import { specificationObj, JSONSchemaElement, JSONReferenceElement, LinkDescriptionElement, FixedFieldsVisitorOptions, FallbackVisitorOptions, SpecPath, FixedFieldsVisitor, FallbackVisitor, SpecificationVisitorOptions, ParentSchemaAwareVisitorOptions, SpecificationVisitor, ParentSchemaAwareVisitor } from '@swagger-api/apidom-ns-json-schema-draft-4';
export { AllOfVisitorOptions, AlternatingVisitor, AlternatingVisitorOptions, AnyOfVisitorOptions, DefinitionsVisitorOptions, DependenciesVisitorOptions, FallbackVisitorOptions as ExamplesVisitorOptions, FallbackVisitor, FallbackVisitorOptions, FixedFieldsVisitor, FixedFieldsVisitorOptions, JSONReferenceElement, MapVisitor, MapVisitorOptions, MediaElement, OneOfVisitorOptions, ParentSchemaAwareVisitor, ParentSchemaAwareVisitorOptions, PatternPropertiesVisitorOptions, PatternedFieldsVisitor, PatternedFieldsVisitorOptions, PropertiesVisitorOptions, SchemaOrReferenceVisitorOptions, SpecPath, SpecificationVisitor, SpecificationVisitorOptions, Visitor, VisitorOptions, isJSONReferenceElement, isJSONReferenceLikeElement, isMediaElement } from '@swagger-api/apidom-ns-json-schema-draft-4';
import * as ts_mixer_dist_types_types from 'ts-mixer/dist/types/types';

type Format = 'generic' | 'json' | 'yaml';
declare class JSONSchemaDraft6MediaTypes extends MediaTypes<string> {
    filterByFormat(format?: Format): string[];
    findBy(version?: string, format?: Format): string;
    latest(format?: Format): string;
}
declare const mediaTypes: JSONSchemaDraft6MediaTypes;

declare const jsonSchemaDraft6: {
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
     * URI: https://datatracker.ietf.org/doc/html/draft-wright-json-schema-01
     */
    get idProp(): StringElement | undefined;
    set idProp(id: StringElement | undefined);
    get $id(): StringElement | undefined;
    set $id($id: StringElement | undefined);
    /**
     * Validation vocabulary
     *
     * URI: https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-01
     */
    /**
     *  Validation keywords for numeric instances (number and integer)
     */
    get exclusiveMaximum(): NumberElement | undefined;
    set exclusiveMaximum(exclusiveMaximum: NumberElement | undefined);
    get exclusiveMinimum(): NumberElement | undefined;
    set exclusiveMinimum(exclusiveMinimum: NumberElement | undefined);
    /**
     * Validation keywords for arrays
     */
    get containsProp(): this | BooleanElement | JSONReferenceElement | undefined;
    set containsProp(contains: this | BooleanElement | JSONReferenceElement | undefined);
    get items(): this | BooleanElement | JSONReferenceElement | ArrayElement | undefined | any;
    set items(items: this | BooleanElement | JSONReferenceElement | ArrayElement | undefined | any);
    /**
     * Validation keywords for objects
     */
    get propertyNames(): this | BooleanElement | JSONReferenceElement | undefined;
    set propertyNames(propertyNames: this | BooleanElement | JSONReferenceElement | undefined);
    /**
     *  Validation keywords for any instance type
     */
    get const(): Element | undefined;
    set const(constValue: Element | undefined);
    get not(): this | BooleanElement | JSONReferenceElement | undefined | any;
    set not(not: this | BooleanElement | JSONReferenceElement | undefined | any);
    /**
     * Metadata keywords
     *
     * URI: https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-01#section-7
     */
    get examples(): ArrayElement | undefined;
    set examples(examples: ArrayElement | undefined);
}

/**
 * URI: https://datatracker.ietf.org/doc/html/draft-wright-json-schema-hyperschema-01#section-6
 */
declare class LinkDescription extends LinkDescriptionElement {
    get hrefSchema(): JSONSchema | BooleanElement | JSONReferenceElement | undefined;
    set hrefSchema(hrefSchema: JSONSchema | BooleanElement | JSONReferenceElement | undefined);
    get targetSchema(): JSONSchema | BooleanElement | JSONReferenceElement | undefined | any;
    set targetSchema(targetSchema: JSONSchema | BooleanElement | JSONReferenceElement | undefined | any);
    get schema(): JSONSchema | JSONReferenceElement | undefined;
    set schema(schema: JSONSchema | JSONReferenceElement | undefined);
    get submissionSchema(): JSONSchema | BooleanElement | JSONReferenceElement | undefined;
    set submissionSchema(submissionSchema: JSONSchema | BooleanElement | JSONReferenceElement | undefined);
    get method(): StringElement | undefined;
    set method(method: StringElement | undefined);
    get encType(): StringElement | undefined;
    set encType(encType: StringElement | undefined);
    get submissionEncType(): StringElement | undefined;
    set submissionEncType(submissionEncType: StringElement | undefined);
}

declare const isJSONSchemaElement: _swagger_api_apidom_core.ElementPredicate<JSONSchema>;
declare const isLinkDescriptionElement: _swagger_api_apidom_core.ElementPredicate<LinkDescription>;

interface LinkDescriptionVisitorOptions extends FixedFieldsVisitorOptions, FallbackVisitorOptions {
}
declare const LinkDescriptionVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class LinkDescriptionVisitor extends LinkDescriptionVisitor_base {
    readonly element: LinkDescription;
    protected readonly specPath: SpecPath<['document', 'objects', 'LinkDescription']>;
    constructor(options: LinkDescriptionVisitorOptions);
}

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

declare class ExamplesVisitor extends FallbackVisitor {
    readonly element: ArrayElement;
    ArrayElement(arrayElement: ArrayElement): {};
}

interface ItemsVisitorOptions extends SpecificationVisitorOptions, ParentSchemaAwareVisitorOptions, FallbackVisitorOptions {
}
declare const ItemsVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & ParentSchemaAwareVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof ParentSchemaAwareVisitor & typeof FallbackVisitor>;
declare class ItemsVisitor extends ItemsVisitor_base {
    element: ObjectElement | ArrayElement;
    ObjectElement(objectElement: ObjectElement): {};
    ArrayElement(arrayElement: ArrayElement): {};
    BooleanElement(booleanElement: BooleanElement): {};
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
    JSONSchemaDraft6Element: string[];
    JSONReferenceElement: string[];
    MediaElement: string[];
    LinkDescriptionElement: string[];
};

export { ExamplesVisitor, ItemsVisitor, type ItemsVisitorOptions, JSONSchemaDraft6MediaTypes, JSONSchema as JSONSchemaElement, JSONSchemaVisitor, type JSONSchemaVisitorOptions, LinkDescription as LinkDescriptionElement, LinkDescriptionVisitor, type LinkDescriptionVisitorOptions, createRefractor, jsonSchemaDraft6 as default, getNodeType, isJSONSchemaElement, isLinkDescriptionElement, keyMap, mediaTypes, refract, plugin as refractorPluginReplaceEmptyElement, _default as specificationObj };
