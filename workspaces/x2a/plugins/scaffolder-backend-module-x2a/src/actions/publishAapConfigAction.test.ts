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
import { mkdir, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises';
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

  it('trims job credential names before writing them', async () => {
    const directory = await createDraft();

    const result = await finalizeDraft(directory, {
      moduleDirectory: 'nginx',
      inventory: 'Production',
      jobCredentialNames: [' ssh-prod ', 'vault-prod  '],
    });

    expect(result.jobTemplates).toContain('- ssh-prod');
    expect(result.jobTemplates).toContain('- vault-prod');
    expect(result.jobTemplates).not.toContain(' ssh-prod ');
    expect(result.jobTemplates).not.toContain('vault-prod  ');
  });

  it.each([
    { names: ['   '], message: 'non-empty values' },
    {
      names: ['ssh-prod', ' ssh-prod '],
      message: 'must not contain duplicates',
    },
  ])(
    'rejects invalid job credential names $names',
    async ({ names, message }) => {
      const directory = await createDraft();

      await expect(
        finalizeDraft(directory, {
          moduleDirectory: 'nginx',
          inventory: 'Production',
          jobCredentialNames: names,
        }),
      ).rejects.toThrow(message);
    },
  );
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
  destinationRepositoryEmpty?: boolean;
  remoteBranchError?: Error;
  rejectRawShaFetch?: boolean;
  sourceCommitInitiallyMissing?: boolean;
  sourceCommitMissingAfterFetch?: boolean;
  status?: string;
  setupDestination?: (destination: string) => Promise<void>;
}) {
  const destinationBranchExists = options?.destinationBranchExists ?? true;
  const status = options?.status ?? 'A  config/dev/project/nginx/config.yml';
  let sourceBranchFetched = false;
  return jest.fn(
    async (
      _cwd: string,
      args: string[],
      _password: string,
      _username: string,
    ): Promise<string> => {
      if (args[0] === 'ls-remote') {
        if (options?.remoteBranchError) throw options.remoteBranchError;
        if (!destinationBranchExists) {
          throw Object.assign(new Error('branch not found'), { code: 2 });
        }
        return commitSha;
      }
      if (args[0] === 'fetch') {
        if (options?.rejectRawShaFetch && args.at(-1) === commitSha) {
          throw new Error('raw SHA fetch rejected');
        }
        sourceBranchFetched = true;
        return '';
      }
      if (args[0] === 'cat-file') {
        if (
          options?.sourceCommitInitiallyMissing &&
          (!sourceBranchFetched || options.sourceCommitMissingAfterFetch)
        ) {
          throw Object.assign(new Error('commit not found'), { code: 128 });
        }
        return '';
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
        } else {
          await options?.setupDestination?.(destination);
        }
        return '';
      }
      if (args[0] === 'status') return status;
      if (args[0] === 'rev-list') {
        return options?.destinationRepositoryEmpty ? '' : commitSha;
      }
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

  it('checks out an already-cloned source commit without fetching its SHA', async () => {
    const fakeGit = createFakeGit({ rejectRawShaFetch: true });
    const action = createPublishAapConfigAction(config, { git: fakeGit });

    await action.handler(createContext('bitbucket.org'));

    expect(
      fakeGit.mock.calls.some(
        call =>
          call[1][0] === 'cat-file' && call[1][2] === `${commitSha}^{commit}`,
      ),
    ).toBe(true);
    expect(
      fakeGit.mock.calls.some(
        call => call[1][0] === 'fetch' && call[1].at(-1) === commitSha,
      ),
    ).toBe(false);
    expect(
      fakeGit.mock.calls.some(
        call =>
          call[1][0] === 'checkout' &&
          call[1][1] === '--detach' &&
          call[1][2] === commitSha,
      ),
    ).toBe(true);
  });

  it('fetches the source branch when the commit is not in the clone', async () => {
    const fakeGit = createFakeGit({ sourceCommitInitiallyMissing: true });
    const action = createPublishAapConfigAction(config, { git: fakeGit });

    await action.handler(createContext('bitbucket.org'));

    expect(
      fakeGit.mock.calls.some(
        call =>
          call[1][0] === 'fetch' &&
          call[1][1] === '--no-tags' &&
          call[1].at(-1) === 'main',
      ),
    ).toBe(true);
    expect(
      fakeGit.mock.calls.filter(call => call[1][0] === 'cat-file'),
    ).toHaveLength(2);
  });

  it('rejects a source commit that is still missing after fetching the branch', async () => {
    const fakeGit = createFakeGit({
      sourceCommitInitiallyMissing: true,
      sourceCommitMissingAfterFetch: true,
    });
    const action = createPublishAapConfigAction(config, { git: fakeGit });

    await expect(
      action.handler(createContext('bitbucket.org')),
    ).rejects.toThrow(
      `Source commit ${commitSha} was not found on branch main`,
    );
    expect(
      fakeGit.mock.calls.some(
        call => call[1][0] === 'checkout' && call[1][1] === '--detach',
      ),
    ).toBe(false);
  });

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

  it('creates an orphan destination branch when the repository is empty', async () => {
    const fakeGit = createFakeGit({
      destinationBranchExists: false,
      destinationRepositoryEmpty: true,
    });
    const action = createPublishAapConfigAction(config, { git: fakeGit });

    await action.handler(createContext('github.com'));

    expect(
      fakeGit.mock.calls.some(
        call => call[1][0] === 'checkout' && call[1][1] === '--orphan',
      ),
    ).toBe(true);
    expect(
      fakeGit.mock.calls.some(
        call => call[1][0] === 'checkout' && call[1][1] === '-B',
      ),
    ).toBe(false);
    expect(fakeGit.mock.calls.some(call => call[1][0] === 'push')).toBe(true);
  });

  it.each([
    ['authentication', 128],
    ['network', 'ENETUNREACH'],
  ])(
    'propagates %s errors while checking the destination branch',
    async (_, code) => {
      const fakeGit = createFakeGit({
        remoteBranchError: Object.assign(new Error('remote lookup failed'), {
          code,
        }),
      });
      const action = createPublishAapConfigAction(config, { git: fakeGit });

      await expect(action.handler(createContext('github.com'))).rejects.toThrow(
        'remote lookup failed',
      );
      expect(fakeGit.mock.calls.some(call => call[1][0] === 'push')).toBe(
        false,
      );
    },
  );

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

  it('rejects a symlinked destination parent outside the clone', async () => {
    const outside = await mkdtemp(join(tmpdir(), 'x2a-outside-test-'));
    const sentinel = join(outside, 'keep.txt');
    await writeFile(sentinel, 'keep');
    const fakeGit = createFakeGit({
      setupDestination: destination =>
        symlink(outside, join(destination, 'config'), 'dir'),
    });
    const action = createPublishAapConfigAction(config, { git: fakeGit });

    await expect(action.handler(createContext('github.com'))).rejects.toThrow(
      'destination path escapes the destination workspace',
    );
    await expect(readFile(sentinel, 'utf8')).resolves.toBe('keep');
    await expect(
      readFile(
        join(outside, 'dev', 'project', 'nginx', 'controller_projects.yml'),
        'utf8',
      ),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
