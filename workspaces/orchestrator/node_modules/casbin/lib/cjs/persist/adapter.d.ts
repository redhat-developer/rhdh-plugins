import { Model } from '../model';
export interface Adapter {
    loadPolicy(model: Model): Promise<void>;
    savePolicy(model: Model): Promise<boolean>;
    addPolicy(sec: string, ptype: string, rule: string[]): Promise<void>;
    removePolicy(sec: string, ptype: string, rule: string[]): Promise<void>;
    removeFilteredPolicy(sec: string, ptype: string, fieldIndex: number, ...fieldValues: string[]): Promise<void>;
}
