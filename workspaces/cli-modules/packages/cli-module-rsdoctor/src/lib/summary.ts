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
import { AssetDelta } from './budgets';
import { formatBytes, formatDelta, SizesReport } from './sizes';

const pad = (value: string, width: number) => value.padStart(width);

/** Console summary of a build's sizes and the Rsdoctor lint findings. */
export function formatSummary(
  report: SizesReport,
  findings: string[] = [],
  options: { largest?: number } = {},
): string {
  const { totals } = report;
  const lines: string[] = [];
  lines.push(`Rsdoctor summary for ${report.package} (gzipped sizes)`);
  lines.push(
    `  JS: ${formatBytes(totals.js.gzip)} in ${
      totals.js.files
    } files, initial ${formatBytes(totals.initialJs.gzip)} in ${
      totals.initialJs.files
    } files; CSS: ${formatBytes(totals.css.gzip)} in ${totals.css.files} files`,
  );
  const largest = report.assets.slice(0, options.largest ?? 10);
  if (largest.length) {
    lines.push('  Largest files:');
    for (const entry of largest) {
      lines.push(
        `    ${pad(formatBytes(entry.gzip), 10)}  ${entry.key}${
          entry.chunk ? ` (${entry.chunk})` : ''
        }${entry.initial ? '  [initial]' : ''}`,
      );
    }
  }
  if (findings.length) {
    const byCode = new Map<string, number>();
    for (const finding of findings) {
      const code = finding.match(/\[(E\d{4}|EXTEND):[^:\]]*:([^\]]+)\]/);
      const label = code ? `${code[1]} ${code[2].toLowerCase()}` : 'other';
      byCode.set(label, (byCode.get(label) ?? 0) + 1);
    }
    lines.push(
      `  Rsdoctor findings: ${[...byCode]
        .map(([label, count]) => `${count} ${label}`)
        .join(', ')}`,
    );
    for (const finding of findings) {
      for (const line of finding.trim().split('\n')) {
        lines.push(`    ${line.replace(/^\s*⚠\s*/, '')}`);
      }
    }
  }
  return lines.join('\n');
}

/** Console table of the largest gzip size changes between two builds. */
export function formatDiff(
  baseline: SizesReport,
  current: SizesReport,
  deltas: AssetDelta[],
  options: { limit?: number } = {},
): string {
  const lines: string[] = [];
  const total = (name: string, before: number, after: number) =>
    `  ${name}: ${formatBytes(before)} -> ${formatBytes(after)} (${formatDelta(
      after - before,
    )})`;
  lines.push('Bundle size diff (gzipped)');
  lines.push(
    total(
      'initial JS',
      baseline.totals.initialJs.gzip,
      current.totals.initialJs.gzip,
    ),
  );
  lines.push(
    total('total JS', baseline.totals.js.gzip, current.totals.js.gzip),
  );
  lines.push(total('CSS', baseline.totals.css.gzip, current.totals.css.gzip));

  const changed = deltas.filter(d => d.delta !== 0);
  const added = changed.filter(d => d.before === undefined).length;
  const removed = changed.filter(d => d.after === undefined).length;
  lines.push(
    `  ${changed.length} files changed (${added} added, ${removed} removed), ${
      deltas.length - changed.length
    } unchanged`,
  );
  for (const item of changed.slice(0, options.limit ?? 15)) {
    let state = `${formatBytes(item.before ?? 0)} -> ${formatBytes(
      item.after ?? 0,
    )}`;
    if (item.before === undefined) {
      state = 'added';
    } else if (item.after === undefined) {
      state = 'removed';
    }
    lines.push(
      `    ${pad(formatDelta(item.delta), 10)}  ${item.key}${
        item.chunk ? ` (${item.chunk})` : ''
      }  ${state}`,
    );
  }
  return lines.join('\n');
}
