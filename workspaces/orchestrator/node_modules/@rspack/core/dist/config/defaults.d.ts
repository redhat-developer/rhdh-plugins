/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/config/defaults.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { RspackOptionsNormalized } from "./normalization";
export declare const applyRspackOptionsDefaults: (options: RspackOptionsNormalized) => void;
export declare const applyRspackOptionsBaseDefaults: (options: RspackOptionsNormalized) => void;
export declare const getPnpDefault: () => boolean;
