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

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';
import { createTestFixture, assertFileContains, runCLI } from './test-helpers';

describe('generate command', () => {
  let fixture: Awaited<ReturnType<typeof createTestFixture>>;

  beforeAll(async () => {
    fixture = await createTestFixture();
  });

  afterAll(async () => {
    await fixture.cleanup();
  });

  it('should generate reference.json file', async () => {
    const outputDir = path.join(fixture.path, 'i18n');
    // Generate command creates files in format: {repo-name}-{sprint}.json
    // Since we're in a test temp dir, repo name will be detected from the directory
    // For simplicity, we'll check if any .json file was created
    const result = runCLI(
      `i18n generate --sprint s9999 --source-dir ${fixture.path} --output-dir ${outputDir}`,
    );

    expect(result.exitCode).toBe(0);

    // Check if any JSON file was created in the output directory
    const files = await fs.readdir(outputDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    expect(jsonFiles.length).toBeGreaterThan(0);
  });

  it('should only include English reference keys (exclude language files)', async () => {
    const outputDir = path.join(fixture.path, 'i18n');

    runCLI(
      `i18n generate --sprint s9999 --source-dir ${fixture.path} --output-dir ${outputDir}`,
    );

    // Find the generated JSON file
    const files = await fs.readdir(outputDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    expect(jsonFiles.length).toBeGreaterThan(0);
    const outputFile = path.join(outputDir, jsonFiles[0]);

    const content = await fs.readFile(outputFile, 'utf-8');
    const data = JSON.parse(content);

    // Should have test-plugin
    expect(data['test-plugin']).toBeDefined();
    expect(data['test-plugin'].en).toBeDefined();

    // Should have English keys
    expect(data['test-plugin'].en.title).toBe('Test Plugin');
    expect(data['test-plugin'].en.description).toBe('This is a test plugin');

    // Should NOT have German translations
    expect(data['test-plugin'].en.title).not.toContain('German');
    expect(data['test-plugin'].en.description).not.toContain('Test-Plugin');
  });

  it('should exclude non-English words from reference file', async () => {
    const outputDir = path.join(fixture.path, 'i18n');

    runCLI(
      `i18n generate --sprint s9999 --source-dir ${fixture.path} --output-dir ${outputDir}`,
    );

    // Find the generated JSON file
    const files = await fs.readdir(outputDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    expect(jsonFiles.length).toBeGreaterThan(0);
    const outputFile = path.join(outputDir, jsonFiles[0]);

    const content = await fs.readFile(outputFile, 'utf-8');

    // Should not contain German words
    expect(content).not.toContain('Test-Plugin');
    expect(content).not.toContain('Dies ist');
  });
});
