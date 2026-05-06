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

import path from 'node:path';

/** Same cap as plugin `NOTEBOOK_MAX_FILES`: max attachments per notebook session. */
export const NOTEBOOK_SESSION_MAX_DOCUMENTS = 10;

/** Playwright URL match when a notebook editor session route is active. */
export const NOTEBOOK_EDITOR_URL_RE = /\/lightspeed\/notebooks\/[^/]+$/;

/** Chat upload JSON fixtures shared with conversational upload e2e (`fixtures/uploads`). */
const UPLOAD_FIXTURE_DIR = path.join(__dirname, '..', 'fixtures', 'uploads');

/**
 * Eleven distinct `*.upload*.json` files under `fixtures/uploads` (`NOTEBOOK_SESSION_MAX_DOCUMENTS` + 1)
 * so the staging UI rejects the batch with `notebook.upload.error.tooManyFiles`.
 */
const DISTINCT_UPLOAD_JSON_FOR_CAP_TEST = [
  'de.upload1.json',
  'de.upload2.json',
  'en.upload1.json',
  'en.upload2.json',
  'es.upload1.json',
  'es.upload2.json',
  'fr.upload1.json',
  'fr.upload2.json',
  'it.upload1.json',
  'it.upload2.json',
  'ja.upload1.json',
] as const;

/** Eleven paths — one over `NOTEBOOK_SESSION_MAX_DOCUMENTS` — to assert `notebook.upload.error.tooManyFiles`. */
export function notebookElevenFileStagingPaths(): string[] {
  return DISTINCT_UPLOAD_JSON_FOR_CAP_TEST.map(f =>
    path.join(UPLOAD_FIXTURE_DIR, f),
  );
}

export function notebookUnsupportedTypeFixturePath(): string {
  return path.join(__dirname, 'notebookTranslation.ts');
}

/** Same locale-keyed JSON fixtures as chat uploads (`fixtures/uploads/{locale}.upload1.json`). */
export function localeNotebookUpload1Path(playwrightLocale: string): {
  absolutePath: string;
  fileName: string;
} {
  const locale = playwrightLocale.split('-')[0] ?? playwrightLocale;
  const fileName = `${locale}.upload1.json`;
  return {
    absolutePath: path.join(UPLOAD_FIXTURE_DIR, fileName),
    fileName,
  };
}
