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

import path from 'path';

import { OptionValues } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';

import { TMSClient } from '../lib/i18n/tmsClient';
import { saveTranslationFile } from '../lib/i18n/saveFile';
import { loadI18nConfig, mergeConfigWithOptions } from '../lib/i18n/config';

export async function downloadCommand(opts: OptionValues): Promise<void> {
  console.log(chalk.blue('📥 Downloading translated strings from TMS...'));

  // Load config and merge with options
  const config = await loadI18nConfig();
  // mergeConfigWithOptions is async (may generate token), so we await it
  const mergedOpts = await mergeConfigWithOptions(config, opts);

  const {
    tmsUrl,
    tmsToken,
    projectId,
    outputDir = 'i18n',
    languages,
    format = 'json',
    includeCompleted = true,
    includeDraft = false,
  } = mergedOpts as {
    tmsUrl?: string;
    tmsToken?: string;
    projectId?: string;
    outputDir?: string;
    languages?: string;
    format?: string;
    includeCompleted?: boolean;
    includeDraft?: boolean;
  };

  // Validate required options
  if (!tmsUrl || !tmsToken || !projectId) {
    console.error(chalk.red('❌ Missing required TMS configuration:'));
    console.error('');

    if (!tmsUrl) {
      console.error(chalk.yellow('   ✗ TMS URL'));
      console.error(
        chalk.gray(
          '     Set via: --tms-url <url> or I18N_TMS_URL or .i18n.config.json',
        ),
      );
    }
    if (!tmsToken) {
      console.error(chalk.yellow('   ✗ TMS Token'));
      console.error(
        chalk.gray(
          '     Primary: Source ~/.memsourcerc (sets MEMSOURCE_TOKEN)',
        ),
      );
      console.error(
        chalk.gray(
          '     Fallback: --tms-token <token> or I18N_TMS_TOKEN or ~/.i18n.auth.json',
        ),
      );
    }
    if (!projectId) {
      console.error(chalk.yellow('   ✗ Project ID'));
      console.error(
        chalk.gray(
          '     Set via: --project-id <id> or I18N_TMS_PROJECT_ID or .i18n.config.json',
        ),
      );
    }

    console.error('');
    console.error(chalk.blue('📋 Quick Setup Guide:'));
    console.error(chalk.gray('   1. Run: translations-cli i18n init'));
    console.error(chalk.gray('      This creates .i18n.config.json'));
    console.error('');
    console.error(
      chalk.gray('   2. Edit .i18n.config.json in your project root:'),
    );
    console.error(
      chalk.gray(
        '      - Add your TMS URL (e.g., "https://cloud.memsource.com/web")',
      ),
    );
    console.error(chalk.gray('      - Add your Project ID'));
    console.error('');
    console.error(
      chalk.gray('   3. Set up Memsource authentication (recommended):'),
    );
    console.error(
      chalk.gray('      - Run: translations-cli i18n setup-memsource'),
    );
    console.error(
      chalk.gray(
        '      - Or manually create ~/.memsourcerc following localization team instructions',
      ),
    );
    console.error(chalk.gray('      - Then source it: source ~/.memsourcerc'));
    console.error('');
    console.error(
      chalk.gray(
        '   OR use ~/.i18n.auth.json as fallback (run init to create it)',
      ),
    );
    console.error('');
    console.error(
      chalk.gray('   See docs/i18n-commands.md for detailed instructions.'),
    );
    process.exit(1);
  }

  try {
    // Ensure output directory exists
    await fs.ensureDir(outputDir);

    // Initialize TMS client
    console.log(chalk.yellow(`🔗 Connecting to TMS at ${tmsUrl}...`));
    const tmsClient = new TMSClient(tmsUrl, tmsToken);

    // Test connection
    await tmsClient.testConnection();
    console.log(chalk.green(`✅ Connected to TMS successfully`));

    // Get project information
    console.log(chalk.yellow(`📋 Getting project information...`));
    const projectInfo = await tmsClient.getProjectInfo(projectId);
    console.log(chalk.gray(`   Project: ${projectInfo.name}`));
    console.log(
      chalk.gray(`   Languages: ${projectInfo.languages.join(', ')}`),
    );

    // Parse target languages
    const targetLanguages =
      languages && typeof languages === 'string'
        ? languages.split(',').map((lang: string) => lang.trim())
        : projectInfo.languages;

    // Download translations for each language
    const downloadResults = [];

    for (const language of targetLanguages) {
      console.log(
        chalk.yellow(`📥 Downloading translations for ${language}...`),
      );

      try {
        const translationData = await tmsClient.downloadTranslations(
          projectId,
          language,
          {
            includeCompleted: Boolean(includeCompleted),
            includeDraft: Boolean(includeDraft),
            format: String(format || 'json'),
          },
        );

        if (translationData && Object.keys(translationData).length > 0) {
          // Save translation file
          const fileName = `${language}.${String(format || 'json')}`;
          const filePath = path.join(String(outputDir || 'i18n'), fileName);

          await saveTranslationFile(
            translationData,
            filePath,
            String(format || 'json'),
          );

          downloadResults.push({
            language,
            filePath,
            keyCount: Object.keys(translationData).length,
          });

          console.log(
            chalk.green(
              `✅ Downloaded ${language}: ${
                Object.keys(translationData).length
              } keys`,
            ),
          );
        } else {
          console.log(
            chalk.yellow(`⚠️  No translations found for ${language}`),
          );
        }
      } catch (error) {
        console.warn(
          chalk.yellow(`⚠️  Warning: Could not download ${language}: ${error}`),
        );
      }
    }

    // Summary
    console.log(chalk.green(`✅ Download completed successfully!`));
    console.log(chalk.gray(`   Output directory: ${outputDir}`));
    console.log(chalk.gray(`   Files downloaded: ${downloadResults.length}`));

    if (downloadResults.length > 0) {
      console.log(chalk.blue('📁 Downloaded files:'));
      for (const result of downloadResults) {
        console.log(
          chalk.gray(
            `   ${result.language}: ${result.filePath} (${result.keyCount} keys)`,
          ),
        );
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ Error downloading from TMS:'), error);
    throw error;
  }
}
