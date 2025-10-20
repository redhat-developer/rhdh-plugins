import { ISSUE_TYPES } from '../constants.js';
import { ConfigurationError } from './errors.js';
export const defaultExcludedIssueTypes = ['classMembers', 'nsExports', 'nsTypes'];
const defaultIssueTypes = ISSUE_TYPES.filter(type => !defaultExcludedIssueTypes.includes(type));
const normalize = (values) => values.flatMap(value => value.split(','));
export const getIncludedIssueTypes = (cliArgs, { include = [], exclude = [], isProduction = false } = {}) => {
    let incl = normalize(cliArgs.includedIssueTypes);
    const excl = normalize(cliArgs.excludedIssueTypes);
    for (const type of [...incl, ...excl, ...include, ...exclude]) {
        if (!ISSUE_TYPES.includes(type))
            throw new ConfigurationError(`Invalid issue type: ${type}`);
    }
    const excludes = exclude.filter(exclude => !incl.includes(exclude));
    const includes = include.filter(include => !excl.includes(include));
    if (cliArgs.isDependenciesShorthand) {
        incl = [...incl, 'dependencies', 'optionalPeerDependencies', 'unlisted', 'binaries', 'unresolved'];
    }
    if (cliArgs.isExportsShorthand) {
        incl = [...incl, 'exports', 'types', 'enumMembers', 'duplicates'];
    }
    if (cliArgs.isFilesShorthand) {
        incl = [...incl, 'files'];
    }
    const _include = [...incl, ...includes];
    const _exclude = [...excl, ...excludes];
    if (isProduction) {
        _exclude.push('devDependencies');
    }
    else {
        if (_include.includes('dependencies'))
            _include.push('devDependencies', 'optionalPeerDependencies');
        if (_exclude.includes('dependencies'))
            _exclude.push('devDependencies', 'optionalPeerDependencies');
    }
    const included = (_include.length > 0
        ? _include.some(type => !defaultExcludedIssueTypes.includes(type))
            ? _include
            : [..._include, ...defaultIssueTypes]
        : defaultIssueTypes).filter(group => !_exclude.includes(group));
    return ISSUE_TYPES.filter(i => i !== '_files').reduce((types, group) => {
        types[group] = included.includes(group);
        return types;
    }, {});
};
