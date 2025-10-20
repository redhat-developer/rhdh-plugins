/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/v5.88.2/lib/RuntimeGlobals.js
 *
 * MIT Licensed
 * Author Tobias Koppers \@sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { JsRuntimeGlobals } from "@rspack/binding";
export declare function __from_binding_runtime_globals(runtimeRequirements: JsRuntimeGlobals): Set<string>;
export declare function __to_binding_runtime_globals(runtimeRequirements: Set<string>): JsRuntimeGlobals;
export declare const RuntimeGlobals: {
    /**
     * the internal require function
     */
    readonly require: "__webpack_require__";
    /**
     * access to properties of the internal require function/object
     */
    readonly requireScope: "__webpack_require__.*";
    /**
     * the internal exports object
     */
    readonly exports: "__webpack_exports__";
    /**
     * top-level this need to be the exports object
     */
    readonly thisAsExports: "top-level-this-exports";
    /**
     * runtime need to return the exports of the last entry module
     */
    readonly returnExportsFromRuntime: "return-exports-from-runtime";
    /**
     * the internal module object
     */
    readonly module: "module";
    /**
     * the internal module object
     */
    readonly moduleId: "module.id";
    /**
     * the internal module object
     */
    readonly moduleLoaded: "module.loaded";
    /**
     * the bundle public path
     */
    readonly publicPath: "__webpack_require__.p";
    /**
     * the module id of the entry point
     */
    readonly entryModuleId: "__webpack_require__.s";
    /**
     * the module cache
     */
    readonly moduleCache: "__webpack_require__.c";
    /**
     * the module functions
     */
    readonly moduleFactories: "__webpack_require__.m";
    /**
     * the module functions, with only write access
     */
    readonly moduleFactoriesAddOnly: "__webpack_require__.m (add only)";
    /**
     * the chunk ensure function
     */
    readonly ensureChunk: "__webpack_require__.e";
    /**
     * an object with handlers to ensure a chunk
     */
    readonly ensureChunkHandlers: "__webpack_require__.f";
    /**
     * a runtime requirement if ensureChunkHandlers should include loading of chunk needed for entries
     */
    readonly ensureChunkIncludeEntries: "__webpack_require__.f (include entries)";
    /**
     * the chunk prefetch function
     */
    readonly prefetchChunk: "__webpack_require__.E";
    /**
     * an object with handlers to prefetch a chunk
     */
    readonly prefetchChunkHandlers: "__webpack_require__.F";
    /**
     * the chunk preload function
     */
    readonly preloadChunk: "__webpack_require__.G";
    /**
     * an object with handlers to preload a chunk
     */
    readonly preloadChunkHandlers: "__webpack_require__.H";
    /**
     * the exported property define getters function
     */
    readonly definePropertyGetters: "__webpack_require__.d";
    /**
     * define compatibility on export
     */
    readonly makeNamespaceObject: "__webpack_require__.r";
    /**
     * create a fake namespace object
     */
    readonly createFakeNamespaceObject: "__webpack_require__.t";
    /**
     * compatibility get default export
     */
    readonly compatGetDefaultExport: "__webpack_require__.n";
    /**
     * ES modules decorator
     */
    readonly harmonyModuleDecorator: "__webpack_require__.hmd";
    /**
     * node.js module decorator
     */
    readonly nodeModuleDecorator: "__webpack_require__.nmd";
    /**
     * the webpack hash
     */
    readonly getFullHash: "__webpack_require__.h";
    /**
     * an object containing all installed WebAssembly.Instance export objects keyed by module id
     */
    readonly wasmInstances: "__webpack_require__.w";
    /**
     * instantiate a wasm instance from module exports object, id, hash and importsObject
     */
    readonly instantiateWasm: "__webpack_require__.v";
    /**
     * the uncaught error handler for the webpack runtime
     */
    readonly uncaughtErrorHandler: "__webpack_require__.oe";
    /**
     * the script nonce
     */
    readonly scriptNonce: "__webpack_require__.nc";
    /**
     * function to load a script tag.
     * Arguments: (url: string, done: (event) =\> void), key?: string | number, chunkId?: string | number) =\> void
     * done function is called when loading has finished or timeout occurred.
     * It will attach to existing script tags with data-webpack == uniqueName + ":" + key or src == url.
     */
    readonly loadScript: "__webpack_require__.l";
    /**
     * function to promote a string to a TrustedScript using webpack's Trusted
     * Types policy
     * Arguments: (script: string) =\> TrustedScript
     */
    readonly createScript: "__webpack_require__.ts";
    /**
     * function to promote a string to a TrustedScriptURL using webpack's Trusted
     * Types policy
     * Arguments: (url: string) =\> TrustedScriptURL
     */
    readonly createScriptUrl: "__webpack_require__.tu";
    /**
     * function to return webpack's Trusted Types policy
     * Arguments: () =\> TrustedTypePolicy
     */
    readonly getTrustedTypesPolicy: "__webpack_require__.tt";
    /**
     * a flag when a chunk has a fetch priority
     */
    readonly hasFetchPriority: "has fetch priority";
    /**
     * the chunk name of the chunk with the runtime
     */
    readonly chunkName: "__webpack_require__.cn";
    /**
     * the runtime id of the current runtime
     */
    readonly runtimeId: "__webpack_require__.j";
    /**
     * the filename of the script part of the chunk
     */
    readonly getChunkScriptFilename: "__webpack_require__.u";
    /**
     * the filename of the css part of the chunk
     */
    readonly getChunkCssFilename: "__webpack_require__.k";
    /**
     * a flag when a module/chunk/tree has css modules
     */
    readonly hasCssModules: "has css modules";
    /**
     * the filename of the script part of the hot update chunk
     */
    readonly getChunkUpdateScriptFilename: "__webpack_require__.hu";
    /**
     * the filename of the css part of the hot update chunk
     */
    readonly getChunkUpdateCssFilename: "__webpack_require__.hk";
    /**
     * startup signal from runtime
     * This will be called when the runtime chunk has been loaded.
     */
    readonly startup: "__webpack_require__.x";
    /**
     * @deprecated
     * creating a default startup function with the entry modules
     */
    readonly startupNoDefault: "__webpack_require__.x (no default handler)";
    /**
     * startup signal from runtime but only used to add logic after the startup
     */
    readonly startupOnlyAfter: "__webpack_require__.x (only after)";
    /**
     * startup signal from runtime but only used to add sync logic before the startup
     */
    readonly startupOnlyBefore: "__webpack_require__.x (only before)";
    /**
     * global callback functions for installing chunks
     */
    readonly chunkCallback: "webpackChunk";
    /**
     * method to startup an entrypoint with needed chunks.
     * Signature: (moduleId: Id, chunkIds: Id[]) =\> any.
     * Returns the exports of the module or a Promise
     */
    readonly startupEntrypoint: "__webpack_require__.X";
    /**
     * register deferred code, which will run when certain
     * chunks are loaded.
     * Signature: (chunkIds: Id[], fn: () =\> any, priority: int \>= 0 = 0) =\> any
     * Returned value will be returned directly when all chunks are already loaded
     * When (priority & 1) it will wait for all other handlers with lower priority to
     * be executed before itself is executed
     */
    readonly onChunksLoaded: "__webpack_require__.O";
    /**
     * method to install a chunk that was loaded somehow
     * Signature: (\{ id, ids, modules, runtime \}) =\> void
     */
    readonly externalInstallChunk: "__webpack_require__.C";
    /**
     * interceptor for module executions
     */
    readonly interceptModuleExecution: "__webpack_require__.i";
    /**
     * the global object
     */
    readonly global: "__webpack_require__.g";
    /**
     * an object with all share scopes
     */
    readonly shareScopeMap: "__webpack_require__.S";
    /**
     * The sharing init sequence function (only runs once per share scope).
     * Has one argument, the name of the share scope.
     * Creates a share scope if not existing
     */
    readonly initializeSharing: "__webpack_require__.I";
    /**
     * The current scope when getting a module from a remote
     */
    readonly currentRemoteGetScope: "__webpack_require__.R";
    /**
     * the filename of the HMR manifest
     */
    readonly getUpdateManifestFilename: "__webpack_require__.hmrF";
    /**
     * function downloading the update manifest
     */
    readonly hmrDownloadManifest: "__webpack_require__.hmrM";
    /**
     * array with handler functions to download chunk updates
     */
    readonly hmrDownloadUpdateHandlers: "__webpack_require__.hmrC";
    /**
     * object with all hmr module data for all modules
     */
    readonly hmrModuleData: "__webpack_require__.hmrD";
    /**
     * array with handler functions when a module should be invalidated
     */
    readonly hmrInvalidateModuleHandlers: "__webpack_require__.hmrI";
    /**
     * the prefix for storing state of runtime modules when hmr is enabled
     */
    readonly hmrRuntimeStatePrefix: "__webpack_require__.hmrS";
    /**
     * the AMD define function
     */
    readonly amdDefine: "__webpack_require__.amdD";
    /**
     * the AMD options
     */
    readonly amdOptions: "__webpack_require__.amdO";
    /**
     * the System polyfill object
     */
    readonly system: "__webpack_require__.System";
    /**
     * the shorthand for Object.prototype.hasOwnProperty
     * using of it decreases the compiled bundle size
     */
    readonly hasOwnProperty: "__webpack_require__.o";
    /**
     * the System.register context object
     */
    readonly systemContext: "__webpack_require__.y";
    /**
     * the baseURI of current document
     */
    readonly baseURI: "__webpack_require__.b";
    /**
     * a RelativeURL class when relative URLs are used
     */
    readonly relativeUrl: "__webpack_require__.U";
    /**
     * Creates an async module. The body function must be a async function.
     * "module.exports" will be decorated with an AsyncModulePromise.
     * The body function will be called.
     * To handle async dependencies correctly do this: "([a, b, c] = await handleDependencies([a, b, c]));".
     * If "hasAwaitAfterDependencies" is truthy, "handleDependencies()" must be called at the end of the body function.
     * Signature: function(
     * module: Module,
     * body: (handleDependencies: (deps: AsyncModulePromise[]) =\> Promise\<any[]\> & () =\> void,
     * hasAwaitAfterDependencies?: boolean
     * ) =\> void
     */
    readonly asyncModule: "__webpack_require__.a";
};
export declare const isReservedRuntimeGlobal: (r: string) => boolean;
