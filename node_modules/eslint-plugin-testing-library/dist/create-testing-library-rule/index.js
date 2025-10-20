"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestingLibraryRule = void 0;
const utils_1 = require("@typescript-eslint/utils");
const utils_2 = require("../utils");
const detect_testing_library_utils_1 = require("./detect-testing-library-utils");
function createTestingLibraryRule({ create, detectionOptions = {}, meta, ...remainingConfig }) {
    return utils_1.ESLintUtils.RuleCreator(utils_2.getDocsUrl)({
        ...remainingConfig,
        create: (0, detect_testing_library_utils_1.detectTestingLibraryUtils)(create, detectionOptions),
        meta: {
            ...meta,
            docs: {
                ...meta.docs,
                recommended: false,
            },
        },
    });
}
exports.createTestingLibraryRule = createTestingLibraryRule;
