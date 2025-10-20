declare const _default: {
    symbols: ({ report, issues, tagHints, configurationHints, noConfigHints, isShowProgress }: import("../index.js").ReporterOptions) => void;
    compact: ({ report, issues, isShowProgress }: import("../index.js").ReporterOptions) => void;
    codeowners: ({ report, issues, isShowProgress, options }: import("../index.js").ReporterOptions) => void;
    disclosure: ({ report, issues }: import("../index.js").ReporterOptions) => void;
    json: ({ report, issues, options }: import("../index.js").ReporterOptions) => Promise<void>;
    markdown: ({ report, issues }: import("../index.js").ReporterOptions) => void;
};
export default _default;
