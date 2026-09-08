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

import { parseArgs } from './parseArgs';

// Capture process.exit, process.stderr.write, and process.stdout.write
// so tests can assert on exit codes and error messages without
// terminating the process.
let exitCode: number | undefined;
let stderrOutput: string;
let stdoutOutput: string;
const originalExit = process.exit;
const originalStderrWrite = process.stderr.write;
const originalStdoutWrite = process.stdout.write;

class ExitCalled extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`);
  }
}

beforeEach(() => {
  exitCode = undefined;
  stderrOutput = '';
  stdoutOutput = '';

  process.exit = ((code: number) => {
    exitCode = code;
    throw new ExitCalled(code);
  }) as never;

  process.stderr.write = ((chunk: string) => {
    stderrOutput += chunk;
    return true;
  }) as never;

  process.stdout.write = ((chunk: string) => {
    stdoutOutput += chunk;
    return true;
  }) as never;

  // Clear env var between tests
  delete process.env.BACKSTAGE_TOKEN;
});

afterEach(() => {
  process.exit = originalExit;
  process.stderr.write = originalStderrWrite;
  process.stdout.write = originalStdoutWrite;
  delete process.env.BACKSTAGE_TOKEN;
});

/** Build an argv array as if invoked via `node cli.js ...args`. */
function argv(...args: string[]): string[] {
  return ['node', 'cli.js', ...args];
}

describe('parseArgs', () => {
  describe('required --catalog-url flag', () => {
    it('returns the catalog URL when provided', () => {
      const result = parseArgs(argv('--catalog-url', 'http://localhost:7007'));
      expect(result.catalogUrl).toBe('http://localhost:7007');
    });

    it('exits with code 1 when --catalog-url is missing', () => {
      expect(() => parseArgs(argv())).toThrow(ExitCalled);
      expect(exitCode).toBe(1);
      expect(stderrOutput).toContain('--catalog-url is required');
    });
  });

  describe('--output-format flag', () => {
    it('defaults to text when not specified', () => {
      const result = parseArgs(argv('--catalog-url', 'http://localhost:7007'));
      expect(result.outputFormat).toBe('text');
    });

    it('accepts json format', () => {
      const result = parseArgs(
        argv(
          '--catalog-url',
          'http://localhost:7007',
          '--output-format',
          'json',
        ),
      );
      expect(result.outputFormat).toBe('json');
    });

    it('accepts text format explicitly', () => {
      const result = parseArgs(
        argv(
          '--catalog-url',
          'http://localhost:7007',
          '--output-format',
          'text',
        ),
      );
      expect(result.outputFormat).toBe('text');
    });

    it('falls back to text with a warning for an invalid format', () => {
      const result = parseArgs(
        argv(
          '--catalog-url',
          'http://localhost:7007',
          '--output-format',
          'xml',
        ),
      );
      expect(result.outputFormat).toBe('text');
      expect(stderrOutput).toContain("Unknown output format 'xml'");
    });
  });

  describe('--token flag and BACKSTAGE_TOKEN env var', () => {
    it('returns the token when --token is provided', () => {
      const result = parseArgs(
        argv('--catalog-url', 'http://localhost:7007', '--token', 'my-token'),
      );
      expect(result.token).toBe('my-token');
    });

    it('falls back to BACKSTAGE_TOKEN env var when --token is not provided', () => {
      process.env.BACKSTAGE_TOKEN = 'env-token';
      const result = parseArgs(argv('--catalog-url', 'http://localhost:7007'));
      expect(result.token).toBe('env-token');
    });

    it('gives --token flag precedence over BACKSTAGE_TOKEN env var', () => {
      process.env.BACKSTAGE_TOKEN = 'env-token';
      const result = parseArgs(
        argv('--catalog-url', 'http://localhost:7007', '--token', 'flag-token'),
      );
      expect(result.token).toBe('flag-token');
    });

    it('returns undefined token when neither --token nor env var is set', () => {
      const result = parseArgs(argv('--catalog-url', 'http://localhost:7007'));
      expect(result.token).toBeUndefined();
    });
  });

  describe('--filter flag', () => {
    it('returns the filter when provided', () => {
      const result = parseArgs(
        argv('--catalog-url', 'http://localhost:7007', '--filter', 'kind=API'),
      );
      expect(result.filter).toBe('kind=API');
    });

    it('returns undefined filter when not provided', () => {
      const result = parseArgs(argv('--catalog-url', 'http://localhost:7007'));
      expect(result.filter).toBeUndefined();
    });
  });

  describe('--flag=value syntax', () => {
    it('supports --catalog-url=<value> inline syntax', () => {
      const result = parseArgs(argv('--catalog-url=http://localhost:7007'));
      expect(result.catalogUrl).toBe('http://localhost:7007');
    });

    it('supports --output-format=json inline syntax', () => {
      const result = parseArgs(
        argv('--catalog-url=http://localhost:7007', '--output-format=json'),
      );
      expect(result.outputFormat).toBe('json');
    });

    it('supports --token=<value> inline syntax', () => {
      const result = parseArgs(
        argv('--catalog-url=http://localhost:7007', '--token=my-token'),
      );
      expect(result.token).toBe('my-token');
    });

    it('handles values containing = characters', () => {
      const result = parseArgs(
        argv('--catalog-url=http://localhost:7007', '--filter=kind=API'),
      );
      expect(result.filter).toBe('kind=API');
    });
  });

  describe('error handling', () => {
    it('exits with code 1 for an unknown argument', () => {
      expect(() =>
        parseArgs(argv('--catalog-url', 'http://localhost:7007', '--verbose')),
      ).toThrow(ExitCalled);
      expect(exitCode).toBe(1);
      expect(stderrOutput).toContain('Unknown argument: --verbose');
    });

    it('exits with code 1 when a flag is missing its value', () => {
      expect(() => parseArgs(argv('--catalog-url'))).toThrow(ExitCalled);
      expect(exitCode).toBe(1);
      expect(stderrOutput).toContain('Missing value for --catalog-url');
    });
  });

  describe('--help flag', () => {
    it('exits with code 0 and prints usage', () => {
      expect(() => parseArgs(argv('--help'))).toThrow(ExitCalled);
      expect(exitCode).toBe(0);
      expect(stdoutOutput).toContain('Usage:');
      expect(stdoutOutput).toContain('--catalog-url');
    });

    it('supports -h shorthand', () => {
      expect(() => parseArgs(argv('-h'))).toThrow(ExitCalled);
      expect(exitCode).toBe(0);
      expect(stdoutOutput).toContain('Usage:');
    });
  });
});
