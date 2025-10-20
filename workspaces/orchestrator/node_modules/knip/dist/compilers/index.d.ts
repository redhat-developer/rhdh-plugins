import type { RawConfiguration } from '../types/config.js';
import type { DependencySet } from '../types/workspace.js';
import type { AsyncCompilerFn, AsyncCompilers, SyncCompilerFn, SyncCompilers } from './types.js';
export declare const partitionCompilers: (rawLocalConfig: RawConfiguration) => {
    syncCompilers: Record<string, SyncCompilerFn>;
    asyncCompilers: Record<string, AsyncCompilerFn>;
    exclude?: ("dependencies" | "exports" | "files" | "devDependencies" | "optionalPeerDependencies" | "unlisted" | "binaries" | "unresolved" | "types" | "nsExports" | "nsTypes" | "duplicates" | "enumMembers" | "classMembers")[] | undefined;
    include?: ("dependencies" | "exports" | "files" | "devDependencies" | "optionalPeerDependencies" | "unlisted" | "binaries" | "unresolved" | "types" | "nsExports" | "nsTypes" | "duplicates" | "enumMembers" | "classMembers")[] | undefined;
    node?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    entry?: string | string[] | undefined;
    project?: string | string[] | undefined;
    angular?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    astro?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    ava?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    babel?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    c8?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    capacitor?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    changesets?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    commitizen?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    commitlint?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    cspell?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    cucumber?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    cypress?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    'dependency-cruiser'?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    dotenv?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    drizzle?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    eleventy?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    eslint?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    expo?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    gatsby?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    'github-actions'?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    glob?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    'graphql-codegen'?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    husky?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    jest?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    karma?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    ladle?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    lefthook?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    'lint-staged'?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    linthtml?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    'lockfile-lint'?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    'lost-pixel'?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    markdownlint?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    metro?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    mocha?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    moonrepo?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    msw?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    nest?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    netlify?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    next?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    nodemon?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    'npm-package-json-lint'?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    nuxt?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    nx?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    nyc?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    oclif?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    playwright?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    'playwright-ct'?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    'playwright-test'?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    plop?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    postcss?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    preconstruct?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    prettier?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    'react-cosmos'?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    'react-router'?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    'release-it'?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    remark?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    remix?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    rollup?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    rsbuild?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    rspack?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    'semantic-release'?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    sentry?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    'simple-git-hooks'?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    'size-limit'?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    storybook?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    stryker?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    stylelint?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    svelte?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    syncpack?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    tailwind?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    travis?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    'ts-node'?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    tsup?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    tsx?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    typedoc?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    typescript?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    unbuild?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    unocss?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    'vercel-og'?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    vike?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    vite?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    vitest?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    vue?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    'webdriver-io'?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    webpack?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    wireit?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    wrangler?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    xo?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    yarn?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    yorkie?: string | boolean | string[] | {
        config?: string | string[] | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
    } | undefined;
    rules?: Partial<Record<"dependencies" | "exports" | "files" | "devDependencies" | "optionalPeerDependencies" | "unlisted" | "binaries" | "unresolved" | "types" | "nsExports" | "nsTypes" | "duplicates" | "enumMembers" | "classMembers", "error" | "warn" | "off">> | undefined;
    paths?: Record<string, string[]> | undefined;
    ignore?: string | string[] | undefined;
    ignoreBinaries?: (string | RegExp)[] | undefined;
    ignoreDependencies?: (string | RegExp)[] | undefined;
    ignoreMembers?: (string | RegExp)[] | undefined;
    ignoreUnresolved?: (string | RegExp)[] | undefined;
    ignoreExportsUsedInFile?: boolean | Partial<Record<"function" | "type" | "enum" | "class" | "interface" | "member", boolean>> | undefined;
    ignoreWorkspaces?: string[] | undefined;
    includeEntryExports?: boolean | undefined;
    compilers?: Record<string, ((args_0: string, args_1: string, ...args: unknown[]) => string) | ((args_0: string, args_1: string, ...args: unknown[]) => Promise<string>)> | undefined;
    workspaces?: Record<string, {
        node?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
        angular?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        astro?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        ava?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        babel?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        c8?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        capacitor?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        changesets?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        commitizen?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        commitlint?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        cspell?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        cucumber?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        cypress?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'dependency-cruiser'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        dotenv?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        drizzle?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        eleventy?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        eslint?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        expo?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        gatsby?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'github-actions'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        glob?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'graphql-codegen'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        husky?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        jest?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        karma?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        ladle?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        lefthook?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'lint-staged'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        linthtml?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'lockfile-lint'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'lost-pixel'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        markdownlint?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        metro?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        mocha?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        moonrepo?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        msw?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        nest?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        netlify?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        next?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        nodemon?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'npm-package-json-lint'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        nuxt?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        nx?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        nyc?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        oclif?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        playwright?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'playwright-ct'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'playwright-test'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        plop?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        postcss?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        preconstruct?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        prettier?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'react-cosmos'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'react-router'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'release-it'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        remark?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        remix?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        rollup?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        rsbuild?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        rspack?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'semantic-release'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        sentry?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'simple-git-hooks'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'size-limit'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        storybook?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        stryker?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        stylelint?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        svelte?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        syncpack?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        tailwind?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        travis?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'ts-node'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        tsup?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        tsx?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        typedoc?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        typescript?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        unbuild?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        unocss?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'vercel-og'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        vike?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        vite?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        vitest?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        vue?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'webdriver-io'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        webpack?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        wireit?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        wrangler?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        xo?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        yarn?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        yorkie?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        paths?: Record<string, string[]> | undefined;
        ignore?: string | string[] | undefined;
        ignoreBinaries?: (string | RegExp)[] | undefined;
        ignoreDependencies?: (string | RegExp)[] | undefined;
        ignoreMembers?: (string | RegExp)[] | undefined;
        ignoreUnresolved?: (string | RegExp)[] | undefined;
        includeEntryExports?: boolean | undefined;
    }> | undefined;
};
export declare const getIncludedCompilers: (syncCompilers: SyncCompilers, asyncCompilers: AsyncCompilers, dependencies: DependencySet) => [SyncCompilers, AsyncCompilers];
export declare const getCompilerExtensions: (compilers: [SyncCompilers, AsyncCompilers]) => string[];
