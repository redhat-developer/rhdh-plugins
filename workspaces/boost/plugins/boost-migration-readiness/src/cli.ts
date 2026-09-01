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

/** Set of flags that consume the next argument as their value. */
const VALUE_FLAGS = new Set([
  '--catalog-url',
  '--output-format',
  '--token',
  '--filter',
]);

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
  const values: Record<string, string> = {};

  for (let i = 2; i < argv.length; i++) {
    let arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }

    // Support --flag=value syntax: split on the first '=' and treat
    // the left side as the flag and the right side as its value.
    let inlineValue: string | undefined;
    const eqIndex = arg.indexOf('=');
    if (eqIndex > 0 && arg.startsWith('--')) {
      inlineValue = arg.slice(eqIndex + 1);
      arg = arg.slice(0, eqIndex);
    }

    if (VALUE_FLAGS.has(arg)) {
      if (inlineValue !== undefined) {
        values[arg] = inlineValue;
      } else if (i + 1 >= argv.length) {
        process.stderr.write(`Missing value for ${arg}\n`);
        process.exit(1);
      } else {
        values[arg] = argv[++i];
      }
      continue;
    }

    process.stderr.write(`Unknown argument: ${arg}\n`);
    printUsage();
    process.exit(1);
  }

  if (!values['--catalog-url']) {
    process.stderr.write('Error: --catalog-url is required.\n\n');
    printUsage();
    process.exit(1);
  }

  const fmt = values['--output-format'];
  let outputFormat: 'json' | 'text' = 'text';
  if (fmt === 'json' || fmt === 'text') {
    outputFormat = fmt;
  } else if (fmt !== undefined) {
    process.stderr.write(`Unknown output format '${fmt}'. Using 'text'.\n`);
  }

  // Support BACKSTAGE_TOKEN env var as an alternative to --token so the
  // token is not visible in process listings (ps aux). The explicit
  // --token flag takes precedence when both are provided.
  const token = values['--token'] ?? process.env.BACKSTAGE_TOKEN;

  return {
    catalogUrl: values['--catalog-url'],
    outputFormat,
    token,
    filter: values['--filter'],
  };
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
                            (or set BACKSTAGE_TOKEN env var)
  --filter <filter>         Filter string to narrow entity results
  --help, -h                Show this help message
`,
  );
}

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
