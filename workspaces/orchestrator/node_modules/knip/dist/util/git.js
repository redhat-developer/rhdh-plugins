import { execSync } from 'node:child_process';
import { join } from './path.js';
const hookFileNames = [
    'prepare-commit-msg',
    'commit-msg',
    'pre-{applypatch,commit,merge-commit,push,rebase,receive}',
    'post-{checkout,commit,merge,rewrite}',
];
const getGitHooksPath = (defaultPath = '.git/hooks') => {
    try {
        return execSync('git config --get core.hooksPath', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    }
    catch (_error) {
        return defaultPath;
    }
};
export const getGitHookPaths = (defaultPath = '.git/hooks', followGitConfig = true) => {
    const gitHooksPath = followGitConfig ? getGitHooksPath(defaultPath) : defaultPath;
    return hookFileNames.map(fileName => join(gitHooksPath, fileName));
};
