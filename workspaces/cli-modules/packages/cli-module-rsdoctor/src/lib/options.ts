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

export interface RsdoctorOptions {
  /** `normal` for the full interactive report, `brief` for a single HTML file. */
  mode: 'normal' | 'brief';
  /** Whether to start the report server and open the browser. */
  open: boolean;
  /** Port of the report server. */
  port?: number;
  /** Directory the report is written into. Defaults to `<package>/.rsdoctor`. */
  reportDir?: string;
  /** Also write a JSON report (brief mode only). */
  json?: boolean;
}

const isFalsy = (value: string | undefined) =>
  value !== undefined && /^(0|false|no|off)$/i.test(value);

/** True when running on CI, mirroring the Backstage CLI's own check. */
export const isCi = Boolean(process.env.CI) && !isFalsy(process.env.CI);

/** Flag definitions shared by the build and start commands. */
export const rsdoctorFlags = {
  mode: {
    type: String,
    description:
      'Report mode, "normal" or "brief". Defaults to normal, or brief when CI is set (env: RSDOCTOR_MODE)',
  },
  open: {
    type: Boolean,
    description:
      'Start the report server and open the browser. Defaults to true, or false when CI is set. Use --no-open to disable (env: RSDOCTOR_OPEN)',
  },
  port: {
    type: Number,
    description: 'Port of the Rsdoctor report server (env: RSDOCTOR_PORT)',
  },
  reportDir: {
    type: String,
    description:
      'Directory to write the report into, defaults to <package>/.rsdoctor (env: RSDOCTOR_REPORT_DIR)',
  },
} as const;

type RsdoctorFlagValues = {
  mode?: string;
  open?: boolean;
  port?: number;
  reportDir?: string;
};

/** Combines command line flags, environment variables and CI defaults. */
export function resolveRsdoctorOptions(
  flags: RsdoctorFlagValues,
): RsdoctorOptions {
  const mode =
    flags.mode ?? process.env.RSDOCTOR_MODE ?? (isCi ? 'brief' : 'normal');
  if (mode !== 'normal' && mode !== 'brief') {
    throw new Error(
      `Invalid Rsdoctor mode '${mode}', expected 'normal' or 'brief'`,
    );
  }
  const open =
    flags.open ??
    (process.env.RSDOCTOR_OPEN !== undefined
      ? !isFalsy(process.env.RSDOCTOR_OPEN)
      : !isCi);
  const port =
    flags.port ??
    (process.env.RSDOCTOR_PORT ? Number(process.env.RSDOCTOR_PORT) : undefined);
  const reportDir = flags.reportDir ?? process.env.RSDOCTOR_REPORT_DIR;
  return { mode, open, port, reportDir };
}

const toKebab = (name: string) =>
  name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);

/**
 * Splits the raw command line into the arguments handled by this command
 * (`own`) and the ones forwarded verbatim, in order, to the wrapped Backstage
 * CLI command (`rest`). A flag is considered our own when its name is in
 * `ownFlags`; non-boolean flags consume the following argument unless given
 * as `--flag=value`.
 */
export function partitionArgs(
  args: string[],
  ownFlags: Record<string, { type: unknown }>,
): { own: string[]; rest: string[] } {
  const own: string[] = [];
  const rest: string[] = [];
  const byName = new Map<string, boolean>();
  for (const [name, def] of Object.entries(ownFlags)) {
    const takesValue = def.type !== Boolean;
    byName.set(name, takesValue);
    byName.set(toKebab(name), takesValue);
  }
  byName.set('help', false);
  byName.set('h', false);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const match = arg.match(/^--?(no-)?([^=]+)(=.*)?$/);
    if (!match || (!arg.startsWith('--') && arg.length > 2)) {
      rest.push(arg);
      continue;
    }
    const [, negation, name, inlineValue] = match;
    if (!byName.has(name)) {
      rest.push(arg);
      continue;
    }
    own.push(arg);
    if (byName.get(name) && !negation && inlineValue === undefined) {
      i++;
      if (i < args.length) {
        own.push(args[i]);
      }
    }
  }
  return { own, rest };
}
