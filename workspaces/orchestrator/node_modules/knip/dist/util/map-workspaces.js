import { readFile } from 'node:fs/promises';
import fg from 'fast-glob';
import { partition } from './array.js';
import { debugLog } from './debug.js';
import { ConfigurationError } from './errors.js';
import { getPackageName } from './package-name.js';
import { join } from './path.js';
export default async function mapWorkspaces(cwd, workspaces) {
    const [negatedPatterns, patterns] = partition(workspaces, p => p.match(/^!/));
    const packages = new Map();
    const wsPkgNames = new Set();
    if (patterns.length === 0 && negatedPatterns.length === 0)
        return [packages, wsPkgNames];
    const matches = await fg.glob(patterns, {
        cwd,
        onlyDirectories: true,
        ignore: ['**/node_modules/**', ...negatedPatterns],
    });
    for (const name of matches) {
        const dir = join(cwd, name);
        const manifestPath = join(dir, 'package.json');
        try {
            const manifestStr = await readFile(manifestPath, 'utf8');
            const manifest = JSON.parse(manifestStr);
            const pkgName = getPackageName(manifest, dir);
            const pkg = { dir, name, pkgName, manifestPath, manifestStr, manifest };
            packages.set(name, pkg);
            if (pkgName)
                wsPkgNames.add(pkgName);
            else
                throw new ConfigurationError(`Missing package name in ${manifestPath}`);
        }
        catch (error) {
            if (error?.code === 'ENOENT')
                debugLog('*', `Unable to load package.json for ${name}`);
            else
                throw error;
        }
    }
    return [packages, wsPkgNames];
}
