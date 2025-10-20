"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchFileAdapter = void 0;
const fileAdapter_1 = require("./fileAdapter");
/**
 * BatchFileAdapter is the file adapter for Casbin.
 * It can add policies and remove policies.
 * @deprecated The class should not be used, you should use FileAdapter.
 */
class BatchFileAdapter extends fileAdapter_1.FileAdapter {
    /**
     * FileAdapter is the constructor for FileAdapter.
     * @param {string} filePath filePath the path of the policy file.
     */
    constructor(filePath) {
        super(filePath);
    }
}
exports.BatchFileAdapter = BatchFileAdapter;
