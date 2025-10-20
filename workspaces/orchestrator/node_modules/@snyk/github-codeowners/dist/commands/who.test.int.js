"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const default_1 = __importDefault(require("./__fixtures__/default"));
const project_builder_test_helper_1 = require("./__fixtures__/project-builder.test.helper");
const util_1 = __importDefault(require("util"));
const exec = util_1.default.promisify(require('child_process').exec);
describe('who', () => {
    const testId = uuid_1.v4();
    let testDir = 'not set';
    beforeAll(async () => {
        testDir = await project_builder_test_helper_1.generateProject(testId, default_1.default);
        // tslint:disable-next-line:no-console
        console.log(`test scratch dir: ${testDir}`);
    });
    const runCli = async (args) => {
        return exec(`node  ../../../dist/cli.js ${args}`, { cwd: testDir });
    };
    it('should list ownership for one file', async () => {
        const { stdout, stderr } = await runCli('who default-wildcard-owners.md');
        expect(stdout).toMatchSnapshot('stdout');
        expect(stderr).toMatchSnapshot('stderr');
    });
    it('should list ownership for multiple files', async () => {
        const { stdout, stderr } = await runCli('who explicit-ignore.js default-wildcard-owners.md');
        expect(stdout).toMatchSnapshot('stdout');
        expect(stderr).toMatchSnapshot('stderr');
    });
});
//# sourceMappingURL=who.test.int.js.map