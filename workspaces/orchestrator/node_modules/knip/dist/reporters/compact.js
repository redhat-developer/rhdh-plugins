import { getTitle, logIssueLine, logIssueSet, logTitle } from './util.js';
const logIssueRecord = (issues) => {
    const sortedByFilePath = issues.sort((a, b) => (a.filePath > b.filePath ? 1 : -1));
    sortedByFilePath.forEach(logIssueLine);
};
export default ({ report, issues, isShowProgress }) => {
    const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;
    let totalIssues = 0;
    for (const [reportType, isReportType] of Object.entries(report)) {
        if (isReportType) {
            const title = reportMultipleGroups && getTitle(reportType);
            const isSet = issues[reportType] instanceof Set;
            const issuesForType = isSet
                ? Array.from(issues[reportType])
                : reportType === 'duplicates'
                    ? Object.values(issues[reportType]).flatMap(Object.values)
                    : Object.values(issues[reportType]).map(issues => {
                        const items = Object.values(issues);
                        return { ...items[0], symbols: items.map(issue => issue.symbol) };
                    });
            if (issuesForType.length > 0) {
                title && logTitle(title, issuesForType.length);
                if (isSet) {
                    logIssueSet(Array.from(issues[reportType]));
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
