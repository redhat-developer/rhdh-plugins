import { FilteredAdapter } from './filteredAdapter';
import { Model } from '../model';
import { FileAdapter } from './fileAdapter';
export declare class Filter {
    g: string[];
    p: string[];
}
export declare class DefaultFilteredAdapter extends FileAdapter implements FilteredAdapter {
    private filtered;
    constructor(filePath: string);
    loadPolicy(model: Model): Promise<void>;
    loadFilteredPolicy(model: Model, filter: Filter): Promise<void>;
    private loadFilteredPolicyFile;
    isFiltered(): boolean;
    savePolicy(model: Model): Promise<boolean>;
    private static filterLine;
    private static filterWords;
}
