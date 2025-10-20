import picocolors from 'picocolors';
import { ISSUE_TYPE_TITLE } from '../constants.js';
import { relative, toRelative } from '../util/path.js';
export const identity = (text) => text;
export const getTitle = (reportType) => {
    return ISSUE_TYPE_TITLE[reportType];
};
export const logTitle = (title, count) => console.log(`${picocolors.yellowBright(picocolors.underline(title))} (${count})`);
export const logTitleDimmed = (title) => console.log(`${picocolors.yellow(picocolors.underline(`${title}`))}`);
export const logIssueLine = ({ owner, filePath, symbols, parentSymbol, severity }) => {
    const symbol = symbols ? `: ${symbols.map(s => s.symbol).join(', ')}` : '';
    const parent = parentSymbol ? ` (${parentSymbol})` : '';
    const print = severity === 'warn' ? picocolors.gray : identity;
    console.log(`${owner ? `${picocolors.cyan(owner)} ` : ''}${print(`${relative(filePath)}${symbol}${parent}`)}`);
};
export const logIssueSet = (issues) => {
    for (const value of issues.sort())
        console.log(toRelative(value));
};
export const convert = (issue) => ({
    name: issue.symbol,
    line: issue.line,
    col: issue.col,
    pos: issue.pos,
});
