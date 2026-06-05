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
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type * as tar from 'tar';

/** Returns true when the file/directory exists; swallows all other errors. */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** True when `childAbs` resolves to `parentAbs` or a path under it. */
export function isInside(childAbs: string, parentAbs: string): boolean {
  const normalized = parentAbs.endsWith(path.sep)
    ? parentAbs
    : parentAbs + path.sep;
  return childAbs === parentAbs || childAbs.startsWith(normalized);
}

/** Plain JS object test — excludes arrays, null, class instances with custom prototype. */
export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Allowed `tar` entry types: regular file kinds + directory + links. Anything
 * else (character/block devices, FIFOs, unknown) is rejected by the tar filters.
 */
export function isAllowedEntryType(type: tar.ReadEntry['type']): boolean {
  return (
    type === 'File' ||
    type === 'Directory' ||
    type === 'SymbolicLink' ||
    type === 'Link' ||
    type === 'OldFile' ||
    type === 'ContiguousFile'
  );
}

/**
 * Drop any entries from `installed` whose value (on-disk directory) matches
 * `pluginPath`. Called after a successful install so stale hash entries for
 * the same directory are not mistakenly removed by the cleanup phase.
 */
export function markAsFresh(
  installed: Map<string, string>,
  pluginPath: string,
): void {
  for (const [k, v] of installed) {
    if (v === pluginPath) installed.delete(k);
  }
}
