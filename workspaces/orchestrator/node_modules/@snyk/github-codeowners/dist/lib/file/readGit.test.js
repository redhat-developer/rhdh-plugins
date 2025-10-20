"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const exec_1 = require("../util/exec");
const readGit_1 = require("./readGit");
const fs_1 = __importDefault(require("fs"));
jest.mock('../util/exec');
jest.mock('fs');
const fsMocked = jest.mocked(fs_1.default);
const execFileMock = exec_1.exec;
describe('readGit', () => {
    beforeEach(() => {
        fsMocked.statSync.mockImplementation((path) => {
            return {
                isFile() {
                    if (!path) {
                        return false;
                    }
                    return true;
                },
            };
        });
    });
    it('should return the expected list of files when called', async () => {
        execFileMock.mockResolvedValue({ stdout: 'foo\nbar\n', stderr: '' });
        const result = await readGit_1.readGit('some/dir');
        expect(result).toStrictEqual(['foo', 'bar']);
    });
    it('should call git ls-files with the correct directory', async () => {
        execFileMock.mockResolvedValue({ stdout: '', stderr: '' });
        const result = await readGit_1.readGit('some/dir');
        expect(exec_1.exec).toHaveBeenCalledWith('git ls-files', expect.objectContaining({
            cwd: 'some/dir',
        }));
    });
    it('should not return non-files', async () => {
        execFileMock.mockResolvedValue({ stdout: 'foo\nbar\nbaz\n', stderr: '' });
        fsMocked.statSync.mockImplementation((path) => {
            return {
                isFile() {
                    if (!path || path === 'baz') {
                        return false;
                    }
                    return true;
                },
            };
        });
        const result = await readGit_1.readGit('some/dir');
        expect(result).toStrictEqual(['foo', 'bar']);
    });
});
//# sourceMappingURL=readGit.test.js.map