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

export async function executeRsdoctorCli(
  command: 'analyze' | 'bundle-diff',
  options: Record<string, unknown>,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { execute } = require('@rsdoctor/cli') as {
    execute: (command: string, options: unknown) => Promise<unknown>;
  };
  await execute(command, options);
}

/**
 * Keeps the process alive until the user interrupts it. Needed for commands
 * that start a report server, because the CLI exits once a command returns.
 */
export function waitForInterrupt(): Promise<void> {
  return new Promise<void>(resolve => {
    process.once('SIGINT', () => resolve());
    process.once('SIGTERM', () => resolve());
  });
}
