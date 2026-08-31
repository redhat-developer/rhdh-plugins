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

import type { MigrationReport } from './types';

/** Footer text appended to all report outputs. */
const FOOTER =
  'This is a migration-readiness assessment.\n' +
  'Actual migration is future work pending upstream RFC finalization.';

/**
 * Format a migration report as machine-readable JSON.
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
 * Format a migration report as human-readable text.
 *
 * @public
 */
export function formatText(report: MigrationReport): string {
  const lines: string[] = [];

  lines.push('Migration Readiness Report');
  lines.push('=========================');
  lines.push('');

  if (report.entities.length === 0) {
    lines.push('No AI asset entities found.');
    lines.push('');
  }

  for (const entity of report.entities) {
    lines.push(`Entity: ${entity.name}`);
    lines.push(
      `  Current: kind=${entity.currentKind}, spec.type=${entity.currentSpecType}`,
    );

    if (entity.targetKind) {
      const modelSuffix = entity.targetModel ? ` (${entity.targetModel})` : '';
      const rfcSuffix = entity.rfcIds.length > 0 ? `, ${entity.rfcIds[0]}` : '';
      lines.push(
        `  Target:  kind=${entity.targetKind}${modelSuffix}${rfcSuffix}`,
      );
    } else {
      lines.push('  Target:  No upstream kind yet');
    }

    lines.push(`  Confidence: ${displayConfidence(entity.confidence)}`);

    if (entity.alreadyAligned) {
      lines.push('  Status: Already aligned with upstream target');
    }

    if (entity.transformations.length > 0) {
      lines.push('  Transformations:');
      for (const t of entity.transformations) {
        lines.push(`    - ${t}`);
      }
    }

    if (entity.warnings.length > 0) {
      lines.push('  Warnings:');
      for (const w of entity.warnings) {
        lines.push(`    - ${w}`);
      }
    }

    lines.push('');
  }

  lines.push('---');
  lines.push(FOOTER);

  return lines.join('\n');
}
