import { fencedCodeBlockMatcher, importMatcher } from './compilers.js';
const mdxDependencies = [
    'astro',
    '@mdx-js/esbuild',
    '@mdx-js/loader',
    '@mdx-js/mdx',
    '@mdx-js/node-loader',
    '@mdx-js/preact',
    '@mdx-js/react',
    '@mdx-js/rollup',
    '@mdx-js/vue',
    'remark-mdx',
];
const condition = (hasDependency) => mdxDependencies.some(hasDependency);
const compiler = (text) => [...text.replace(fencedCodeBlockMatcher, '').matchAll(importMatcher)].join('\n');
export default { condition, compiler };
