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

import { InputError } from '@backstage/errors';

import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Convert a document to markdown using the docling CLI.
 * Writes the multer buffer to a temp file, runs docling, and returns
 * the path to the output .md file. The caller is responsible for
 * calling cleanupDoclingOutput after consuming the file.
 */
export async function convertWithDocling(
  buffer: Buffer,
  originalName: string,
): Promise<string> {
  const tempDir = await fs.mkdtemp(join(tmpdir(), 'docling-'));
  const inputPath = join(tempDir, originalName);
  const outputDir = join(tempDir, 'output');

  await fs.writeFile(inputPath, buffer);

  try {
    await execFileAsync('docling', [
      inputPath,
      '--to',
      'md',
      '--output',
      outputDir,
    ]);
  } catch (error: any) {
    await fs.rm(tempDir, { recursive: true, force: true });
    throw new InputError(
      `Docling conversion failed: ${error.stderr || error.message}`,
    );
  }

  await fs.unlink(inputPath);

  const files = await fs.readdir(outputDir);
  const mdFile = files.find(f => f.endsWith('.md'));
  if (!mdFile) {
    await fs.rm(tempDir, { recursive: true, force: true });
    throw new InputError('Docling produced no markdown output');
  }

  return join(outputDir, mdFile);
}

export async function cleanupDoclingOutput(mdPath: string): Promise<void> {
  const tempDir = join(mdPath, '..', '..');
  await fs.rm(tempDir, { recursive: true, force: true });
}
