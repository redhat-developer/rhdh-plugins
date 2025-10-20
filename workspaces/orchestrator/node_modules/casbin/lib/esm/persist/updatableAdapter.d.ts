import { Adapter } from './adapter';
export interface UpdatableAdapter extends Adapter {
    updatePolicy(sec: string, ptype: string, oldRule: string[], newRule: string[]): Promise<void>;
}
