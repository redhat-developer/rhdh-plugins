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

import { spawnSync, SpawnSyncOptions } from 'child_process';
import { platform } from 'node:os';

/**
 * Safely execute a command with arguments.
 * Uses spawnSync with separate command and args to prevent command injection.
 *
 * @param command - The command to execute (e.g., 'memsource', 'tsx', 'git')
 * @param args - Array of arguments (e.g., ['job', 'create', '--project-id', '123'])
 * @param options - Optional spawn options
 * @returns Object with stdout, stderr, and status
 */
export function safeExecSync(
  command: string,
  args: string[] = [],
  options: SpawnSyncOptions = {},
): {
  stdout: string;
  stderr: string;
  status: number | null;
  error?: Error;
} {
  const defaultOptions: SpawnSyncOptions = {
    encoding: 'utf-8',
    stdio: 'pipe',
    ...options,
  };

  const result = spawnSync(command, args, defaultOptions);

  return {
    stdout: (result.stdout?.toString() || '').trim(),
    stderr: (result.stderr?.toString() || '').trim(),
    status: result.status,
    error: result.error,
  };
}

/**
 * Check if a command exists in PATH (cross-platform).
 * Uses 'where' on Windows, 'which' on Unix-like systems.
 *
 * @param command - The command to check (e.g., 'memsource', 'tsx')
 * @returns true if command exists, false otherwise
 */
export function commandExists(command: string): boolean {
  const isWindows = platform() === 'win32';
  const checkCommand = isWindows ? 'where' : 'which';
  const result = safeExecSync(checkCommand, [command], { stdio: 'pipe' });
  return result.status === 0 && result.stdout.length > 0;
}

/**
 * Execute a command and throw an error if it fails.
 *
 * @param command - The command to execute
 * @param args - Array of arguments
 * @param options - Optional spawn options
 * @returns The stdout output
 * @throws Error if command fails
 */
export function safeExecSyncOrThrow(
  command: string,
  args: string[] = [],
  options: SpawnSyncOptions = {},
): string {
  const result = safeExecSync(command, args, options);

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const errorMessage =
      result.stderr || `Command failed with status ${result.status}`;
    throw new Error(errorMessage);
  }

  return result.stdout;
}
