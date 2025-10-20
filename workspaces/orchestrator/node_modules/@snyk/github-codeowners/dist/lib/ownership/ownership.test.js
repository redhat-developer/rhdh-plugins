"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ownership_1 = require("./ownership");
const OwnershipEngine_1 = require("./OwnershipEngine");
const file_1 = require("../file");
jest.mock('./OwnershipEngine');
describe('ownership', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });
    describe('getOwnership', () => {
        it('should create an engine using the specified code owners file', async () => {
            // Arrange
            const expected = 'some/file';
            // Act
            await ownership_1.getOwnership(expected, []);
            // Assert
            expect(OwnershipEngine_1.OwnershipEngine.FromCodeownersFile).toHaveBeenLastCalledWith(expected);
        });
        it('should return owned files', async () => {
            // Arrange
            const expected = [
                new file_1.File({ path: 'is/not-owned', owners: ['@some/owner'] }),
                new file_1.File({ path: 'is/owned', owners: ['@some/other-owner'] }),
            ];
            const mockEngine = OwnershipEngine_1.OwnershipEngine;
            mockEngine.FromCodeownersFile.mockImplementation(() => {
                return Object.assign(Object.assign({}, OwnershipEngine_1.OwnershipEngine), { calcFileOwnership: (path) => {
                        const matching = expected.find(f => f.path === path);
                        if (!matching)
                            throw new Error('unexpected path');
                        return matching.owners;
                    } });
            });
            // Act
            const paths = expected.map(f => f.path);
            const result = await ownership_1.getOwnership('some/file', paths);
            // Assert
            expect(result).toEqual(expected);
        });
    });
});
//# sourceMappingURL=ownership.test.js.map