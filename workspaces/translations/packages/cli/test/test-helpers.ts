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

import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

export interface TestFixture {
  path: string;
  cleanup: () => Promise<void>;
}

/**
 * Create a temporary test directory with sample translation files
 */
export async function createTestFixture(): Promise<TestFixture> {
  const testDir = path.join(process.cwd(), '.test-temp');
  await fs.ensureDir(testDir);

  // Create a sample plugin structure
  const pluginDir = path.join(
    testDir,
    'plugins',
    'test-plugin',
    'src',
    'translations',
  );
  await fs.ensureDir(pluginDir);

  // Create a ref.ts file with createTranslationRef
  const refFile = path.join(pluginDir, 'ref.ts');
  await fs.writeFile(
    refFile,
    `import { createTranslationRef } from '@backstage/core-plugin-api/alpha';

export const testPluginMessages = createTranslationRef({
  id: 'test-plugin',
  messages: {
    title: 'Test Plugin',
    description: 'This is a test plugin',
    button: {
      save: 'Save',
      cancel: 'Cancel',
    },
  },
});
`,
  );

  // Create a de.ts file (should be excluded)
  const deFile = path.join(pluginDir, 'de.ts');
  await fs.writeFile(
    deFile,
    `import { createTranslationMessages } from '@backstage/core-plugin-api/alpha';
import { testPluginMessages } from './ref';

export default createTranslationMessages({
  ref: testPluginMessages,
  messages: {
    title: 'Test Plugin (German)',
    description: 'Dies ist ein Test-Plugin',
  },
});
`,
  );

  return {
    path: testDir,
    cleanup: async () => {
      await fs.remove(testDir);
    },
  };
}

/**
 * Run CLI command and return output
 */
export function runCLI(
  command: string,
  cwd?: string,
): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  try {
    const binPath = path.join(process.cwd(), 'bin', 'translations-cli');
    const fullCommand = `${binPath} ${command}`;
    const stdout = execSync(fullCommand, {
      cwd: cwd || process.cwd(),
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || '',
      exitCode: error.status || 1,
    };
  }
}

/**
 * Check if file exists and has expected content
 */
export async function assertFileContains(
  filePath: string,
  expectedContent: string | RegExp,
): Promise<void> {
  if (!(await fs.pathExists(filePath))) {
    throw new Error(`File does not exist: ${filePath}`);
  }

  const content = await fs.readFile(filePath, 'utf-8');
  if (typeof expectedContent === 'string') {
    if (!content.includes(expectedContent)) {
      throw new Error(
        `File ${filePath} does not contain expected content: ${expectedContent}`,
      );
    }
  } else {
    if (!expectedContent.test(content)) {
      throw new Error(
        `File ${filePath} does not match expected pattern: ${expectedContent}`,
      );
    }
  }
}
