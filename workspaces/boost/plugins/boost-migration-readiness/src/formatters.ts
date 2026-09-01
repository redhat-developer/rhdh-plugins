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

import type { EntityAssessment, MigrationReport } from './types';

/**
 * Strip ANSI escape sequences and ASCII control characters (except
 * newline and tab) from an untrusted string before terminal output.
 * Covers carriage return (\r) to prevent terminal line overwriting.
 *
 * @internal
 */
function sanitize(value: string): string {
  /* eslint-disable no-control-regex */
  return value.replace(/\x1b\[[0-9;]*[A-Za-z]|[\x00-\x08\x0b-\x1f]/g, '');
  /* eslint-enable no-control-regex */
}

/** Footer text appended to all report outputs. @internal */
const FOOTER =
  'This is a migration-readiness assessment.\n' +
  'Actual migration is future work pending upstream RFC finalization.';

/**
 * Format a migration report as machine-readable JSON.
 *
 * @param report - The migration report to format.
 * @returns A JSON string representation of the report.
 *
 * @public
 */
export function formatJson(report: MigrationReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Capitalize the first letter of a confidence level for display.
 *
 * @internal
 */
function displayConfidence(confidence: string): string {
  const map: Record<string, string> = {
    high: 'High',
    'medium-high': 'Medium–High',
    'medium-low': 'Medium/Low',
    low: 'Low',
  };
  return map[confidence] ?? confidence;
}

/**
 * Format the target line for an entity assessment.
 *
 * @internal
 */
function formatTarget(entity: EntityAssessment): string {
  if (!entity.targetKind) {
    return '  Target:  No upstream kind yet';
  }
  const modelSuffix = entity.targetModel ? ` (${entity.targetModel})` : '';
  const rfcSuffix =
    entity.rfcIds.length > 0 ? `, ${entity.rfcIds.join(', ')}` : '';
  return `  Target:  kind=${entity.targetKind}${modelSuffix}${rfcSuffix}`;
}

/**
 * Format a single entity assessment as text lines.
 *
 * @internal
 */
function formatEntityLines(entity: EntityAssessment): string[] {
  const lines: string[] = [
    `Entity: ${sanitize(entity.name)}`,
    `  Current: kind=${sanitize(entity.currentKind)}, spec.type=${sanitize(entity.currentSpecType)}`,
    formatTarget(entity),
    `  Confidence: ${displayConfidence(entity.confidence)}`,
    ...(entity.alreadyAligned
      ? ['  Status: Already aligned with upstream target']
      : []),
    ...(entity.transformations.length > 0
      ? [
          '  Transformations:',
          ...entity.transformations.map(t => `    - ${sanitize(t)}`),
        ]
      : []),
    ...(entity.warnings.length > 0
      ? ['  Warnings:', ...entity.warnings.map(w => `    - ${sanitize(w)}`)]
      : []),
    '',
  ];
  return lines;
}

/**
 * Format a migration report as human-readable text.
 *
 * @param report - The migration report to format.
 * @returns A human-readable text representation of the report.
 *
 * @public
 */
export function formatText(report: MigrationReport): string {
  const lines: string[] = [
    'Migration Readiness Report',
    '=========================',
    '',
    ...(report.entities.length === 0
      ? ['No AI asset entities found.', '']
      : report.entities.flatMap(entity => formatEntityLines(entity))),
    '---',
    FOOTER,
  ];

  return lines.join('\n');
}
