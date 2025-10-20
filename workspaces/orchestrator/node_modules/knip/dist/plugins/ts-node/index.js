const title = 'ts-node';
const args = {
    binaries: [title],
    positional: true,
    nodeImportArgs: true,
    boolean: ['transpileOnly', 'compilerHost', 'ignoreDiagnostics', 'swc', 'preferTsExts'],
    alias: { transpileOnly: ['T'], compilerHost: ['H'], ignoreDiagnostics: ['D'] },
};
export default {
    title,
    args,
};
