import { z } from 'zod';
export declare const globSchema: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
export declare const pluginSchema: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
    config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
}, "strip", z.ZodTypeAny, {
    config?: string | string[] | undefined;
    entry?: string | string[] | undefined;
    project?: string | string[] | undefined;
}, {
    config?: string | string[] | undefined;
    entry?: string | string[] | undefined;
    project?: string | string[] | undefined;
}>]>;
export declare const pluginsSchema: z.ZodObject<{
    angular: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    astro: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    ava: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    babel: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    c8: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    capacitor: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    changesets: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    commitizen: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    commitlint: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    cspell: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    cucumber: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    cypress: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    'dependency-cruiser': z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    dotenv: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    drizzle: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    eleventy: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    eslint: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    expo: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    gatsby: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    'github-actions': z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    glob: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    'graphql-codegen': z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    husky: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    jest: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    karma: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    ladle: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    lefthook: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    'lint-staged': z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    linthtml: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    'lockfile-lint': z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    'lost-pixel': z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    markdownlint: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    metro: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    mocha: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    moonrepo: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    msw: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    nest: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    netlify: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    next: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    node: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    nodemon: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    'npm-package-json-lint': z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    nuxt: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    nx: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    nyc: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    oclif: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    playwright: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    'playwright-ct': z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    'playwright-test': z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    plop: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    postcss: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    preconstruct: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    prettier: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    'react-cosmos': z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    'react-router': z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    'release-it': z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    remark: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    remix: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    rollup: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    rsbuild: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    rspack: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    'semantic-release': z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    sentry: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    'simple-git-hooks': z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    'size-limit': z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    storybook: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    stryker: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    stylelint: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    svelte: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    syncpack: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    tailwind: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    travis: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    'ts-node': z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    tsup: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    tsx: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    typedoc: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    typescript: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    unbuild: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    unocss: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    'vercel-og': z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    vike: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    vite: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    vitest: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    vue: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    'webdriver-io': z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    webpack: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    wireit: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    wrangler: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    xo: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    yarn: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
    yorkie: z.ZodUnion<[z.ZodBoolean, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, z.ZodObject<{
        config: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        entry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        project: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }, {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    }>]>;
}, "strip", z.ZodTypeAny, {
    node: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    angular: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    astro: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    ava: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    babel: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    c8: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    capacitor: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    changesets: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    commitizen: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    commitlint: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    cspell: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    cucumber: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    cypress: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'dependency-cruiser': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    dotenv: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    drizzle: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    eleventy: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    eslint: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    expo: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    gatsby: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'github-actions': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    glob: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'graphql-codegen': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    husky: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    jest: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    karma: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    ladle: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    lefthook: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'lint-staged': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    linthtml: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'lockfile-lint': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'lost-pixel': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    markdownlint: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    metro: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    mocha: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    moonrepo: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    msw: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    nest: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    netlify: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    next: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    nodemon: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'npm-package-json-lint': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    nuxt: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    nx: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    nyc: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    oclif: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    playwright: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'playwright-ct': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'playwright-test': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    plop: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    postcss: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    preconstruct: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    prettier: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'react-cosmos': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'react-router': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'release-it': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    remark: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    remix: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    rollup: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    rsbuild: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    rspack: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'semantic-release': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    sentry: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'simple-git-hooks': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'size-limit': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    storybook: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    stryker: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    stylelint: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    svelte: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    syncpack: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    tailwind: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    travis: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'ts-node': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    tsup: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    tsx: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    typedoc: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    typescript: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    unbuild: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    unocss: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'vercel-og': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    vike: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    vite: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    vitest: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    vue: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'webdriver-io': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    webpack: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    wireit: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    wrangler: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    xo: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    yarn: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    yorkie: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
}, {
    node: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    angular: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    astro: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    ava: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    babel: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    c8: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    capacitor: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    changesets: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    commitizen: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    commitlint: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    cspell: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    cucumber: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    cypress: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'dependency-cruiser': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    dotenv: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    drizzle: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    eleventy: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    eslint: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    expo: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    gatsby: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'github-actions': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    glob: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'graphql-codegen': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    husky: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    jest: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    karma: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    ladle: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    lefthook: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'lint-staged': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    linthtml: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'lockfile-lint': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'lost-pixel': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    markdownlint: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    metro: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    mocha: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    moonrepo: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    msw: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    nest: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    netlify: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    next: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    nodemon: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'npm-package-json-lint': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    nuxt: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    nx: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    nyc: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    oclif: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    playwright: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'playwright-ct': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'playwright-test': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    plop: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    postcss: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    preconstruct: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    prettier: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'react-cosmos': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'react-router': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'release-it': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    remark: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    remix: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    rollup: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    rsbuild: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    rspack: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'semantic-release': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    sentry: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'simple-git-hooks': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'size-limit': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    storybook: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    stryker: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    stylelint: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    svelte: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    syncpack: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    tailwind: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    travis: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'ts-node': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    tsup: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    tsx: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    typedoc: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    typescript: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    unbuild: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    unocss: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'vercel-og': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    vike: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    vite: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    vitest: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    vue: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    'webdriver-io': string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    webpack: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    wireit: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    wrangler: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    xo: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    yarn: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
    yorkie: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    };
}>;
