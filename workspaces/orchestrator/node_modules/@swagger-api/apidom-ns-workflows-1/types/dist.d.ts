import * as _swagger_api_apidom_core from '@swagger-api/apidom-core';
import { MediaTypes, NamespacePluginOptions, StringElement, Element, MemberElement, ObjectElement, Meta, Attributes, ArrayElement, NumberElement } from '@swagger-api/apidom-core';
export { isArrayElement, isBooleanElement, isElement, isLinkElement as isLinkPrimitiveElement, isMemberElement, isNullElement, isNumberElement, isObjectElement, isRefElement, isStringElement } from '@swagger-api/apidom-core';
import * as minim from 'minim';
import * as _swagger_api_apidom_ns_openapi_3_1 from '@swagger-api/apidom-ns-openapi-3-1';
import { SchemaElement, SchemaVisitorOptions, JsonSchemaDialectElement } from '@swagger-api/apidom-ns-openapi-3-1';
import * as ts_mixer_dist_types_types from 'ts-mixer/dist/types/types';

type Format = 'generic' | 'json' | 'yaml';
declare class WorkflowsMediaTypes extends MediaTypes<string> {
    filterByFormat(format?: Format): string[];
    findBy(version?: string, format?: Format): string;
    latest(format?: Format): string;
}
declare const mediaTypes: WorkflowsMediaTypes;

declare const workflows1: {
    namespace: (options: NamespacePluginOptions) => minim.Namespace;
};

declare const plugin: () => () => {
    visitor: {
        StringElement(element: StringElement, key: any, parent: any, path: any, ancestors: any[]): any;
    };
};

declare const refract: <T extends Element>(value: unknown, { specPath, plugins, }?: {
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

declare const isWorkflowsSpecificationExtension: (element: MemberElement) => boolean;

type SpecPath<T = string[]> = (element: unknown) => T;
interface FixedFieldsVisitorOptions extends SpecificationVisitorOptions {
    readonly specPath: SpecPath;
    readonly ignoredFields?: string[];
    readonly canSupportSpecificationExtensions?: boolean;
    readonly specificationExtensionPredicate?: typeof isWorkflowsSpecificationExtension;
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

declare class WorkflowsSpec extends StringElement {
    constructor(content?: string, meta?: Meta, attributes?: Attributes);
}

declare class Info extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get title(): StringElement | undefined;
    set title(title: StringElement | undefined);
    get summary(): StringElement | undefined;
    set summary(summary: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get version(): StringElement | undefined;
    set version(version: StringElement | undefined);
}

declare class Components extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get inputs(): ObjectElement | undefined;
    set inputs(inputs: ObjectElement | undefined);
    get parameters(): ObjectElement | undefined;
    set parameters(parameters: ObjectElement | undefined);
}

declare class WorkflowsSpecification1 extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get workflowsSpec(): WorkflowsSpec | undefined;
    set workflowsSpec(workflowsSpec: WorkflowsSpec | undefined);
    get info(): Info | undefined;
    set info(info: Info | undefined);
    get sourceDescriptions(): ArrayElement | undefined;
    set sourceDescriptions(sourceDescriptions: ArrayElement | undefined);
    get workflows(): ArrayElement | undefined;
    set workflows(workflows: ArrayElement | undefined);
    get components(): Components | undefined;
    set components(components: Components | undefined);
}

interface WorkflowsSpecificationVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const WorkflowsSpecificationVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class WorkflowsSpecificationVisitor extends WorkflowsSpecificationVisitor_base {
    readonly element: WorkflowsSpecification1;
    protected readonly specPath: SpecPath<['document', 'objects', 'WorkflowsSpecification']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: WorkflowsSpecificationVisitorOptions);
    ObjectElement(objectElement: ObjectElement): {};
}

interface WorkflowsSpecVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const WorkflowsSpecVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class WorkflowsSpecVisitor extends WorkflowsSpecVisitor_base {
    element: WorkflowsSpec;
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
    readonly element: StringElement;
    StringElement(stringElement: StringElement): {};
}

declare class SourceDescription extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get name(): StringElement | undefined;
    set name(name: StringElement | undefined);
    get url(): StringElement | undefined;
    set url(url: StringElement | undefined);
    get type(): StringElement | undefined;
    set type(type: StringElement | undefined);
}

interface SourceDescriptionVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const SourceDescriptionVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class SourceDescriptionVisitor extends SourceDescriptionVisitor_base {
    readonly element: SourceDescription;
    protected readonly specPath: SpecPath<['document', 'objects', 'SourceDescription']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: SourceDescriptionVisitorOptions);
}

declare class UrlVisitor extends FallbackVisitor {
    readonly element: StringElement;
    StringElement(stringElement: StringElement): {};
}

declare class JSONSchema extends SchemaElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    /**
     * We're redefining the getters/setters here so that the following keywords
     * are not part of the OAS base vocabulary, but rather an arbitrary custom dialect.
     */
    get discriminator(): any;
    set discriminator(discriminator: any);
    get xml(): any;
    set xml(xml: any);
    get externalDocs(): any;
    set externalDocs(externalDocs: any);
    get example(): any;
    set example(example: any);
}

declare class Workflow extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get workflowId(): StringElement | undefined;
    set workflowId(workflowId: StringElement | undefined);
    get summary(): StringElement | undefined;
    set summary(summary: StringElement | undefined);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get inputs(): JSONSchema | undefined;
    set inputs(inputs: JSONSchema | undefined);
    get steps(): ArrayElement | undefined;
    set steps(steps: ArrayElement | undefined);
    get outputs(): ObjectElement | undefined;
    set outputs(outputs: ObjectElement | undefined);
}

interface WorkflowVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const WorkflowVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class WorkflowVisitor extends WorkflowVisitor_base {
    readonly element: Workflow;
    protected readonly specPath: SpecPath<['document', 'objects', 'Workflow']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: WorkflowVisitorOptions);
}

declare class WorkflowSteps extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface StepsVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const StepsVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class StepsVisitor extends StepsVisitor_base {
    readonly element: WorkflowSteps;
    constructor(options: StepsVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

interface PatternedFieldsVisitorOptions extends SpecificationVisitorOptions {
    readonly specPath: SpecPath;
    readonly ignoredFields?: string[];
    readonly fieldPatternPredicate?: (...args: unknown[]) => boolean;
    readonly canSupportSpecificationExtensions?: boolean;
    readonly specificationExtensionPredicate?: typeof isWorkflowsSpecificationExtension;
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

declare class WorkflowOutputs extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface OutputsVisitorOptions$1 extends MapVisitorOptions, VisitorOptions {
}
declare const OutputsVisitor_base$1: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class OutputsVisitor$1 extends OutputsVisitor_base$1 {
    readonly element: WorkflowOutputs;
    protected readonly specPath: SpecPath<['value']>;
    constructor(options: OutputsVisitorOptions$1);
}

declare class Step extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get description(): StringElement | undefined;
    set description(description: StringElement | undefined);
    get stepId(): StringElement | undefined;
    set stepId(stepId: StringElement | undefined);
    get operationId(): StringElement | undefined;
    set operationId(operationId: StringElement | undefined);
    get operationRef(): StringElement | undefined;
    set operationRef(operationRef: StringElement | undefined);
    get workflowId(): StringElement | undefined;
    set workflowId(workflowId: StringElement | undefined);
    get parameters(): ArrayElement | undefined;
    set parameters(parameters: ArrayElement | undefined);
    get dependsOn(): ArrayElement | undefined;
    set dependsOn(dependsOn: ArrayElement | undefined);
    get successCriteria(): ArrayElement | undefined;
    set successCriteria(successCriteria: ArrayElement | undefined);
    get onSuccess(): ArrayElement | undefined;
    set onSuccess(onSuccess: ArrayElement | undefined);
    get onFailure(): ArrayElement | undefined;
    set onFailure(onFailure: ArrayElement | undefined);
    get outputs(): ObjectElement | undefined;
    set outputs(outputs: ObjectElement | undefined);
}

interface StepVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const StepVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class StepVisitor extends StepVisitor_base {
    readonly element: Step;
    protected readonly specPath: SpecPath<['document', 'objects', 'Step']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: StepVisitorOptions);
}

declare class StepOutputs extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface OutputsVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const OutputsVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class OutputsVisitor extends OutputsVisitor_base {
    readonly element: StepOutputs;
    protected readonly specPath: SpecPath<['value']>;
    constructor(options: OutputsVisitorOptions);
}

declare class StepParameters extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface ParametersVisitorOptions$2 extends SpecificationVisitorOptions, VisitorOptions {
}
declare const ParametersVisitor_base$2: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class ParametersVisitor$2 extends ParametersVisitor_base$2 {
    readonly element: StepParameters;
    constructor(options: ParametersVisitorOptions$2);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class StepDependsOn extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface DependsOnVisitorOptions extends VisitorOptions {
}
declare class DependsOnVisitor extends FallbackVisitor {
    element: StepDependsOn;
    constructor(options: DependsOnVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class StepSuccessCriteria extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface SuccessCriteriaVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const SuccessCriteriaVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class SuccessCriteriaVisitor extends SuccessCriteriaVisitor_base {
    readonly element: StepSuccessCriteria;
    constructor(options: SuccessCriteriaVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class StepOnSuccess extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface OnSuccessVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const OnSuccessVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class OnSuccessVisitor extends OnSuccessVisitor_base {
    readonly element: StepOnSuccess;
    constructor(options: OnSuccessVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class StepOnFailure extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface OnFailureVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const OnFailureVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class OnFailureVisitor extends OnFailureVisitor_base {
    readonly element: StepOnFailure;
    constructor(options: OnFailureVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class Parameter extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get name(): StringElement | undefined;
    set name(name: StringElement | undefined);
    get in(): StringElement | undefined;
    set in(val: StringElement | undefined);
    get style(): StringElement | undefined;
    set style(style: StringElement | undefined);
    get target(): StringElement | undefined;
    set target(target: StringElement | undefined);
    get value(): Element | undefined;
    set value(value: Element | undefined);
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

declare class SourceDescriptions extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface SourceDescriptionsVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const SourceDescriptionsVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class SourceDescriptionsVisitor extends SourceDescriptionsVisitor_base {
    readonly element: SourceDescriptions;
    constructor(options: SourceDescriptionsVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class Workflows extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface WorkflowsVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const WorkflowsVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class WorkflowsVisitor extends WorkflowsVisitor_base {
    readonly element: Workflows;
    constructor(options: WorkflowsVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class SuccessAction extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get type(): StringElement | undefined;
    set type(type: StringElement | undefined);
    get workflowId(): StringElement | undefined;
    set workflowId(workflowId: StringElement | undefined);
    get stepId(): StringElement | undefined;
    set stepId(stepId: StringElement | undefined);
    get criteria(): ArrayElement | undefined;
    set criteria(criteria: ArrayElement | undefined);
}

interface SuccessActionVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const SuccessActionVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class SuccessActionVisitor extends SuccessActionVisitor_base {
    readonly element: SuccessAction;
    protected readonly specPath: SpecPath<['document', 'objects', 'SuccessAction']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: SuccessActionVisitorOptions);
}

declare class SuccessActionCriteria extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface SuccessActionCriteriaVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const SuccessActionCriteriaVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class SuccessActionCriteriaVisitor extends SuccessActionCriteriaVisitor_base {
    readonly element: SuccessActionCriteria;
    constructor(options: SuccessActionCriteriaVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare class FailureAction extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get type(): StringElement | undefined;
    set type(type: StringElement | undefined);
    get workflowId(): StringElement | undefined;
    set workflowId(workflowId: StringElement | undefined);
    get stepId(): StringElement | undefined;
    set stepId(stepId: StringElement | undefined);
    get retryAfter(): NumberElement | undefined;
    set retryAfter(retryAfter: NumberElement | undefined);
    get retryLimit(): NumberElement | undefined;
    set retryLimit(retryLimit: NumberElement | undefined);
    get criteria(): ArrayElement | undefined;
    set criteria(criteria: ArrayElement | undefined);
}

interface FailureActionVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const FailureActionVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class FailureActionVisitor extends FailureActionVisitor_base {
    readonly element: FailureAction;
    protected readonly specPath: SpecPath<['document', 'objects', 'FailureAction']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: FailureActionVisitorOptions);
}

declare class FailureActionCriteria extends ArrayElement {
    static primaryClass: string;
    constructor(content?: Array<unknown>, meta?: Meta, attributes?: Attributes);
}

interface FailureActionCriteriaVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const FailureActionCriteriaVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class FailureActionCriteriaVisitor extends FailureActionCriteriaVisitor_base {
    readonly element: FailureActionCriteria;
    constructor(options: FailureActionCriteriaVisitorOptions);
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

declare class ComponentsInputs extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface InputsVisitorOptions extends MapVisitorOptions, VisitorOptions {
}
declare const InputsVisitor_base: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class InputsVisitor extends InputsVisitor_base {
    readonly element: ComponentsInputs;
    protected readonly specPath: SpecPath<['document', 'objects', 'JSONSchema']>;
    constructor(options: InputsVisitorOptions);
}

declare class ComponentsParameters extends ObjectElement {
    static primaryClass: string;
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
}

interface ParametersVisitorOptions$1 extends MapVisitorOptions, VisitorOptions {
}
declare const ParametersVisitor_base$1: ts_mixer_dist_types_types.Class<any[], MapVisitor & FallbackVisitor, typeof MapVisitor & typeof FallbackVisitor>;
declare class ParametersVisitor$1 extends ParametersVisitor_base$1 {
    readonly element: ComponentsParameters;
    protected readonly specPath: SpecPath<['document', 'objects', 'Parameter']>;
    constructor(options: ParametersVisitorOptions$1);
}

declare class Criterion extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get context(): StringElement | undefined;
    set context(context: StringElement | undefined);
    get condition(): StringElement | undefined;
    set condition(condition: StringElement | undefined);
    get type(): StringElement | undefined;
    set type(type: StringElement | undefined);
}

interface CriterionVisitorOptions extends FixedFieldsVisitorOptions, VisitorOptions {
}
declare const CriterionVisitor_base: ts_mixer_dist_types_types.Class<any[], FixedFieldsVisitor & FallbackVisitor, typeof FixedFieldsVisitor & typeof FallbackVisitor>;
declare class CriterionVisitor extends CriterionVisitor_base {
    readonly element: Criterion;
    protected readonly specPath: SpecPath<['document', 'objects', 'Criterion']>;
    protected readonly canSupportSpecificationExtensions: true;
    constructor(options: CriterionVisitorOptions);
}

declare class Reference extends ObjectElement {
    constructor(content?: Record<string, unknown>, meta?: Meta, attributes?: Attributes);
    get $ref(): StringElement | undefined;
    set $ref($ref: StringElement | undefined);
    get value(): StringElement | undefined;
    set value(value: StringElement | undefined);
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

declare const SchemaVisitor: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaVisitor;
type JSONSchemaVisitorOptions = SchemaVisitorOptions;
declare class JSONSchemaVisitor extends SchemaVisitor {
    readonly element: JSONSchema;
    protected readonly specPath: SpecPath<['document', 'objects', 'JSONSchema']>;
    protected readonly canSupportSpecificationExtensions: false;
    protected readonly jsonSchemaDefaultDialect: JsonSchemaDialectElement;
    constructor(options: JSONSchemaVisitorOptions);
}

declare class SpecificationExtensionVisitor extends SpecificationVisitor {
    element: MemberElement;
    MemberElement(memberElement: MemberElement): {};
}

declare const specification: {
    readonly visitors: {
        readonly value: typeof FallbackVisitor;
        readonly document: {
            readonly objects: {
                readonly WorkflowsSpecification: {
                    readonly $visitor: typeof WorkflowsSpecificationVisitor;
                    readonly fixedFields: {
                        readonly workflowSpec: typeof WorkflowsSpecVisitor;
                        readonly info: {
                            readonly $ref: "#/visitors/document/objects/Info";
                        };
                        readonly sourceDescriptions: typeof SourceDescriptionsVisitor;
                        readonly workflows: typeof WorkflowsVisitor;
                        readonly components: {
                            readonly $ref: "#/visitors/document/objects/Components";
                        };
                    };
                };
                readonly Info: {
                    readonly $visitor: typeof InfoVisitor;
                    readonly fixedFields: {
                        readonly title: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly summary: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly version: typeof VersionVisitor;
                    };
                };
                readonly SourceDescription: {
                    readonly $visitor: typeof SourceDescriptionVisitor;
                    readonly fixedFields: {
                        readonly name: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly url: typeof UrlVisitor;
                        readonly type: {
                            readonly $ref: "#/visitors/value";
                        };
                    };
                };
                readonly Workflow: {
                    readonly $visitor: typeof WorkflowVisitor;
                    readonly fixedFields: {
                        readonly workflowId: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly summary: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly inputs: typeof JSONSchemaVisitor;
                        readonly steps: typeof StepsVisitor;
                        readonly outputs: typeof OutputsVisitor$1;
                    };
                };
                readonly Step: {
                    readonly $visitor: typeof StepVisitor;
                    readonly fixedFields: {
                        readonly description: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly stepId: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly operationId: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly operationRef: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly workflowId: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly parameters: typeof ParametersVisitor$2;
                        readonly dependsOn: typeof DependsOnVisitor;
                        readonly successCriteria: typeof SuccessCriteriaVisitor;
                        readonly onSuccess: typeof OnSuccessVisitor;
                        readonly onFailure: typeof OnFailureVisitor;
                        readonly outputs: typeof OutputsVisitor;
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
                        readonly style: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly target: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly value: {
                            readonly $ref: "#/visitors/value";
                        };
                    };
                };
                readonly SuccessAction: {
                    readonly $visitor: typeof SuccessActionVisitor;
                    readonly fixedFields: {
                        readonly type: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly workflowId: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly stepId: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly criteria: typeof SuccessActionCriteriaVisitor;
                    };
                };
                readonly FailureAction: {
                    readonly $visitor: typeof FailureActionVisitor;
                    readonly fixedFields: {
                        readonly type: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly workflowId: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly stepId: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly retryAfter: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly retryLimit: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly criteria: typeof FailureActionCriteriaVisitor;
                    };
                };
                readonly Components: {
                    readonly $visitor: typeof ComponentsVisitor;
                    readonly fixedFields: {
                        readonly inputs: typeof InputsVisitor;
                        readonly parameters: typeof ParametersVisitor$1;
                    };
                };
                readonly Criterion: {
                    readonly $visitor: typeof CriterionVisitor;
                    readonly fixedFields: {
                        readonly context: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly condition: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly type: {
                            readonly $ref: "#/visitors/value";
                        };
                    };
                };
                readonly Reference: {
                    readonly $visitor: typeof ReferenceVisitor;
                    readonly fixedFields: {
                        readonly $ref: typeof $RefVisitor;
                        readonly value: {
                            readonly $ref: "#/visitors/value";
                        };
                    };
                };
                readonly Schema: {
                    /**
                     * Internally the fixed field visitors are using references to `/document/objects/Schema`.
                     * Schema spec make sure it's pointing to our JSONSchema visitor and basically acts like
                     * an alias for it.
                     */
                    readonly $visitor: typeof JSONSchemaVisitor;
                    readonly fixedFields: Omit<{
                        readonly $schema: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly $vocabulary: typeof _swagger_api_apidom_ns_openapi_3_1.Schema$vocabularyVisitor;
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
                        readonly $ref: typeof _swagger_api_apidom_ns_openapi_3_1.Schema$refVisitor;
                        readonly $defs: typeof _swagger_api_apidom_ns_openapi_3_1.Schema$defsVisitor;
                        readonly $comment: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly allOf: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaAllOfVisitor;
                        readonly anyOf: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaAnyOfVisitor;
                        readonly oneOf: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaOneOfVisitor;
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
                        readonly dependentSchemas: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaDependentSchemasVisitor;
                        readonly prefixItems: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaPrefixItemsVisitor;
                        readonly items: {
                            readonly $ref: "#/visitors/document/objects/Schema";
                        };
                        readonly contains: {
                            readonly $ref: "#/visitors/document/objects/Schema";
                        };
                        readonly properties: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaPropertiesVisitor;
                        readonly patternProperties: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaPatternPropertiesVisitor;
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
                        readonly type: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaTypeVisitor;
                        readonly enum: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaEnumVisitor;
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
                        readonly dependentRequired: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaDependentRequiredVisitor;
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
                        readonly examples: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaExamplesVisitor;
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
                    }, "discriminator" | "xml" | "externalDocs" | "example">;
                };
                readonly JSONSchema: {
                    readonly $visitor: typeof JSONSchemaVisitor;
                    readonly fixedFields: Omit<{
                        readonly $schema: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly $vocabulary: typeof _swagger_api_apidom_ns_openapi_3_1.Schema$vocabularyVisitor;
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
                        readonly $ref: typeof _swagger_api_apidom_ns_openapi_3_1.Schema$refVisitor;
                        readonly $defs: typeof _swagger_api_apidom_ns_openapi_3_1.Schema$defsVisitor;
                        readonly $comment: {
                            readonly $ref: "#/visitors/value";
                        };
                        readonly allOf: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaAllOfVisitor;
                        readonly anyOf: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaAnyOfVisitor;
                        readonly oneOf: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaOneOfVisitor;
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
                        readonly dependentSchemas: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaDependentSchemasVisitor;
                        readonly prefixItems: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaPrefixItemsVisitor;
                        readonly items: {
                            readonly $ref: "#/visitors/document/objects/Schema";
                        };
                        readonly contains: {
                            readonly $ref: "#/visitors/document/objects/Schema";
                        };
                        readonly properties: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaPropertiesVisitor;
                        readonly patternProperties: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaPatternPropertiesVisitor;
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
                        readonly type: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaTypeVisitor;
                        readonly enum: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaEnumVisitor;
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
                        readonly dependentRequired: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaDependentRequiredVisitor;
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
                        readonly examples: typeof _swagger_api_apidom_ns_openapi_3_1.SchemaExamplesVisitor;
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
                    }, "discriminator" | "xml" | "externalDocs" | "example">;
                };
            };
            readonly extension: {
                readonly $visitor: typeof SpecificationExtensionVisitor;
            };
        };
    };
};

interface ParametersVisitorOptions extends SpecificationVisitorOptions, VisitorOptions {
}
declare const ParametersVisitor_base: ts_mixer_dist_types_types.Class<any[], SpecificationVisitor & FallbackVisitor, typeof SpecificationVisitor & typeof FallbackVisitor>;
declare class ParametersVisitor extends ParametersVisitor_base {
    readonly element: ArrayElement;
    constructor(options: ParametersVisitorOptions);
    ArrayElement(arrayElement: ArrayElement): {};
}

declare const isWorkflowsSpecElement: _swagger_api_apidom_core.ElementPredicate<WorkflowsSpec>;
declare const isWorkflowsSpecification1Element: _swagger_api_apidom_core.ElementPredicate<WorkflowsSpecification1>;
declare const isInfoElement: _swagger_api_apidom_core.ElementPredicate<Info>;
declare const isSourceDescriptionElement: _swagger_api_apidom_core.ElementPredicate<SourceDescription>;
declare const isSourceDescriptionsElement: _swagger_api_apidom_core.ElementPredicate<SourceDescriptions>;
declare const isWorkflowStepsElement: _swagger_api_apidom_core.ElementPredicate<WorkflowSteps>;
declare const isWorkflowOutputsElement: _swagger_api_apidom_core.ElementPredicate<WorkflowOutputs>;
declare const isWorkflowElement: _swagger_api_apidom_core.ElementPredicate<Workflow>;
declare const isStepOnSuccessElement: _swagger_api_apidom_core.ElementPredicate<StepOnSuccess>;
declare const isStepOnFailureElement: _swagger_api_apidom_core.ElementPredicate<StepOnFailure>;
declare const isStepOutputsElement: _swagger_api_apidom_core.ElementPredicate<StepOutputs>;
declare const isStepElement: _swagger_api_apidom_core.ElementPredicate<Step>;
declare const isStepParametersElement: _swagger_api_apidom_core.ElementPredicate<StepParameters>;
declare const isStepDependsOnElement: _swagger_api_apidom_core.ElementPredicate<StepDependsOn>;
declare const isStepSuccessCriteriaElement: _swagger_api_apidom_core.ElementPredicate<StepSuccessCriteria>;
declare const isParameterElement: _swagger_api_apidom_core.ElementPredicate<Parameter>;
declare const isSuccessActionElement: _swagger_api_apidom_core.ElementPredicate<SuccessAction>;
declare const isComponentsElement: _swagger_api_apidom_core.ElementPredicate<Components>;
declare const isCriterionElement: _swagger_api_apidom_core.ElementPredicate<Criterion>;
declare const isReferenceElement: _swagger_api_apidom_core.ElementPredicate<Reference>;
declare const isSuccessActionCriteriaElement: _swagger_api_apidom_core.ElementPredicate<SuccessActionCriteria>;
declare const isFailureActionElement: _swagger_api_apidom_core.ElementPredicate<FailureAction>;
declare const isFailureActionCriteriaElement: _swagger_api_apidom_core.ElementPredicate<FailureActionCriteria>;
declare const isJSONSchemaElement: _swagger_api_apidom_core.ElementPredicate<JSONSchema>;

declare const getNodeType: <T extends Element>(element: T) => string | undefined;
/**
 * Workflows Specification 1.0.0
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
    WorkflowsSpecification1Element: string[];
    InfoElement: string[];
    SourceDescriptionElement: string[];
    WorkflowElement: string[];
    StepElement: string[];
    ParameterElement: string[];
    SuccessActionElement: string[];
    FailureActionElement: string[];
    ComponentsElement: string[];
    CriterionElement: string[];
    ReferenceElement: string[];
    JSONSchemaDraft202012Element: string[];
};

export { Components as ComponentsElement, InputsVisitor as ComponentsInputsVisitor, type InputsVisitorOptions as ComponentsInputsVisitorOptions, ComponentsParameters, ParametersVisitor$1 as ComponentsParametersVisitor, type ParametersVisitorOptions$1 as ComponentsParametersVisitorOptions, ComponentsInputs as ComponentsSchemas, ComponentsVisitor, type ComponentsVisitorOptions, Criterion as CriterionElement, CriterionVisitor, type CriterionVisitorOptions, FailureActionCriteria as FailureActionCriteriaElement, FailureActionCriteriaVisitor, type FailureActionCriteriaVisitorOptions, FailureAction as FailureActionElement, type FailureActionVisitorOptions, FailureActionVisitor as FailureVisitor, FallbackVisitor, type VisitorOptions as FallbackVisitorOptions, FixedFieldsVisitor, type FixedFieldsVisitorOptions, Info as InfoElement, VersionVisitor as InfoVersionVisitor, type VisitorOptions as InfoVersionVisitorOptions, InfoVisitor, type InfoVisitorOptions, JSONSchema as JSONSchemaElement, JSONSchemaVisitor, type JSONSchemaVisitorOptions, MapVisitor, type MapVisitorOptions, Parameter as ParameterElement, ParameterVisitor, type ParameterVisitorOptions, PatternedFieldsVisitor, type PatternedFieldsVisitorOptions, $RefVisitor as Reference$RefVisitor, type VisitorOptions as Reference$RefVisitorOptions, Reference as ReferenceElement, ReferenceVisitor, type ReferenceVisitorOptions, SourceDescription as SourceDescriptionElement, type SourceDescriptionVisitorOptions, SourceDescriptions as SourceDescriptionsElement, UrlVisitor as SourceDescriptionsUrlVisitor, type VisitorOptions as SourceDescriptionsUrlVisitorOptions, SourceDescriptionVisitor as SourceDescriptionsVisitor, SpecificationExtensionVisitor, type SpecificationVisitorOptions as SpecificationExtensionVisitorOptions, SpecificationVisitor, type SpecificationVisitorOptions, StepDependsOn as StepDependsOnElement, DependsOnVisitor as StepDependsOnVisitor, type DependsOnVisitorOptions as StepDependsOnVisitorOptions, Step as StepElement, StepOnFailure as StepOnFailureElement, OnFailureVisitor as StepOnFailureVisitor, type OnFailureVisitorOptions as StepOnFailureVisitorOptions, StepOnSuccess as StepOnSuccessElement, OnSuccessVisitor as StepOnSuccessVisitor, type OnSuccessVisitorOptions as StepOnSuccessVisitorOptions, StepOutputs as StepOutputsElement, OutputsVisitor as StepOutputsVisitor, type OutputsVisitorOptions as StepOutputsVisitorOptions, StepParameters as StepParametersElement, ParametersVisitor$2 as StepParametersVisitor, type ParametersVisitorOptions$2 as StepParametersVisitorOptions, StepSuccessCriteria as StepSuccessCriteriaElement, SuccessCriteriaVisitor as StepSuccessCriteriaVisitor, type SuccessCriteriaVisitorOptions as StepSuccessCriteriaVisitorOptions, type StepVisitorOptions, StepVisitor as StepsVisitor, SuccessActionCriteria as SuccessActionCriteriaElement, SuccessAction as SuccessActionElement, SuccessActionVisitor, type SuccessActionVisitorOptions, Visitor, type VisitorOptions, Workflow as WorkflowElement, WorkflowOutputs as WorkflowOutputsElement, OutputsVisitor$1 as WorkflowOutputsVisitor, type OutputsVisitorOptions$1 as WorkflowOutputsVisitorOptions, WorkflowSteps as WorkflowStepsElement, StepsVisitor as WorkflowStepsVisitor, type StepsVisitorOptions as WorkflowStepsVisitorOptions, WorkflowVisitor, type WorkflowVisitorOptions, Workflows as WorkflowsElement, WorkflowsMediaTypes, ParametersVisitor as WorkflowsParametersVisitor, type ParametersVisitorOptions as WorkflowsParametersVisitorOptions, SourceDescriptionsVisitor as WorkflowsSourceDescriptionsVisitor, type SourceDescriptionsVisitorOptions as WorkflowsSourceDescriptionsVisitorOptions, WorkflowsSpec as WorkflowsSpecElement, WorkflowsSpecVisitor, type WorkflowsSpecVisitorOptions, WorkflowsSpecification1 as WorkflowsSpecification1Element, WorkflowsSpecificationVisitor, type WorkflowsSpecificationVisitorOptions, SuccessActionCriteriaVisitor as WorkflowsSuccessActionCriteriaVisitor, type SuccessActionCriteriaVisitorOptions as WorkflowsSuccessActionCriteriaVisitorOptions, WorkflowsVisitor, type WorkflowsVisitorOptions, createRefractor, workflows1 as default, getNodeType, isComponentsElement, isCriterionElement, isFailureActionCriteriaElement, isFailureActionElement, isInfoElement, isJSONSchemaElement, isParameterElement, isReferenceElement, isSourceDescriptionElement, isSourceDescriptionsElement, isStepDependsOnElement, isStepElement, isStepOnFailureElement, isStepOnSuccessElement, isStepOutputsElement, isStepParametersElement, isStepSuccessCriteriaElement, isSuccessActionCriteriaElement, isSuccessActionElement, isWorkflowElement, isWorkflowOutputsElement, isWorkflowStepsElement, isWorkflowsSpecElement, isWorkflowsSpecification1Element, isWorkflowsSpecificationExtension, keyMap, mediaTypes, refract, plugin as refractorPluginReplaceEmptyElement, specification as specificationObj };
