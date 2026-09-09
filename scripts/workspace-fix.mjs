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

import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const REPO_ROOT_PACKAGE_NAME = '@redhat-developer/rhdh-plugins';

// Match .github/workflows/ci.yml so local yarn fix behaves like CI.
export const DEFAULT_NODE_OPTIONS = '--max-old-space-size=8192';

const MEMORY_HEAVY_STEPS = new Set([
  'repo-fix',
  'lint-fix',
  'prettier',
  'knip',
]);

const MARKDOWNLINT_PACKAGES = [
  'markdownlint-cli2',
  'markdownlint-cli',
  'markdownlint',
];

/**
 * Deterministic fixer order. Add new fixers here — workspace package.json
 * scripts should keep pointing at this file.
 *
 * 1. backstage-cli repo fix  (package.json exports / metadata)
 * 2. sort-package-json       (optional; skipped unless installed)
 * 3. backstage-cli repo lint --fix
 * 4. markdownlint --fix      (optional; skipped unless installed)
 * 5. prettier --write        (last formatter so eslint and prettier do not fight)
 * 6. knip --fix              (opt-in only; skipped unless rhdhFix.knip or --knip)
 */
export const FIXER_ORDER = [
  'repo-fix',
  'sort-package-json',
  'lint-fix',
  'markdownlint',
  'prettier',
  'knip',
];

const PACKAGE_ROOTS = ['plugins', 'packages'];

export function parseArgs(argv) {
  const extra = [];
  const flags = {
    publish: false,
    knip: false,
    check: false,
    help: false,
    plugin: undefined,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--publish') {
      flags.publish = true;
    } else if (arg === '--knip') {
      flags.knip = true;
    } else if (arg === '--check') {
      flags.check = true;
    } else if (arg === '--help' || arg === '-h') {
      flags.help = true;
    } else if (arg === '--plugin') {
      const value = argv[++i];
      if (!value || value.startsWith('-')) {
        throw Object.assign(
          new Error(
            'Missing value for --plugin. Example: yarn fix --plugin segment',
          ),
          { exitCode: 1 },
        );
      }
      flags.plugin = value;
    } else if (arg.startsWith('--plugin=')) {
      flags.plugin = arg.slice('--plugin='.length);
      if (!flags.plugin) {
        throw Object.assign(
          new Error(
            'Missing value for --plugin. Example: yarn fix --plugin segment',
          ),
          { exitCode: 1 },
        );
      }
    } else if (arg.startsWith('-')) {
      throw Object.assign(
        new Error(
          `Unknown flag '${arg}'. Use --check, --publish, --knip, or --plugin <name>.`,
        ),
        { exitCode: 1 },
      );
    } else {
      extra.push(arg);
    }
  }
  if (extra.length) {
    throw Object.assign(new Error(`Unexpected arguments: ${extra.join(' ')}`), {
      exitCode: 1,
    });
  }
  return { flags, extra };
}

export function readPackageJson(cwd) {
  const pkgPath = resolve(cwd, 'package.json');
  if (!existsSync(pkgPath)) {
    throw Object.assign(
      new Error(
        `No package.json in ${cwd}. Run yarn fix from a workspace root (workspaces/<name>).`,
      ),
      { exitCode: 1 },
    );
  }
  return JSON.parse(readFileSync(pkgPath, 'utf8'));
}

export function assertWorkspaceRoot(pkg) {
  if (pkg.name === REPO_ROOT_PACKAGE_NAME) {
    throw Object.assign(
      new Error(
        'yarn fix is per workspace. cd into workspaces/<name> and run yarn fix there.',
      ),
      { exitCode: 1 },
    );
  }
  if (!pkg.workspaces) {
    throw Object.assign(
      new Error(
        'yarn fix must run from a workspace root that declares a workspaces field.',
      ),
      { exitCode: 1 },
    );
  }
}

export function listWorkspacePackages(cwd) {
  const packages = [];
  for (const root of PACKAGE_ROOTS) {
    const base = resolve(cwd, root);
    if (!existsSync(base)) {
      continue;
    }
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const relativePath = `${root}/${entry.name}`;
      if (existsSync(resolve(cwd, relativePath, 'package.json'))) {
        packages.push({ name: entry.name, relativePath });
      }
    }
  }
  return packages.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export function resolvePluginTarget(cwd, query) {
  const packages = listWorkspacePackages(cwd);
  if (packages.length === 0) {
    throw Object.assign(
      new Error('No plugins or packages found under plugins/ or packages/.'),
      { exitCode: 1 },
    );
  }

  const normalized = query.replace(/^\.\//, '');
  const direct = packages.find(
    pkg =>
      pkg.name === normalized ||
      pkg.relativePath === normalized ||
      pkg.relativePath === `plugins/${normalized}` ||
      pkg.relativePath === `packages/${normalized}`,
  );
  if (direct) {
    return direct;
  }

  const suffixMatches = packages.filter(
    pkg => pkg.name === normalized || pkg.name.endsWith(`-${normalized}`),
  );
  if (suffixMatches.length === 1) {
    return suffixMatches[0];
  }
  if (suffixMatches.length > 1) {
    throw Object.assign(
      new Error(
        `Ambiguous plugin '${query}'. Matches: ${suffixMatches
          .map(pkg => pkg.relativePath)
          .join(', ')}. Use the full directory name.`,
      ),
      { exitCode: 1 },
    );
  }

  const known = packages.map(pkg => pkg.relativePath).join(', ');
  throw Object.assign(
    new Error(
      `Unknown plugin '${query}'. Expected a name like segment or a path like plugins/analytics-provider-segment. Known packages: ${known}`,
    ),
    { exitCode: 1 },
  );
}

export function resolveConfig(pkg, flags, cwd = process.cwd()) {
  const fromPkg = pkg.rhdhFix ?? {};
  const plugin = flags.plugin ? resolvePluginTarget(cwd, flags.plugin) : null;
  return {
    check: Boolean(flags.check),
    publish: Boolean(fromPkg.publish || flags.publish),
    knip: Boolean(fromPkg.knip || flags.knip),
    nodeOptions: fromPkg.nodeOptions,
    plugin,
  };
}

export function mergeNodeOptions(existing, additional, options = {}) {
  const { overrideHeapLimit = false } = options;
  if (!additional) {
    return existing;
  }
  if (!existing) {
    return additional;
  }
  if (existing.includes('max-old-space-size')) {
    if (overrideHeapLimit) {
      const replacement = additional.match(/--max-old-space-size=\d+/)?.[0];
      if (replacement) {
        return existing.replace(/--max-old-space-size=\d+/, replacement);
      }
    }
    return existing;
  }
  return `${existing} ${additional}`.trim();
}

export function resolveSpawnEnv(step, config, baseEnv = process.env) {
  const extra =
    config.nodeOptions ??
    (MEMORY_HEAVY_STEPS.has(step.id) ? DEFAULT_NODE_OPTIONS : undefined);
  if (!extra) {
    return baseEnv;
  }
  return {
    ...baseEnv,
    NODE_OPTIONS: mergeNodeOptions(baseEnv.NODE_OPTIONS, extra, {
      overrideHeapLimit: Boolean(config.nodeOptions),
    }),
  };
}

export function detectTools(pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const markdownlintPkg = MARKDOWNLINT_PACKAGES.find(name => name in deps);
  return {
    backstageCli: '@backstage/cli' in deps,
    prettier: 'prettier' in deps,
    sortPackageJson: 'sort-package-json' in deps,
    markdownlint: markdownlintPkg,
    knip: 'knip' in deps,
  };
}

function lintFixArgs(config) {
  if (config.plugin) {
    return [
      'backstage-cli',
      'package',
      'lint',
      '--fix',
      config.plugin.relativePath,
    ];
  }
  return ['backstage-cli', 'repo', 'lint', '--fix'];
}

function prettierArgs(config) {
  return ['prettier', '--write', config.plugin?.relativePath ?? '.'];
}

function markdownlintArgs(packageName, config) {
  const target = config.plugin
    ? `${config.plugin.relativePath}/**/*.md`
    : '**/*.md';
  if (packageName === 'markdownlint-cli2') {
    return ['exec', 'markdownlint-cli2', '--fix', target];
  }
  return ['exec', 'markdownlint', '--fix', target];
}

function repoFixArgs(config) {
  return [
    'backstage-cli',
    'repo',
    'fix',
    ...(config.check ? ['--check'] : []),
    ...(config.publish ? ['--publish'] : []),
  ];
}

export function buildSteps({ tools, config, cwd = process.cwd() }) {
  const repoFixStep = {
    id: 'repo-fix',
    required: true,
    available: tools.backstageCli,
    command: 'yarn',
    args: repoFixArgs(config),
  };

  if (config.check) {
    return [repoFixStep];
  }

  return [
    repoFixStep,
    {
      id: 'sort-package-json',
      required: false,
      available: Boolean(tools.sortPackageJson) && !config.plugin,
      skipReason: config.plugin
        ? 'sort-package-json runs on the workspace root only'
        : undefined,
      command: 'yarn',
      args: ['exec', 'sort-package-json', 'package.json'],
    },
    {
      id: 'lint-fix',
      required: true,
      available: tools.backstageCli,
      command: 'yarn',
      args: lintFixArgs(config),
    },
    {
      id: 'markdownlint',
      required: false,
      available: Boolean(tools.markdownlint),
      command: 'yarn',
      args: markdownlintArgs(tools.markdownlint, config),
    },
    {
      id: 'prettier',
      required: false,
      available: Boolean(tools.prettier),
      command: 'yarn',
      args: prettierArgs(config),
    },
    {
      id: 'knip',
      required: false,
      available: Boolean(tools.knip) && config.knip,
      skipReason: config.knip
        ? 'knip is not installed'
        : 'knip --fix is opt-in (set rhdhFix.knip or pass --knip)',
      command: 'yarn',
      args: ['knip', '--fix'],
      cwd: config.plugin ? resolve(cwd, config.plugin.relativePath) : undefined,
    },
  ];
}

export async function runPipeline(steps, { run, log }) {
  for (const step of steps) {
    if (!step.available) {
      if (step.required) {
        throw Object.assign(
          new Error(`Required fixer '${step.id}' is not available`),
          { exitCode: 1 },
        );
      }
      log(`skip ${step.id}: ${step.skipReason ?? 'not installed'}`);
      continue;
    }

    log(`run ${step.id}: ${step.command} ${step.args.join(' ')}`);
    const code = await run(step);
    if (code !== 0) {
      throw Object.assign(
        new Error(`Fixer '${step.id}' failed with exit code ${code}`),
        { exitCode: code },
      );
    }
  }
}

function spawnStep(step, cwd, config) {
  const runCwd = step.cwd ?? cwd;
  return new Promise(resolvePromise => {
    const child = spawn(step.command, step.args, {
      cwd: runCwd,
      stdio: 'inherit',
      env: resolveSpawnEnv(step, config),
    });
    child.on('error', () => resolvePromise(1));
    child.on('close', code => resolvePromise(code ?? 1));
  });
}

export function helpText() {
  return [
    'Usage: yarn fix [--check] [--publish] [--knip] [--plugin <name>]',
    '',
    'Run from a workspace root (workspaces/<name>).',
    'Fixer order is defined in scripts/workspace-fix.mjs.',
    '',
    '  --check           Run backstage-cli repo fix --check only (matches CI)',
    '  --publish         Pass --publish to backstage-cli repo fix',
    '  --knip            Run knip --fix (off by default)',
    '  --plugin <name>   Limit lint, prettier, and markdownlint to one plugin',
    '                    or package (for example: global-header or',
    '                    plugins/global-header)',
    '',
    'Without --plugin, yarn fix runs across the whole workspace.',
    'backstage-cli repo fix always runs for the full workspace.',
    '',
    'Exit 0 when every run fixer succeeds, even if files changed.',
    'Exit non-zero when a fixer fails. Missing optional fixers are skipped.',
  ].join('\n');
}

export async function main(argv, cwd, io = console) {
  const { flags } = parseArgs(argv);
  if (flags.help) {
    io.log(helpText());
    return;
  }

  const pkg = readPackageJson(cwd);
  assertWorkspaceRoot(pkg);
  const config = resolveConfig(pkg, flags, cwd);
  const tools = detectTools(pkg);
  const steps = buildSteps({ tools, config, cwd });
  await runPipeline(steps, {
    log: msg => io.log(msg),
    run: step => spawnStep(step, cwd, config),
  });
}

function isMainModule() {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return import.meta.url === pathToFileURL(resolve(entry)).href;
}

if (isMainModule()) {
  try {
    await main(process.argv.slice(2), process.cwd());
  } catch (error) {
    console.error(error.message);
    process.exit(error.exitCode ?? 1);
  }
}
