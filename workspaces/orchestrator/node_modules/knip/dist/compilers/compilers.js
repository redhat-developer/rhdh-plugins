export const fencedCodeBlockMatcher = /```[\s\S]*?```/g;
const scriptExtractor = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
export const importMatcher = /import[^'"]+['"]([^'"]+)['"]/g;
export const importsWithinScripts = (text) => {
    const scripts = [];
    let scriptMatch;
    while ((scriptMatch = scriptExtractor.exec(text))) {
        for (const importMatch of scriptMatch[1].matchAll(importMatcher)) {
            scripts.push(importMatch);
        }
    }
    return scripts.join(';\n');
};
const tsScriptExtractor = /<script\b[^>]*lang="ts"[^>]*>(?<body>[\s\S]*?)<\/script>/gm;
export const tsScriptBodies = (text) => {
    const scripts = [];
    let scriptMatch;
    while ((scriptMatch = tsScriptExtractor.exec(text))) {
        if (scriptMatch.groups?.body)
            scripts.push(scriptMatch.groups.body);
    }
    return scripts.join(';\n');
};
