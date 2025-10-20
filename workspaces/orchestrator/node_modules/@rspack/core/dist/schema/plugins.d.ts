import type { JsBuildMeta } from "@rspack/binding";
// @ts-ignore
import * as z from "zod/v4";
export declare const getIgnorePluginOptionsSchema: () => z.ZodUnion<readonly [z.ZodObject<{
    contextRegExp: z.ZodOptional<z.ZodCustom<RegExp, RegExp>>;
    resourceRegExp: z.ZodCustom<RegExp, RegExp>;
}, z.core.$strip>, z.ZodObject<{
    checkResource: z.ZodCustom<(...args: unknown[]) => any, (...args: unknown[]) => any>;
}, z.core.$strip>]>;
export declare const getRsdoctorPluginSchema: () => z.ZodObject<{
    moduleGraphFeatures: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodArray<z.ZodEnum<{
        ids: "ids";
        graph: "graph";
        sources: "sources";
    }>>]>>;
    chunkGraphFeatures: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodArray<z.ZodEnum<{
        assets: "assets";
        graph: "graph";
    }>>]>>;
    sourceMapFeatures: z.ZodOptional<z.ZodObject<{
        module: z.ZodOptional<z.ZodBoolean>;
        cheap: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strict>;
export declare const getSRIPluginOptionsSchema: () => z.ZodObject<{
    hashFuncNames: z.ZodOptional<z.ZodTuple<[z.ZodEnum<{
        sha256: "sha256";
        sha384: "sha384";
        sha512: "sha512";
    }>], z.ZodEnum<{
        sha256: "sha256";
        sha384: "sha384";
        sha512: "sha512";
    }>>>;
    htmlPlugin: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodLiteral<false>]>>;
    enabled: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"auto">, z.ZodBoolean]>>;
}, z.core.$strip>;
export declare const getDllPluginOptionsSchema: () => z.ZodObject<{
    context: z.ZodOptional<z.ZodString>;
    entryOnly: z.ZodOptional<z.ZodBoolean>;
    format: z.ZodOptional<z.ZodBoolean>;
    name: z.ZodOptional<z.ZodString>;
    path: z.ZodString;
    type: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const getDllReferencePluginOptionsSchema: () => z.ZodUnion<readonly [z.ZodObject<{
    context: z.ZodOptional<z.ZodString>;
    extensions: z.ZodOptional<z.ZodArray<z.ZodString>>;
    manifest: z.ZodUnion<[z.ZodString, z.ZodObject<{
        content: z.ZodRecord<z.ZodString, z.ZodObject<{
            buildMeta: z.ZodOptional<z.ZodCustom<JsBuildMeta, JsBuildMeta>>;
            exports: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodString>, z.ZodLiteral<true>]>>;
            id: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodUnion<[z.ZodNumber, z.ZodLiteral<number>]>]>>;
        }, z.core.$strip>>;
        name: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<{
            commonjs: "commonjs";
            jsonp: "jsonp";
            var: "var";
            assign: "assign";
            this: "this";
            window: "window";
            global: "global";
            commonjs2: "commonjs2";
            "commonjs-module": "commonjs-module";
            amd: "amd";
            "amd-require": "amd-require";
            umd: "umd";
            umd2: "umd2";
            system: "system";
        }>>;
    }, z.core.$strip>]>;
    name: z.ZodOptional<z.ZodString>;
    scope: z.ZodOptional<z.ZodString>;
    sourceType: z.ZodOptional<z.ZodEnum<{
        commonjs: "commonjs";
        jsonp: "jsonp";
        var: "var";
        assign: "assign";
        this: "this";
        window: "window";
        global: "global";
        commonjs2: "commonjs2";
        "commonjs-module": "commonjs-module";
        amd: "amd";
        "amd-require": "amd-require";
        umd: "umd";
        umd2: "umd2";
        system: "system";
    }>>;
    type: z.ZodOptional<z.ZodEnum<{
        object: "object";
        require: "require";
    }>>;
}, z.core.$strip>, z.ZodObject<{
    content: z.ZodRecord<z.ZodString, z.ZodObject<{
        buildMeta: z.ZodOptional<z.ZodCustom<JsBuildMeta, JsBuildMeta>>;
        exports: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodString>, z.ZodLiteral<true>]>>;
        id: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodUnion<[z.ZodNumber, z.ZodLiteral<number>]>]>>;
    }, z.core.$strip>>;
    context: z.ZodOptional<z.ZodString>;
    extensions: z.ZodOptional<z.ZodArray<z.ZodString>>;
    name: z.ZodString;
    scope: z.ZodOptional<z.ZodString>;
    sourceType: z.ZodOptional<z.ZodEnum<{
        commonjs: "commonjs";
        jsonp: "jsonp";
        var: "var";
        assign: "assign";
        this: "this";
        window: "window";
        global: "global";
        commonjs2: "commonjs2";
        "commonjs-module": "commonjs-module";
        amd: "amd";
        "amd-require": "amd-require";
        umd: "umd";
        umd2: "umd2";
        system: "system";
    }>>;
    type: z.ZodOptional<z.ZodEnum<{
        object: "object";
        require: "require";
    }>>;
}, z.core.$strip>]>;
export declare const getHtmlPluginOptionsSchema: () => z.ZodObject<{
    filename: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodCustom<(...args: unknown[]) => any, (...args: unknown[]) => any>]>>;
    template: z.ZodOptional<z.ZodString>;
    templateContent: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodCustom<(...args: unknown[]) => any, (...args: unknown[]) => any>]>>;
    templateParameters: z.ZodOptional<z.ZodUnion<[z.ZodUnion<[z.ZodRecord<z.ZodString, z.ZodString>, z.ZodBoolean]>, z.ZodCustom<(...args: unknown[]) => any, (...args: unknown[]) => any>]>>;
    inject: z.ZodOptional<z.ZodUnion<[z.ZodEnum<{
        body: "body";
        head: "head";
    }>, z.ZodBoolean]>>;
    publicPath: z.ZodOptional<z.ZodString>;
    base: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        href: z.ZodOptional<z.ZodString>;
        target: z.ZodOptional<z.ZodEnum<{
            _self: "_self";
            _blank: "_blank";
            _parent: "_parent";
            _top: "_top";
        }>>;
    }, z.core.$strict>]>>;
    scriptLoading: z.ZodOptional<z.ZodEnum<{
        module: "module";
        blocking: "blocking";
        defer: "defer";
        "systemjs-module": "systemjs-module";
    }>>;
    chunks: z.ZodOptional<z.ZodArray<z.ZodString>>;
    excludeChunks: z.ZodOptional<z.ZodArray<z.ZodString>>;
    chunksSortMode: z.ZodOptional<z.ZodEnum<{
        auto: "auto";
        manual: "manual";
    }>>;
    sri: z.ZodOptional<z.ZodEnum<{
        sha256: "sha256";
        sha384: "sha384";
        sha512: "sha512";
    }>>;
    minify: z.ZodOptional<z.ZodBoolean>;
    title: z.ZodOptional<z.ZodString>;
    favicon: z.ZodOptional<z.ZodString>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodString>]>>>;
    hash: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
