import { OwnershipEngine } from '@snyk/github-codeowners/dist/lib/ownership/index.js';
import picocolors from 'picocolors';
import { relative, resolve, toRelative } from '../util/path.js';
import { getTitle, logIssueLine, logTitle } from './util.js';
const logIssueSet = (issues) => {
    for (const issue of issues.sort((a, b) => (a.owner < b.owner ? -1 : 1))) {
        console.log(picocolors.cyan(issue.owner), toRelative(issue.symbol));
    }
};
const logIssueRecord = (issues) => {
    const sortedByFilePath = issues.sort((a, b) => (a.owner < b.owner ? -1 : 1));
    for (const { filePath, symbols, owner, parentSymbol } of sortedByFilePath) {
        logIssueLine({ owner, filePath, symbols, parentSymbol });
    }
};
export default ({ report, issues, isShowProgress, options }) => {
    let opts = {};
    try {
        opts = options ? JSON.parse(options) : opts;
    }
    catch (error) {
        console.error(error);
    }
    const codeownersFilePath = resolve(opts.path ?? '.github/CODEOWNERS');
    const codeownersEngine = OwnershipEngine.FromCodeownersFile(codeownersFilePath);
    const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;
    const [dependenciesOwner = '[no-owner]'] = codeownersEngine.calcFileOwnership('package.json');
    const fallbackOwner = dependenciesOwner;
    let totalIssues = 0;
    const calcFileOwnership = (filePath) => codeownersEngine.calcFileOwnership(relative(filePath))[0] ?? fallbackOwner;
    const addOwner = (issue) => ({ ...issue, owner: calcFileOwnership(issue.filePath) });
    for (const [reportType, isReportType] of Object.entries(report)) {
        if (isReportType) {
            const title = reportMultipleGroups && getTitle(reportType);
            const isSet = issues[reportType] instanceof Set;
            const toIssue = (filePath) => ({ type: reportType, filePath, symbol: filePath });
            const issuesForType = issues[reportType] instanceof Set
                ? Array.from(issues[reportType])
                    .map(toIssue)
                    .map(addOwner)
                : reportType === 'duplicates'
                    ? Object.values(issues[reportType]).flatMap(Object.values).map(addOwner)
                    : Object.values(issues[reportType]).map(issues => {
                        const symbols = Object.values(issues);
                        return addOwner({ ...symbols[0], symbols });
                    });
            if (issuesForType.length > 0) {
                if (totalIssues)
                    console.log();
                title && logTitle(title, issuesForType.length);
                if (isSet) {
                    logIssueSet(issuesForType);
                }
                else {
                    logIssueRecord(issuesForType);
                }
            }
            totalIssues = totalIssues + issuesForType.length;
        }
    }
    if (totalIssues === 0 && isShowProgress) {
        console.log('✂️  Excellent, Knip found no issues.');
    }
};
