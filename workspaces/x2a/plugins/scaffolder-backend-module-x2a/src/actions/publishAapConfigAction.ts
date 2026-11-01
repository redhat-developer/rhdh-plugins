/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

import { Config } from '@backstage/config';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { z as zod } from 'zod';
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

const jobCredentialNamesSchema = zod
  .array(zod.string().trim().min(1))
  .default([])
  .superRefine((values, ctx) => {
    if (new Set(values).size !== values.length) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: 'jobCredentialNames must not contain duplicates',
      });
    }
  });

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
    inventory: string;
    scmCredentialName?: string;
    jobCredentialNames: string[];
    executionEnvironmentName?: string;
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

  const project = singleEntry(projects, 'controller_projects_x2a', 'Project');
  const jobTemplate = singleEntry(
    jobTemplates,
    'controller_templates_x2a',
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

  if (input.jobCredentialNames.length) {
    jobTemplate.credentials = input.jobCredentialNames;
  }
  const executionEnvironmentName = input.executionEnvironmentName?.trim();
  if (executionEnvironmentName) {
    jobTemplate.execution_environment = executionEnvironmentName;
  } else {
    delete jobTemplate.execution_environment;
  }
  if (!input.jobCredentialNames.length) delete jobTemplate.credentials;

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

async function cloneRepository(
  url: string,
  branch: string | undefined,
  token: string,
  username: string,
  destination: string,
  askpass: string,
): Promise<void> {
  const args = ['clone', '--no-tags'];
  if (branch) args.push('--branch', branch);
  args.push(url, destination);
  await git(tmpdir(), args, token, username, askpass);
}

async function remoteBranchExists(
  url: string,
  branch: string,
  token: string,
  username: string,
  askpass: string,
): Promise<boolean> {
  try {
    await git(
      tmpdir(),
      ['ls-remote', '--exit-code', '--heads', url, `refs/heads/${branch}`],
      token,
      username,
      askpass,
    );
    return true;
  } catch {
    return false;
  }
}

/** Publishes the two converter-owned AAP files directly to a destination branch. */
export function createPublishAapConfigAction(config: Config) {
  const hostProviderMap = buildScmHostMap(config);
  return createTemplateAction({
    id: 'x2a:aapConfig:publish',
    description:
      'Publish generated AAP Config-as-Code files to a Git repository.',
    schema: {
      input: () =>
        zod.object({
          sourceRepository: zod.string(),
          sourceBranch: zod.string().min(1),
          sourceCommit: zod.string().regex(/^[0-9a-f]{7,64}$/i),
          artifactPath: zod.string().min(1),
          inventory: zod.string().trim().min(1),
          scmCredentialName: zod.string().trim().min(1).optional(),
          jobCredentialNames: jobCredentialNamesSchema,
          executionEnvironmentName: zod.string().trim().min(1).optional(),
          destinationRepository: zod.string(),
          destinationBranch: zod.string().min(1),
          destinationConfigDirectory: zod.string().min(1),
          projectName: zod.string().min(1),
          projectDirName: zod.string().min(1),
          moduleName: zod.string().min(1),
          sourceToken: zod.string().min(1),
          destinationToken: zod.string().min(1),
        }),
    },
    async handler(ctx) {
      const input = ctx.input;
      const sourceUrl = repositoryUrl(input.sourceRepository, hostProviderMap);
      const destinationUrl = repositoryUrl(
        input.destinationRepository,
        hostProviderMap,
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
          sourceUrl.toString(),
          sourceBranch,
          input.sourceToken,
          'oauth2',
          sourceDir,
          askpass,
        );
        await git(
          sourceDir,
          ['fetch', '--no-tags', 'origin', input.sourceCommit],
          input.sourceToken,
          'oauth2',
          askpass,
        );
        await git(
          sourceDir,
          ['checkout', '--detach', input.sourceCommit],
          input.sourceToken,
          'oauth2',
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
          inventory: input.inventory,
          scmCredentialName: input.scmCredentialName,
          jobCredentialNames: input.jobCredentialNames,
          executionEnvironmentName: input.executionEnvironmentName,
        });

        const destinationExists = await remoteBranchExists(
          destinationUrl.toString(),
          destinationBranch,
          input.destinationToken,
          'oauth2',
          askpass,
        );
        if (destinationExists) {
          await cloneRepository(
            destinationUrl.toString(),
            destinationBranch,
            input.destinationToken,
            'oauth2',
            destinationDir,
            askpass,
          );
        } else {
          await cloneRepository(
            destinationUrl.toString(),
            undefined,
            input.destinationToken,
            'oauth2',
            destinationDir,
            askpass,
          );
          await git(
            destinationDir,
            ['checkout', '-B', destinationBranch],
            input.destinationToken,
            'oauth2',
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
        if (relative(destinationDir, destinationRoot).startsWith('..')) {
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
        await git(
          destinationDir,
          ['add', '--', join(configDirectory, projectDirName, moduleDirectory)],
          input.destinationToken,
          'oauth2',
          askpass,
        );
        const status = await git(
          destinationDir,
          ['status', '--porcelain'],
          input.destinationToken,
          'oauth2',
          askpass,
        );
        if (status) {
          await git(
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
            input.destinationToken,
            'oauth2',
            askpass,
          );
          await git(
            destinationDir,
            ['push', '--set-upstream', 'origin', destinationBranch],
            input.destinationToken,
            'oauth2',
            askpass,
          );
        }
        const commit = await git(
          destinationDir,
          ['rev-parse', 'HEAD'],
          input.destinationToken,
          'oauth2',
          askpass,
        );
        const destinationBase = destinationUrl
          .toString()
          .replace(/\.git$/, '')
          .replace(/\/$/, '');
        const provider = resolveScmProvider(
          destinationUrl.toString(),
          hostProviderMap,
        ).name;
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
