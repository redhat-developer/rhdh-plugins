/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

import { ConfigReader } from '@backstage/config';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createPublishAapConfigAction,
  finalizeDraft,
} from './publishAapConfigAction';

async function createDraft(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'x2a-draft-test-'));
  await writeFile(
    join(directory, 'controller_projects.yml'),
    [
      'controller_projects_x2a_nginx:',
      '  - name: x2a_nginx',
      '    organization: Platform',
      '    scm_url: https://github.com/example/project.git',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(directory, 'controller_job_templates.yml'),
    [
      'controller_templates_x2a_nginx:',
      '  - name: x2a_nginx',
      '    project: x2a_nginx',
      '    inventory: __X2A_REQUIRED_INVENTORY__',
      '',
    ].join('\n'),
  );
  return directory;
}

describe('finalizeDraft', () => {
  it('mutates the declared YAML entries structurally', async () => {
    const directory = await createDraft();

    const result = await finalizeDraft(directory, {
      moduleDirectory: 'nginx',
      inventory: 'Production',
      scmCredentialName: 'scm-prod',
      jobCredentialNames: ['ssh-prod', 'vault-prod'],
      executionEnvironmentName: 'ee-prod',
    });

    expect(result.projects).toContain('scm_credential: scm-prod');
    expect(result.jobTemplates).toContain('inventory: Production');
    expect(result.jobTemplates).toContain('credentials:');
    expect(result.jobTemplates).toContain('- ssh-prod');
    expect(result.jobTemplates).toContain('execution_environment: ee-prod');
    expect(result.jobTemplates).not.toContain('__X2A_REQUIRED_');
  });

  it('rejects a draft whose inventory marker was already changed', async () => {
    const directory = await createDraft();
    await writeFile(
      join(directory, 'controller_job_templates.yml'),
      'controller_templates_x2a_nginx:\n  - name: x2a_nginx\n    project: x2a_nginx\n    inventory: old\n',
    );

    await expect(
      finalizeDraft(directory, {
        moduleDirectory: 'nginx',
        inventory: 'Production',
        jobCredentialNames: [],
      }),
    ).rejects.toThrow('inventory marker is missing or unexpected');
  });

  it('rejects a missing draft file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'x2a-draft-test-'));

    await expect(
      finalizeDraft(directory, {
        moduleDirectory: 'nginx',
        inventory: 'Production',
        jobCredentialNames: [],
      }),
    ).rejects.toThrow('Missing controller_projects.yml');
  });
});

const config = new ConfigReader({
  integrations: {
    github: [{ host: 'github.com' }],
    gitlab: [{ host: 'gitlab.com' }],
    bitbucketCloud: [{ host: 'bitbucket.org' }],
  },
});

const commitSha = '0123456789abcdef0123456789abcdef01234567';
const artifactPath = 'project/ansible/aap-config/nginx';

type JsonSchema = {
  type?: string;
  const?: unknown;
  pattern?: string;
  properties?: Record<string, JsonSchema>;
  anyOf?: JsonSchema[];
};

function inputProperty(
  action: ReturnType<typeof createPublishAapConfigAction>,
  name: string,
) {
  const schema = action.schema?.input as JsonSchema;
  return schema.properties?.[name];
}

function schemaContains(
  schema: JsonSchema | undefined,
  predicate: (candidate: JsonSchema) => boolean,
): boolean {
  if (!schema) return false;
  if (predicate(schema)) return true;
  return (
    schema.anyOf?.some(candidate => schemaContains(candidate, predicate)) ??
    false
  );
}

function createFakeGit(options?: {
  destinationBranchExists?: boolean;
  status?: string;
}) {
  const destinationBranchExists = options?.destinationBranchExists ?? true;
  const status = options?.status ?? 'A  config/dev/project/nginx/config.yml';
  return jest.fn(
    async (
      _cwd: string,
      args: string[],
      _password: string,
      _username: string,
    ): Promise<string> => {
      if (args[0] === 'ls-remote') {
        if (!destinationBranchExists) throw new Error('branch not found');
        return commitSha;
      }
      if (args[0] === 'clone') {
        const repository = args.at(-2)!;
        const destination = args.at(-1)!;
        await mkdir(destination, { recursive: true });
        if (repository.includes('/source')) {
          const sourceRoot = join(destination, artifactPath);
          await mkdir(sourceRoot, { recursive: true });
          await writeFile(
            join(sourceRoot, 'controller_projects.yml'),
            'controller_projects_x2a_nginx:\n  - name: project\n',
          );
          await writeFile(
            join(sourceRoot, 'controller_job_templates.yml'),
            'controller_templates_x2a_nginx:\n  - name: project_nginx\n    project: project\n    inventory: __X2A_REQUIRED_INVENTORY__\n',
          );
        }
        return '';
      }
      if (args[0] === 'status') return status;
      if (args[0] === 'rev-parse') return commitSha;
      return '';
    },
  );
}

function createContext(
  host: string,
  optionalNames: {
    scmCredentialName?: string | null;
    executionEnvironmentName?: string | null;
  } = {},
) {
  return createMockActionContext({
    input: {
      sourceRepository: `https://${host}/acme/source.git`,
      sourceBranch: 'main',
      sourceCommit: commitSha,
      artifactPath,
      inventory: 'Production',
      jobCredentialNames: [],
      destinationRepository: `https://${host}/acme/destination.git`,
      destinationBranch: 'main',
      destinationConfigDirectory: 'config/dev',
      projectName: 'Project',
      projectDirName: 'project',
      moduleName: 'nginx',
      sourceToken: 'source-token',
      destinationToken: 'destination-token',
      ...optionalNames,
    },
  });
}

describe('x2a:aapConfig:publish', () => {
  it.each(['scmCredentialName', 'executionEnvironmentName'])(
    'accepts blank and null values for optional %s',
    propertyName => {
      const action = createPublishAapConfigAction(config);
      const property = inputProperty(action, propertyName);

      expect(
        schemaContains(property, candidate => candidate.const === ''),
      ).toBe(true);
      expect(
        schemaContains(property, candidate => candidate.type === 'null'),
      ).toBe(true);
    },
  );

  it('publishes when optional AAP names are blank or null', async () => {
    const fakeGit = createFakeGit();
    const action = createPublishAapConfigAction(config, { git: fakeGit });
    const context = createContext('github.com', {
      scmCredentialName: '',
      executionEnvironmentName: null,
    });

    await action.handler(context);

    expect(context.output).toHaveBeenCalledWith('changed', true);
  });

  it.each(['sourceBranch', 'destinationBranch'])(
    'rejects option-like and refspec values for %s',
    propertyName => {
      const action = createPublishAapConfigAction(config);
      const pattern = inputProperty(action, propertyName)?.pattern;

      expect(pattern).toBeDefined();
      const expression = new RegExp(pattern!);
      expect(expression.test('main')).toBe(true);
      expect(expression.test('-upload-pack=malicious')).toBe(false);
      expect(expression.test('main:refs/heads/other')).toBe(false);
    },
  );

  it.each([
    [
      'github.com',
      'source-token',
      `https://github.com/acme/destination/commit/${commitSha}`,
    ],
    [
      'gitlab.com',
      'oauth2',
      `https://gitlab.com/acme/destination/-/commit/${commitSha}`,
    ],
    [
      'bitbucket.org',
      'x-token-auth',
      `https://bitbucket.org/acme/destination/commits/${commitSha}`,
    ],
  ])(
    'uses provider credentials and commit URLs for %s',
    async (host, expectedSourceUsername, expectedCommitUrl) => {
      const fakeGit = createFakeGit();
      const action = createPublishAapConfigAction(config, { git: fakeGit });
      const context = createContext(host);

      await action.handler(context);

      const sourceCalls = fakeGit.mock.calls.filter(
        call => call[2] === 'source-token',
      );
      expect(sourceCalls.length).toBeGreaterThan(0);
      expect(
        sourceCalls.every(call => call[3] === expectedSourceUsername),
      ).toBe(true);
      const destinationCalls = fakeGit.mock.calls.filter(
        call => call[2] === 'destination-token',
      );
      const expectedDestinationUsername =
        expectedSourceUsername === 'source-token'
          ? 'destination-token'
          : expectedSourceUsername;
      expect(
        destinationCalls.every(call => call[3] === expectedDestinationUsername),
      ).toBe(true);
      expect(context.output).toHaveBeenCalledWith(
        'destinationCommitUrl',
        expectedCommitUrl,
      );
      expect(context.output).toHaveBeenCalledWith('changed', true);
    },
  );

  it('creates the destination branch when it does not exist', async () => {
    const fakeGit = createFakeGit({ destinationBranchExists: false });
    const action = createPublishAapConfigAction(config, { git: fakeGit });

    await action.handler(createContext('github.com'));

    expect(
      fakeGit.mock.calls.some(
        call => call[1][0] === 'checkout' && call[1][1] === '-B',
      ),
    ).toBe(true);
  });

  it('does not commit or push an unchanged tree', async () => {
    const fakeGit = createFakeGit({ status: '' });
    const action = createPublishAapConfigAction(config, { git: fakeGit });
    const context = createContext('github.com');

    await action.handler(context);

    expect(fakeGit.mock.calls.some(call => call[1].includes('commit'))).toBe(
      false,
    );
    expect(fakeGit.mock.calls.some(call => call[1][0] === 'push')).toBe(false);
    expect(context.output).toHaveBeenCalledWith('changed', false);
  });
});
