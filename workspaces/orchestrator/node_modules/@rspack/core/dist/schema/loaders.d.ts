// @ts-ignore
import * as z from "zod/v4";
export declare const getZodSwcLoaderOptionsSchema: () => z.ZodObject<{
    $schema: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    test: z.ZodOptional<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString>]>>>;
    exclude: z.ZodOptional<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString>]>>>;
    env: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        mode: z.ZodOptional<z.ZodEnum<{
            entry: "entry";
            usage: "usage";
        }>>;
        debug: z.ZodOptional<z.ZodBoolean>;
        dynamicImport: z.ZodOptional<z.ZodBoolean>;
        loose: z.ZodOptional<z.ZodBoolean>;
        bugfixes: z.ZodOptional<z.ZodBoolean>;
        skip: z.ZodOptional<z.ZodArray<z.ZodString>>;
        include: z.ZodOptional<z.ZodArray<z.ZodString>>;
        exclude: z.ZodOptional<z.ZodArray<z.ZodString>>;
        coreJs: z.ZodOptional<z.ZodString>;
        targets: z.ZodOptional<z.ZodAny>;
        path: z.ZodOptional<z.ZodString>;
        shippedProposals: z.ZodOptional<z.ZodBoolean>;
        forceAllTransforms: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strict>>>;
    jsc: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        assumptions: z.ZodOptional<z.ZodObject<{
            arrayLikeIsIterable: z.ZodOptional<z.ZodBoolean>;
            constantReexports: z.ZodOptional<z.ZodBoolean>;
            constantSuper: z.ZodOptional<z.ZodBoolean>;
            enumerableModuleMeta: z.ZodOptional<z.ZodBoolean>;
            ignoreFunctionLength: z.ZodOptional<z.ZodBoolean>;
            ignoreFunctionName: z.ZodOptional<z.ZodBoolean>;
            ignoreToPrimitiveHint: z.ZodOptional<z.ZodBoolean>;
            iterableIsArray: z.ZodOptional<z.ZodBoolean>;
            mutableTemplateObject: z.ZodOptional<z.ZodBoolean>;
            noClassCalls: z.ZodOptional<z.ZodBoolean>;
            noDocumentAll: z.ZodOptional<z.ZodBoolean>;
            noIncompleteNsImportDetection: z.ZodOptional<z.ZodBoolean>;
            noNewArrows: z.ZodOptional<z.ZodBoolean>;
            objectRestNoSymbols: z.ZodOptional<z.ZodBoolean>;
            privateFieldsAsProperties: z.ZodOptional<z.ZodBoolean>;
            pureGetters: z.ZodOptional<z.ZodBoolean>;
            setClassMethods: z.ZodOptional<z.ZodBoolean>;
            setComputedProperties: z.ZodOptional<z.ZodBoolean>;
            setPublicClassFields: z.ZodOptional<z.ZodBoolean>;
            setSpreadProperties: z.ZodOptional<z.ZodBoolean>;
            skipForOfIteratorClosing: z.ZodOptional<z.ZodBoolean>;
            superIsCallableConstructor: z.ZodOptional<z.ZodBoolean>;
            tsEnumIsReadonly: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>;
        loose: z.ZodOptional<z.ZodBoolean>;
        parser: z.ZodOptional<z.ZodObject<{
            syntax: z.ZodEnum<{
                typescript: "typescript";
                ecmascript: "ecmascript";
            }>;
            tsx: z.ZodOptional<z.ZodBoolean>;
            decorators: z.ZodOptional<z.ZodBoolean>;
            dynamicImport: z.ZodOptional<z.ZodBoolean>;
            jsx: z.ZodOptional<z.ZodBoolean>;
            numericSeparator: z.ZodOptional<z.ZodBoolean>;
            classPrivateProperty: z.ZodOptional<z.ZodBoolean>;
            privateMethod: z.ZodOptional<z.ZodBoolean>;
            classProperty: z.ZodOptional<z.ZodBoolean>;
            functionBind: z.ZodOptional<z.ZodBoolean>;
            decoratorsBeforeExport: z.ZodOptional<z.ZodBoolean>;
            exportDefaultFrom: z.ZodOptional<z.ZodBoolean>;
            exportNamespaceFrom: z.ZodOptional<z.ZodBoolean>;
            nullishCoalescing: z.ZodOptional<z.ZodBoolean>;
            optionalChaining: z.ZodOptional<z.ZodBoolean>;
            importMeta: z.ZodOptional<z.ZodBoolean>;
            topLevelAwait: z.ZodOptional<z.ZodBoolean>;
            importAssertions: z.ZodOptional<z.ZodBoolean>;
            importAttributes: z.ZodOptional<z.ZodBoolean>;
            allowSuperOutsideMethod: z.ZodOptional<z.ZodBoolean>;
            allowReturnOutsideFunction: z.ZodOptional<z.ZodBoolean>;
            autoAccessors: z.ZodOptional<z.ZodBoolean>;
            explicitResourceManagement: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>;
        transform: z.ZodOptional<z.ZodObject<{
            react: z.ZodOptional<z.ZodObject<{
                pragma: z.ZodOptional<z.ZodString>;
                pragmaFrag: z.ZodOptional<z.ZodString>;
                throwIfNamespace: z.ZodOptional<z.ZodBoolean>;
                development: z.ZodOptional<z.ZodBoolean>;
                useBuiltins: z.ZodOptional<z.ZodBoolean>;
                refresh: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodObject<{
                    refreshReg: z.ZodOptional<z.ZodString>;
                    refreshSig: z.ZodOptional<z.ZodString>;
                    emitFullSignatures: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strict>]>>;
                runtime: z.ZodOptional<z.ZodEnum<{
                    preserve: "preserve";
                    automatic: "automatic";
                    classic: "classic";
                }>>;
                importSource: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>;
            constModules: z.ZodOptional<z.ZodObject<{
                globals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodString>>>;
            }, z.core.$strict>>;
            optimizer: z.ZodOptional<z.ZodObject<{
                simplify: z.ZodOptional<z.ZodBoolean>;
                globals: z.ZodOptional<z.ZodObject<{
                    vars: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
                    envs: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodRecord<z.ZodString, z.ZodString>]>>;
                    typeofs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
                }, z.core.$strict>>;
                jsonify: z.ZodOptional<z.ZodObject<{
                    minCost: z.ZodUnion<[z.ZodNumber, z.ZodLiteral<number>]>;
                }, z.core.$strict>>;
            }, z.core.$strict>>;
            legacyDecorator: z.ZodOptional<z.ZodBoolean>;
            decoratorMetadata: z.ZodOptional<z.ZodBoolean>;
            decoratorVersion: z.ZodOptional<z.ZodEnum<{
                "2021-12": "2021-12";
                "2022-03": "2022-03";
            }>>;
            treatConstEnumAsEnum: z.ZodOptional<z.ZodBoolean>;
            tsEnumIsMutable: z.ZodOptional<z.ZodBoolean>;
            useDefineForClassFields: z.ZodOptional<z.ZodBoolean>;
            verbatimModuleSyntax: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>;
        externalHelpers: z.ZodOptional<z.ZodBoolean>;
        target: z.ZodOptional<z.ZodEnum<{
            es3: "es3";
            es5: "es5";
            es2015: "es2015";
            es2016: "es2016";
            es2017: "es2017";
            es2018: "es2018";
            es2019: "es2019";
            es2020: "es2020";
            es2021: "es2021";
            es2022: "es2022";
            es2023: "es2023";
            es2024: "es2024";
            esnext: "esnext";
        }>>;
        keepClassNames: z.ZodOptional<z.ZodBoolean>;
        experimental: z.ZodOptional<z.ZodObject<{
            optimizeHygiene: z.ZodOptional<z.ZodBoolean>;
            keepImportAttributes: z.ZodOptional<z.ZodBoolean>;
            emitAssertForImportAttributes: z.ZodOptional<z.ZodBoolean>;
            cacheRoot: z.ZodOptional<z.ZodString>;
            plugins: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodAny>], null>>>;
            runPluginFirst: z.ZodOptional<z.ZodBoolean>;
            disableBuiltinTransformsForInternalTesting: z.ZodOptional<z.ZodBoolean>;
            emitIsolatedDts: z.ZodOptional<z.ZodBoolean>;
            disableAllLints: z.ZodOptional<z.ZodBoolean>;
            keepImportAssertions: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>;
        baseUrl: z.ZodOptional<z.ZodString>;
        paths: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>>;
        minify: z.ZodOptional<z.ZodObject<{
            compress: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
                arguments: z.ZodOptional<z.ZodBoolean>;
                arrows: z.ZodOptional<z.ZodBoolean>;
                booleans: z.ZodOptional<z.ZodBoolean>;
                booleans_as_integers: z.ZodOptional<z.ZodBoolean>;
                collapse_vars: z.ZodOptional<z.ZodBoolean>;
                comparisons: z.ZodOptional<z.ZodBoolean>;
                computed_props: z.ZodOptional<z.ZodBoolean>;
                conditionals: z.ZodOptional<z.ZodBoolean>;
                dead_code: z.ZodOptional<z.ZodBoolean>;
                defaults: z.ZodOptional<z.ZodBoolean>;
                directives: z.ZodOptional<z.ZodBoolean>;
                drop_console: z.ZodOptional<z.ZodBoolean>;
                drop_debugger: z.ZodOptional<z.ZodBoolean>;
                ecma: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<5>, z.ZodLiteral<2015>, z.ZodLiteral<2016>, z.ZodString, z.ZodInt]>>;
                evaluate: z.ZodOptional<z.ZodBoolean>;
                expression: z.ZodOptional<z.ZodBoolean>;
                global_defs: z.ZodOptional<z.ZodAny>;
                hoist_funs: z.ZodOptional<z.ZodBoolean>;
                hoist_props: z.ZodOptional<z.ZodBoolean>;
                hoist_vars: z.ZodOptional<z.ZodBoolean>;
                ie8: z.ZodOptional<z.ZodBoolean>;
                if_return: z.ZodOptional<z.ZodBoolean>;
                inline: z.ZodOptional<z.ZodUnion<[z.ZodUnion<[z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>, z.ZodLiteral<2>]>, z.ZodLiteral<3>]>>;
                join_vars: z.ZodOptional<z.ZodBoolean>;
                keep_classnames: z.ZodOptional<z.ZodBoolean>;
                keep_fargs: z.ZodOptional<z.ZodBoolean>;
                keep_fnames: z.ZodOptional<z.ZodBoolean>;
                keep_infinity: z.ZodOptional<z.ZodBoolean>;
                loops: z.ZodOptional<z.ZodBoolean>;
                negate_iife: z.ZodOptional<z.ZodBoolean>;
                passes: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodLiteral<number>]>>;
                properties: z.ZodOptional<z.ZodBoolean>;
                pure_getters: z.ZodOptional<z.ZodAny>;
                pure_funcs: z.ZodOptional<z.ZodArray<z.ZodString>>;
                reduce_funcs: z.ZodOptional<z.ZodBoolean>;
                reduce_vars: z.ZodOptional<z.ZodBoolean>;
                sequences: z.ZodOptional<z.ZodAny>;
                side_effects: z.ZodOptional<z.ZodBoolean>;
                switches: z.ZodOptional<z.ZodBoolean>;
                top_retain: z.ZodOptional<z.ZodAny>;
                toplevel: z.ZodOptional<z.ZodAny>;
                typeofs: z.ZodOptional<z.ZodBoolean>;
                unsafe: z.ZodOptional<z.ZodBoolean>;
                unsafe_passes: z.ZodOptional<z.ZodBoolean>;
                unsafe_arrows: z.ZodOptional<z.ZodBoolean>;
                unsafe_comps: z.ZodOptional<z.ZodBoolean>;
                unsafe_function: z.ZodOptional<z.ZodBoolean>;
                unsafe_math: z.ZodOptional<z.ZodBoolean>;
                unsafe_symbols: z.ZodOptional<z.ZodBoolean>;
                unsafe_methods: z.ZodOptional<z.ZodBoolean>;
                unsafe_proto: z.ZodOptional<z.ZodBoolean>;
                unsafe_regexp: z.ZodOptional<z.ZodBoolean>;
                unsafe_undefined: z.ZodOptional<z.ZodBoolean>;
                unused: z.ZodOptional<z.ZodBoolean>;
                const_to_let: z.ZodOptional<z.ZodBoolean>;
                module: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strict>, z.ZodBoolean]>>;
            format: z.ZodOptional<z.ZodObject<{
                asciiOnly: z.ZodOptional<z.ZodBoolean>;
                beautify: z.ZodOptional<z.ZodBoolean>;
                braces: z.ZodOptional<z.ZodBoolean>;
                comments: z.ZodOptional<z.ZodUnion<[z.ZodUnion<[z.ZodLiteral<"some">, z.ZodLiteral<"all">]>, z.ZodLiteral<false>]>>;
                ecma: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<5>, z.ZodLiteral<2015>, z.ZodLiteral<2016>, z.ZodString, z.ZodInt]>>;
                indentLevel: z.ZodOptional<z.ZodInt>;
                indentStart: z.ZodOptional<z.ZodInt>;
                inlineScript: z.ZodOptional<z.ZodBoolean>;
                keepNumbers: z.ZodOptional<z.ZodInt>;
                keepQuotedProps: z.ZodOptional<z.ZodBoolean>;
                maxLineLen: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodLiteral<number>]>>;
                preamble: z.ZodOptional<z.ZodString>;
                quoteKeys: z.ZodOptional<z.ZodBoolean>;
                quoteStyle: z.ZodOptional<z.ZodBoolean>;
                preserveAnnotations: z.ZodOptional<z.ZodBoolean>;
                safari10: z.ZodOptional<z.ZodBoolean>;
                semicolons: z.ZodOptional<z.ZodBoolean>;
                shebang: z.ZodOptional<z.ZodBoolean>;
                webkit: z.ZodOptional<z.ZodBoolean>;
                wrapIife: z.ZodOptional<z.ZodBoolean>;
                wrapFuncArgs: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strict>>;
            mangle: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
                props: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                topLevel: z.ZodOptional<z.ZodBoolean>;
                toplevel: z.ZodOptional<z.ZodBoolean>;
                keepClassNames: z.ZodOptional<z.ZodBoolean>;
                keep_classnames: z.ZodOptional<z.ZodBoolean>;
                keepFnNames: z.ZodOptional<z.ZodBoolean>;
                keep_fnames: z.ZodOptional<z.ZodBoolean>;
                keepPrivateProps: z.ZodOptional<z.ZodBoolean>;
                keep_private_props: z.ZodOptional<z.ZodBoolean>;
                ie8: z.ZodOptional<z.ZodBoolean>;
                safari10: z.ZodOptional<z.ZodBoolean>;
                reserved: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strict>, z.ZodBoolean]>>;
            ecma: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<5>, z.ZodLiteral<2015>, z.ZodLiteral<2016>, z.ZodString, z.ZodInt]>>;
            keep_classnames: z.ZodOptional<z.ZodBoolean>;
            keep_fnames: z.ZodOptional<z.ZodBoolean>;
            module: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodLiteral<"unknown">]>>;
            safari10: z.ZodOptional<z.ZodBoolean>;
            toplevel: z.ZodOptional<z.ZodBoolean>;
            sourceMap: z.ZodOptional<z.ZodBoolean>;
            outputPath: z.ZodOptional<z.ZodString>;
            inlineSourcesContent: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>;
        preserveAllComments: z.ZodOptional<z.ZodBoolean>;
        output: z.ZodOptional<z.ZodObject<{
            charset: z.ZodOptional<z.ZodEnum<{
                ascii: "ascii";
                utf8: "utf8";
            }>>;
        }, z.core.$strict>>;
    }, z.core.$strict>>>;
    module: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
        strict: z.ZodOptional<z.ZodBoolean>;
        strictMode: z.ZodOptional<z.ZodBoolean>;
        lazy: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodArray<z.ZodString>]>>;
        noInterop: z.ZodOptional<z.ZodBoolean>;
        importInterop: z.ZodOptional<z.ZodEnum<{
            none: "none";
            node: "node";
            swc: "swc";
            babel: "babel";
        }>>;
        outFileExtension: z.ZodOptional<z.ZodEnum<{
            mjs: "mjs";
            js: "js";
            cjs: "cjs";
        }>>;
        exportInteropAnnotation: z.ZodOptional<z.ZodBoolean>;
        ignoreDynamic: z.ZodOptional<z.ZodBoolean>;
        allowTopLevelThis: z.ZodOptional<z.ZodBoolean>;
        preserveImportMeta: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodLiteral<"es6">;
    }, z.core.$strict>, z.ZodObject<{
        strict: z.ZodOptional<z.ZodBoolean>;
        strictMode: z.ZodOptional<z.ZodBoolean>;
        lazy: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodArray<z.ZodString>]>>;
        noInterop: z.ZodOptional<z.ZodBoolean>;
        importInterop: z.ZodOptional<z.ZodEnum<{
            none: "none";
            node: "node";
            swc: "swc";
            babel: "babel";
        }>>;
        outFileExtension: z.ZodOptional<z.ZodEnum<{
            mjs: "mjs";
            js: "js";
            cjs: "cjs";
        }>>;
        exportInteropAnnotation: z.ZodOptional<z.ZodBoolean>;
        ignoreDynamic: z.ZodOptional<z.ZodBoolean>;
        allowTopLevelThis: z.ZodOptional<z.ZodBoolean>;
        preserveImportMeta: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodLiteral<"commonjs">;
    }, z.core.$strict>, z.ZodObject<{
        strict: z.ZodOptional<z.ZodBoolean>;
        strictMode: z.ZodOptional<z.ZodBoolean>;
        lazy: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodArray<z.ZodString>]>>;
        noInterop: z.ZodOptional<z.ZodBoolean>;
        importInterop: z.ZodOptional<z.ZodEnum<{
            none: "none";
            node: "node";
            swc: "swc";
            babel: "babel";
        }>>;
        outFileExtension: z.ZodOptional<z.ZodEnum<{
            mjs: "mjs";
            js: "js";
            cjs: "cjs";
        }>>;
        exportInteropAnnotation: z.ZodOptional<z.ZodBoolean>;
        ignoreDynamic: z.ZodOptional<z.ZodBoolean>;
        allowTopLevelThis: z.ZodOptional<z.ZodBoolean>;
        preserveImportMeta: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodLiteral<"umd">;
        globals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        strict: z.ZodOptional<z.ZodBoolean>;
        strictMode: z.ZodOptional<z.ZodBoolean>;
        lazy: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodArray<z.ZodString>]>>;
        noInterop: z.ZodOptional<z.ZodBoolean>;
        importInterop: z.ZodOptional<z.ZodEnum<{
            none: "none";
            node: "node";
            swc: "swc";
            babel: "babel";
        }>>;
        outFileExtension: z.ZodOptional<z.ZodEnum<{
            mjs: "mjs";
            js: "js";
            cjs: "cjs";
        }>>;
        exportInteropAnnotation: z.ZodOptional<z.ZodBoolean>;
        ignoreDynamic: z.ZodOptional<z.ZodBoolean>;
        allowTopLevelThis: z.ZodOptional<z.ZodBoolean>;
        preserveImportMeta: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodLiteral<"amd">;
        moduleId: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>, z.ZodObject<{
        strict: z.ZodOptional<z.ZodBoolean>;
        strictMode: z.ZodOptional<z.ZodBoolean>;
        lazy: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodArray<z.ZodString>]>>;
        noInterop: z.ZodOptional<z.ZodBoolean>;
        importInterop: z.ZodOptional<z.ZodEnum<{
            none: "none";
            node: "node";
            swc: "swc";
            babel: "babel";
        }>>;
        outFileExtension: z.ZodOptional<z.ZodEnum<{
            mjs: "mjs";
            js: "js";
            cjs: "cjs";
        }>>;
        exportInteropAnnotation: z.ZodOptional<z.ZodBoolean>;
        ignoreDynamic: z.ZodOptional<z.ZodBoolean>;
        allowTopLevelThis: z.ZodOptional<z.ZodBoolean>;
        preserveImportMeta: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodLiteral<"nodenext">;
    }, z.core.$strict>, z.ZodObject<{
        type: z.ZodLiteral<"systemjs">;
        allowTopLevelThis: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strict>]>>>;
    minify: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    sourceMaps: z.ZodOptional<z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodLiteral<"inline">]>>>;
    inlineSourcesContent: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    isModule: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodLiteral<"unknown">]>>;
    rspackExperiments: z.ZodOptional<z.ZodObject<{
        import: z.ZodOptional<z.ZodArray<z.ZodObject<{
            libraryName: z.ZodString;
            libraryDirectory: z.ZodOptional<z.ZodString>;
            customName: z.ZodOptional<z.ZodString>;
            customStyleName: z.ZodOptional<z.ZodString>;
            style: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
            styleLibraryDirectory: z.ZodOptional<z.ZodString>;
            camelToDashComponentName: z.ZodOptional<z.ZodBoolean>;
            transformToDefaultImport: z.ZodOptional<z.ZodBoolean>;
            ignoreEsComponent: z.ZodOptional<z.ZodArray<z.ZodString>>;
            ignoreStyleComponent: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>>>;
        collectTypeScriptInfo: z.ZodOptional<z.ZodObject<{
            typeExports: z.ZodOptional<z.ZodBoolean>;
            exportedEnum: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodLiteral<"const-only">]>>;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
}, z.core.$strict>;
