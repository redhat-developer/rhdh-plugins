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

import { OptionValues } from 'commander';
import chalk from 'chalk';

import { analyzeTranslationStatus } from '../lib/i18n/analyzeStatus';
import { formatStatusReport } from '../lib/i18n/formatReport';

export async function statusCommand(opts: OptionValues): Promise<void> {
  console.log(chalk.blue('📊 Analyzing translation status...'));

  const {
    sourceDir = 'src',
    i18nDir = 'i18n',
    localesDir = 'src/locales',
    format = 'table',
    includeStats = true,
  } = opts;

  try {
    // Analyze translation status
    const status = await analyzeTranslationStatus({
      sourceDir,
      i18nDir,
      localesDir,
    });

    // Format and display report
    const report = await formatStatusReport(status, format, includeStats);
    console.log(report);

    // Summary
    console.log(chalk.green(`✅ Status analysis completed!`));
    console.log(chalk.gray(`   Source files: ${status.sourceFiles.length}`));
    console.log(chalk.gray(`   Translation keys: ${status.totalKeys}`));
    console.log(chalk.gray(`   Languages: ${status.languages.length}`));
    console.log(chalk.gray(`   Completion: ${status.overallCompletion}%`));
  } catch (error) {
    console.error(chalk.red('❌ Error analyzing translation status:'), error);
    throw error;
  }
}
