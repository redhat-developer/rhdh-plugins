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
import zlib from 'node:zlib';

/** One emitted JS or CSS file of a build. */
export interface SizeEntry {
  /** File name with content hashes removed, stable across builds. */
  key: string;
  /** Emitted file name relative to the output directory. */
  file: string;
  /** Chunk name(s) the file belongs to, when the chunk is named. */
  chunk?: string;
  /** True when the file is loaded on page start. */
  initial: boolean;
  type: 'js' | 'css';
  /** Raw size in bytes. */
  size: number;
  /** Gzipped size in bytes. */
  gzip: number;
}

export interface SizeTotal {
  files: number;
  size: number;
  gzip: number;
}

/** Sizes of all emitted JS and CSS files of a build, written as sizes.json. */
export interface SizesReport {
  version: 1;
  package: string;
  createdAt: string;
  totals: {
    js: SizeTotal;
    initialJs: SizeTotal;
    css: SizeTotal;
  };
  assets: SizeEntry[];
}

export const SIZES_FILE_NAME = 'sizes.json';

/** Classifies an emitted file; only JS and CSS files are measured. */
export function assetType(file: string): 'js' | 'css' | undefined {
  if (file.endsWith('.js')) {
    return 'js';
  }
  if (file.endsWith('.css')) {
    return 'css';
  }
  return undefined;
}

/** Removes content hashes such as `.f3e5465d5719` from an emitted file name. */
export function stableAssetKey(file: string): string {
  return file.replace(/\.[0-9a-f]{8,}(?=\.)/g, '');
}

function sumTotals(entries: SizeEntry[]): SizeTotal {
  return entries.reduce(
    (acc, e) => ({
      files: acc.files + 1,
      size: acc.size + e.size,
      gzip: acc.gzip + e.gzip,
    }),
    { files: 0, size: 0, gzip: 0 },
  );
}

/** Formats a byte count for humans, e.g. `1.27 MB`. */
export function formatBytes(bytes: number): string {
  const abs = Math.abs(bytes);
  if (abs >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  if (abs >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

/** Formats a size difference with sign, e.g. `+12.3 KB`. */
export function formatDelta(bytes: number): string {
  return `${bytes >= 0 ? '+' : '-'}${formatBytes(Math.abs(bytes))}`;
}

interface StatsLike {
  toJson(options: Record<string, unknown>): {
    assets?: Array<{ name: string; size: number }>;
    chunks?: Array<{
      id?: string | number;
      names?: string[];
      files?: string[];
      initial?: boolean;
    }>;
  };
  compilation: {
    getAsset?(name: string): { source: { buffer(): Buffer } } | undefined;
  };
  compiler?: { outputPath?: string };
}

/**
 * Collects the emitted JS and CSS files of a finished compilation together
 * with their raw and gzipped sizes and whether they are initial chunks.
 */
export function collectSizes(
  stats: StatsLike,
  packageName: string,
): SizesReport {
  const json = stats.toJson({
    all: false,
    assets: true,
    chunks: true,
    cachedAssets: true,
  });

  const chunkByFile = new Map<string, { names: string[]; initial: boolean }>();
  for (const chunk of json.chunks ?? []) {
    for (const file of chunk.files ?? []) {
      const existing = chunkByFile.get(file) ?? { names: [], initial: false };
      existing.names.push(...(chunk.names ?? []));
      existing.initial = existing.initial || Boolean(chunk.initial);
      chunkByFile.set(file, existing);
    }
  }

  const readContent = (name: string): Buffer | undefined => {
    const asset = stats.compilation.getAsset?.(name);
    if (asset) {
      return asset.source.buffer();
    }
    const outputPath = stats.compiler?.outputPath;
    if (outputPath && fs.existsSync(path.join(outputPath, name))) {
      return fs.readFileSync(path.join(outputPath, name));
    }
    return undefined;
  };

  const assets: SizeEntry[] = [];
  for (const asset of json.assets ?? []) {
    const type = assetType(asset.name);
    if (!type) {
      continue;
    }
    const content = readContent(asset.name);
    const gzip = content ? zlib.gzipSync(content).length : 0;
    const chunk = chunkByFile.get(asset.name);
    const names = [...new Set(chunk?.names ?? [])];
    assets.push({
      key: stableAssetKey(asset.name),
      file: asset.name,
      chunk: names.length ? names.join(',') : undefined,
      initial: chunk?.initial ?? false,
      type,
      size: asset.size,
      gzip,
    });
  }
  return buildSizesReport(assets, packageName);
}

/** Builds a sizes report (sorted by gzip size, with totals) from entries. */
export function buildSizesReport(
  entries: SizeEntry[],
  packageName: string,
): SizesReport {
  const assets = [...entries].sort((a, b) => b.gzip - a.gzip);
  const js = assets.filter(a => a.type === 'js');
  return {
    version: 1,
    package: packageName,
    createdAt: new Date().toISOString(),
    totals: {
      js: sumTotals(js),
      initialJs: sumTotals(js.filter(a => a.initial)),
      css: sumTotals(assets.filter(a => a.type === 'css')),
    },
    assets,
  };
}

export function writeSizes(file: string, report: SizesReport): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
}

/**
 * Reads a sizes.json. Accepts the file itself, a report directory that
 * contains it, or a package directory with a `.rsdoctor` folder.
 */
export function readSizes(target: string): SizesReport {
  const file = resolveReportFile(target, SIZES_FILE_NAME);
  const report = JSON.parse(fs.readFileSync(file, 'utf8')) as SizesReport;
  if (report.version !== 1 || !Array.isArray(report.assets)) {
    throw new Error(`${file} is not a sizes.json written by rsdoctor build`);
  }
  return report;
}

/**
 * Resolves a report file (`sizes.json`, `manifest.json`, ...) from a path that
 * is either the file, a directory containing it, or a directory with a
 * `.rsdoctor` sub folder containing it.
 */
export function resolveReportFile(target: string, fileName: string): string {
  const candidates = [
    target,
    path.join(target, fileName),
    path.join(target, '.rsdoctor', fileName),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  throw new Error(
    `Could not find ${fileName} at ${target} (looked for the file itself, ${fileName} inside it, and .rsdoctor/${fileName} inside it)`,
  );
}
