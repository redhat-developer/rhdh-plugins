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
const uuid_1 = require("uuid");
const validate_1 = __importStar(require("./__fixtures__/validate"));
const project_builder_test_helper_1 = require("./__fixtures__/project-builder.test.helper");
const util_1 = __importDefault(require("util"));
const exec = util_1.default.promisify(require('child_process').exec);
describe('validate', () => {
    describe('when all owners are valid', () => {
        const testId = uuid_1.v4();
        let testDir = 'not set';
        beforeAll(async () => {
            testDir = await project_builder_test_helper_1.generateProject(testId, validate_1.default);
            // tslint:disable-next-line:no-console
            console.log(`test scratch dir: ${testDir}`);
        });
        const runCli = async (args) => {
            return exec(`node  ../../../dist/cli.js ${args}`, { cwd: testDir });
        };
        it('output the result of all validation checks', async () => {
            const { stdout, stderr } = await runCli('validate');
            expect(stdout).toMatchSnapshot('stdout');
            expect(stderr).toMatchSnapshot('stderr');
        });
    });
    describe('when owners are invalid', () => {
        const testId = uuid_1.v4();
        let testDir = 'not set';
        beforeAll(async () => {
            testDir = await project_builder_test_helper_1.generateProject(testId, validate_1.invalidOwnerFixtures);
            // tslint:disable-next-line:no-console
            console.log(`test scratch dir: ${testDir}`);
        });
        const runCli = async (args) => {
            return exec(`node  ../../../dist/cli.js ${args}`, { cwd: testDir });
        };
        it('should throw on invalid users', async () => {
            await expect(() => runCli('validate')).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=validate.test.int.js.map