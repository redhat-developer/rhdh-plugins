import type { PackageJson } from '../types/package-json.js';
declare const INDENT: unique symbol;
declare const NEWLINE: unique symbol;
interface ExtendedPackageJson extends PackageJson {
    [INDENT]?: string;
    [NEWLINE]?: string;
}
export declare const load: (filePath: string) => Promise<ExtendedPackageJson>;
export declare const save: (filePath: string, content: ExtendedPackageJson) => Promise<void>;
export declare const getEntryPathsFromManifest: (manifest: PackageJson, sharedGlobOptions: {
    cwd: string;
    dir: string;
    gitignore: boolean;
    ignore: string[];
}) => Promise<string[]>;
export {};
