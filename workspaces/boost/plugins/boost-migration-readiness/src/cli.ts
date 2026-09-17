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

import { fetchEntities } from './catalogClient';
import { analyzeEntities } from './analyze';
import { formatJson, formatText } from './formatters';
import { parseArgs } from './parseArgs';

/**
 * CLI entry point.
 *
 * @internal
 */
async function main(): Promise<void> {
  const opts = parseArgs(process.argv);

  try {
    const entities = await fetchEntities({
      catalogUrl: opts.catalogUrl,
      token: opts.token,
      filter: opts.filter,
    });

    const report = analyzeEntities(entities);

    const output =
      opts.outputFormat === 'json' ? formatJson(report) : formatText(report);
    process.stdout.write(`${output}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${message}\n`);
    process.exit(1);
  }
}

main();
