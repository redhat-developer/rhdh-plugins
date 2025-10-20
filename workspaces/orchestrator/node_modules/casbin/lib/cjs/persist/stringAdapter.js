"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringAdapter = void 0;
const helper_1 = require("./helper");
/**
 * StringAdapter is the string adapter for Casbin.
 * It can load policy from a string.
 */
class StringAdapter {
    /**
     * StringAdapter is the constructor for StringAdapter.
     * @param {string} policy policy formatted as a CSV string.
     */
    constructor(policy) {
        this.policy = policy;
    }
    async loadPolicy(model) {
        if (!this.policy) {
            throw new Error('Invalid policy, policy document cannot be false-y');
        }
        await this.loadRules(model, helper_1.Helper.loadPolicyLine);
    }
    async loadRules(model, handler) {
        const rules = this.policy.split('\n');
        rules.forEach((n, index) => {
            if (!n) {
                return;
            }
            handler(n, model);
        });
    }
    /**
     * savePolicy saves all policy rules to the storage.
     */
    async savePolicy(model) {
        throw new Error('not implemented');
    }
    /**
     * addPolicy adds a policy rule to the storage.
     */
    async addPolicy(sec, ptype, rule) {
        throw new Error('not implemented');
    }
    /**
     * removePolicy removes a policy rule from the storage.
     */
    async removePolicy(sec, ptype, rule) {
        throw new Error('not implemented');
    }
    /**
     * removeFilteredPolicy removes policy rules that match the filter from the storage.
     */
    async removeFilteredPolicy(sec, ptype, fieldIndex, ...fieldValues) {
        throw new Error('not implemented');
    }
}
exports.StringAdapter = StringAdapter;
