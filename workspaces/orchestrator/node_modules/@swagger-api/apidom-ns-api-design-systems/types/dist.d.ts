import * as _swagger_api_apidom_core from '@swagger-api/apidom-core';
import { MediaTypes, NamespacePluginOptions, ObjectElement, Meta, Attributes, StringElement, ArrayElement, AnnotationElement, Element } from '@swagger-api/apidom-core';
export { isArrayElement, isBooleanElement, isElement, isLinkElement, isMemberElement, isNullElement, isNumberElement, isObjectElement, isRefElement, isStringElement } from '@swagger-api/apidom-core';
import * as minim from 'minim';
import { OperationElement, ParameterElement, RequestBodyElement, ResponseElement, OpenApi3_1Element } from '@swagger-api/apidom-ns-openapi-3-1';
import * as ts_mixer_dist_types_types from 'ts-mixer/dist/types/types';

type Format = 'generic' | 'json' | 'yaml';
declare class ApiDesignSystemsMediaTypes extends MediaTypes<string> {
    filterByFormat(format?: Format): string[];
    findBy(version?: string, format?: Format): string;
    latest(format?: Format): string;
}
declare const mediaTypes: ApiDesignSystemsMediaTypes;

declare const apiDesignSystems: {
    namespace: (options: NamespacePluginOptions) => minim.Namespace;
};

declare const plugin$1: () => () => {
    visitor: {
        OperationElement: {
            enter(element: OperationElement, ...rest: any): void;
            leave(element: OperationElement): void;
        };
        ParameterElement(element: ParameterElement): void;
        RequestBodyElement(element: RequestBodyElement): void;
        ResponseElement: {
            enter(element: ResponseElement): void;
            leave(element: ResponseElement): void;
        };
    };
};

declare const plugin: () => () => {
    visitor: {
        OperationElement(element: OperationElement, ...rest: any): void;
        ParameterElement(element: ParameterElement): void;
        RequestBodyElement(element: RequestBodyElement): void;
        ResponseElement(element: ResponseElement): void;
    };
};

declare class Info extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get title(): StringElement | undefined;
    set title(title: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
}

declare class Main extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get version(): StringElement | undefined;
    set version(version: StringElement | undefined);
    get info(): Info | undefined;
    set info(info: Info | undefined);
    get principles(): ArrayElement | undefined;
    set principles(principles: ArrayElement | undefined);
    get standards(): ArrayElement | undefined;
    set standards(standards: ArrayElement | undefined);
    get scenarios(): ArrayElement | undefined;
    set scenarios(scenarios: ArrayElement | undefined);
}

declare const validate: (mainElement: Main, openApiElement: OpenApi3_1Element) => AnnotationElement[];

declare class RequirementLevel extends StringElement {
    constructor(content?: string, meta?: Meta, attributes?: Attributes);
}

declare class Principle extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get name(): StringElement | undefined;
    set name(name: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get iri(): StringElement | undefined;
    set iri(iri: StringElement | undefined);
    get level(): RequirementLevel | undefined;
    set level(level: RequirementLevel | undefined);
}

declare class StandardIdentifier extends ArrayElement {
    constructor(content?: string[], meta?: Meta, attributes?: Attributes);
}

declare class Requirement extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get subject(): StandardIdentifier;
    set subject(subject: StandardIdentifier);
    get level(): RequirementLevel;
    set level(level: RequirementLevel);
    get values(): ArrayElement | undefined;
    set values(values: ArrayElement | undefined);
    get follows(): StringElement | undefined;
    set follows(follows: StringElement | undefined);
}

declare class Scenario extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get when(): StandardIdentifier;
    set when(when: StandardIdentifier);
    get then(): ArrayElement | undefined;
    set then(then: ArrayElement | undefined);
}

declare class Standard extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get name(): StringElement | undefined;
    set name(name: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get iri(): StringElement | undefined;
    set iri(iri: StringElement | undefined);
    get level(): RequirementLevel | undefined;
    set level(level: RequirementLevel | undefined);
}

declare const isMainElement: _swagger_api_apidom_core.ElementPredicate<Main>;
declare const isInfoElement: _swagger_api_apidom_core.ElementPredicate<Info>;
declare const isPrincipleElement: _swagger_api_apidom_core.ElementPredicate<Principle>;
declare const isRequirementElement: _swagger_api_apidom_core.ElementPredicate<Requirement>;
declare const isRequirementLevelElement: _swagger_api_apidom_core.ElementPredicate<RequirementLevel>;
declare const isScenarioElement: _swagger_api_apidom_core.ElementPredicate<Scenario>;
declare const isStandardElement: _swagger_api_apidom_core.ElementPredicate<Standard>;
declare const isStandardIdentifierElement: _swagger_api_apidom_core.ElementPredicate<StandardIdentifier>;

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

interface RequirementLevelVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const RequirementLevelVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class RequirementLevelVisitor extends RequirementLevelVisitor_base {
    element: RequirementLevel;
    StringElement(stringElement: StringElement): {};
}

interface StandardIdentifierVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const StandardIdentifierVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class StandardIdentifierVisitor extends StandardIdentifierVisitor_base {
    readonly element: StandardIdentifier;
    constructor(options: StandardIdentifierVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

interface RequirementVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const RequirementVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class RequirementVisitor extends RequirementVisitor_base {
    readonly element: Requirement;
    protected readonly specPath: SpecPath<['document', 'objects', 'Requirement']>;
    constructor(options: RequirementVisitorOptions);
}

interface ScenarioVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const ScenarioVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class ScenarioVisitor extends ScenarioVisitor_base {
    readonly element: Scenario;
    protected readonly specPath: SpecPath<['document', 'objects', 'Scenario']>;
    constructor(options: ScenarioVisitorOptions);
}

interface ThenVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const ThenVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class ThenVisitor extends ThenVisitor_base {
    readonly element: ArrayElement;
    constructor(options: ThenVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

interface StandardVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const StandardVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class StandardVisitor extends StandardVisitor_base {
    readonly element: Standard;
    protected readonly specPath: SpecPath<['document', 'objects', 'Standard']>;
    constructor(options: StandardVisitorOptions);
}

interface PrincipleVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const PrincipleVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class PrincipleVisitor extends PrincipleVisitor_base {
    readonly element: Principle;
    protected readonly specPath: SpecPath<['document', 'objects', 'Principle']>;
    constructor(options: PrincipleVisitorOptions);
}

interface InfoVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const InfoVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class InfoVisitor extends InfoVisitor_base {
    readonly element: Info;
    constructor(options: InfoVisitorOptions);
}

interface MainVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const MainVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class MainVisitor extends MainVisitor_base {
    readonly element: Main;
    protected readonly specPath: SpecPath<['document', 'objects', 'Main']>;
    constructor(options: MainVisitorOptions);
}

interface PrinciplesVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const PrinciplesVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class PrinciplesVisitor extends PrinciplesVisitor_base {
    readonly element: ArrayElement;
    constructor(options: PrinciplesVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

interface StandardsVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const StandardsVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class StandardsVisitor extends StandardsVisitor_base {
    readonly element: ArrayElement;
    constructor(options: StandardsVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

interface ScenariosVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const ScenariosVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class ScenariosVisitor extends ScenariosVisitor_base {
    readonly element: ArrayElement;
    constructor(options: ScenariosVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
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
        document: {
            objects: {
                /**
                 * API Design Systems 2021-05-07 specification elements.
                 */
                Main: {
                    $visitor: typeof MainVisitor;
                    fixedFields: {
                        version: {
                            $ref: string;
                        };
                        info: {
                            $ref: string;
                        };
                        principles: typeof PrinciplesVisitor;
                        standards: typeof StandardsVisitor;
                        scenarios: typeof ScenariosVisitor;
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
                    };
                };
                Principle: {
                    $visitor: typeof PrincipleVisitor;
                    fixedFields: {
                        name: {
                            $ref: string;
                        };
                        description: {
                            $ref: string;
                        };
                        iri: {
                            $ref: string;
                        };
                        level: {
                            $ref: string;
                        };
                    };
                };
                Standard: {
                    $visitor: typeof StandardVisitor;
                    fixedFields: {
                        name: {
                            $ref: string;
                        };
                        description: {
                            $ref: string;
                        };
                        level: {
                            $ref: string;
                        };
                        iri: {
                            $ref: string;
                        };
                    };
                };
                Scenario: {
                    $visitor: typeof ScenarioVisitor;
                    fixedFields: {
                        description: {
                            $ref: string;
                        };
                        when: {
                            $ref: string;
                        };
                        then: typeof ThenVisitor;
                    };
                };
                Requirement: {
                    $visitor: typeof RequirementVisitor;
                    fixedFields: {
                        subject: {
                            $ref: string;
                        };
                        level: {
                            $ref: string;
                        };
                        values: {
                            $ref: string;
                        };
                        follows: {
                            $ref: string;
                        };
                    };
                };
                StandardIdentifier: {
                    $visitor: typeof StandardIdentifierVisitor;
                };
                RequirementLevel: {
                    $visitor: typeof RequirementLevelVisitor;
                };
            };
        };
    };
};

/**
 * This is a base class for every visitor that does
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
    /**
     * API Design Systems 2021-05-07 specification elements.
     */
    MainElement: string[];
    InfoElement: string[];
    PrincipleElement: string[];
    StandardElement: string[];
    ScenarioElement: string[];
    RequirementElement: string[];
    StandardIdentifierElement: string[];
    RequirementLevelElement: never[];
};

export { ApiDesignSystemsMediaTypes, FallbackVisitor, type VisitorOptions as FallbackVisitorOptions, FixedFieldsVisitor, type FixedFieldsVisitorOptions, Info as InfoElement, InfoVisitor, type InfoVisitorOptions, Main as MainElement, PrinciplesVisitor as MainPrinciplesVisitor, type PrinciplesVisitorOptions as MainPrinciplesVisitorOptions, ScenariosVisitor as MainScenariosVisitor, type ScenariosVisitorOptions as MainScenariosVisitorOptions, StandardsVisitor as MainStandardsVisitor, type StandardsVisitorOptions as MainStandardsVisitorOptions, MainVisitor, type MainVisitorOptions, Principle as PrincipleElement, PrincipleVisitor, type PrincipleVisitorOptions, Requirement as RequirementElement, RequirementLevel as RequirementLevelElement, RequirementLevelVisitor, type RequirementLevelVisitorOptions, RequirementVisitor, type RequirementVisitorOptions, Scenario as ScenarioElement, ThenVisitor as ScenarioThenVisitor, type ThenVisitorOptions as ScenarioThenVisitorOptions, ScenarioVisitor, type ScenarioVisitorOptions, type SpecPath, SpecificationVisitor, type SpecificationVisitorOptions, Standard as StandardElement, StandardIdentifier as StandardIdentifierElement, StandardIdentifierVisitor, type StandardIdentifierVisitorOptions, StandardVisitor, type StandardVisitorOptions, Visitor, type VisitorOptions, apiDesignSystems as default, getNodeType, isInfoElement, isMainElement, isPrincipleElement, isRequirementElement, isRequirementLevelElement, isScenarioElement, isStandardElement, isStandardIdentifierElement, keyMap, mediaTypes, plugin as refractPluginOpenApi3_1StandardIdentifierAccessors, plugin$1 as refractPluginOpenApi3_1StandardIdentifierSelectors, validate as validateOpenAPI3_1 };
