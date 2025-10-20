import { Model } from '../model';
import { Adapter } from './adapter';
export interface FilteredAdapter extends Adapter {
    loadFilteredPolicy(model: Model, filter: any): Promise<void>;
    isFiltered(): boolean;
}
