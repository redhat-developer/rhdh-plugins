import { FileAdapter } from './fileAdapter';
/**
 * BatchFileAdapter is the file adapter for Casbin.
 * It can add policies and remove policies.
 * @deprecated The class should not be used, you should use FileAdapter.
 */
export class BatchFileAdapter extends FileAdapter {
    /**
     * FileAdapter is the constructor for FileAdapter.
     * @param {string} filePath filePath the path of the policy file.
     */
    constructor(filePath) {
        super(filePath);
    }
}
