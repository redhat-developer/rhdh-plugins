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

The script searches for plugins using repo-specific patterns:

- **rhdh-plugins/community-plugins**: `workspaces/*/plugins/{plugin}/src/translations/`
- **rhdh**: `packages/app/src/translations/{plugin}/` or flat structure

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
