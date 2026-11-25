/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const Ajv2020 = require('ajv/dist/2020').default;

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('positive and negative triage/fix fixtures match their schema expectations', () => {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateFormats: false,
  });
  for (const kind of ['ci-triage-result', 'ci-fix-result']) {
    const validate = ajv.compile(
      JSON.parse(read(`.fullsend/rhdh/schemas/${kind}.schema.json`)),
    );
    const positive = JSON.parse(read(`scripts/ci/fixtures/${kind}.valid.json`));
    const negative = JSON.parse(
      read(`scripts/ci/fixtures/${kind}.invalid.json`),
    );
    assert.equal(validate(positive), true, JSON.stringify(validate.errors));
    assert.equal(
      validate(negative),
      false,
      `${kind} negative fixture unexpectedly passed`,
    );
  }
});

test('new workflows pin actions and Fullsend v0.45 exactly', () => {
  const pinnedFullsend = '3454a2e4ee2b667e2ed71fa9d384edc6de3d4f74';
  for (const file of [
    '.github/workflows/fullsend-ci-triage.yml',
    '.github/workflows/fullsend-ci-repair.yml',
  ]) {
    const text = read(file);
    YAML.parse(text);
    for (const match of text.matchAll(/uses:\s+([^\s#]+)/g)) {
      const uses = match[1];
      assert.match(
        uses,
        /@[0-9a-f]{40}$/,
        `${file} has an unpinned action: ${uses}`,
      );
    }
    assert.match(text, new RegExp(`reusable-dispatch\\.yml@${pinnedFullsend}`));
  }
});

test('CI repair overrides GitHub forge scripts and uses the v0.45 base', () => {
  const fix = YAML.parse(read('.fullsend/rhdh/harness/ci-repair.yaml'));
  assert.match(
    fix.base,
    /agents\/93c69826f40bd14c8c40dc5797bd7d9ef5a8b748\/harness\/fix\.yaml/,
  );
  assert.equal(fix.forge.github.pre_script, 'rhdh/scripts/pre-ci-fix.sh');
  assert.equal(fix.forge.github.post_script, 'rhdh/scripts/post-ci-fix.sh');
});

test('privileged workflows load only trusted upstream helper code', () => {
  for (const file of [
    '.github/workflows/fullsend-ci-triage.yml',
    '.github/workflows/fullsend-ci-repair.yml',
  ]) {
    const text = read(file);
    assert.doesNotMatch(
      text,
      /actions\/checkout@/,
      `${file} must not checkout code in a privileged workflow`,
    );
    assert.match(
      text,
      /repos\.getContent\(/,
      `${file} must load the helper through the GitHub API`,
    );
    assert.match(
      text,
      /ref:\s+context\.payload\.repository\.default_branch/,
      `${file} must load the helper from the upstream default branch`,
    );
    assert.doesNotMatch(
      text,
      /ref:\s+context\.payload\.pull_request/,
      `${file} must not load a pull request ref`,
    );
  }
});

test('workflow permissions and artifact scope remain constrained', () => {
  const triage = YAML.parse(read('.github/workflows/fullsend-ci-triage.yml'));
  const repair = YAML.parse(read('.github/workflows/fullsend-ci-repair.yml'));
  assert.deepEqual(triage.permissions, {});
  assert.deepEqual(repair.permissions, {});
  assert.equal(triage.jobs.prepare.permissions.actions, 'read');
  assert.equal(triage.jobs.prepare.permissions.contents, 'read');
  assert.equal(triage.jobs.triage.permissions.contents, 'write');
  assert.equal(repair.jobs.prepare.permissions['pull-requests'], 'read');
  assert.equal(repair.jobs.repair.permissions.contents, 'write');

  const ci = read('.github/workflows/ci.yml');
  assert.match(ci, /retention-days:\s*7/);
  assert.doesNotMatch(ci, /path:\s*[|>-]?\s*\n\s+workspaces\/\*\*/);
  assert.match(ci, /node_modules\/\.cache\/e2e-test-results/);
});

test('Fullsend config registers triage and CI repair harnesses', () => {
  const config = YAML.parse(read('.fullsend/config.yaml'));
  const agents = new Map(
    config.agents.map(agent => [agent.name, agent.source]),
  );
  assert.equal(agents.get('ci-triage'), 'rhdh/harness/ci-triage.yaml');
  assert.equal(agents.get('ci-repair'), 'rhdh/harness/ci-repair.yaml');
  assert.equal(agents.has('ci-fix'), false);
  const triage = YAML.parse(read('.fullsend/rhdh/harness/ci-triage.yaml'));
  const fix = YAML.parse(read('.fullsend/rhdh/harness/ci-repair.yaml'));
  assert.equal(triage.role, 'retro');
  assert.equal(triage.readonly_repo, true);
  assert.deepEqual(triage.providers, ['github-artifacts']);
  assert.equal(fix.agent, 'rhdh/agents/fix.md');
  assert.equal(fix.role, 'coder');
  assert.deepEqual(fix.providers, ['github-artifacts']);
  const fixPolicy = YAML.parse(read('.fullsend/rhdh/policies/ci-fix.yaml'));
  assert.equal(
    fixPolicy.network_policies.github_api.endpoints[0].access,
    'read-only',
  );
});
