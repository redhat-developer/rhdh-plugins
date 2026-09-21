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
import fs from 'node:fs';
import path from 'node:path';
import { formatBytes, formatDelta, SizeEntry, SizesReport } from './sizes';

/** Size limit as bytes or a string like `600 KB`, `1.5 MB`. */
export type SizeLimit = number | string;

/** Increase limit as bytes, a size string, or a percentage like `5%`. */
export type IncreaseLimit = number | string;

/** Contents of rsdoctor.budgets.json. */
export interface Budgets {
  /** Maximum gzipped size of all JS files that load on page start. */
  maxInitialSize?: SizeLimit;
  /** Maximum gzipped size of all JS files. */
  maxTotalSize?: SizeLimit;
  /** Maximum gzipped size of any single JS or CSS file. */
  maxChunkSize?: SizeLimit;
  /** Maximum number of JS files (chunks) the build may emit. */
  maxChunks?: number;
  /**
   * Limits for individual files, keyed by chunk name (`main`, `backstage`)
   * or by file name without hash (`static/698.chunk.js`). Keys may contain
   * `*` wildcards (`module-*`, `static/*.chunk.js`). The key `*` is the
   * catch-all that applies to every file no other key matches, so unlisted
   * and newly appearing chunks are checked too.
   */
  chunks?: Record<string, SizeLimit>;
  /** Limits applied when comparing against a baseline sizes.json. */
  baseline?: {
    /** Default baseline file, used when `--baseline` is not given. */
    path?: string;
    /** Maximum growth of the initial JS total, e.g. `5%` or `20 KB`. */
    maxInitialIncrease?: IncreaseLimit;
    /** Maximum growth of the JS total. */
    maxTotalIncrease?: IncreaseLimit;
    /** Maximum growth of any file that also exists in the baseline. */
    maxChunkIncrease?: IncreaseLimit;
    /**
     * What to do with files that do not exist in the baseline: `allow`
     * (default, only reported), `fail` (any new file fails), or a size
     * limit such as `10 KB` (new files above it fail).
     */
    newChunks?: 'allow' | 'fail' | SizeLimit;
    /** Maximum number of files that may be new compared to the baseline. */
    maxNewChunks?: number;
  };
}

export const BUDGETS_FILE_NAME = 'rsdoctor.budgets.json';

const UNITS: Record<string, number> = {
  b: 1,
  kb: 1024,
  kib: 1024,
  mb: 1024 * 1024,
  mib: 1024 * 1024,
};

/** Parses `600 KB`, `1.5MB` or a plain byte count into bytes. */
export function parseSize(value: SizeLimit, what = 'size'): number {
  if (typeof value === 'number') {
    return value;
  }
  const match = value.trim().match(/^([\d.]+)\s*([a-zA-Z]*)$/);
  const unit = match ? UNITS[match[2].toLowerCase() || 'b'] : undefined;
  if (!match || unit === undefined) {
    throw new Error(
      `Invalid ${what} '${value}', expected a number of bytes or e.g. '600 KB', '1.5 MB'`,
    );
  }
  return Math.round(parseFloat(match[1]) * unit);
}

/** Parses an increase limit into either a percentage or a byte count. */
export function parseIncrease(value: IncreaseLimit): {
  percent?: number;
  bytes?: number;
} {
  if (typeof value === 'string' && value.trim().endsWith('%')) {
    const percent = parseFloat(value);
    if (Number.isNaN(percent)) {
      throw new Error(`Invalid increase limit '${value}'`);
    }
    return { percent };
  }
  return { bytes: parseSize(value, 'increase limit') };
}

export function loadBudgets(file: string): Budgets {
  if (!fs.existsSync(file)) {
    throw new Error(`Budget file not found: ${file}`);
  }
  const budgets = JSON.parse(fs.readFileSync(file, 'utf8')) as Budgets;
  if (typeof budgets !== 'object' || budgets === null) {
    throw new Error(`Budget file ${file} must contain a JSON object`);
  }
  return budgets;
}

export interface EvaluationResult {
  /** Human readable violations; the build fails when this is not empty. */
  violations: string[];
  /** Informational lines about what was checked. */
  notes: string[];
}

function entryLabel(entry: SizeEntry): string {
  return entry.chunk ? `${entry.key} (${entry.chunk})` : entry.key;
}

const CATCH_ALL_KEY = '*';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Matches a budget key, which may contain `*` wildcards, against a file. */
export function matchesBudgetKey(entry: SizeEntry, key: string): boolean {
  const candidates = [
    entry.key,
    entry.file,
    path.basename(entry.key),
    ...(entry.chunk?.split(',') ?? []),
  ];
  if (!key.includes('*')) {
    return candidates.includes(key);
  }
  const pattern = new RegExp(
    `^${key.split('*').map(escapeRegExp).join('.*')}$`,
  );
  return candidates.some(candidate => pattern.test(candidate));
}

function percentChange(before: number, after: number): number {
  if (before === 0) {
    return after > 0 ? Infinity : 0;
  }
  return ((after - before) / before) * 100;
}

function exceedsIncrease(
  before: number,
  after: number,
  limit: IncreaseLimit,
): { exceeded: boolean; description: string } {
  const parsed = parseIncrease(limit);
  const delta = after - before;
  if (parsed.percent !== undefined) {
    const percent = percentChange(before, after);
    const percentLabel =
      percent === Infinity ? 'new' : `${percent.toFixed(1)}%`;
    return {
      exceeded: percent > parsed.percent,
      description: `${formatDelta(delta)} (${percentLabel}), limit ${
        parsed.percent
      }%`,
    };
  }
  return {
    exceeded: delta > (parsed.bytes ?? 0),
    description: `${formatDelta(delta)}, limit ${formatBytes(
      parsed.bytes ?? 0,
    )}`,
  };
}

/** Checks the static limits of a budget file against a sizes report. */
export function evaluateBudgets(
  report: SizesReport,
  budgets: Budgets,
): EvaluationResult {
  const violations: string[] = [];
  const notes: string[] = [];

  const checkTotal = (
    name: string,
    actual: number,
    limit: SizeLimit | undefined,
  ) => {
    if (limit === undefined) {
      return;
    }
    const max = parseSize(limit, `${name} limit`);
    const line = `${name}: ${formatBytes(actual)} gzip, limit ${formatBytes(
      max,
    )}`;
    if (actual > max) {
      violations.push(`${line} exceeded by ${formatBytes(actual - max)}`);
    } else {
      notes.push(`${line} ok`);
    }
  };
  checkTotal(
    'initial JS',
    report.totals.initialJs.gzip,
    budgets.maxInitialSize,
  );
  checkTotal('total JS', report.totals.js.gzip, budgets.maxTotalSize);

  if (budgets.maxChunkSize !== undefined) {
    const max = parseSize(budgets.maxChunkSize, 'maxChunkSize');
    const over = report.assets.filter(a => a.gzip > max);
    for (const entry of over) {
      violations.push(
        `${entryLabel(entry)}: ${formatBytes(
          entry.gzip,
        )} gzip exceeds maxChunkSize ${formatBytes(max)}`,
      );
    }
    if (over.length === 0) {
      notes.push(
        `largest file ${formatBytes(
          report.assets[0]?.gzip ?? 0,
        )} gzip, maxChunkSize ${formatBytes(max)} ok`,
      );
    }
  }

  if (budgets.maxChunks !== undefined) {
    const count = report.totals.js.files;
    const line = `${count} JS files, maxChunks ${budgets.maxChunks}`;
    if (count > budgets.maxChunks) {
      violations.push(`${line} exceeded by ${count - budgets.maxChunks}`);
    } else {
      notes.push(`${line} ok`);
    }
  }

  const chunkLimits = Object.entries(budgets.chunks ?? {}).filter(
    ([key]) => key !== CATCH_ALL_KEY,
  );
  const matched = new Set<SizeEntry>();
  for (const [key, limit] of chunkLimits) {
    const max = parseSize(limit, `limit for ${key}`);
    const entries = report.assets.filter(a => matchesBudgetKey(a, key));
    if (entries.length === 0) {
      notes.push(`chunk ${key}: not found in this build`);
      continue;
    }
    for (const entry of entries) {
      matched.add(entry);
      const line = `${entryLabel(entry)}: ${formatBytes(
        entry.gzip,
      )} gzip, limit ${formatBytes(max)} (${key})`;
      if (entry.gzip > max) {
        violations.push(`${line} exceeded by ${formatBytes(entry.gzip - max)}`);
      } else {
        notes.push(`${line} ok`);
      }
    }
  }

  const catchAll = budgets.chunks?.[CATCH_ALL_KEY];
  if (catchAll !== undefined) {
    const max = parseSize(catchAll, 'limit for *');
    const others = report.assets.filter(a => !matched.has(a));
    const over = others.filter(a => a.gzip > max);
    for (const entry of over) {
      violations.push(
        `${entryLabel(entry)}: ${formatBytes(
          entry.gzip,
        )} gzip, limit ${formatBytes(max)} (*) exceeded by ${formatBytes(
          entry.gzip - max,
        )}`,
      );
    }
    const largest = others.find(a => !over.includes(a));
    notes.push(
      `${
        others.length - over.length
      } other files within the catch-all limit ${formatBytes(max)}${
        largest
          ? `, largest ${entryLabel(largest)} ${formatBytes(largest.gzip)}`
          : ''
      } ok`,
    );
  }

  return { violations, notes };
}

export interface AssetDelta {
  key: string;
  chunk?: string;
  before?: number;
  after?: number;
  delta: number;
}

/** Per-file gzip deltas between two sizes reports, largest change first. */
export function diffSizes(
  baseline: SizesReport,
  current: SizesReport,
): AssetDelta[] {
  const byKey = new Map<string, AssetDelta>();
  for (const entry of baseline.assets) {
    byKey.set(entry.key, {
      key: entry.key,
      chunk: entry.chunk,
      before: entry.gzip,
      delta: -entry.gzip,
    });
  }
  for (const entry of current.assets) {
    const existing = byKey.get(entry.key);
    if (existing) {
      existing.after = entry.gzip;
      existing.chunk = entry.chunk ?? existing.chunk;
      existing.delta = entry.gzip - (existing.before ?? 0);
    } else {
      byKey.set(entry.key, {
        key: entry.key,
        chunk: entry.chunk,
        after: entry.gzip,
        delta: entry.gzip,
      });
    }
  }
  return [...byKey.values()].sort(
    (a, b) => Math.abs(b.delta) - Math.abs(a.delta),
  );
}

/** Checks the baseline limits of a budget file against two sizes reports. */
export function evaluateBaseline(
  baseline: SizesReport,
  current: SizesReport,
  limits: NonNullable<Budgets['baseline']>,
): EvaluationResult {
  const violations: string[] = [];
  const notes: string[] = [];

  const checkTotal = (
    name: string,
    before: number,
    after: number,
    limit: IncreaseLimit | undefined,
  ) => {
    if (limit === undefined) {
      return;
    }
    const { exceeded, description } = exceedsIncrease(before, after, limit);
    const line = `${name}: ${formatBytes(before)} -> ${formatBytes(
      after,
    )} gzip, ${description}`;
    (exceeded ? violations : notes).push(
      exceeded ? `${line} exceeded` : `${line} ok`,
    );
  };
  checkTotal(
    'initial JS',
    baseline.totals.initialJs.gzip,
    current.totals.initialJs.gzip,
    limits.maxInitialIncrease,
  );
  checkTotal(
    'total JS',
    baseline.totals.js.gzip,
    current.totals.js.gzip,
    limits.maxTotalIncrease,
  );

  const deltas = diffSizes(baseline, current);
  const newFiles = deltas.filter(d => d.before === undefined);
  const removedFiles = deltas.filter(d => d.after === undefined);
  const label = (item: AssetDelta) =>
    item.chunk ? `${item.key} (${item.chunk})` : item.key;

  if (limits.maxChunkIncrease !== undefined) {
    let grown = 0;
    for (const item of deltas) {
      if (
        item.before === undefined ||
        item.after === undefined ||
        item.delta <= 0
      ) {
        continue;
      }
      const { exceeded, description } = exceedsIncrease(
        item.before,
        item.after,
        limits.maxChunkIncrease,
      );
      if (exceeded) {
        grown++;
        violations.push(
          `${label(item)}: ${formatBytes(item.before)} -> ${formatBytes(
            item.after,
          )} gzip, ${description} exceeded`,
        );
      }
    }
    if (grown === 0) {
      notes.push(
        `no existing file grew more than ${String(limits.maxChunkIncrease)} ok`,
      );
    }
  }

  const policy = limits.newChunks ?? 'allow';
  if (newFiles.length === 0) {
    notes.push('no new files compared to the baseline ok');
  } else if (policy === 'fail') {
    for (const item of newFiles) {
      violations.push(
        `${label(item)}: new file of ${formatBytes(
          item.after ?? 0,
        )} gzip, new files are not allowed (newChunks: fail)`,
      );
    }
  } else if (policy === 'allow') {
    notes.push(
      `${newFiles.length} new file(s) compared to the baseline: ${newFiles
        .map(item => `${label(item)} ${formatBytes(item.after ?? 0)}`)
        .join(', ')}`,
    );
  } else {
    const max = parseSize(policy, 'newChunks limit');
    for (const item of newFiles) {
      const size = item.after ?? 0;
      const line = `${label(item)}: new file of ${formatBytes(
        size,
      )} gzip, newChunks limit ${formatBytes(max)}`;
      if (size > max) {
        violations.push(`${line} exceeded by ${formatBytes(size - max)}`);
      } else {
        notes.push(`${line} ok`);
      }
    }
  }
  if (
    limits.maxNewChunks !== undefined &&
    newFiles.length > limits.maxNewChunks
  ) {
    violations.push(
      `${newFiles.length} new files compared to the baseline, maxNewChunks ${limits.maxNewChunks} exceeded`,
    );
  }
  if (removedFiles.length > 0) {
    notes.push(
      `${
        removedFiles.length
      } file(s) from the baseline no longer exist: ${removedFiles
        .map(item => `${label(item)} ${formatBytes(item.before ?? 0)}`)
        .join(', ')}`,
    );
  }

  return { violations, notes };
}
