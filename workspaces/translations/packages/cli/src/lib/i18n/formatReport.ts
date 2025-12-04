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

import chalk from 'chalk';

import { TranslationStatus } from './analyzeStatus';

/**
 * Format translation status report
 */
export async function formatStatusReport(
  status: TranslationStatus,
  format: string,
  includeStats: boolean,
): Promise<string> {
  switch (format.toLowerCase()) {
    case 'table':
      return formatTableReport(status, includeStats);
    case 'json':
      return formatJsonReport(status, includeStats);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Format table report
 */
function formatTableReport(
  status: TranslationStatus,
  includeStats: boolean,
): string {
  const lines: string[] = [];

  // Header
  lines.push(chalk.blue('📊 Translation Status Report'));
  lines.push(chalk.gray('═'.repeat(50)));

  // Summary
  lines.push(chalk.yellow('\n📈 Summary:'));
  lines.push(`   Total Keys: ${status.totalKeys}`);
  lines.push(`   Languages: ${status.languages.length}`);
  lines.push(`   Overall Completion: ${status.overallCompletion.toFixed(1)}%`);

  // Language breakdown
  if (status.languages.length > 0) {
    lines.push(chalk.yellow('\n🌍 Language Status:'));
    lines.push(chalk.gray('   Language    | Translated | Total | Completion'));
    lines.push(chalk.gray('   ────────────┼────────────┼───────┼───────────'));

    for (const language of status.languages) {
      const stats = status.languageStats[language];
      const completion = stats.completion.toFixed(1);
      const completionBar = getCompletionBar(stats.completion);

      lines.push(
        `   ${language.padEnd(12)} | ${stats.translated
          .toString()
          .padStart(10)} | ${stats.total
          .toString()
          .padStart(5)} | ${completion.padStart(8)}% ${completionBar}`,
      );
    }
  }

  // Missing keys
  if (status.missingKeys.length > 0) {
    lines.push(chalk.red(`\n❌ Missing Keys (${status.missingKeys.length}):`));
    for (const key of status.missingKeys.slice(0, 10)) {
      lines.push(chalk.gray(`   ${key}`));
    }
    if (status.missingKeys.length > 10) {
      lines.push(
        chalk.gray(`   ... and ${status.missingKeys.length - 10} more`),
      );
    }
  }

  // Extra keys
  const languagesWithExtraKeys = status.languages.filter(
    lang => status.extraKeys[lang] && status.extraKeys[lang].length > 0,
  );

  if (languagesWithExtraKeys.length > 0) {
    lines.push(chalk.yellow(`\n⚠️  Extra Keys:`));
    for (const language of languagesWithExtraKeys) {
      const extraKeys = status.extraKeys[language];
      lines.push(chalk.gray(`   ${language}: ${extraKeys.length} extra keys`));
      for (const key of extraKeys.slice(0, 5)) {
        lines.push(chalk.gray(`     ${key}`));
      }
      if (extraKeys.length > 5) {
        lines.push(chalk.gray(`     ... and ${extraKeys.length - 5} more`));
      }
    }
  }

  // Detailed stats
  if (includeStats) {
    lines.push(chalk.yellow('\n📊 Detailed Statistics:'));
    lines.push(`   Source Files: ${status.sourceFiles.length}`);
    lines.push(
      `   Total Translations: ${status.languages.reduce(
        (sum, lang) => sum + (status.languageStats[lang]?.translated || 0),
        0,
      )}`,
    );
    lines.push(
      `   Average Completion: ${(
        status.languages.reduce(
          (sum, lang) => sum + (status.languageStats[lang]?.completion || 0),
          0,
        ) / status.languages.length
      ).toFixed(1)}%`,
    );
  }

  return lines.join('\n');
}

/**
 * Format JSON report
 */
function formatJsonReport(
  status: TranslationStatus,
  includeStats: boolean,
): string {
  const summary: {
    totalKeys: number;
    languages: number;
    overallCompletion: number;
    sourceFiles?: number;
    totalTranslations?: number;
    averageCompletion?: number;
  } = {
    totalKeys: status.totalKeys,
    languages: status.languages.length,
    overallCompletion: status.overallCompletion,
  };

  if (includeStats) {
    summary.sourceFiles = status.sourceFiles.length;
    summary.totalTranslations = status.languages.reduce(
      (sum, lang) => sum + (status.languageStats[lang]?.translated || 0),
      0,
    );
    summary.averageCompletion =
      status.languages.reduce(
        (sum, lang) => sum + (status.languageStats[lang]?.completion || 0),
        0,
      ) / status.languages.length;
  }

  const report = {
    summary,
    languages: status.languageStats,
    missingKeys: status.missingKeys,
    extraKeys: status.extraKeys,
  };

  return JSON.stringify(report, null, 2);
}

/**
 * Get completion bar visualization
 */
function getCompletionBar(completion: number): string {
  const filled = Math.floor(completion / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
