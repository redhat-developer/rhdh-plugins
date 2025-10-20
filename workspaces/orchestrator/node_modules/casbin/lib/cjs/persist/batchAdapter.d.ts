import { Adapter } from './adapter';
export interface BatchAdapter extends Adapter {
    addPolicies(sec: string, ptype: string, rules: string[][]): Promise<void>;
    removePolicies(sec: string, ptype: string, rules: string[][]): Promise<void>;
}
