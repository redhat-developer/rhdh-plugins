"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const default_1 = __importDefault(require("./__fixtures__/default"));
const project_builder_test_helper_1 = require("./__fixtures__/project-builder.test.helper");
const util_1 = __importDefault(require("util"));
const { version } = require('../../package.json');
const exec = util_1.default.promisify(require('child_process').exec);
describe('git', () => {
    const testId = uuid_1.v4();
    let testDir = 'not set';
    beforeAll(async () => {
        testDir = await project_builder_test_helper_1.generateProject(testId, default_1.default);
        // tslint:disable-next-line:no-console
        console.log(`test scratch dir: ${testDir}`);
    });
    const runCli = async (args) => {
        return exec(`node dist/cli.js ${args}`);
    };
    const outputs = ['simple', 'jsonl', 'csv'];
    for (const output of outputs) {
        describe(output, () => {
            it('should list ownership at the specific commit when a commit sha is provided', async () => {
                const { stdout, stderr } = await runCli(`git 2d9bde975c5a5b1a20c57ce0918b0071dcd44e61 -o ${output}`);
                expect(stdout).toMatchSnapshot('stdout');
                expect(stderr).toMatchSnapshot('stderr');
            });
            it('should list ownership of files changed between specific commits', async () => {
                const { stdout, stderr } = await runCli(`git 2d9bde975c5a5b1a20c57ce0918b0071dcd44e61 062f7fe9568b8f66ca97f67c6be9ead0eaba7b38 -o ${output}`);
                expect(stdout).toMatchSnapshot('stdout');
                expect(stderr).toMatchSnapshot('stderr');
            });
        });
    }
    describe('cli', () => {
        it('should print package version', async () => {
            const { stdout, stderr } = await runCli('--version');
            expect(stdout).toEqual(`${version}\n`);
        });
    });
});
//# sourceMappingURL=git.test.int.js.map