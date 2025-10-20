import { toEntry } from '../../util/input.js';
const title = 'Node.js';
const isEnabled = () => true;
const config = ['package.json'];
const packageJsonPath = (id) => id;
const resolveEntryPaths = localConfig => {
    const scripts = localConfig.scripts;
    const entry = ['server.js'];
    if (scripts && Object.keys(scripts).some(script => /(?<=^|\s)node\s(.*)--test/.test(scripts[script]))) {
        entry.push(...['**/*{.,-,_}test.?(c|m)js', '**/test-*.?(c|m)js', '**/test.?(c|m)js', '**/test/**/*.?(c|m)js']);
    }
    return entry.map(toEntry);
};
const args = {
    positional: true,
    nodeImportArgs: true,
    resolve: ['test-reporter'],
    args: (args) => args.filter(arg => !/--test-reporter[= ](spec|tap|dot|junit|lcov)/.test(arg)),
};
export default {
    title,
    isEnabled,
    packageJsonPath,
    config,
    resolveEntryPaths,
    args,
};
