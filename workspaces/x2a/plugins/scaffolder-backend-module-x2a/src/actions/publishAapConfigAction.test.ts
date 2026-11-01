/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { finalizeDraft } from './publishAapConfigAction';

async function createDraft(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'x2a-draft-test-'));
  await writeFile(
    join(directory, 'controller_projects.yml'),
    [
      'controller_projects_x2a:',
      '  - name: x2a_nginx',
      '    organization: Platform',
      '    scm_url: https://github.com/example/project.git',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(directory, 'controller_job_templates.yml'),
    [
      'controller_templates_x2a:',
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
      'controller_templates_x2a:\n  - name: x2a_nginx\n    project: x2a_nginx\n    inventory: old\n',
    );

    await expect(
      finalizeDraft(directory, {
        inventory: 'Production',
        jobCredentialNames: [],
      }),
    ).rejects.toThrow('inventory marker is missing or unexpected');
  });

  it('rejects a missing draft file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'x2a-draft-test-'));

    await expect(
      finalizeDraft(directory, {
        inventory: 'Production',
        jobCredentialNames: [],
      }),
    ).rejects.toThrow('Missing controller_projects.yml');
  });
});
