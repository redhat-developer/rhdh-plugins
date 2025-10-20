"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = __importDefault(require("child_process"));
const util_1 = __importDefault(require("util"));
const uuid_1 = require("uuid");
const default_1 = __importDefault(require("./__fixtures__/default"));
const project_builder_test_helper_1 = require("./__fixtures__/project-builder.test.helper");
const exec = util_1.default.promisify(child_process_1.default.exec);
const writeFile = util_1.default.promisify(fs_1.default.writeFile);
describe('audit', () => {
    let testDir = 'not set';
    const runCli = async (args) => {
        return exec(`node  ../../../dist/cli.js ${args}`, { cwd: testDir });
    };
    const gitTrackProject = async () => {
        await exec(`git init`, { cwd: testDir });
        await exec(`git add .`, { cwd: testDir });
        await exec(`git config user.email "github-codeowners@example.com"`, { cwd: testDir });
        await exec(`git config user.name "github-codeowners"`, { cwd: testDir });
        await exec(`git commit -m "integration tests"`, { cwd: testDir });
    };
    const outputs = ['simple', 'jsonl', 'csv'];
    for (const output of outputs) {
        describe(output, () => {
            beforeEach(async () => {
                const testId = uuid_1.v4();
                testDir = await project_builder_test_helper_1.generateProject(testId, default_1.default);
            });
            it('should list ownership for all files', async () => {
                const { stdout, stderr } = await runCli(`audit -o ${output}`);
                expect(stdout).toMatchSnapshot('stdout');
                expect(stderr).toMatchSnapshot('stderr');
            });
            it('should calculate stats when asked', async () => {
                const { stdout, stderr } = await runCli(`audit -s -o ${output}`);
                expect(stdout).toMatchSnapshot('stdout');
                expect(stderr).toMatchSnapshot('stderr');
            });
            it('should show only unloved files when asked', async () => {
                const { stdout, stderr } = await runCli(`audit -u -o ${output}`);
                expect(stdout).toMatchSnapshot('stdout');
                expect(stderr).toMatchSnapshot('stderr');
            });
            it('should use a specific root when asked', async () => {
                const { stdout, stderr } = await runCli(`audit -r deep -o ${output}`);
                expect(stdout).toMatchSnapshot('stdout');
                expect(stderr).toMatchSnapshot('stderr');
            });
            it('should only consider files tracked in git root when asked', async () => {
                // Arrange
                await gitTrackProject();
                await writeFile(path_1.default.resolve(testDir, 'git-untracked.txt'), 'not tracked in git');
                // Act
                const { stdout, stderr } = await runCli(`audit -g -o ${output}`);
                // Assert
                expect(stdout).toMatchSnapshot('stdout');
                expect(stderr).toMatchSnapshot('stderr');
            });
            it('should do all commands in combination when asked', async () => {
                const { stdout, stderr } = await runCli(`audit -us -r deep -o ${output}`);
                expect(stdout).toMatchSnapshot('stdout');
                expect(stderr).toMatchSnapshot('stderr');
            });
        });
    }
});
//# sourceMappingURL=audit.test.int.js.map