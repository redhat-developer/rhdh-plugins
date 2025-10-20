import { existsSync } from 'node:fs';
import { toEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency, load } from '../../util/plugin.js';
import vite from '../vite/index.js';
const title = 'React Router';
const enablers = ['@react-router/dev'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['react-router.config.{js,ts}', ...vite.config];
const resolveEntryPaths = async (localConfig, options) => {
    const { configFileDir } = options;
    const appDirectory = localConfig.appDirectory ?? 'app';
    const appDir = join(configFileDir, appDirectory);
    globalThis.__reactRouterAppDirectory = appDir;
    let routeConfig = [];
    const routesPathTs = join(appDir, 'routes.ts');
    const routesPathJs = join(appDir, 'routes.js');
    if (existsSync(routesPathTs)) {
        routeConfig = await load(routesPathTs);
    }
    else if (existsSync(routesPathJs)) {
        routeConfig = await load(routesPathJs);
    }
    const mapRoute = (route) => {
        return [join(appDir, route.file), ...(route.children ? route.children.flatMap(mapRoute) : [])];
    };
    const routes = routeConfig.flatMap(mapRoute);
    return [
        join(appDir, 'routes.{js,ts}'),
        join(appDir, 'root.{jsx,tsx}'),
        join(appDir, 'entry.{client,server}.{js,jsx,ts,tsx}'),
        ...routes,
    ].map(toEntry);
};
export default {
    title,
    enablers,
    isEnabled,
    config,
    resolveEntryPaths,
};
