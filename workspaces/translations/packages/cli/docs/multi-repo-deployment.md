# Multi-Repository Translation Deployment

The CLI commands are **universal** and work for all three repositories: `rhdh-plugins`, `community-plugins`, and `rhdh`.

## How It Works

The deployment script automatically:

1. **Detects the repository type** based on directory structure
2. **Finds downloaded translation files** matching the current repo (no hardcoded dates)
3. **Locates plugin translation directories** using repo-specific patterns
4. **Handles different file naming conventions** per repo

## Repository Structures Supported

### 1. rhdh-plugins

- **Structure**: `workspaces/*/plugins/*/src/translations/`
- **Files**: `{lang}.ts` (e.g., `it.ts`, `ja.ts`)
- **Example**: `workspaces/adoption-insights/plugins/adoption-insights/src/translations/it.ts`

### 2. community-plugins

- **Structure**: `workspaces/*/plugins/*/src/translations/`
- **Files**: `{lang}.ts` (e.g., `it.ts`, `ja.ts`)
- **Example**: `workspaces/rbac/plugins/rbac/src/translations/it.ts`

### 3. rhdh

- **Structure**: `packages/app/src/translations/{plugin}/` or flat `packages/app/src/translations/`
- **Files**: `{lang}.ts` or `{plugin}-{lang}.ts` (e.g., `it.ts` or `user-settings-it.ts`)
- **Example**: `packages/app/src/translations/user-settings/user-settings-it.ts`

## Usage

### Step 1: Download translations (same for all repos)

From any of the three repositories:

```bash
# Download all completed jobs
translations-cli i18n download

# Or download specific job IDs
translations-cli i18n download --job-ids "13,14,16,17,19,20"

# Or download specific languages
translations-cli i18n download --languages "it,ja"
```

**Note**: Downloaded files are named with repo prefix:

- `rhdh-plugins-reference-*-{lang}-C.json`
- `community-plugins-reference-*-{lang}-C.json`
- `rhdh-reference-*-{lang}-C.json`

### Step 2: Deploy translations (same command, different repos)

The deploy command automatically detects which repo you're in and processes only the relevant files:

#### For rhdh-plugins:

```bash
cd /path/to/rhdh-plugins
translations-cli i18n deploy
```

#### For community-plugins:

```bash
cd /path/to/community-plugins
translations-cli i18n deploy
```

#### For rhdh:

```bash
cd /path/to/rhdh
translations-cli i18n deploy
# Or from shared location:
translations-cli i18n deploy --source-dir ~/translations/downloads
```

**Special Feature: Deploying backstage/community-plugins files from rhdh root**

When running the deploy command from the `rhdh` repo root, the command can also process `backstage` and `community-plugins` JSON files:

1. **JSON files are copied** to `rhdh/translations/` with format: `<repo_name>-<timestamp>-<locale>.json`

   - Example: `backstage-2026-01-08-fr.json`, `community-plugins-2025-12-05-fr.json`

2. **TS files are deployed** to `rhdh/translations/{plugin}/` for all plugins

3. **Red Hat owned plugins** (plugins that exist in community-plugins repo) are **automatically detected** and deployed to:
   - `rhdh/translations/{plugin}/` (standard deployment)
   - `community-plugins/workspaces/{workspace}/plugins/{plugin}/src/translations/` (additional deployment)

**Prerequisites for Red Hat owned plugin deployment:**

- Community-plugins repo must be cloned locally (typically as sibling directory: `../community-plugins`)
- Or set `COMMUNITY_PLUGINS_REPO_PATH` environment variable
- The plugin must exist in the community-plugins repo workspaces

**Example workflow:**

```bash
# 1. Pull latest community-plugins repo
cd /path/to/community-plugins && git pull

# 2. Deploy from rhdh root (processes rhdh, backstage, and community-plugins files)
cd /path/to/rhdh
translations-cli i18n deploy --source-dir ~/translations/downloads

# 3. Create PR in community-plugins repo with deployed TS files
cd /path/to/community-plugins
git add workspaces/*/plugins/*/src/translations/*.ts
git commit -m "Add translations for Red Hat owned plugins"
git push
```

## Complete Workflow for All Repos

### Option A: Deploy to each repo separately

```bash
# 1. Download all translations (from any repo)
cd /path/to/rhdh-plugins
translations-cli i18n download

# 2. Deploy to rhdh-plugins
translations-cli i18n deploy

# 3. Deploy to community-plugins
cd /path/to/community-plugins
translations-cli i18n deploy --source-dir /path/to/rhdh-plugins/i18n/downloads

# 4. Deploy to rhdh
cd /path/to/rhdh
translations-cli i18n deploy --source-dir /path/to/rhdh-plugins/i18n/downloads
```

### Option B: Use shared download directory

```bash
# 1. Download to a shared location
mkdir -p ~/translations/downloads
cd /path/to/rhdh-plugins
translations-cli i18n download --output-dir ~/translations/downloads

# 2. Deploy from shared location to each repo
cd /path/to/rhdh-plugins
translations-cli i18n deploy --source-dir ~/translations/downloads

cd /path/to/community-plugins
translations-cli i18n deploy --source-dir ~/translations/downloads

cd /path/to/rhdh
translations-cli i18n deploy --source-dir ~/translations/downloads
```

### Option C: Unified deployment from rhdh root (Recommended for backstage/community-plugins)

This option allows you to deploy all translations (rhdh, backstage, and community-plugins) from a single command run from the rhdh repo root. It automatically handles Red Hat owned plugins.

```bash
# 1. Pull latest community-plugins repo (for Red Hat owned plugin detection)
cd /path/to/community-plugins && git pull

# 2. Download all translations to shared location
mkdir -p ~/translations/downloads
cd /path/to/rhdh-plugins
translations-cli i18n download --output-dir ~/translations/downloads

# 3. Deploy everything from rhdh root
cd /path/to/rhdh
translations-cli i18n deploy --source-dir ~/translations/downloads

# This will:
# - Deploy rhdh translations to rhdh repo
# - Copy backstage/community-plugins JSON files to rhdh/translations/
# - Deploy backstage/community-plugins TS files to rhdh/translations/{plugin}/
# - Automatically detect and deploy Red Hat owned plugins to community-plugins workspaces

# 4. Create PR in community-plugins repo with Red Hat owned plugin translations
cd /path/to/community-plugins
git add workspaces/*/plugins/*/src/translations/*.ts
git commit -m "Add translations for Red Hat owned plugins"
git push
```

## Auto-Detection Features

### Repository Detection

The script detects the repo type by checking:

- `workspaces/` directory → `rhdh-plugins` or `community-plugins`
- `packages/app/` directory → `rhdh`

### File Detection

The script automatically finds downloaded files matching:

- Pattern: `{repo-name}-reference-*-{lang}-C.json`
- No hardcoded dates - works with any download date
- Only processes files matching the current repo

### Plugin Location

The script intelligently searches for plugins using repo-specific patterns:

- **rhdh-plugins/community-plugins**: `workspaces/*/plugins/{plugin}/src/translations/`
- **rhdh**:
  - Standard: `packages/app/src/translations/{plugin}/`
  - Alternative: `packages/app/src/components/{plugin}/translations/` (for some plugins like catalog)
  - The script searches for existing reference files (`ref.ts` or `translations.ts`) to determine the correct path

### Intelligent Path Finding

For the `rhdh` repo, the deploy command intelligently finds plugin translation directories by:

1. **Checking standard locations first**: `packages/app/src/translations/{plugin}/`
2. **Checking alternative locations**: `packages/app/src/components/{plugin}/translations/`
3. **Searching for existing reference files**: Looks for `ref.ts` or `translations.ts` files to determine where translations were originally extracted
4. **Matching plugin imports**: Verifies the plugin by checking import statements in existing language files

### Filename Pattern Detection

For plugin overrides in the `rhdh` repo, the deploy command automatically detects the correct filename pattern by checking existing files:

- If existing files use `{plugin}-{lang}.ts` (e.g., `search-it.ts`), new files use the same pattern
- If existing files use `{lang}.ts` (e.g., `fr.ts`), new files use the same pattern
- Defaults to `{plugin}-{lang}.ts` for new plugins

## Troubleshooting

### "Could not detect repository type"

- Ensure you're running the command from the repository root
- Check that `workspaces/` or `packages/` directory exists

### "No translation files found for {repo}"

- Verify downloaded files exist in the source directory
- Check that file names match pattern: `{repo}-reference-*-{lang}-C.json`
- Ensure you've run the download command first

### "Plugin not found" warnings

- Some plugins might not exist in all repos
- This is normal - the script skips missing plugins
- Check that plugin names match between downloaded files and repo structure

### Red Hat owned plugins not deploying to community-plugins

- Ensure community-plugins repo is cloned locally (typically as sibling directory: `../community-plugins`)
- Or set `COMMUNITY_PLUGINS_REPO_PATH` environment variable to the repo path
- Verify the plugin exists in `community-plugins/workspaces/*/plugins/{plugin}/`
- Check that the plugin name matches (the script automatically strips "plugin." prefix)
