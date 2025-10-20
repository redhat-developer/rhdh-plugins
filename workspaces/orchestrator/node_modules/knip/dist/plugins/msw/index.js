import { toEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Mock Service Worker';
const enablers = ['msw'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['package.json'];
const entry = ['mockServiceWorker.js'];
const resolveEntryPaths = async (localConfig) => {
    const workerDirectory = localConfig?.workerDirectory;
    const dir = workerDirectory ? [workerDirectory].flat()[0] : '.';
    return entry.map(pattern => toEntry(join(dir, pattern)));
};
export default {
    title,
    enablers,
    isEnabled,
    config,
    entry,
    resolveEntryPaths,
};
