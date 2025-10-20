"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const underTest = __importStar(require("./readDir"));
const path = __importStar(require("path"));
jest.mock('fs');
const readdirSyncMock = fs_1.default.readdirSync;
const statSyncMock = fs_1.default.statSync;
const readFileSync = fs_1.default.readFileSync;
describe('readDirRecursively', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });
    it('should return all files in the root directory', async () => {
        // Arrange
        const expectedFiles = [
            'some-file',
            'some-other-file',
        ];
        readdirSyncMock.mockReturnValue(expectedFiles);
        statSyncMock.mockReturnValue(statFake(STAT_FAKE_TYPES.FILE));
        // Act
        const result = await underTest.readDir('root');
        // Assert
        expect(readdirSyncMock).toHaveBeenCalledWith(path.resolve('root'));
        expect(result).toEqual(expectedFiles);
    });
    it('should return all files in child directories directory', async () => {
        // Arrange
        const expectedChildDir = 'sub-dir';
        const expectedFiles = [
            'some-file',
            'some-other-file',
        ];
        readdirSyncMock.mockReturnValueOnce([expectedChildDir]);
        statSyncMock.mockReturnValueOnce(statFake(STAT_FAKE_TYPES.DIR));
        readdirSyncMock.mockReturnValueOnce(expectedFiles);
        statSyncMock.mockReturnValue(statFake(STAT_FAKE_TYPES.FILE));
        // Act
        const result = await underTest.readDir('root');
        // Assert
        expect(readdirSyncMock).toHaveBeenCalledWith(path.resolve('root'));
        for (const expected of expectedFiles) {
            expect(result).toContain(path.join(expectedChildDir, expected));
        }
    });
    it('should ignore files matching the provided patterns', async () => {
        // Arrange
        const expectedFiles = [
            'some-file',
        ];
        readdirSyncMock.mockReturnValue([...expectedFiles, 'ignored.js']);
        statSyncMock.mockReturnValue(statFake(STAT_FAKE_TYPES.FILE));
        // Act
        const result = await underTest.readDir('root', ['*.js']);
        // Assert
        expect(result).toEqual(expectedFiles);
    });
    it('should filter a file which when it has a matching rule in the root .gitignore', async () => {
        // Arrange
        const expectedFiles = [
            '.gitignore',
            'some-file',
        ];
        readdirSyncMock.mockReturnValue([...expectedFiles, 'ignored.js']);
        readFileSync.mockReturnValue(Buffer.from('*.js'));
        statSyncMock.mockReturnValue(statFake(STAT_FAKE_TYPES.FILE));
        // Act
        const result = await underTest.readDir('root');
        // Assert
        expect(result).toEqual(expectedFiles);
    });
    it('should filter a file which when it has a matching rule in a nested .gitignore', async () => {
        // Arrange
        const expectedFiles = [
            '.gitignore',
            'child/.gitignore',
            'child/some-file',
        ];
        readdirSyncMock.mockReturnValueOnce(['.gitignore', 'child']);
        statSyncMock.mockReturnValueOnce(statFake(STAT_FAKE_TYPES.FILE));
        statSyncMock.mockReturnValueOnce(statFake(STAT_FAKE_TYPES.DIR));
        readFileSync.mockReturnValueOnce(Buffer.from(''));
        readdirSyncMock.mockReturnValueOnce(['.gitignore', 'some-file', 'ignore.js']);
        statSyncMock.mockReturnValue(statFake(STAT_FAKE_TYPES.FILE));
        readFileSync.mockReturnValueOnce(Buffer.from('*.js'));
        // Act
        const result = await underTest.readDir('root');
        // Assert
        expect(result).toEqual(expectedFiles);
    });
    it('should respect rules in the parent .gitignore when they are not overwritten in the child .gitignore', async () => {
        // Arrange
        const expectedFiles = [
            '.gitignore',
            'child/.gitignore',
            'child/some-file',
        ];
        readdirSyncMock.mockReturnValueOnce(['.gitignore', 'child']);
        statSyncMock.mockReturnValueOnce(statFake(STAT_FAKE_TYPES.FILE));
        statSyncMock.mockReturnValueOnce(statFake(STAT_FAKE_TYPES.DIR));
        readFileSync.mockReturnValueOnce(Buffer.from('*.js'));
        readdirSyncMock.mockReturnValueOnce(['.gitignore', 'some-file', 'ignore.js']);
        statSyncMock.mockReturnValue(statFake(STAT_FAKE_TYPES.FILE));
        readFileSync.mockReturnValueOnce(Buffer.from(''));
        // Act
        const result = await underTest.readDir('root');
        // Assert
        expect(result).toEqual(expectedFiles);
    });
    it('should respect precedence and allow rules to be overwritten by child .gitignores', async () => {
        // Arrange
        const expectedFiles = [
            '.gitignore',
            'child/.gitignore',
            'child/some-file',
            'child/not-ignored.js',
        ];
        readdirSyncMock.mockReturnValueOnce(['.gitignore', 'child']);
        statSyncMock.mockReturnValueOnce(statFake(STAT_FAKE_TYPES.FILE));
        statSyncMock.mockReturnValueOnce(statFake(STAT_FAKE_TYPES.DIR));
        readFileSync.mockReturnValueOnce(Buffer.from('*.js'));
        readdirSyncMock.mockReturnValueOnce(['.gitignore', 'some-file', 'not-ignored.js']);
        statSyncMock.mockReturnValue(statFake(STAT_FAKE_TYPES.FILE));
        readFileSync.mockReturnValueOnce(Buffer.from('!*.js'));
        // Act
        const result = await underTest.readDir('root');
        // Assert
        expect(result).toEqual(expectedFiles);
    });
    let STAT_FAKE_TYPES;
    (function (STAT_FAKE_TYPES) {
        STAT_FAKE_TYPES["FILE"] = "FILE";
        STAT_FAKE_TYPES["DIR"] = "DIR";
        STAT_FAKE_TYPES["OTHER"] = "OTHER";
    })(STAT_FAKE_TYPES || (STAT_FAKE_TYPES = {}));
    const statFake = (type) => {
        switch (type) {
            case STAT_FAKE_TYPES.DIR:
                return {
                    isFile: () => false,
                    isDirectory: () => true,
                };
            case STAT_FAKE_TYPES.FILE:
                return {
                    isFile: () => true,
                    isDirectory: () => false,
                };
            default:
                throw new Error();
        }
    };
});
//# sourceMappingURL=readDir.test.js.map