import { RefElement } from 'minim';
import type Parser from '../parse/parsers/Parser';
import type Resolver from '../resolve/resolvers/Resolver';
import type ResolveStrategy from '../resolve/strategies/ResolveStrategy';
import type DereferenceStrategy from '../dereference/strategies/DereferenceStrategy';
import type ReferenceSet from '../ReferenceSet';
import type BundleStrategy from '../bundle/strategies/BundleStrategy';
interface ReferenceParseOptions {
    mediaType: string;
    parsers: Array<Parser>;
    parserOpts: Record<string, any>;
}
interface ReferenceResolveOptions {
    baseURI: string;
    resolvers: Array<Resolver>;
    resolverOpts: Record<string, any>;
    strategies: Array<ResolveStrategy>;
    strategyOpts: Record<string, any>;
    internal: boolean;
    external: boolean;
    maxDepth: number;
}
interface ReferenceDereferenceOptions {
    strategies: Array<DereferenceStrategy>;
    strategyOpts: Record<string, any>;
    refSet: null | ReferenceSet;
    maxDepth: number;
    circular: 'ignore' | 'replace' | 'error';
    circularReplacer: (ref: RefElement) => unknown;
    immutable: boolean;
}
interface ReferenceBundleOptions {
    strategies: Array<BundleStrategy>;
    refSet: null | ReferenceSet;
    maxDepth: number;
}
export interface ReferenceOptions {
    readonly parse: ReferenceParseOptions;
    readonly resolve: ReferenceResolveOptions;
    readonly dereference: ReferenceDereferenceOptions;
    readonly bundle: ReferenceBundleOptions;
}
declare const defaultOptions: ReferenceOptions;
export default defaultOptions;
