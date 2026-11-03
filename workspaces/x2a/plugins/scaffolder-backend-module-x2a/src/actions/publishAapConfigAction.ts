/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

import { isChildPath } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import YAML from 'yaml';
import {
  buildScmHostMap,
  normalizeRepoUrl,
  resolveScmProvider,
  ScmProviderName,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, relative, posix } from 'node:path';

const execFileAsync = promisify(execFile);
const REQUIRED_INVENTORY_MARKER = '__X2A_REQUIRED_INVENTORY__';

type YamlDocument = Record<string, unknown>;

function relativePath(value: string, label: string): string {
  if (!value || value.startsWith('/') || value.includes('\\')) {
    throw new Error(`${label} must be a relative POSIX path`);
  }
  const normalized = posix.normalize(value);
  if (
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith('../')
  ) {
    throw new Error(`${label} must not contain parent traversal`);
  }
  return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function singleEntry(
  document: YamlDocument,
  key: string,
  label: string,
): Record<string, unknown> {
  const entries = document[key];
  if (!Array.isArray(entries)) {
    throw new Error(`Invalid YAML structure: missing ${key}`);
  }
  if (entries.length !== 1 || !isRecord(entries[0])) {
    throw new Error(
      `${label} document must contain exactly one entry; found ${entries.length}`,
    );
  }
  return entries[0];
}

function containsRequiredMarker(value: unknown): boolean {
  if (typeof value === 'string') return value.includes('__X2A_REQUIRED_');
  if (Array.isArray(value)) return value.some(containsRequiredMarker);
  if (isRecord(value)) return Object.values(value).some(containsRequiredMarker);
  return false;
}

export async function finalizeDraft(
  sourceRoot: string,
  input: {
    moduleDirectory: string;
    inventory: string;
    scmCredentialName?: string | null;
    jobCredentialNames: string[];
    executionEnvironmentName?: string | null;
  },
): Promise<{ projects: string; jobTemplates: string }> {
  const projectPath = join(sourceRoot, 'controller_projects.yml');
  const jobTemplatePath = join(sourceRoot, 'controller_job_templates.yml');

  let projects: YamlDocument;
  let jobTemplates: YamlDocument;
  let projectContent: string;
  let jobTemplateContent: string;
  try {
    projectContent = await readFile(projectPath, 'utf8');
  } catch {
    throw new Error(
      'Missing controller_projects.yml in AAP configuration draft',
    );
  }
  try {
    jobTemplateContent = await readFile(jobTemplatePath, 'utf8');
  } catch {
    throw new Error(
      'Missing controller_job_templates.yml in AAP configuration draft',
    );
  }
  try {
    projects = YAML.parse(projectContent);
    jobTemplates = YAML.parse(jobTemplateContent);
  } catch {
    throw new Error('Invalid YAML in AAP configuration draft');
  }
  if (!isRecord(projects) || !isRecord(jobTemplates)) {
    throw new Error('AAP configuration YAML documents must be objects');
  }

  const project = singleEntry(
    projects,
    `controller_projects_x2a_${input.moduleDirectory}`,
    'Project',
  );
  const jobTemplate = singleEntry(
    jobTemplates,
    `controller_templates_x2a_${input.moduleDirectory}`,
    'Job Template',
  );
  if (
    typeof project.name !== 'string' ||
    typeof jobTemplate.name !== 'string' ||
    jobTemplate.project !== project.name
  ) {
    throw new Error(
      'AAP configuration Project and Job Template entries do not reference the same project',
    );
  }
  if (jobTemplate.inventory !== REQUIRED_INVENTORY_MARKER) {
    throw new Error(
      'AAP configuration inventory marker is missing or unexpected',
    );
  }
  const inventory = input.inventory.trim();
  if (!inventory || inventory.includes('__X2A_REQUIRED_')) {
    throw new Error('AAP inventory must be a non-empty value');
  }
  jobTemplate.inventory = inventory;

  const scmCredentialName = input.scmCredentialName?.trim();
  if (scmCredentialName) project.scm_credential = scmCredentialName;
  else delete project.scm_credential;

  const jobCredentialNames = input.jobCredentialNames.map(name => name.trim());
  if (jobCredentialNames.some(name => !name)) {
    throw new Error('AAP job credential names must be non-empty values');
  }
  if (new Set(jobCredentialNames).size !== jobCredentialNames.length) {
    throw new Error('AAP job credential names must not contain duplicates');
  }
  if (jobCredentialNames.length) {
    jobTemplate.credentials = jobCredentialNames;
  } else {
    delete jobTemplate.credentials;
  }
  const executionEnvironmentName = input.executionEnvironmentName?.trim();
  if (executionEnvironmentName) {
    jobTemplate.execution_environment = executionEnvironmentName;
  } else {
    delete jobTemplate.execution_environment;
  }
  if (
    containsRequiredMarker(projects) ||
    containsRequiredMarker(jobTemplates)
  ) {
    throw new Error('AAP configuration contains unresolved required markers');
  }
  return {
    projects: YAML.stringify(projects),
    jobTemplates: YAML.stringify(jobTemplates),
  };
}

function repositoryUrl(
  value: string,
  hostProviderMap: Map<string, ScmProviderName>,
): URL {
  let parsed: URL;
  try {
    parsed = new URL(normalizeRepoUrl(value));
  } catch {
    throw new Error('Repository URL must be a valid HTTPS URL');
  }
  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      'Repository URL must use HTTPS and must not contain credentials, query parameters, or fragments',
    );
  }
  resolveScmProvider(parsed.toString(), hostProviderMap);
  return parsed;
}

async function git(
  cwd: string,
  args: string[],
  token: string,
  username: string,
  askpass: string,
): Promise<string> {
  const result = await execFileAsync('git', args, {
    cwd,
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
      GIT_ASKPASS: askpass,
      GIT_USERNAME: username,
      GIT_TOKEN: token,
    },
    maxBuffer: 10 * 1024 * 1024,
  });
  return result.stdout.trim();
}

export type GitRunner = typeof git;

function gitCredentials(
  provider: ReturnType<typeof resolveScmProvider>,
  token: string,
): { username: string; password: string } {
  const augmentedToken = provider.augmentToken(token);
  const separator = augmentedToken.indexOf(':');
  if (separator === -1) {
    return { username: augmentedToken, password: augmentedToken };
  }
  return {
    username: augmentedToken.slice(0, separator),
    password: augmentedToken.slice(separator + 1),
  };
}

async function cloneRepository(
  runGit: GitRunner,
  url: string,
  branch: string | undefined,
  password: string,
  username: string,
  destination: string,
  askpass: string,
): Promise<void> {
  const args = ['clone', '--no-tags'];
  if (branch) args.push('--branch', branch);
  args.push(url, destination);
  await runGit(tmpdir(), args, password, username, askpass);
}

async function remoteBranchExists(
  runGit: GitRunner,
  url: string,
  branch: string,
  password: string,
  username: string,
  askpass: string,
): Promise<boolean> {
  try {
    await runGit(
      tmpdir(),
      ['ls-remote', '--exit-code', '--heads', url, `refs/heads/${branch}`],
      password,
      username,
      askpass,
    );
    return true;
  } catch (error) {
    // With --exit-code, git uses status 2 specifically when no matching refs
    // exist. Authentication, network, and other failures must remain visible.
    if (error instanceof Error && 'code' in error && error.code === 2) {
      return false;
    }
    throw error;
  }
}

async function localCommitExists(
  runGit: GitRunner,
  repositoryDir: string,
  commit: string,
  password: string,
  username: string,
  askpass: string,
): Promise<boolean> {
  try {
    await runGit(
      repositoryDir,
      ['cat-file', '-e', `${commit}^{commit}`],
      password,
      username,
      askpass,
    );
    return true;
  } catch (error) {
    // cat-file exits with status 128 when the requested object is unavailable.
    if (error instanceof Error && 'code' in error && error.code === 128) {
      return false;
    }
    throw error;
  }
}

export type PublishAapConfigActionOptions = {
  git?: GitRunner;
  hostProviderMap?: Map<string, ScmProviderName>;
};

/** Publishes the two converter-owned AAP files directly to a destination branch. */
export function createPublishAapConfigAction(
  config: Config,
  options?: PublishAapConfigActionOptions,
) {
  const hostProviderMap = options?.hostProviderMap ?? buildScmHostMap(config);
  const runGit = options?.git ?? git;
  return createTemplateAction({
    id: 'x2a:aapConfig:publish',
    description:
      'Publish generated AAP Config-as-Code files to a Git repository.',
    schema: {
      input: z => {
        const branch = () =>
          z
            .string()
            .min(1)
            .regex(/^(?!-)[^:]+$/, {
              message: 'Branch must not start with "-" or contain ":"',
            });
        const optionalName = () =>
          z.preprocess(
            value =>
              value === null ||
              (typeof value === 'string' && value.trim() === '')
                ? undefined
                : value,
            z
              .union([z.string().trim().min(1), z.literal(''), z.null()])
              .optional(),
          );
        const jobCredentialNames = z
          .array(z.string().trim().min(1))
          .default([])
          .superRefine((values, ctx) => {
            if (new Set(values).size !== values.length) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'jobCredentialNames must not contain duplicates',
              });
            }
          });
        return z.object({
          sourceRepository: z.string(),
          sourceBranch: branch(),
          sourceCommit: z.string().regex(/^[0-9a-f]{7,64}$/i),
          artifactPath: z.string().min(1),
          inventory: z.string().trim().min(1),
          scmCredentialName: optionalName(),
          jobCredentialNames,
          executionEnvironmentName: optionalName(),
          destinationRepository: z.string(),
          destinationBranch: branch(),
          destinationConfigDirectory: z.string().min(1),
          projectName: z.string().min(1),
          projectDirName: z.string().min(1),
          moduleName: z.string().min(1),
          sourceToken: z.string().min(1),
          destinationToken: z.string().min(1),
        });
      },
      output: {
        destinationRepository: z =>
          z.string({ description: 'The destination repository URL' }),
        destinationBranch: z =>
          z.string({ description: 'The destination repository branch' }),
        destinationCommitSha: z =>
          z.string({ description: 'The destination commit SHA' }),
        destinationCommitUrl: z =>
          z.string({ description: 'The destination commit URL' }),
        changed: z =>
          z.boolean({ description: 'Whether a new commit was created' }),
      },
    },
    async handler(ctx) {
      const input = ctx.input;
      const sourceUrl = repositoryUrl(input.sourceRepository, hostProviderMap);
      const destinationUrl = repositoryUrl(
        input.destinationRepository,
        hostProviderMap,
      );
      const sourceCredentials = gitCredentials(
        resolveScmProvider(sourceUrl.toString(), hostProviderMap),
        input.sourceToken,
      );
      const destinationProvider = resolveScmProvider(
        destinationUrl.toString(),
        hostProviderMap,
      );
      const destinationCredentials = gitCredentials(
        destinationProvider,
        input.destinationToken,
      );
      const sourceBranch = input.sourceBranch;
      const destinationBranch = input.destinationBranch;
      const artifactPath = relativePath(input.artifactPath, 'artifactPath');
      const configDirectory = relativePath(
        input.destinationConfigDirectory,
        'destinationConfigDirectory',
      );
      const projectDirName = relativePath(
        input.projectDirName,
        'projectDirName',
      );
      if (projectDirName.includes('/')) {
        throw new Error('projectDirName must be a single path segment');
      }
      const moduleDirectory = posix.basename(artifactPath);

      const workspace = await mkdtemp(join(tmpdir(), 'x2a-aap-config-'));
      const sourceDir = join(workspace, 'source');
      const destinationDir = join(workspace, 'destination');
      const askpass = join(workspace, 'askpass.sh');
      await writeFile(
        askpass,
        '#!/bin/sh\ncase "$1" in *Username*) printf "%s\\n" "$GIT_USERNAME" ;; *) printf "%s\\n" "$GIT_TOKEN" ;; esac\n',
        { mode: 0o700 },
      );

      try {
        await cloneRepository(
          runGit,
          sourceUrl.toString(),
          sourceBranch,
          sourceCredentials.password,
          sourceCredentials.username,
          sourceDir,
          askpass,
        );
        let sourceCommitExists = await localCommitExists(
          runGit,
          sourceDir,
          input.sourceCommit,
          sourceCredentials.password,
          sourceCredentials.username,
          askpass,
        );
        if (!sourceCommitExists) {
          await runGit(
            sourceDir,
            ['fetch', '--no-tags', 'origin', sourceBranch],
            sourceCredentials.password,
            sourceCredentials.username,
            askpass,
          );
          sourceCommitExists = await localCommitExists(
            runGit,
            sourceDir,
            input.sourceCommit,
            sourceCredentials.password,
            sourceCredentials.username,
            askpass,
          );
        }
        if (!sourceCommitExists) {
          throw new Error(
            `Source commit ${input.sourceCommit} was not found on branch ${sourceBranch}`,
          );
        }
        await runGit(
          sourceDir,
          ['checkout', '--detach', input.sourceCommit],
          sourceCredentials.password,
          sourceCredentials.username,
          askpass,
        );

        const sourceRoot = resolve(sourceDir, artifactPath);
        if (
          !relative(sourceDir, sourceRoot) ||
          relative(sourceDir, sourceRoot).startsWith('..')
        ) {
          throw new Error('artifactPath escapes the source workspace');
        }
        const finalized = await finalizeDraft(sourceRoot, {
          moduleDirectory,
          inventory: input.inventory,
          scmCredentialName: input.scmCredentialName,
          jobCredentialNames: input.jobCredentialNames,
          executionEnvironmentName: input.executionEnvironmentName,
        });

        const destinationExists = await remoteBranchExists(
          runGit,
          destinationUrl.toString(),
          destinationBranch,
          destinationCredentials.password,
          destinationCredentials.username,
          askpass,
        );
        if (destinationExists) {
          await cloneRepository(
            runGit,
            destinationUrl.toString(),
            destinationBranch,
            destinationCredentials.password,
            destinationCredentials.username,
            destinationDir,
            askpass,
          );
        } else {
          await cloneRepository(
            runGit,
            destinationUrl.toString(),
            undefined,
            destinationCredentials.password,
            destinationCredentials.username,
            destinationDir,
            askpass,
          );
          const existingCommit = await runGit(
            destinationDir,
            ['rev-list', '-n', '1', '--all'],
            destinationCredentials.password,
            destinationCredentials.username,
            askpass,
          );
          await runGit(
            destinationDir,
            existingCommit
              ? ['checkout', '-B', destinationBranch]
              : ['checkout', '--orphan', destinationBranch],
            destinationCredentials.password,
            destinationCredentials.username,
            askpass,
          );
        }
        if (!destinationExists)
          ctx.logger.info(`Created destination branch ${destinationBranch}`);

        const destinationRoot = resolve(
          destinationDir,
          configDirectory,
          projectDirName,
          moduleDirectory,
        );
        if (!isChildPath(destinationDir, destinationRoot)) {
          throw new Error('destination path escapes the destination workspace');
        }
        // The module-owned directory is replaced as a unit; everything else
        // in the destination repository remains untouched.
        await rm(destinationRoot, { recursive: true, force: true });
        await mkdir(destinationRoot, { recursive: true });
        await writeFile(
          join(destinationRoot, 'controller_projects.yml'),
          finalized.projects,
        );
        await writeFile(
          join(destinationRoot, 'controller_job_templates.yml'),
          finalized.jobTemplates,
        );
        await runGit(
          destinationDir,
          ['add', '--', join(configDirectory, projectDirName, moduleDirectory)],
          destinationCredentials.password,
          destinationCredentials.username,
          askpass,
        );
        const status = await runGit(
          destinationDir,
          ['status', '--porcelain'],
          destinationCredentials.password,
          destinationCredentials.username,
          askpass,
        );
        if (status) {
          await runGit(
            destinationDir,
            [
              '-c',
              'user.name=X2A',
              '-c',
              'user.email=x2a@redhat.com',
              'commit',
              '-m',
              `x2a: publish AAP config for ${input.projectName}/${input.moduleName}`,
            ],
            destinationCredentials.password,
            destinationCredentials.username,
            askpass,
          );
          await runGit(
            destinationDir,
            ['push', '--set-upstream', 'origin', destinationBranch],
            destinationCredentials.password,
            destinationCredentials.username,
            askpass,
          );
        }
        const commit = await runGit(
          destinationDir,
          ['rev-parse', 'HEAD'],
          destinationCredentials.password,
          destinationCredentials.username,
          askpass,
        );
        const destinationBase = destinationUrl
          .toString()
          .replace(/\.git$/, '')
          .replace(/\/$/, '');
        const provider = destinationProvider.name;
        let commitPath: string;
        if (provider === 'github') {
          commitPath = `/commit/${commit}`;
        } else if (provider === 'bitbucket') {
          commitPath = `/commits/${commit}`;
        } else {
          commitPath = `/-/commit/${commit}`;
        }
        ctx.output('destinationRepository', destinationUrl.toString());
        ctx.output('destinationBranch', destinationBranch);
        ctx.output('destinationCommitSha', commit);
        ctx.output('destinationCommitUrl', `${destinationBase}${commitPath}`);
        ctx.output('changed', Boolean(status));
      } finally {
        await rm(workspace, { recursive: true, force: true });
      }
    },
  });
}
