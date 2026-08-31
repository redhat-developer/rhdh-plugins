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

/**
 * Parse CLI arguments into a typed options object.
 *
 * @internal
 */
function parseArgs(argv: string[]): {
  catalogUrl: string;
  outputFormat: 'json' | 'text';
  token?: string;
  filter?: string;
} {
  let catalogUrl = '';
  let outputFormat: 'json' | 'text' = 'text';
  let token: string | undefined;
  let filter: string | undefined;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--catalog-url' && i + 1 < argv.length) {
      catalogUrl = argv[++i];
    } else if (arg === '--output-format' && i + 1 < argv.length) {
      const fmt = argv[++i];
      if (fmt === 'json' || fmt === 'text') {
        outputFormat = fmt;
      } else {
        process.stderr.write(`Unknown output format '${fmt}'. Using 'text'.\n`);
      }
    } else if (arg === '--token' && i + 1 < argv.length) {
      token = argv[++i];
    } else if (arg === '--filter' && i + 1 < argv.length) {
      filter = argv[++i];
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else {
      process.stderr.write(`Unknown argument: ${arg}\n`);
      printUsage();
      process.exit(1);
    }
  }

  if (!catalogUrl) {
    process.stderr.write('Error: --catalog-url is required.\n\n');
    printUsage();
    process.exit(1);
  }

  return { catalogUrl, outputFormat, token, filter };
}

/**
 * Print CLI usage information.
 *
 * @internal
 */
function printUsage(): void {
  process.stdout.write(
    `Usage: boost-migration-readiness --catalog-url <url> [options]

Options:
  --catalog-url <url>       Backstage catalog API base URL (required)
  --output-format <format>  Output format: 'json' or 'text' (default: text)
  --token <token>           Bearer token for catalog API authentication
  --filter <filter>         Filter string to narrow entity results
  --help, -h                Show this help message
`,
  );
}

/**
 * CLI entry point.
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
