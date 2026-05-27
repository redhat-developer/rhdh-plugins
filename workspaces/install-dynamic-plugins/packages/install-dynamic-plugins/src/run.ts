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
import { spawn, type SpawnOptions } from 'node:child_process';
import { InstallException } from './errors.js';

export type RunResult = {
  stdout: string;
  stderr: string;
};

/**
 * Execute a command, capturing stdout/stderr. Throws InstallException with full
 * context (exit code, stderr) on non-zero exit. Matches the Python `run()` contract.
 */
export async function run(
  cmd: string[],
  errMsg: string,
  options: SpawnOptions = {},
): Promise<RunResult> {
  if (cmd.length === 0) {
    throw new InstallException(`${errMsg}: empty command`);
  }
  const [bin, ...args] = cmd as [string, ...string[]];
  return new Promise<RunResult>((resolve, reject) => {
    const child = spawn(bin, args, {
      ...options,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr?.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
    child.on('error', err =>
      reject(new InstallException(`${errMsg}: ${err.message}`)),
    );
    child.on('close', code => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const parts = [`${errMsg}: exit code ${code}`, `cmd: ${cmd.join(' ')}`];
        if (stderr.trim()) parts.push(`stderr: ${stderr.trim()}`);
        reject(new InstallException(parts.join('\n')));
      }
    });
  });
}
