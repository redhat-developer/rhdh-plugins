import { OwnershipEngine } from '@snyk/github-codeowners/dist/lib/ownership/index.js';
import { isFile } from '../util/fs.js';
import { relative, resolve } from '../util/path.js';
import { convert } from './util.js';
export default async ({ report, issues, options }) => {
    let opts = {};
    try {
        opts = options ? JSON.parse(options) : opts;
    }
    catch (error) {
        console.error(error);
    }
    const json = {};
    const codeownersFilePath = resolve(opts.codeowners ?? '.github/CODEOWNERS');
    const codeownersEngine = isFile(codeownersFilePath) && OwnershipEngine.FromCodeownersFile(codeownersFilePath);
    const flatten = (issues) => Object.values(issues).flatMap(Object.values);
    const initRow = (filePath) => {
        const file = relative(filePath);
        const row = {
            file,
            ...(codeownersEngine && { owners: codeownersEngine.calcFileOwnership(file) }),
            ...(report.dependencies && { dependencies: [] }),
            ...(report.devDependencies && { devDependencies: [] }),
            ...(report.optionalPeerDependencies && { optionalPeerDependencies: [] }),
            ...(report.unlisted && { unlisted: [] }),
            ...(report.binaries && { binaries: [] }),
            ...(report.unresolved && { unresolved: [] }),
            ...(report.exports && { exports: [] }),
            ...(report.nsExports && { nsExports: [] }),
            ...(report.types && { types: [] }),
            ...(report.nsTypes && { nsTypes: [] }),
            ...(report.enumMembers && { enumMembers: {} }),
            ...(report.classMembers && { classMembers: {} }),
            ...(report.duplicates && { duplicates: [] }),
        };
        return row;
    };
    for (const [type, isReportType] of Object.entries(report)) {
        if (isReportType) {
            if (type === 'files' || type === '_files') {
            }
            else {
                for (const issue of flatten(issues[type])) {
                    const { filePath, symbol, symbols, parentSymbol } = issue;
                    json[filePath] = json[filePath] ?? initRow(filePath);
                    if (type === 'duplicates') {
                        symbols && json[filePath][type]?.push(symbols.map(convert));
                    }
                    else if (type === 'enumMembers' || type === 'classMembers') {
                        const item = json[filePath][type];
                        if (parentSymbol && item) {
                            item[parentSymbol] = item[parentSymbol] ?? [];
                            item[parentSymbol].push(convert(issue));
                        }
                    }
                    else {
                        if (['unlisted', 'binaries'].includes(type)) {
                            json[filePath][type]?.push({ name: symbol });
                        }
                        else {
                            json[filePath][type]?.push(convert(issue));
                        }
                    }
                }
            }
        }
    }
    const output = JSON.stringify({
        files: Array.from(issues.files).map(filePath => relative(filePath)),
        issues: Object.values(json),
    });
    process.stdout._handle?.setBlocking?.(true);
    process.stdout.write(`${output}\n`);
};
