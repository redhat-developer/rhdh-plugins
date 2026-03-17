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
import Papa from 'papaparse';
import { ProjectsPost } from '../../client/src/schema/openapi';

/**
 * A single project row parsed from a CSV bulk-import file.
 * Matches the shape of {@link ProjectsPost}['body'].
 *
 * @public
 */
export type CsvProjectRow = ProjectsPost['body'];

const CSV_REQUIRED_HEADERS: readonly string[] = [
  'name',
  'abbreviation',
  'sourceRepoUrl',
  'sourceRepoBranch',
  'targetRepoBranch',
];

const CSV_OPTIONAL_HEADERS: readonly string[] = [
  'description',
  'ownedByGroup',
  'targetRepoUrl',
];

const CSV_ALL_HEADERS = [...CSV_REQUIRED_HEADERS, ...CSV_OPTIONAL_HEADERS];

/**
 * Decodes a base64 data-URL encoded CSV string and parses it into
 * an array of {@link CsvProjectRow} objects ready for project creation.
 *
 * Expected CSV columns (header row required):
 *   name, abbreviation, sourceRepoUrl, sourceRepoBranch, targetRepoBranch
 *   (required)
 *   description, ownedByGroup, targetRepoUrl
 *   (optional — targetRepoUrl defaults to sourceRepoUrl when empty)
 *
 * @param dataUrl - a `data:[mediatype];base64,<payload>` string
 * @returns parsed project rows
 * @public
 */
function decodeBase64(encoded: string): string {
  if (typeof globalThis.Buffer !== 'undefined') {
    return globalThis.Buffer.from(encoded, 'base64').toString('utf-8');
  }
  const binaryString = atob(encoded);
  const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

/**
 * Parses a CSV bulk-import file into an array of {@link CsvProjectRow} objects ready for project creation.
 *
 * @param dataUrl - a `data:[mediatype];base64,<payload>` string
 * @returns parsed project rows
 * @public
 */
export function parseCsvContent(dataUrl: string): CsvProjectRow[] {
  const base64Match = dataUrl.match(/^data:(?:[^;]*;)*base64,(.*)$/);
  if (!base64Match) {
    throw new Error('Invalid CSV content: expected a base64-encoded data-URL');
  }

  const csvText = decodeBase64(base64Match[1]);

  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h =>
      h.startsWith('\uFEFF') ? h.slice(1).trim() : h.trim(),
  });

  if (result.errors.length > 0) {
    const first = result.errors[0];
    const location = first.row !== undefined ? ` (row ${first.row + 2})` : '';
    throw new Error(`CSV parse error${location}: ${first.message}`);
  }

  const headers = result.meta.fields ?? [];

  for (const required of CSV_REQUIRED_HEADERS) {
    if (!headers.includes(required)) {
      throw new Error(`CSV is missing required column: "${required}"`);
    }
  }

  const unknown = headers.filter(h => !CSV_ALL_HEADERS.includes(h));
  if (unknown.length > 0) {
    throw new Error(
      `CSV contains unknown column(s): ${unknown.map(h => `"${h}"`).join(', ')}`,
    );
  }

  if (result.data.length === 0) {
    throw new Error('CSV must contain a header row and at least one data row');
  }

  const rows: CsvProjectRow[] = [];

  for (let i = 0; i < result.data.length; i++) {
    const record = result.data[i];

    for (const required of CSV_REQUIRED_HEADERS) {
      if (!record[required]?.trim()) {
        throw new Error(
          `CSV row ${i + 2} is missing required field: "${required}"`,
        );
      }
    }

    rows.push({
      name: record.name.trim(),
      description: record.description?.trim() || '',
      abbreviation: record.abbreviation.trim(),
      ownedByGroup: record.ownedByGroup?.trim() || undefined,
      sourceRepoUrl: record.sourceRepoUrl.trim(),
      sourceRepoBranch: record.sourceRepoBranch.trim(),
      targetRepoUrl:
        record.targetRepoUrl?.trim() || record.sourceRepoUrl.trim(),
      targetRepoBranch: record.targetRepoBranch.trim(),
    });
  }

  return rows;
}
