import { Adapter } from './adapter';
import { Model } from '../model';
/**
 * StringAdapter is the string adapter for Casbin.
 * It can load policy from a string.
 */
export declare class StringAdapter implements Adapter {
    readonly policy: string;
    /**
     * StringAdapter is the constructor for StringAdapter.
     * @param {string} policy policy formatted as a CSV string.
     */
    constructor(policy: string);
    loadPolicy(model: Model): Promise<void>;
    private loadRules;
    /**
     * savePolicy saves all policy rules to the storage.
     */
    savePolicy(model: Model): Promise<boolean>;
    /**
     * addPolicy adds a policy rule to the storage.
     */
    addPolicy(sec: string, ptype: string, rule: string[]): Promise<void>;
    /**
     * removePolicy removes a policy rule from the storage.
     */
    removePolicy(sec: string, ptype: string, rule: string[]): Promise<void>;
    /**
     * removeFilteredPolicy removes policy rules that match the filter from the storage.
     */
    removeFilteredPolicy(sec: string, ptype: string, fieldIndex: number, ...fieldValues: string[]): Promise<void>;
}
