import * as _swagger_api_apidom_core from '@swagger-api/apidom-core';
import { MediaTypes, NamespacePluginOptions, StringElement, Element, ObjectElement, Meta, Attributes, NumberElement, BooleanElement, ArrayElement } from '@swagger-api/apidom-core';
export { isArrayElement, isBooleanElement, isElement, isLinkElement, isMemberElement, isNullElement, isNumberElement, isObjectElement, isRefElement, isStringElement } from '@swagger-api/apidom-core';
import * as minim from 'minim';
import * as ts_mixer_dist_types_types from 'ts-mixer/dist/types/types';

type Format = 'generic' | 'json' | 'yaml';
declare class JSONSchemaDraft4MediaTypes extends MediaTypes<string> {
    filterByFormat(format?: Format): string[];
    findBy(version?: string, format?: Format): string;
    latest(format?: Format): string;
}
declare const mediaTypes: JSONSchemaDraft4MediaTypes;

declare const jsonSchemaDraft4: {
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
            value: typeof FallbackVisitor;
            JSONSchemaOrJSONReferenceVisitor: typeof SchemaOrReferenceVisitor;
            document: {
                objects: {
                    JSONSchema: {
                        $visitor: typeof JSONSchemaVisitor;
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
                            additionalItems: typeof SchemaOrReferenceVisitor;
                            items: typeof ItemsVisitor;
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
                            required: typeof RequiredVisitor;
                            properties: typeof PropertiesVisitor;
                            additionalProperties: typeof SchemaOrReferenceVisitor;
                            patternProperties: typeof PatternPropertiesVisitor;
                            dependencies: typeof DependenciesVisitor;
                            enum: typeof EnumVisitor;
                            type: typeof TypeVisitor;
                            allOf: typeof AllOfVisitor;
                            anyOf: typeof AnyOfVisitor;
                            oneOf: typeof OneOfVisitor;
                            not: typeof SchemaOrReferenceVisitor;
                            definitions: typeof DefinitionsVisitor;
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
                            links: typeof LinksVisitor;
                            media: {
                                $ref: string;
                            };
                            readOnly: {
                                $ref: string;
                            };
                        };
                    };
                    JSONReference: {
                        $visitor: typeof JSONReferenceVisitor;
                        fixedFields: {
                            $ref: typeof $RefVisitor;
                        };
                    };
                    Media: {
                        $visitor: typeof MediaVisitor;
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
                        $visitor: typeof LinkDescriptionVisitor;
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
                            targetSchema: typeof SchemaOrReferenceVisitor;
                            mediaType: {
                                $ref: string;
                            };
                            method: {
                                $ref: string;
                            };
                            encType: {
                                $ref: string;
                            };
                            schema: typeof SchemaOrReferenceVisitor;
                        };
                    };
                };
            };
        };
    } | undefined;
}) => T;
declare const createRefractor: (specPath: string[]) => (value: unknown, options?: {}) => Element;

interface VisitorOptions {
}
declare class Visitor {
    element: Element;
    constructor(options: VisitorOptions);
    copyMetaAndAttributes(from: Element, to: Element): void;
}

declare class FallbackVisitor extends Visitor {
    enter(element: Element): {};
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
    retrievePassingOptions(): string[];
    retrieveFixedFields(specPath: string[]): string[];
    retrieveVisitor(specPath: string[]): unknown;
    retrieveVisitorInstance(specPath: string[], options?: {}): Visitor;
    toRefractedElement(specPath: string[], element: any, options?: {}): any;
}

type SpecPath<T = string[]> = (element: unknown) => T;
interface FixedFieldsVisitorOptions extends SpecificationVisitorOptions {
    readonly specPath: SpecPath;
    readonly ignoredFields?: string[];
}
declare class FixedFieldsVisitor extends SpecificationVisitor {
    protected specPath: SpecPath;
    protected ignoredFields: string[];
    constructor({ specPath, ignoredFields, ...rest }: FixedFieldsVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

/**
 * In Draft 4, $ref behaves a little differently. When an object contains a $ref property,
 * the object is considered a reference, not a schema. Therefore, any other properties you put in that object will
 * not be treated as JSON Schema keywords and will be ignored by the validator.
 * $ref can only be used where a schema is expected.
 *
 * URI: https://json-schema.org/understanding-json-schema/structuring.html?highlight=ref#id18
 */
declare class JSONReference extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get $ref(): StringElement | undefined;
    set $ref($ref: StringElement | undefined);
}

/**
 * URI: https://datatracker.ietf.org/doc/html/draft-wright-json-schema-hyperschema-00#section-4.3
 */
declare class Media extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get binaryEncoding(): StringElement | undefined;
    set binaryEncoding(binaryEncoding: StringElement | undefined);
    get type(): StringElement | undefined;
    set type(type: StringElement | undefined);
}

declare class JSONSchema extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    /**
     * Core vocabulary
     *
     * URI: https://tools.ietf.org/html/draft-wright-json-schema-00
     */
    get idProp(): StringElement | undefined;
    set idProp(idProp: StringElement | undefined);
    get $schema(): StringElement | undefined;
    set $schema($schema: StringElement | undefined);
    /**
     * Validation vocabulary
     *
     * URI: https://tools.ietf.org/html/draft-wright-json-schema-validation-00
     */
    /**
     *  Validation keywords for numeric instances (number and integer)
     */
    get multipleOf(): NumberElement | undefined;
    set multipleOf(multipleOf: NumberElement | undefined);
    get maximum(): NumberElement | undefined;
    set maximum(maximum: NumberElement | undefined);
    get exclusiveMaximum(): BooleanElement | undefined;
    set exclusiveMaximum(exclusiveMaximum: BooleanElement | undefined);
    get minimum(): NumberElement | undefined;
    set minimum(minimum: NumberElement | undefined);
    get exclusiveMinimum(): BooleanElement | undefined;
    set exclusiveMinimum(exclusiveMinimum: BooleanElement | undefined);
    /**
     * Validation keywords for strings
     */
    get maxLength(): NumberElement | undefined;
    set maxLength(maxLength: NumberElement | undefined);
    get minLength(): NumberElement | undefined;
    set minLength(minLength: NumberElement | undefined);
    get pattern(): StringElement | undefined;
    set pattern(pattern: StringElement | undefined);
    /**
     * Validation keywords for arrays
     */
    get additionalItems(): this | JSONReference | BooleanElement | undefined;
    set additionalItems(additionalItems: this | JSONReference | BooleanElement | undefined);
    get items(): this | JSONReference | ArrayElement | undefined;
    set items(items: this | JSONReference | ArrayElement | undefined);
    get maxItems(): NumberElement | undefined;
    set maxItems(maxItems: NumberElement | undefined);
    get minItems(): NumberElement | undefined;
    set minItems(minItems: NumberElement | undefined);
    get uniqueItems(): BooleanElement | undefined;
    set uniqueItems(uniqueItems: BooleanElement | undefined);
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
    get additionalProperties(): this | JSONReference | BooleanElement | undefined;
    set additionalProperties(additionalProperties: this | JSONReference | BooleanElement | undefined);
    get patternProperties(): ObjectElement | undefined;
    set patternProperties(patternProperties: ObjectElement | undefined);
    get dependencies(): ObjectElement | undefined;
    set dependencies(dependencies: ObjectElement | undefined);
    /**
     *  Validation keywords for any instance type
     */
    get enum(): ArrayElement | undefined;
    set enum(enumValue: ArrayElement | undefined);
    get type(): ArrayElement | StringElement | undefined;
    set type(type: ArrayElement | StringElement | undefined);
    get allOf(): ArrayElement | undefined;
    set allOf(allOf: ArrayElement | undefined);
    get anyOf(): ArrayElement | undefined;
    set anyOf(anyOf: ArrayElement | undefined);
    get oneOf(): ArrayElement | undefined;
    set oneOf(oneOf: ArrayElement | undefined);
    get not(): this | JSONReference | undefined;
    set not(not: this | JSONReference | undefined);
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
    get default(): Element | undefined;
    set default(defaultValue: Element | undefined);
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
    get media(): Media | undefined;
    set media(media: Media | undefined);
    get readOnly(): BooleanElement | undefined;
    set readOnly(readOnly: BooleanElement | undefined);
}

interface JSONSchemaVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const JSONSchemaVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class JSONSchemaVisitor extends JSONSchemaVisitor_base {
    element: JSONSchema;
    protected readonly specPath: SpecPath<['document', 'objects', 'JSONSchema']>;
    constructor(options: JSONSchemaVisitorOptions);
}

interface ParentSchemaAwareVisitorOptions {
    readonly parent: Element;
}
declare class ParentSchemaAwareVisitor {
    parent: Element;
    constructor({ parent }: ParentSchemaAwareVisitorOptions);
}

interface ItemsVisitorOptions extends SpecificationVisitorOptions, ParentSchemaAwareVisitorOptions, VisitorOptions {
}
declare const ItemsVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & ParentSchemaAwareVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof ParentSchemaAwareVisitor & typeof FallbackVisitor>;
declare class ItemsVisitor extends ItemsVisitor_base {
    element: ArrayElement | ObjectElement;
    ObjectElement(objectElement: ObjectElement): {};
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class RequiredVisitor extends FallbackVisitor {
    readonly element: ArrayElement;
    ArrayElement(arrayElement: ArrayElement): {};
}

interface PatternedFieldsVisitorOptions extends SpecificationVisitorOptions {
    readonly specPath: SpecPath;
    readonly ignoredFields?: string[];
    readonly fieldPatternPredicate?: (...args: unknown[]) => boolean;
}
declare class PatternedFieldsVisitor extends SpecificationVisitor {
    protected specPath: SpecPath;
    protected ignoredFields: string[];
    protected fieldPatternPredicate: (value: unknown) => boolean;
    constructor({ specPath, ignoredFields, fieldPatternPredicate, ...rest }: PatternedFieldsVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

interface MapVisitorOptions extends PatternedFieldsVisitorOptions {
}
declare class MapVisitor extends PatternedFieldsVisitor {
    constructor(options: MapVisitorOptions);
}

interface PropertiesVisitorOptions extends MapVisitorOptions, ParentSchemaAwareVisitorOptions, VisitorOptions {
}
declare const PropertiesVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & ParentSchemaAwareVisitor & FallbackVisitor, typeof MapVisitor & typeof ParentSchemaAwareVisitor & typeof FallbackVisitor>;
declare class PropertiesVisitor extends PropertiesVisitor_base {
    readonly element: ObjectElement;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'JSONReference'
    ] | ['document', 'objects', 'JSONSchema']>;
    constructor(options: PropertiesVisitorOptions);
}

interface PatternPropertiesVisitorOptions extends MapVisitorOptions, ParentSchemaAwareVisitorOptions, VisitorOptions {
}
declare const PatternPropertiesVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & ParentSchemaAwareVisitor & FallbackVisitor, typeof MapVisitor & typeof ParentSchemaAwareVisitor & typeof FallbackVisitor>;
declare class PatternPropertiesVisitor extends PatternPropertiesVisitor_base {
    readonly element: ObjectElement;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'JSONReference'
    ] | ['document', 'objects', 'JSONSchema']>;
    constructor(options: PatternPropertiesVisitorOptions);
}

interface DependenciesVisitorOptions extends MapVisitorOptions, ParentSchemaAwareVisitorOptions, VisitorOptions {
}
declare const DependenciesVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & ParentSchemaAwareVisitor & FallbackVisitor, typeof MapVisitor & typeof ParentSchemaAwareVisitor & typeof FallbackVisitor>;
declare class DependenciesVisitor extends DependenciesVisitor_base {
    readonly element: ObjectElement;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'JSONReference'
    ] | ['document', 'objects', 'JSONSchema']>;
    constructor(options: DependenciesVisitorOptions);
}

declare class EnumVisitor extends FallbackVisitor {
    readonly element: ArrayElement;
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class TypeVisitor extends FallbackVisitor {
    readonly element: StringElement | ArrayElement;
    StringElement(stringElement: StringElement): {};
    ArrayElement(arrayElement: ArrayElement): {};
}

interface AllOfVisitorOptions extends SpecificationVisitorOptions, ParentSchemaAwareVisitorOptions, VisitorOptions {
}
declare const AllOfVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & ParentSchemaAwareVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof ParentSchemaAwareVisitor & typeof FallbackVisitor>;
declare class AllOfVisitor extends AllOfVisitor_base {
    readonly element: ArrayElement;
    constructor(options: AllOfVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

interface AnyOfVisitorOptions extends SpecificationVisitorOptions, ParentSchemaAwareVisitorOptions, VisitorOptions {
}
declare const AnyOfVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & ParentSchemaAwareVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof ParentSchemaAwareVisitor & typeof FallbackVisitor>;
declare class AnyOfVisitor extends AnyOfVisitor_base {
    readonly element: ArrayElement;
    constructor(options: AnyOfVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

interface OneOfVisitorOptions extends SpecificationVisitorOptions, ParentSchemaAwareVisitorOptions, VisitorOptions {
}
declare const OneOfVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & ParentSchemaAwareVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof ParentSchemaAwareVisitor & typeof FallbackVisitor>;
declare class OneOfVisitor extends OneOfVisitor_base {
    readonly element: ArrayElement;
    constructor(options: OneOfVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

interface DefinitionsVisitorOptions extends MapVisitorOptions, ParentSchemaAwareVisitorOptions, VisitorOptions {
}
declare const DefinitionsVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & ParentSchemaAwareVisitor & FallbackVisitor, typeof MapVisitor & typeof ParentSchemaAwareVisitor & typeof FallbackVisitor>;
declare class DefinitionsVisitor extends DefinitionsVisitor_base {
    readonly element: ObjectElement;
    protected readonly specPath: SpecPath<[
        'document',
        'objects',
        'JSONReference'
    ] | ['document', 'objects', 'JSONSchema']>;
    constructor(options: DefinitionsVisitorOptions);
}

interface LinksVisitorOptions extends SpecificationVisitorOptions, ParentSchemaAwareVisitorOptions, VisitorOptions {
}
declare const LinksVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & ParentSchemaAwareVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof ParentSchemaAwareVisitor & typeof FallbackVisitor>;
declare class LinksVisitor extends LinksVisitor_base {
    readonly element: ArrayElement;
    constructor(options: LinksVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

interface JSONReferenceVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const JSONReferenceVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class JSONReferenceVisitor extends JSONReferenceVisitor_base {
    readonly element: JSONReference;
    protected readonly specPath: SpecPath<['document', 'objects', 'JSONReference']>;
    constructor(options: JSONReferenceVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

declare class $RefVisitor extends FallbackVisitor {
    readonly element: StringElement;
    StringElement(stringElement: StringElement): {};
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

declare class SchemaOrReferenceVisitor extends AlternatingVisitor {
    constructor(options: AlternatingVisitorOptions);
}

interface MediaVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const MediaVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class MediaVisitor extends MediaVisitor_base {
    readonly element: Media;
    protected readonly specPath: SpecPath<['document', 'objects', 'Media']>;
    constructor(options: MediaVisitorOptions);
}

/**
 * URI: https://datatracker.ietf.org/doc/html/draft-wright-json-schema-hyperschema-00#section-5
 */
declare class LinkDescription extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get href(): StringElement | undefined;
    set href(href: StringElement | undefined);
    get rel(): StringElement | undefined;
    set rel(rel: StringElement | undefined);
    get title(): StringElement | undefined;
    set title(title: StringElement | undefined);
    get targetSchema(): JSONSchema | JSONReference | undefined;
    set targetSchema(targetSchema: JSONSchema | JSONReference | undefined);
    get mediaType(): StringElement | undefined;
    set mediaType(mediaType: StringElement | undefined);
    get method(): StringElement | undefined;
    set method(method: StringElement | undefined);
    get encType(): StringElement | undefined;
    set encType(encType: StringElement | undefined);
    get schema(): JSONSchema | JSONReference | undefined;
    set schema(schema: JSONSchema | JSONReference | undefined);
}

interface LinkDescriptionVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const LinkDescriptionVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class LinkDescriptionVisitor extends LinkDescriptionVisitor_base {
    readonly element: LinkDescription;
    protected readonly specPath: SpecPath<['document', 'objects', 'LinkDescription']>;
    constructor(options: LinkDescriptionVisitorOptions);
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
    visitors: {
        value: typeof FallbackVisitor;
        JSONSchemaOrJSONReferenceVisitor: typeof SchemaOrReferenceVisitor;
        document: {
            objects: {
                JSONSchema: {
                    $visitor: typeof JSONSchemaVisitor;
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
                        additionalItems: typeof SchemaOrReferenceVisitor;
                        items: typeof ItemsVisitor;
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
                        required: typeof RequiredVisitor;
                        properties: typeof PropertiesVisitor;
                        additionalProperties: typeof SchemaOrReferenceVisitor;
                        patternProperties: typeof PatternPropertiesVisitor;
                        dependencies: typeof DependenciesVisitor;
                        enum: typeof EnumVisitor;
                        type: typeof TypeVisitor;
                        allOf: typeof AllOfVisitor;
                        anyOf: typeof AnyOfVisitor;
                        oneOf: typeof OneOfVisitor;
                        not: typeof SchemaOrReferenceVisitor;
                        definitions: typeof DefinitionsVisitor;
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
                        links: typeof LinksVisitor;
                        media: {
                            $ref: string;
                        };
                        readOnly: {
                            $ref: string;
                        };
                    };
                };
                JSONReference: {
                    $visitor: typeof JSONReferenceVisitor;
                    fixedFields: {
                        $ref: typeof $RefVisitor;
                    };
                };
                Media: {
                    $visitor: typeof MediaVisitor;
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
                    $visitor: typeof LinkDescriptionVisitor;
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
                        targetSchema: typeof SchemaOrReferenceVisitor;
                        mediaType: {
                            $ref: string;
                        };
                        method: {
                            $ref: string;
                        };
                        encType: {
                            $ref: string;
                        };
                        schema: typeof SchemaOrReferenceVisitor;
                    };
                };
            };
        };
    };
};

declare const isJSONSchemaElement: _swagger_api_apidom_core.ElementPredicate<JSONSchema>;
declare const isJSONReferenceElement: _swagger_api_apidom_core.ElementPredicate<JSONReference>;
declare const isMediaElement: _swagger_api_apidom_core.ElementPredicate<Media>;
declare const isLinkDescriptionElement: _swagger_api_apidom_core.ElementPredicate<LinkDescription>;

interface JSONReferenceLikeElement extends ObjectElement {
    hasKey: (value: '$ref') => true;
}
declare const isJSONReferenceLikeElement: (element: unknown) => element is JSONReferenceLikeElement;

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
    JSONSchemaDraft4Element: string[];
    JSONReferenceElement: string[];
    MediaElement: string[];
    LinkDescriptionElement: string[];
};

export { AllOfVisitor, type AllOfVisitorOptions, AlternatingVisitor, type AlternatingVisitorOptions, AnyOfVisitor, type AnyOfVisitorOptions, DefinitionsVisitor, type DefinitionsVisitorOptions, DependenciesVisitor, type DependenciesVisitorOptions, EnumVisitor, type VisitorOptions as EnumVisitorOptions, FallbackVisitor, type VisitorOptions as FallbackVisitorOptions, FixedFieldsVisitor, type FixedFieldsVisitorOptions, ItemsVisitor, type ItemsVisitorOptions, $RefVisitor as JSONReference$RefVisitor, type VisitorOptions as JSONReference$RefVisitorOptions, JSONReference as JSONReferenceElement, JSONReferenceVisitor, type JSONReferenceVisitorOptions, JSONSchemaDraft4MediaTypes, JSONSchema as JSONSchemaElement, JSONSchemaVisitor, type JSONSchemaVisitorOptions, LinkDescription as LinkDescriptionElement, LinkDescriptionVisitor, type LinkDescriptionVisitorOptions, LinksVisitor, type LinksVisitorOptions, MapVisitor, type MapVisitorOptions, Media as MediaElement, MediaVisitor, type MediaVisitorOptions, OneOfVisitor, type OneOfVisitorOptions, ParentSchemaAwareVisitor, type ParentSchemaAwareVisitorOptions, PatternPropertiesVisitor, type PatternPropertiesVisitorOptions, PatternedFieldsVisitor, type PatternedFieldsVisitorOptions, PropertiesVisitor, type PropertiesVisitorOptions, RequiredVisitor, type VisitorOptions as RequiredVisitorOptions, SchemaOrReferenceVisitor, type AlternatingVisitorOptions as SchemaOrReferenceVisitorOptions, type SpecPath, SpecificationVisitor, type SpecificationVisitorOptions, TypeVisitor, type VisitorOptions as TypeVisitorOptions, Visitor, type VisitorOptions, createRefractor, jsonSchemaDraft4 as default, getNodeType, isJSONReferenceElement, isJSONReferenceLikeElement, isJSONSchemaElement, isLinkDescriptionElement, isMediaElement, keyMap, mediaTypes, refract, plugin as refractorPluginReplaceEmptyElement, specification as specificationObj };
