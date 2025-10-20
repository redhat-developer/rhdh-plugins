"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const OwnershipEngine_1 = require("./OwnershipEngine");
const readDir_1 = require("../file/readDir");
exports.validate = async (options) => {
    const engine = OwnershipEngine_1.OwnershipEngine.FromCodeownersFile(options.codeowners); // Validates code owner file
    const filePaths = await readDir_1.readDir(options.dir, ['.git']);
    for (const file of filePaths) {
        engine.calcFileOwnership(file); // Test each file against rule set
    }
    const rules = engine.getRules();
    const unique = new Set();
    const duplicated = new Set();
    const hasMatches = new Set();
    const unmatched = new Set();
    for (const { rule, matched } of rules) {
        if (!unique.has(rule)) {
            unique.add(rule);
        }
        else {
            duplicated.add(rule);
        }
        if (matched > 0) {
            hasMatches.add(rule);
        }
        else {
            unmatched.add(rule);
        }
    }
    for (const rule of unmatched) { // Where we have duplicates we get an edge condition where one version of the matcher doesn't get hit - TODO - there is no doubt a nicer way to express this
        if (hasMatches.has(rule)) {
            unmatched.delete(rule);
        }
    }
    return { duplicated, unmatched };
};
//# sourceMappingURL=validate.js.map