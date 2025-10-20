import type { ConsumeOptions } from 'webpack/lib/sharing/ConsumeSharedModule';
import type { InputFileSystem } from 'webpack/lib/util/fs';
/**
 * @param {string} str maybe required version
 * @returns {boolean} true, if it looks like a version
 */
declare function isRequiredVersion(str: string): boolean;
export { isRequiredVersion };
/**
 * @see https://docs.npmjs.com/cli/v7/configuring-npm/package-json#urls-as-dependencies
 * @param {string} versionDesc version to be normalized
 * @returns {string} normalized version
 */
declare function normalizeVersion(versionDesc: string): string;
export { normalizeVersion };
/**
 *
 * @param {InputFileSystem} fs file system
 * @param {string} directory directory to start looking into
 * @param {string[]} descriptionFiles possible description filenames
 * @param {function((Error | null)=, {data: object, path: string}=): void} callback callback
 */
declare const getDescriptionFile: (fs: InputFileSystem, directory: string, descriptionFiles: string[], callback: (err: Error | null, data?: {
    data: object;
    path: string;
}) => void) => void;
export { getDescriptionFile };
/**
 * Get required version from description file
 * @param {Record<string, any>} data - The data object
 * @param {string} packageName - The package name
 * @returns {string | undefined} The normalized version
 */
export declare function getRequiredVersionFromDescriptionFile(data: Record<string, any>, packageName: string): string | undefined | void;
export declare function normalizeConsumeShareOptions(consumeOptions: ConsumeOptions): {
    shareConfig: {
        fixedDependencies: boolean;
        requiredVersion: false | import("webpack/lib/util/semver").SemVerRange;
        strictVersion: boolean;
        singleton: boolean;
        eager: boolean;
    };
    shareScope: string;
    shareKey: string;
};
