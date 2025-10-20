"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const file_1 = require("../file");
const OwnershipEngine_1 = require("./OwnershipEngine");
exports.getOwnership = async (codeowners, filePaths) => {
    const engine = OwnershipEngine_1.OwnershipEngine.FromCodeownersFile(codeowners);
    const owned = [];
    for (const filePath of filePaths) {
        const owners = engine.calcFileOwnership(filePath);
        owned.push(new file_1.File({ path: filePath, owners }));
    }
    return owned;
};
//# sourceMappingURL=ownership.js.map