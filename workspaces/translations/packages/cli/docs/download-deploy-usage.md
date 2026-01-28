# Download and Deploy Translations

This guide explains how to use the automated download and deploy commands for translations.

## Prerequisites

1. **Memsource CLI setup**: Ensure you have `memsource` CLI installed and `~/.memsourcerc` is sourced:

   ```bash
   source ~/.memsourcerc
   ```

2. **Project configuration**: Ensure `.i18n.config.json` exists in your project root with:

   ```json
   {
     "tms": {
       "url": "https://cloud.memsource.com/web",
       "projectId": "your-project-id"
     }
   }
   ```

3. **tsx installed**: For the deploy command, ensure `tsx` is available:
   ```bash
   npm install -g tsx
   # or
   yarn add -D tsx
   ```

## Download Translations

Download completed translation jobs from Memsource:

### Download all completed jobs:

```bash
translations-cli i18n download
```

### Download specific languages:

```bash
translations-cli i18n download --languages "it,ja,fr"
```

### Download specific job IDs:

```bash
translations-cli i18n download --job-ids "13,14,16,17,19,20"
```

### Custom output directory:

```bash
translations-cli i18n download --output-dir "custom/downloads"
```

**Options:**

- `--project-id <id>`: Memsource project ID (can be set in `.i18n.config.json`)
- `--output-dir <path>`: Output directory (default: `i18n/downloads`)
- `--languages <languages>`: Comma-separated list of languages (e.g., "it,ja,fr")
- `--job-ids <ids>`: Comma-separated list of specific job IDs to download

**Output:**

- Downloaded files are saved to the output directory
- Files are named: `{filename}-{lang}-C.json` (e.g., `rhdh-plugins-reference-2025-12-05-it-C.json`)

## Deploy Translations

Deploy downloaded translations to TypeScript translation files:

### Deploy from default location:

```bash
translations-cli i18n deploy
```

### Deploy from custom location:

```bash
translations-cli i18n deploy --source-dir "custom/downloads"
```

**Options:**

- `--source-dir <path>`: Source directory containing downloaded translations (default: `i18n/downloads`)

**What it does:**

1. Reads JSON files from the source directory
2. Finds corresponding plugin translation directories
3. Updates existing `it.ts` files with new translations
4. Creates new `ja.ts` files for plugins that don't have them
5. Updates `index.ts` files to register Japanese translations

**Output:**

- Updated/created files in `workspaces/*/plugins/*/src/translations/`
- Files maintain TypeScript format with proper imports
- All translations are registered in `index.ts` files

## Complete Workflow

This section provides a comprehensive step-by-step guide for the entire translation workflow across all three repositories (`rhdh-plugins`, `community-plugins`, and `rhdh`).

### Prerequisites (One-Time Setup)

Before starting, ensure you have completed the initial setup:

1. **Memsource CLI installed and configured**:

   ```bash
   pip install memsource-cli-client
   # Configure ~/.memsourcerc with your credentials
   source ~/.memsourcerc
   ```

2. **Project configuration files**:

   - Each repo should have `.i18n.config.json` in its root directory
   - Contains TMS URL, Project ID, and target languages

3. **tsx installed** (for deploy command):
   ```bash
   npm install -g tsx
   # or
   yarn add -D tsx
   ```

### Step 1: Generate Reference Files

Generate the reference translation files for each repository. These files contain all English strings that need translation.

#### For rhdh-plugins:

```bash
cd /path/to/rhdh-plugins
translations-cli i18n generate
```

**Output**: `workspaces/i18n/reference.json`

#### For community-plugins:

```bash
cd /path/to/community-plugins
translations-cli i18n generate
```

**Output**: `i18n/reference.json`

**Note**: When using `--core-plugins` flag with community-plugins repo, only **Red Hat owned plugins** (plugins with `"author": "Red Hat"` in their `package.json`) are included in the generated reference file. Non-Red Hat plugins are automatically filtered out.

#### For rhdh:

```bash
cd /path/to/rhdh
translations-cli i18n generate
```

**Output**: `i18n/reference.json`

**What it does:**

- Scans all TypeScript/JavaScript source files
- Extracts translation keys from `createTranslationRef` and `createTranslationMessages` calls
- Generates a flat JSON file with all English reference strings
- File format: `{ "pluginName": { "en": { "key": "English value" } } }`

**Special behavior for community-plugins with `--core-plugins` flag:**

When using `--core-plugins` flag and pointing to a community-plugins repository, the generate command automatically filters to only include **Red Hat owned plugins**. A plugin is considered Red Hat owned if it has `"author": "Red Hat"` in its `package.json` file. Non-Red Hat plugins are automatically excluded from the generated reference file.

Example:

```bash
cd /path/to/community-plugins
translations-cli i18n generate --core-plugins --backstage-repo-path /path/to/community-plugins
# Only Red Hat owned plugins will be included in the output
```

### Step 2: Upload Reference Files to Memsource

Upload the generated reference files to your TMS project for translation.

#### For rhdh-plugins:

```bash
cd /path/to/rhdh-plugins
translations-cli i18n upload
```

#### For community-plugins:

```bash
cd /path/to/community-plugins
translations-cli i18n upload
```

#### For rhdh:

```bash
cd /path/to/rhdh
translations-cli i18n upload
```

**What it does:**

- Reads `i18n/reference.json` (or `workspaces/i18n/reference.json` for rhdh-plugins)
- Uploads to Memsource project specified in `.i18n.config.json`
- Creates translation jobs for each target language (e.g., `it`, `ja`, `fr`)
- Uses caching to avoid re-uploading unchanged files (use `--force` to bypass)

**Output:**

- Success message with job IDs
- Files are now available in Memsource UI for translation

### Step 3: Wait for Translations to Complete

1. **Monitor progress in Memsource UI**:

   - Visit your Memsource project: `https://cloud.memsource.com/web/project2/show/{projectId}`
   - Check job status for each language
   - Wait for jobs to be marked as "Completed"

2. **Note the job IDs**:
   - Job IDs are displayed in the Memsource UI
   - You'll need these for downloading specific jobs
   - Example: Jobs 13, 14, 16, 17, 19, 20

### Step 4: Download Completed Translations

Download the translated files from Memsource. You can download from any repository - the files are named with repo prefixes, so they won't conflict.

#### Option A: Download all completed jobs

```bash
cd /path/to/rhdh-plugins  # Can be any repo
source ~/.memsourcerc
translations-cli i18n download
```

#### Option B: Download specific job IDs

```bash
cd /path/to/rhdh-plugins
source ~/.memsourcerc
translations-cli i18n download --job-ids "13,14,16,17,19,20"
```

#### Option C: Download specific languages

```bash
cd /path/to/rhdh-plugins
source ~/.memsourcerc
translations-cli i18n download --languages "it,ja,fr"
```

#### Option D: Download to shared location (recommended for multi-repo)

```bash
mkdir -p ~/translations/downloads
cd /path/to/rhdh-plugins
source ~/.memsourcerc
translations-cli i18n download --output-dir ~/translations/downloads
```

**What it does:**

- Lists all completed jobs from Memsource project
- Downloads JSON files for each language
- Filters by job IDs or languages if specified
- Saves files with naming pattern: `{repo-name}-reference-{date}-{lang}-C.json`

**Output files:**

- `rhdh-plugins-reference-2025-12-05-it-C.json`
- `rhdh-plugins-reference-2025-12-05-ja-C.json`
- `community-plugins-reference-2025-12-05-it-C.json`
- `rhdh-reference-2025-12-05-it-C.json`
- etc.

**Default location**: `i18n/downloads/` in the current repo

### Step 5: Deploy Translations to Application

Deploy the downloaded translations back to your application's TypeScript translation files. The deploy command automatically detects which repo you're in and processes only the relevant files.

#### For rhdh-plugins:

```bash
cd /path/to/rhdh-plugins
translations-cli i18n deploy
# Or from shared location:
translations-cli i18n deploy --source-dir ~/translations/downloads
```

#### For community-plugins:

```bash
cd /path/to/community-plugins
translations-cli i18n deploy
# Or from shared location:
translations-cli i18n deploy --source-dir ~/translations/downloads
```

#### For rhdh:

```bash
cd /path/to/rhdh
translations-cli i18n deploy
# Or from shared location:
translations-cli i18n deploy --source-dir ~/translations/downloads
```

**What it does:**

1. **Detects repository type** automatically (rhdh-plugins, community-plugins, or rhdh)
2. **Finds downloaded files** matching the current repo (filters by repo name in filename)
   - When running from `rhdh` repo, also processes `backstage` and `community-plugins` files
3. **For backstage/community-plugins files deployed from rhdh:**
   - **Copies JSON files** to `rhdh/translations/` with format: `<repo_name>-<timestamp>-<locale>.json`
   - Example: `backstage-2026-01-08-fr.json`, `community-plugins-2025-12-05-fr.json`
4. **Locates plugin translation directories**:
   - `rhdh-plugins`: `workspaces/*/plugins/*/src/translations/`
   - `community-plugins`: `workspaces/*/plugins/*/src/translations/`
   - `rhdh`: Intelligently searches for plugins in:
     - `packages/app/src/translations/{plugin}/` (standard)
     - `packages/app/src/components/{plugin}/translations/` (alternative, e.g., catalog)
     - Searches for existing reference files to determine correct path
5. **Deploys TS files** to appropriate locations:
   - Standard deployment: `rhdh/translations/{plugin}/` for backstage/community-plugins files
   - Red Hat owned plugins: Also deploys to `community-plugins/workspaces/{workspace}/plugins/{plugin}/src/translations/`
6. **Updates existing files** (e.g., `it.ts`) with new translations
7. **Creates new files** (e.g., `ja.ts`) for plugins that don't have them
8. **Detects filename patterns** for rhdh plugin overrides:
   - Checks existing files to determine pattern: `{lang}.ts` or `{plugin}-{lang}.ts`
   - Uses the same pattern for new files
9. **Handles import paths** correctly:
   - Local imports: `./ref` or `./translations`
   - External imports: `@backstage/plugin-*/alpha` (for rhdh repo)

**Output:**

- **JSON files** copied to `rhdh/translations/` (for backstage/community-plugins files)
- **Updated/created TypeScript files** in plugin translation directories
- **Red Hat owned plugins** deployed to both rhdh and community-plugins repos
- Files maintain proper TypeScript format with correct imports
- All translations registered in `index.ts` files

**Red Hat Owned Plugin Deployment:**

When deploying from `rhdh` repo with `backstage` or `community-plugins` JSON files, the command automatically:

1. Detects if a plugin exists in the community-plugins repo (Red Hat owned)
2. Deploys TS files to both:
   - `rhdh/translations/{plugin}/` (standard)
   - `community-plugins/workspaces/{workspace}/plugins/{plugin}/src/translations/` (additional)
3. Allows you to create PRs in community-plugins repo with the deployed translations

**Prerequisites:**

- Community-plugins repo cloned locally (sibling directory or set `COMMUNITY_PLUGINS_REPO_PATH` env var)

### Step 6: Verify Deployment

After deployment, verify that translations are correctly integrated:

1. **Check file syntax**:

   ```bash
   # In each repo, check for TypeScript errors
   yarn tsc --noEmit
   ```

2. **Verify imports**:

   - Ensure all import paths are correct
   - Check that `./ref` or external package imports exist

3. **Test in application**:
   - Build and run the application
   - Switch language settings
   - Verify translations appear correctly

## Complete Workflow Example (All 3 Repos)

Here's a complete example workflow for all three repositories:

```bash
# 1. Setup (one-time)
source ~/.memsourcerc

# 2. Generate reference files for all repos
cd /path/to/rhdh-plugins && translations-cli i18n generate
cd /path/to/community-plugins && translations-cli i18n generate
cd /path/to/rhdh && translations-cli i18n generate

# 3. Upload all reference files
cd /path/to/rhdh-plugins && translations-cli i18n upload
cd /path/to/community-plugins && translations-cli i18n upload
cd /path/to/rhdh && translations-cli i18n upload

# 4. Wait for translations in Memsource UI...

# 5. Download all translations to shared location
mkdir -p ~/translations/downloads
cd /path/to/rhdh-plugins
translations-cli i18n download --output-dir ~/translations/downloads

# 6. Deploy to each repo
cd /path/to/rhdh-plugins
translations-cli i18n deploy --source-dir ~/translations/downloads

cd /path/to/community-plugins
translations-cli i18n deploy --source-dir ~/translations/downloads

cd /path/to/rhdh
translations-cli i18n deploy --source-dir ~/translations/downloads

# 7. Verify
cd /path/to/rhdh-plugins && yarn tsc --noEmit
cd /path/to/community-plugins && yarn tsc --noEmit
cd /path/to/rhdh && yarn tsc --noEmit
```

## Troubleshooting

### "memsource CLI not found"

- Ensure `memsource` CLI is installed
- Check that `~/.memsourcerc` is sourced: `source ~/.memsourcerc`

### "MEMSOURCE_TOKEN not found"

- Source `~/.memsourcerc`: `source ~/.memsourcerc`
- Verify token: `echo $MEMSOURCE_TOKEN`

### "tsx not found" (deploy command)

- Install tsx: `npm install -g tsx` or `yarn add -D tsx`

### "No translation files found"

- Ensure you've run the download command first
- Check that files exist in the source directory
- Verify file names end with `.json`

### "Plugin not found" during deploy

- Ensure plugin translation directories exist
- Check that plugin names match between downloaded files and workspace structure
