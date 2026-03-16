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

/**
 * Wire / storage form of entity status (lowercase).
 *
 * @public
 */
export type DcmEntityStatus = 'success' | 'running';

/**
 * Canonical lowercase entity status values for DCM data (mock, API, DB).
 * Use {@link displayDcmEntityStatus} for user-visible labels in the UI.
 *
 * When adding a status: extend {@link DcmEntityStatus}, add an entry here, and add a branch in
 * {@link displayDcmEntityStatus} (`assertNever` catches missing switch cases).
 *
 * @public
 */
export const DCM_ENTITY_STATUS = {
  success: 'success',
  running: 'running',
} as const satisfies Record<DcmEntityStatus, DcmEntityStatus>;

/** All known {@link DcmEntityStatus} values (for guards / tests). @public */
export const DCM_ENTITY_STATUS_VALUES: readonly DcmEntityStatus[] =
  Object.freeze(Object.values(DCM_ENTITY_STATUS) as DcmEntityStatus[]);

function assertNever(x: never): never {
  throw new Error(`Unexpected entity status: ${String(x)}`);
}

/**
 * Human-readable label for UI (e.g. table cells).
 * @public
 */
export function displayDcmEntityStatus(status: DcmEntityStatus): string {
  switch (status) {
    case DCM_ENTITY_STATUS.success:
      return 'Success';
    case DCM_ENTITY_STATUS.running:
      return 'Running';
    default:
      return assertNever(status);
  }
}

/**
 * Parse wire / JSON values; returns `undefined` if not a known status.
 * @public
 */
export function parseDcmEntityStatus(raw: string): DcmEntityStatus | undefined {
  return (DCM_ENTITY_STATUS_VALUES as readonly string[]).includes(raw)
    ? (raw as DcmEntityStatus)
    : undefined;
}

/**
 * Display for possibly unknown wire values — falls back to the raw string.
 * @public
 */
export function displayDcmEntityStatusLoose(raw: string): string {
  const parsed = parseDcmEntityStatus(raw);
  return parsed === undefined ? raw : displayDcmEntityStatus(parsed);
}
