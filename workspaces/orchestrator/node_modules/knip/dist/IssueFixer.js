import { readFile, rm, writeFile } from 'node:fs/promises';
import { load, save } from './util/package-json.js';
import { join, relative } from './util/path.js';
import { removeExport } from './util/remove-export.js';
export class IssueFixer {
    isEnabled = false;
    cwd = process.cwd();
    isFixFiles = true;
    isFixDependencies = true;
    isFixUnusedTypes = true;
    isFixUnusedExports = true;
    unusedTypeNodes = new Map();
    unusedExportNodes = new Map();
    constructor({ isEnabled, cwd, fixTypes = [], isRemoveFiles }) {
        this.isEnabled = isEnabled;
        this.cwd = cwd;
        this.isFixFiles = isRemoveFiles && (fixTypes.length === 0 || fixTypes.includes('files'));
        this.isFixDependencies = fixTypes.length === 0 || fixTypes.includes('dependencies');
        this.isFixUnusedTypes = fixTypes.length === 0 || fixTypes.includes('types');
        this.isFixUnusedExports = fixTypes.length === 0 || fixTypes.includes('exports');
    }
    addUnusedTypeNode(filePath, fixes) {
        if (!fixes || fixes.length === 0)
            return;
        if (this.unusedTypeNodes.has(filePath))
            for (const fix of fixes)
                this.unusedTypeNodes.get(filePath)?.add(fix);
        else
            this.unusedTypeNodes.set(filePath, new Set(fixes));
    }
    addUnusedExportNode(filePath, fixes) {
        if (!fixes || fixes.length === 0)
            return;
        if (this.unusedExportNodes.has(filePath))
            for (const fix of fixes)
                this.unusedExportNodes.get(filePath)?.add(fix);
        else
            this.unusedExportNodes.set(filePath, new Set(fixes));
    }
    async fixIssues(issues) {
        await this.removeUnusedFiles(issues);
        await this.removeUnusedExports(issues);
        await this.removeUnusedDependencies(issues);
    }
    markExportFixed(issues, filePath) {
        const relPath = relative(filePath);
        const types = [
            ...(this.isFixUnusedTypes ? ['types', 'nsTypes', 'classMembers', 'enumMembers'] : []),
            ...(this.isFixUnusedExports ? ['exports', 'nsExports'] : []),
        ];
        for (const type of types) {
            for (const id in issues[type][relPath]) {
                issues[type][relPath][id].isFixed = true;
            }
        }
    }
    async removeUnusedFiles(issues) {
        if (!this.isFixFiles)
            return;
        for (const issue of issues._files) {
            await rm(issue.filePath);
            issue.isFixed = true;
        }
    }
    async removeUnusedExports(issues) {
        const filePaths = new Set([...this.unusedTypeNodes.keys(), ...this.unusedExportNodes.keys()]);
        for (const filePath of filePaths) {
            const types = (this.isFixUnusedTypes && this.unusedTypeNodes.get(filePath)) || [];
            const exports = (this.isFixUnusedExports && this.unusedExportNodes.get(filePath)) || [];
            const exportPositions = [...types, ...exports].filter(fix => fix !== undefined).sort((a, b) => b[0] - a[0]);
            if (exportPositions.length > 0) {
                const sourceFileText = exportPositions.reduce((text, [start, end, flags]) => removeExport({ text, start, end, flags }), await readFile(filePath, 'utf-8'));
                await writeFile(filePath, sourceFileText);
                this.markExportFixed(issues, filePath);
            }
        }
    }
    async removeUnusedDependencies(issues) {
        if (!this.isFixDependencies)
            return;
        const filePaths = new Set([...Object.keys(issues.dependencies), ...Object.keys(issues.devDependencies)]);
        for (const filePath of filePaths) {
            const absFilePath = join(this.cwd, filePath);
            const pkg = await load(absFilePath);
            if (filePath in issues.dependencies) {
                for (const dependency of Object.keys(issues.dependencies[filePath])) {
                    if (pkg.dependencies) {
                        delete pkg.dependencies[dependency];
                        issues.dependencies[filePath][dependency].isFixed = true;
                    }
                }
            }
            if (filePath in issues.devDependencies) {
                for (const dependency of Object.keys(issues.devDependencies[filePath])) {
                    if (pkg.devDependencies) {
                        delete pkg.devDependencies[dependency];
                        issues.devDependencies[filePath][dependency].isFixed = true;
                    }
                }
            }
            await save(absFilePath, pkg);
        }
    }
}
