/// <reference path="./minim.d.ts" />
import * as minim from "minim";
import { Namespace as Namespace$1, NamespacePlugin, StringElement, Meta, Attributes, ArrayElement, Element, ArraySlice, NumberElement, NullElement, BooleanElement, ObjectElement, MemberElement, LinkElement, RefElement, KeyValuePair, ObjectSlice } from 'minim';
export { ArrayElement, ArraySlice, Attributes, BooleanElement, Element, KeyValuePair, LinkElement, MemberElement, Meta, NamespacePluginOptions, NullElement, NumberElement, ObjectElement, ObjectSlice, RefElement, StringElement, refract } from 'minim';
import { ApiDOMStructuredError, ApiDOMErrorOptions } from '@swagger-api/apidom-error';
import ShortUniqueId from 'short-unique-id';
export { BREAK, mergeAllVisitors } from '@swagger-api/apidom-ast';

declare class Namespace extends Namespace$1 {
    constructor();
}
declare const namespace: Namespace;
declare const createNamespace: (namespacePlugin?: NamespacePlugin) => Namespace;

declare class Annotation extends StringElement {
    constructor(content?: string, meta?: Meta, attributes?: Attributes);
    get code(): any;
    set code(value: any);
}

declare class Comment extends StringElement {
    constructor(content?: string, meta?: Meta, attributes?: Attributes);
}

declare class ParseResult extends ArrayElement {
    constructor(content?: Array<any>, meta?: Meta, attributes?: Attributes);
    get api(): Element | undefined;
    get results(): ArraySlice;
    get result(): Element | undefined;
    get annotations(): ArraySlice;
    get warnings(): ArraySlice;
    get errors(): ArraySlice;
    get isEmpty(): boolean;
    replaceResult(replacement: Element): boolean;
}

interface Position {
    row: number;
    column: number;
    char: number;
}
interface PositionRange {
    start: Position;
    end: Position;
}
declare class SourceMap extends ArrayElement {
    constructor(content?: Array<any>, meta?: Meta, attributes?: Attributes);
    get positionStart(): Element | undefined;
    get positionEnd(): Element | undefined;
    set position(position: PositionRange | undefined);
}

declare const createToolbox: () => {
    predicates: {
        isElement: ElementPredicate<minim.Element>;
        isStringElement: ElementPredicate<minim.StringElement>;
        isNumberElement: ElementPredicate<minim.NumberElement>;
        isNullElement: ElementPredicate<minim.NullElement>;
        isBooleanElement: ElementPredicate<minim.BooleanElement>;
        isObjectElement: ElementPredicate<minim.ObjectElement>;
        isArrayElement: ElementPredicate<minim.ArrayElement>;
        isMemberElement: ElementPredicate<minim.MemberElement>;
        isLinkElement: ElementPredicate<minim.LinkElement>;
        isRefElement: ElementPredicate<minim.RefElement>;
        isAnnotationElement: ElementPredicate<Annotation>;
        isCommentElement: ElementPredicate<Comment>;
        isParseResultElement: ElementPredicate<ParseResult>;
        isSourceMapElement: ElementPredicate<SourceMap>;
        isPrimitiveElement: ElementPredicate<minim.StringElement | minim.ObjectElement | minim.ArrayElement | minim.NumberElement | minim.NullElement | minim.BooleanElement | minim.MemberElement>;
        hasElementSourceMap: <T extends minim.Element>(element: T) => boolean;
        includesSymbols: <T extends minim.Element>(symbols: string[], element: T) => boolean;
        includesClasses: <T extends minim.Element>(classes: string[], element: T) => boolean;
    };
    namespace: Namespace;
};

declare const getNodeType: <T extends Element>(element: T) => string | undefined;
declare const cloneNode: <T>(node: T) => T;
declare const keyMapDefault: {
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
};
declare const visit: (root: Element, visitor: any, { keyMap, ...rest }?: {
    keyMap?: {
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
    } | undefined;
}) => Element;

interface DispatchPluginsOptions {
    toolboxCreator: typeof createToolbox;
    visitorOptions: {
        nodeTypeGetter: typeof getNodeType;
        exposeEdits: boolean;
    };
}
interface DispatchPluginsSync {
    <T extends Element, U extends Element = Element>(element: T, plugins: ((toolbox: any) => object)[], options?: Record<string, unknown>): U;
    [key: symbol]: DispatchPluginsAsync;
}
interface DispatchPluginsAsync {
    <T extends Element, U extends Element = Element>(element: T, plugins: ((toolbox: any) => object)[], options?: Record<string, unknown>): Promise<U>;
}
declare const dispatchPluginsSync: DispatchPluginsSync;

/**
 * Plugin for decorating every element in ApiDOM tree with UUID.
 */
declare const plugin$1: ({ length }?: {
    length?: number | undefined;
}) => () => {
    pre(): void;
    visitor: {
        enter<T extends Element>(element: T): void;
    };
    post(): void;
};

interface PredicateHelpers {
    hasMethod: typeof hasMethod;
    hasBasicElementProps: typeof hasBasicElementProps;
    primitiveEq: typeof primitiveEq;
    isElementType: typeof isElementType;
    hasClass: typeof hasClass;
}
interface ElementBasicsTrait {
    _storedElement: string;
    _content: unknown;
}
interface ElementPrimitiveBehavior {
    primitive: () => unknown;
}
interface ElementTypeTrait<T = string> {
    element: T;
}
interface ElementClassesTrait {
    classes: ArrayElement | Array<string>;
}
type PredicateCreator<T extends Element> = (helpers: PredicateHelpers) => ElementPredicate<T>;
type ElementPredicate<T extends Element> = (element: unknown) => element is T;
declare const hasMethod: <T extends string>(name: T, element: unknown) => element is { [key in T]: (...args: unknown[]) => unknown; };
declare const hasBasicElementProps: (element: unknown) => element is ElementBasicsTrait;
declare const primitiveEq: (val: unknown, element: unknown) => element is ElementPrimitiveBehavior;
declare const hasClass: (cls: string, element: unknown) => element is ElementClassesTrait;
declare const isElementType: (name: string, element: unknown) => element is ElementTypeTrait;
declare const createPredicate: <T extends Element>(predicateCreator: PredicateCreator<T>) => ElementPredicate<T>;

declare const isElement: ElementPredicate<Element>;
declare const isStringElement: ElementPredicate<StringElement>;
declare const isNumberElement: ElementPredicate<NumberElement>;
declare const isNullElement: ElementPredicate<NullElement>;
declare const isBooleanElement: ElementPredicate<BooleanElement>;
declare const isObjectElement: ElementPredicate<ObjectElement>;
declare const isArrayElement: ElementPredicate<ArrayElement>;
declare const isMemberElement: ElementPredicate<MemberElement>;
declare const isLinkElement: ElementPredicate<LinkElement>;
declare const isRefElement: ElementPredicate<RefElement>;
declare const isAnnotationElement: ElementPredicate<Annotation>;
declare const isParseResultElement: ElementPredicate<ParseResult>;
declare const isSourceMapElement: ElementPredicate<SourceMap>;
type PrimitiveElement = ObjectElement | ArrayElement | BooleanElement | NumberElement | StringElement | NullElement | MemberElement;
declare const isPrimitiveElement: ElementPredicate<PrimitiveElement>;
declare const hasElementSourceMap: <T extends Element>(element: T) => boolean;
declare const includesSymbols: <T extends Element>(symbols: string[], element: T) => boolean;
declare const includesClasses: <T extends Element>(classes: string[], element: T) => boolean;

/**
 * Plugin for decorating every semantic element in ApiDOM tree with UUID.
 */
type Predicates = {
    isPrimitiveElement: typeof isPrimitiveElement;
};
declare const plugin: ({ length }?: {
    length?: number | undefined;
}) => ({ predicates }: {
    predicates: Predicates;
}) => {
    pre(): void;
    visitor: {
        enter<T extends Element>(element: T): void;
    };
    post(): void;
};

declare class MediaTypes<T> extends Array<T> {
    unknownMediaType: string;
    filterByFormat(): void;
    findBy(): void;
    latest(): void;
}

declare const filter: <T extends Element>(predicate: (element: any) => boolean, element: T) => ArraySlice;

declare const find: <T extends Element>(predicate: (element: any) => boolean, element: T) => T | undefined;

interface FindAtOffsetOptions {
    offset: number;
    includeRightBound?: boolean;
}
declare const findAtOffset: <T extends Element>(options: number | FindAtOffsetOptions, element: T) => T | undefined;

declare const reject: <T extends Element>(predicate: (element: any) => boolean, element: T) => ArraySlice;

declare const some: <T extends Element>(predicate: (element: any) => boolean, element: T) => boolean;

type Callback = <T extends Element>(element: T) => void;
interface TraverseOptions {
    callback?: Callback;
    predicate?: (element: any) => boolean;
}
declare const traverse: <T extends Element>(options: Callback | TraverseOptions, element: T) => void;

declare const parents: <T extends Element>(element: T) => WeakMap<Element, Element | undefined>;

/**
 * This is a mutating stamp. If you don't want your Element to be mutated,
 * clone in before passing it to initializer of this stamp.
 */
declare class Transcluder {
    protected element: Element;
    protected edges: WeakMap<Element, Element | undefined>;
    constructor({ element }: {
        element: Element;
    });
    transclude(search: Element, replace: Element): Element | undefined;
}

/**
 * This is a mutating function. If you don't want your Element to be mutated,
 * clone in before passing it to this function.
 */
declare const transclude: (search: Element, replace: Element, element: Element) => Element | undefined;

/**
 * This dereference algorithm is used exclusively for dereferencing specification objects.
 * It doesn't handle circular references of external references and works on objects only (not arrays).
 */
declare const dereference: (object: Record<string, any>, root?: Record<string, any>) => Record<string, any>;

type FinalCloneTypes = KeyValuePair | ArraySlice | ObjectSlice;
type DeepCloneOptions<T extends Element | FinalCloneTypes> = {
    visited?: WeakMap<T, T>;
};
declare const cloneDeep: {
    <T extends Element | FinalCloneTypes>(value: T, options?: DeepCloneOptions<T>): T;
    safe<T>(value: T): T;
};
declare const cloneShallow: {
    <T extends Element | FinalCloneTypes>(value: T): T;
    safe<T>(value: T): T;
};

interface CloneErrorOptions extends ApiDOMErrorOptions {
    readonly value: unknown;
}
declare class CloneError extends ApiDOMStructuredError {
    readonly value: unknown;
    constructor(message?: string, structuredOptions?: CloneErrorOptions);
}

declare class DeepCloneError extends CloneError {
}

declare class ShallowCloneError extends CloneError {
}

declare class IdentityManager {
    protected readonly uuid: ShortUniqueId;
    protected readonly identityMap: WeakMap<Element, StringElement>;
    constructor({ length }?: {
        length?: number | undefined;
    });
    identify<T extends Element>(this: IdentityManager, element: T): StringElement;
    forget<T extends Element>(element: T): boolean;
    generateId(): string;
}
declare const defaultIdentityManager: IdentityManager;

interface ElementIdentityErrorOptions extends ApiDOMErrorOptions {
    readonly value: unknown;
}
declare class ElementIdentityError extends ApiDOMStructuredError {
    readonly value: unknown;
    constructor(message?: string, structuredOptions?: ElementIdentityErrorOptions);
}

/**
 * Transforms data to an Element from a particular namespace.
 *
 * The name of the function was originally `from`,
 * but it was renamed to `fromFn` to avoid issues with Parcel.js:
 *
 * - https://github.com/parcel-bundler/parcel/issues/9473
 * - https://github.com/swagger-api/swagger-ui/issues/9466#issuecomment-1881053410
 */
declare const fromFn: (data: any, namespace?: Namespace$1) => Element;

declare const serializer$2: <T extends Element | unknown>(element: T) => any;

declare const serializer$1: (element: Element, replacer?: (this: any, key: string, value: any) => any, space?: string | number) => string;

declare const serializer: (element: Element, { directive }?: {
    directive?: boolean | undefined;
}) => string;

/**
 * Creates a refract representation of an Element.
 * https://github.com/refractproject/refract-spec
 */
declare const dehydrate: (element: Element, namespace?: Namespace$1) => any;

/**
 * Create a refracted string representation of an Element.
 */
declare const toString: (element: Element, namespace?: Namespace$1) => string;

declare const sexprs: (element: Element) => string;

type ObjectOrArrayElement = ObjectElement | ArrayElement;
type AnyElement = ObjectElement | ArrayElement | Element;
type DeepMerge = (targetElement: ObjectOrArrayElement, sourceElement: ObjectOrArrayElement, options?: DeepMergeOptions) => AnyElement;
type CustomMerge = (keyElement: Element, options: DeepMergeOptions) => DeepMerge;
type CustomMetaMerge = (targetElementMeta: ObjectElement, sourceElementMeta: ObjectElement) => ObjectElement;
type CustomAttributesMerge = (targetElementAttributes: ObjectElement, sourceElementAttributes: ObjectElement) => ObjectElement;
type ArrayElementMerge = (targetElement: ArrayElement, sourceElement: ArrayElement, options: DeepMergeOptions) => ArrayElement;
type ObjectElementMerge = (targetElement: ObjectElement, source: ObjectElement, options: DeepMergeOptions) => ObjectElement;
type DeepMergeUserOptions = {
    clone?: boolean;
    isMergeableElement?: (element: Element) => boolean;
    arrayElementMerge?: ArrayElementMerge;
    objectElementMerge?: ObjectElementMerge;
    customMerge?: CustomMerge;
    customMetaMerge?: CustomMetaMerge;
    customAttributesMerge?: CustomAttributesMerge;
};
type DeepMergeOptions = DeepMergeUserOptions & {
    clone: boolean;
    isMergeableElement: (element: Element) => boolean;
    arrayElementMerge: ArrayElementMerge;
    objectElementMerge: ObjectElementMerge;
    customMerge: CustomMerge | undefined;
    customMetaMerge: CustomMetaMerge | undefined;
    customAttributesMerge: CustomAttributesMerge | undefined;
};
declare function deepmerge(targetElement: ObjectOrArrayElement, sourceElement: ObjectOrArrayElement, options?: DeepMergeUserOptions): AnyElement;
declare namespace deepmerge {
    var all: (list: ObjectOrArrayElement[], options?: DeepMergeUserOptions) => any;
}

type MergeRightOptions = Omit<DeepMergeUserOptions, 'customMerge' | 'clone'>;
declare const mergeRight: {
    (targetElement: ObjectOrArrayElement, sourceElement: ObjectOrArrayElement, options?: MergeRightOptions): minim.Element | ObjectElement | minim.ArrayElement;
    all(list: ObjectOrArrayElement[], options?: MergeRightOptions): any;
};

declare const mergeLeft: {
    (targetElement: ObjectOrArrayElement, sourceElement: ObjectOrArrayElement, options?: MergeRightOptions | undefined): minim.Element | minim.ObjectElement | minim.ArrayElement;
    all(list: ObjectOrArrayElement[], options?: MergeRightOptions | undefined): any;
};

export { Annotation as AnnotationElement, CloneError, Comment as CommentElement, DeepCloneError, type DeepMergeUserOptions, type DispatchPluginsAsync, type DispatchPluginsOptions, type DispatchPluginsSync, ElementIdentityError, type ElementPredicate, IdentityManager, MediaTypes, type MergeRightOptions as MergeLeftOptions, type MergeRightOptions, Namespace, type ObjectOrArrayElement, ParseResult as ParseResultElement, type Position, type PositionRange, ShallowCloneError, SourceMap as SourceMapElement, Transcluder, cloneDeep, cloneNode, cloneShallow, createNamespace, createPredicate, deepmerge, defaultIdentityManager, dehydrate, dereference, dispatchPluginsSync as dispatchRefractorPlugins, filter, find, findAtOffset, fromFn as from, getNodeType, hasElementSourceMap, includesClasses, includesSymbols, isAnnotationElement, isArrayElement, isBooleanElement, isElement, isLinkElement, isMemberElement, isNullElement, isNumberElement, isObjectElement, isParseResultElement, isPrimitiveElement, isRefElement, isSourceMapElement, isStringElement, keyMapDefault as keyMap, mergeLeft, mergeRight, namespace, parents, plugin$1 as refractorPluginElementIdentity, plugin as refractorPluginSemanticElementIdentity, reject, sexprs, some, serializer$1 as toJSON, toString, serializer$2 as toValue, serializer as toYAML, transclude, traverse, visit };
