import type { LoaderContext, LoaderDefinition } from "../..";
export declare const BASE_URI = "webpack://";
export declare const MODULE_TYPE = "css/mini-extract";
export declare const AUTO_PUBLIC_PATH = "__mini_css_extract_plugin_public_path_auto__";
export declare const ABSOLUTE_PUBLIC_PATH = "webpack:///mini-css-extract-plugin/";
export declare const SINGLE_DOT_PATH_SEGMENT = "__mini_css_extract_plugin_single_dot_path_segment__";
export interface CssExtractRspackLoaderOptions {
    publicPath?: string | ((resourcePath: string, context: string) => string);
    emit?: boolean;
    esModule?: boolean;
    layer?: string;
    defaultExport?: boolean;
}
export declare function hotLoader(content: string, context: {
    loaderContext: LoaderContext;
    options?: CssExtractRspackLoaderOptions;
    locals?: Record<string, string>;
}): string;
declare const loader: LoaderDefinition;
export declare const pitch: LoaderDefinition["pitch"];
export default loader;
