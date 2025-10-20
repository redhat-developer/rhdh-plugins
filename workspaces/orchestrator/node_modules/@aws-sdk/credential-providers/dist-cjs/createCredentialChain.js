"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCredentialChain = void 0;
const property_provider_1 = require("@smithy/property-provider");
const createCredentialChain = (...credentialProviders) => {
    let expireAfter = -1;
    const baseFunction = async () => {
        const credentials = await (0, property_provider_1.chain)(...credentialProviders)();
        if (!credentials.expiration && expireAfter !== -1) {
            credentials.expiration = new Date(Date.now() + expireAfter);
        }
        return credentials;
    };
    const withOptions = Object.assign(baseFunction, {
        expireAfter(milliseconds) {
            if (milliseconds < 5 * 60000) {
                throw new Error("@aws-sdk/credential-providers - createCredentialChain(...).expireAfter(ms) may not be called with a duration lower than five minutes.");
            }
            expireAfter = milliseconds;
            return withOptions;
        },
    });
    return withOptions;
};
exports.createCredentialChain = createCredentialChain;
