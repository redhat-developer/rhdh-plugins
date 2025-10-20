"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const ignore_1 = __importDefault(require("ignore"));
const logger_1 = require("../logger");
class OwnershipEngine {
    /**
     * @param matchers : FileOwnershipMatcher Matchers should be in precedence order, with overriding rules coming last
     */
    constructor(matchers) {
        this.matchers = matchers;
    }
    calcFileOwnership(filePath) {
        // We reverse the matchers so that the first matching rule encountered
        // will be the last from CODEOWNERS, respecting precedence correctly and performantly
        const matchers = [...this.matchers].reverse();
        for (const matcher of matchers) {
            if (matcher.match(filePath)) {
                matcher.matched++;
                return matcher.owners;
            }
        }
        return [];
    }
    getRules() {
        const status = [];
        for (const matcher of this.matchers) {
            status.push({ rule: matcher.rule, matched: matcher.matched });
        }
        return status;
    }
    static FromCodeownersFile(filePath) {
        try {
            const lines = fs.readFileSync(filePath).toString().replace(/\r/g, '').split('\n');
            const owned = [];
            for (const line of lines) {
                if (!line || line.startsWith('#')) {
                    continue;
                }
                owned.push(createMatcherCodeownersRule(line));
            }
            return new OwnershipEngine(owned);
        }
        catch (error) {
            logger_1.log.error(`failed to load codeowners file from ${filePath}`, error);
            throw error;
        }
    }
}
exports.OwnershipEngine = OwnershipEngine;
const createMatcherCodeownersRule = (rule) => {
    // Split apart on spaces
    const parts = rule.split(/\s+/);
    // The first part is expected to be the path
    const path = parts[0];
    let teamNames = [];
    // Remaining parts are expected to be team names (if any)
    if (parts.length > 1) {
        teamNames = parts.slice(1, parts.length);
        for (const name of teamNames) {
            if (!codeOwnerRegex.test(name)) {
                throw new Error(`${name} is not a valid owner name in rule ${rule}`);
            }
        }
    }
    // Create an `ignore` matcher to ape github behaviour
    const match = ignore_1.default().add(path);
    // Workaround for rules ending with /*
    // GitHub will not look for nested files, so we adjust the node-ignore regex
    match._rules = match._rules.map((r) => {
        if (r.pattern.endsWith('/*')) {
            r.regex = new RegExp(r.regex.source.replace('(?=$|\\/$)', '(?=$|[^\\/]$)'), 'i');
        }
        return r;
    });
    // Return our complete matcher
    return {
        rule,
        path,
        owners: teamNames,
        match: match.ignores.bind(match),
        matched: 0,
    };
};
// ensures that only the following patterns are allowed @octocat @octocat/kitty docs@example.com
const codeOwnerRegex = /(^@[a-zA-Z0-9_\-/]*$)|(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
//# sourceMappingURL=OwnershipEngine.js.map