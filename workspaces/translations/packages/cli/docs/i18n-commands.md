# i18n Translation Commands Guide

This guide provides comprehensive documentation for using the translations-cli i18n commands to manage translations in your projects.

## Table of Contents

- [Prerequisites](#prerequisites) ⚠️ **Required setup before using CLI**
- [Available Commands](#available-commands)
- [Configuration](#configuration)
- [Recommended Workflow](#recommended-workflow) ⭐ **Start here for best practices**
- [Complete Translation Workflow](#complete-translation-workflow)
- [Step-by-Step Usage](#step-by-step-usage)
- [Quick Start](#quick-start)
- [Command Reference](#command-reference)

---

## Prerequisites

Before using the translations-cli, you need to set up Memsource authentication. This is a **required prerequisite** for upload and download operations.

### 1. Request Memsource Account

Request a Memsource account from the localization team.

### 2. Install Memsource CLI Client

Install the unofficial Memsource CLI client:

**Using pip:**

```bash
pip install memsource-cli-client
```

For detailed installation instructions, see: https://github.com/unofficial-memsource/memsource-cli-client#pip-install

### 3. Configure Memsource Client

You have two options to configure Memsource authentication:

#### Option A: Automated Setup (Recommended)

Use the CLI's built-in setup command to automatically create the configuration file:

```bash
# Interactive setup (will prompt for credentials)
npx translations-cli i18n setup-memsource

# Or provide credentials directly
npx translations-cli i18n setup-memsource \
  --username your-username \
  --password your-password \
  --memsource-venv "${HOME}/git/memsource-cli-client/.memsource/bin/activate"
```

This creates `~/.memsourcerc` in the exact format specified by the localization team.

#### Option B: Manual Setup

Create `~/.memsourcerc` file in your home directory manually:

```bash
vi ~/.memsourcerc
```

Paste the following content (replace `username` and `password` with your credentials):

```bash
source ${HOME}/git/memsource-cli-client/.memsource/bin/activate

export MEMSOURCE_URL="https://cloud.memsource.com/web"
export MEMSOURCE_USERNAME=username
export MEMSOURCE_PASSWORD=password
export MEMSOURCE_TOKEN=$(memsource auth login --user-name $MEMSOURCE_USERNAME --password "${MEMSOURCE_PASSWORD}" -c token -f value)
```

**Note:** Adjust the `source` path to match your Memsource CLI installation location.

For detailed configuration instructions (including macOS), see: https://github.com/unofficial-memsource/memsource-cli-client#configuration-red-hat-enterprise-linux-derivatives

### 4. Source the Configuration

Before running translation commands, source the configuration file:

```bash
source ~/.memsourcerc
```

This sets up the Memsource environment and generates the authentication token automatically.

**💡 Tip:** You can add `source ~/.memsourcerc` to your `~/.zshrc` or `~/.bashrc` to automatically load it in new terminal sessions.

---

**📝 Note:** The `i18n setup-memsource` command is a **one-time setup utility** and is not part of the regular translation workflow. After initial setup, you'll primarily use the workflow commands listed below.

---

## Available Commands

### Workflow Commands

These are the commands you'll use regularly in your translation workflow:

#### 1. `i18n init` - Initialize Configuration

Creates a default configuration file (`.i18n.config.json`) in your project root.

#### 2. `i18n generate` - Extract Translation Keys

Scans your source code and generates a reference translation file containing all translatable strings.

#### 3. `i18n upload` - Upload to TMS

Uploads the reference translation file to your Translation Management System (TMS) for translation.

#### 4. `i18n download` - Download Translations

Downloads completed translations from your TMS.

#### 5. `i18n deploy` - Deploy to Application

Deploys downloaded translations back to your application's locale files.

#### 6. `i18n status` - Check Status

Shows translation completion status and statistics across all languages.

#### 7. `i18n clean` - Cleanup

Removes temporary files, caches, and backup directories.

#### 8. `i18n sync` - All-in-One Workflow

Runs the complete workflow: generate → upload → download → deploy in one command.

### Setup/Utility Commands

These commands are for one-time setup or maintenance tasks:

#### `i18n setup-memsource` - Set Up Memsource Configuration ⚙️ **One-Time Setup**

Creates `.memsourcerc` file following the localization team's instructions format. This is a **prerequisite setup command** that should be run once before using the workflow commands.

**Note:** This command is documented in detail in the [Prerequisites](#prerequisites) section above. It's listed here for reference, but you should complete the setup before using the workflow commands.

---

## Configuration

The CLI uses a **project configuration file** for project-specific settings, and **Memsource authentication** (via `~/.memsourcerc`) for personal credentials:

1. **Project Config** (`.i18n.config.json`) - Project-specific settings that can be committed
2. **Memsource Auth** (`~/.memsourcerc`) - Personal credentials (primary method, see [Prerequisites](#prerequisites))
3. **Fallback Auth** (`~/.i18n.auth.json`) - Optional fallback if not using `.memsourcerc`

### Initialize Configuration Files

Initialize the project configuration file with:

```bash
npx translations-cli i18n init
```

This creates:

#### 1. Project Configuration (`.i18n.config.json`)

Located in your project root. **This file can be committed to git.**

```json
{
  "tms": {
    "url": "",
    "projectId": ""
  },
  "directories": {
    "sourceDir": "src",
    "outputDir": "i18n",
    "localesDir": "src/locales"
  },
  "languages": [],
  "format": "json",
  "patterns": {
    "include": "**/*.{ts,tsx,js,jsx}",
    "exclude": "**/node_modules/**,**/dist/**,**/build/**,**/*.test.ts,**/*.spec.ts"
  }
}
```

**Contains:**

- TMS URL (project-specific)
- Project ID (project-specific)
- Directory paths (project-specific)
- Languages (project-specific)
- Format (project-specific)
- File patterns (project-specific) - for scanning source files

#### 2. Memsource Authentication (`~/.memsourcerc`) - **Primary Method**

Located in your home directory. **This file should NOT be committed to git.**

This is the **recommended authentication method** following the localization team's instructions. See [Prerequisites](#prerequisites) for setup instructions.

**Contains:**

- Memsource virtual environment activation
- `MEMSOURCE_URL` environment variable
- `MEMSOURCE_USERNAME` environment variable
- `MEMSOURCE_PASSWORD` environment variable
- `MEMSOURCE_TOKEN` (automatically generated)

**Usage:**

```bash
source ~/.memsourcerc
translations-cli i18n upload --source-file i18n/reference.json
```

#### 3. Fallback Authentication (`~/.i18n.auth.json`) - **Optional**

Located in your home directory. **This file should NOT be committed to git.**

Only needed if you're not using `.memsourcerc`. The CLI will create this file if `.memsourcerc` doesn't exist when you run `init`.

```json
{
  "tms": {
    "username": "",
    "password": "",
    "token": ""
  }
}
```

**⚠️ Important:** Add both `~/.memsourcerc` and `~/.i18n.auth.json` to your global `.gitignore`:

```bash
echo ".memsourcerc" >> ~/.gitignore_global
echo ".i18n.auth.json" >> ~/.gitignore_global
git config --global core.excludesfile ~/.gitignore_global
```

### Environment Variables

You can also configure settings using environment variables (these override config file values):

**Project Settings:**

```bash
export I18N_TMS_URL="https://your-tms-api.com"
export I18N_TMS_PROJECT_ID="your-project-id"
export I18N_LANGUAGES="es,fr,de,ja,zh"
export I18N_FORMAT="json"
export I18N_SOURCE_DIR="src"
export I18N_OUTPUT_DIR="i18n"
export I18N_LOCALES_DIR="src/locales"
```

**Personal Authentication:**

```bash
export I18N_TMS_TOKEN="your-api-token"
export I18N_TMS_USERNAME="your-username"
export I18N_TMS_PASSWORD="your-password"
```

**Backward Compatibility with Memsource CLI:**

The CLI also supports `MEMSOURCE_*` environment variables for compatibility with existing Memsource CLI setups:

```bash
export MEMSOURCE_URL="https://cloud.memsource.com/web"
export MEMSOURCE_USERNAME="your-username"
export MEMSOURCE_PASSWORD="your-password"
export MEMSOURCE_TOKEN="your-token"  # Optional - will be auto-generated if username/password are provided
```

**Automatic Token Generation:**

If you provide `username` and `password` but no `token`, the CLI will automatically attempt to generate a token using the Memsource CLI (`memsource auth login`). This replicates the behavior of your `.memsourcerc` file:

```bash
# If memsource CLI is installed and activated, token will be auto-generated
export MEMSOURCE_USERNAME="your-username"
export MEMSOURCE_PASSWORD="your-password"
# Token will be generated automatically: memsource auth login --user-name $USERNAME --password "$PASSWORD" -c token -f value
```

### Configuration Priority

Configuration values are resolved in the following order (highest to lowest priority):

1. **Command-line options** (highest priority)
2. **Environment variables**
3. **Personal auth file** (`~/.i18n.auth.json`) - for credentials
4. **Project config file** (`.i18n.config.json`) - for project settings
5. **Default values** (lowest priority)

This means:

- **Project settings** (URL, project ID, directories, languages) come from `.i18n.config.json`
- **Personal credentials** (username, password, token) come from `~/.i18n.auth.json`
- Both can be overridden by environment variables or command-line options

---

## Output Format

### Generated Reference File Structure

The `generate` command creates a `reference.json` file with a nested structure organized by plugin:

```json
{
  "plugin-name": {
    "en": {
      "key": "value",
      "nested.key": "value"
    }
  },
  "another-plugin": {
    "en": {
      "key": "value"
    }
  }
}
```

**Structure Details:**

- **Top level**: Plugin names (detected from file paths or workspace structure)
- **Second level**: Language code (`en` for English reference)
- **Third level**: Translation keys and their English values

**Plugin Name Detection:**

- For workspace structure: `workspaces/{workspace}/plugins/{plugin}/...` → uses `{plugin}`
- For non-workspace structure: `.../translations/{plugin}/ref.ts` → uses `{plugin}` (folder name)
- Fallback: Uses parent directory name if no pattern matches

**After Generation:**
The command outputs a summary table showing:

- Each plugin included
- Number of keys per plugin
- Total plugins and keys

Example output:

```
📋 Included Plugins Summary:
────────────────────────────────────────────────────────────
  • adoption-insights           45 keys
  • global-header               32 keys
  • topology                   276 keys
────────────────────────────────────────────────────────────
  Total: 3 plugins, 353 keys
```

---

## Recommended Workflow

### For Memsource Users (Recommended)

**The recommended workflow is to source `.memsourcerc` first, then use CLI commands:**

```bash
# 1. One-time setup (first time only)
npx translations-cli i18n setup-memsource
source ~/.memsourcerc

# 2. Daily usage (in each new shell session)
source ~/.memsourcerc  # Sets MEMSOURCE_TOKEN in environment
npx translations-cli i18n generate
npx translations-cli i18n upload --source-file i18n/reference.json
npx translations-cli i18n download
npx translations-cli i18n deploy
```

**Why this workflow?**

- ✅ `.memsourcerc` sets `MEMSOURCE_TOKEN` in your environment
- ✅ CLI automatically reads from environment variables (highest priority)
- ✅ No redundant token generation needed
- ✅ Follows localization team's standard workflow
- ✅ Most efficient and reliable

**Pro Tip**: Add to your shell profile to auto-source:

```bash
echo "source ~/.memsourcerc" >> ~/.zshrc  # or ~/.bashrc
```

### For Other TMS Users

```bash
# 1. One-time setup
npx translations-cli i18n init
# Edit ~/.i18n.auth.json with your credentials

# 2. Daily usage
npx translations-cli i18n generate
npx translations-cli i18n upload --source-file i18n/reference.json
npx translations-cli i18n download
npx translations-cli i18n deploy
```

---

## Complete Translation Workflow

The typical translation workflow consists of four main steps:

```
┌─────────────┐
│  1. Generate │  Extract translation keys from source code
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  2. Upload  │  Send reference file to TMS for translation
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 3. Download │  Get completed translations from TMS
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  4. Deploy  │  Update application locale files
└─────────────┘
```

---

## Step-by-Step Usage

### Option A: Step-by-Step Workflow

#### Step 1: Initialize Configuration (First Time Only)

```bash
# Basic initialization
npx translations-cli i18n init

# Or initialize with Memsource setup (recommended for Memsource users)
npx translations-cli i18n init --setup-memsource
```

**For Memsource Users:**

If you haven't completed the Memsource setup yet, see the [Prerequisites](#prerequisites) section above for detailed setup instructions.

**Important**: After creating `.memsourcerc` (via `i18n setup-memsource` or manually), you must source it before using CLI commands:

```bash
# Source the file to set MEMSOURCE_TOKEN in your environment
source ~/.memsourcerc

# Now you can use CLI commands - they'll automatically use MEMSOURCE_TOKEN
npx translations-cli i18n generate
```

**For convenience**, add it to your shell profile so it's automatically sourced:

```bash
echo "source ~/.memsourcerc" >> ~/.zshrc  # or ~/.bashrc
```

**Why this matters**: When you source `.memsourcerc`, it sets `MEMSOURCE_TOKEN` in your environment. The CLI reads this automatically (environment variables have high priority), so you don't need to provide credentials each time.

Edit `.i18n.config.json` with your project settings (TMS URL, project ID, languages).

#### Step 2: Generate Translation Reference File

```bash
npx translations-cli i18n generate \
  --source-dir src \
  --output-dir i18n \
  --format json
```

**Options:**

- `--source-dir`: Source directory to scan (default: `src`, can be set in config)
- `--output-dir`: Output directory for generated files (default: `i18n`, can be set in config)
- `--format`: Output format - `json` or `po` (default: `json`, can be set in config)
- `--include-pattern`: File pattern to include (default: `**/*.{ts,tsx,js,jsx}`, can be set in config)
- `--exclude-pattern`: File pattern to exclude (default: `**/node_modules/**`, can be set in config)
- `--extract-keys`: Extract translation keys from source code (default: `true`)
- `--merge-existing`: Merge with existing translation files (default: `false`)

**Output Format:**
The generated `reference.json` file uses a nested structure organized by plugin:

```json
{
  "plugin-name": {
    "en": {
      "key": "value",
      "nested.key": "value"
    }
  },
  "another-plugin": {
    "en": {
      "key": "value"
    }
  }
}
```

**File Detection:**
The CLI automatically detects English reference files by looking for:

- `createTranslationRef` imports from `@backstage/core-plugin-api/alpha` or `@backstage/frontend-plugin-api`
- `createTranslationMessages` imports (for overriding/extending existing translations)
- `createTranslationResource` imports (for setting up translation resources)
- Files are excluded if they match language file patterns (e.g., `de.ts`, `es.ts`, `fr.ts`)

**After Generation:**
The command outputs a summary showing:

- Total number of plugins included
- Total number of keys extracted
- A detailed list of each plugin with its key count

**💡 Tip:** For monorepos or projects with custom file structures, configure patterns in `.i18n.config.json`:

```json
{
  "directories": {
    "sourceDir": ".",
    "outputDir": "i18n"
  },
  "patterns": {
    "include": "**/*.{ts,tsx}",
    "exclude": "**/node_modules/**,**/dist/**,**/build/**,**/*.test.ts,**/*.spec.ts"
  }
}
```

Then run without passing patterns:

```bash
npx translations-cli i18n generate
```

#### Step 3: Upload to TMS

```bash
npx translations-cli i18n upload \
  --tms-url https://your-tms-api.com \
  --tms-token YOUR_API_TOKEN \
  --project-id YOUR_PROJECT_ID \
  --source-file i18n/reference.json \
  --target-languages "es,fr,de,ja,zh"
```

**Options:**

- `--tms-url`: TMS API URL (can be set in config)
- `--tms-token`: TMS API token (can be set in config, or from `~/.memsourcerc` via `MEMSOURCE_TOKEN`)
- `--project-id`: TMS project ID (can be set in config)
- `--source-file`: Source translation file to upload (required)
- `--target-languages`: Comma-separated list of target languages (required, or set in config `languages` array)
- `--upload-filename`: Custom filename for the uploaded file (default: auto-generated as `{repo-name}-reference-{YYYY-MM-DD}.json`)
- `--force`: Force upload even if file hasn't changed (bypasses cache check)
- `--dry-run`: Show what would be uploaded without actually uploading

**Upload Filename:**
The CLI automatically generates unique filenames for uploads to prevent overwriting files in your TMS project:

- Format: `{repo-name}-reference-{YYYY-MM-DD}.json`
- Example: `rhdh-plugins-reference-2025-11-25.json`
- The repo name is detected from your git remote URL or current directory name
- You can override with `--upload-filename` if needed

**Caching:**
The CLI caches uploads to avoid re-uploading unchanged files:

- Cache is stored in `.i18n-cache/` directory
- Cache tracks file content hash and upload filename
- Use `--force` to bypass cache and upload anyway
- Cache is automatically checked before each upload

#### Step 4: Download Translations (After Translation is Complete)

```bash
npx translations-cli i18n download \
  --tms-url https://your-tms-api.com \
  --tms-token YOUR_API_TOKEN \
  --project-id YOUR_PROJECT_ID \
  --output-dir i18n \
  --languages "es,fr,de,ja,zh" \
  --format json
```

**Options:**

- `--tms-url`: TMS API URL (can be set in config)
- `--tms-token`: TMS API token (can be set in config)
- `--project-id`: TMS project ID (can be set in config)
- `--output-dir`: Output directory for downloaded translations (default: `i18n`)
- `--languages`: Comma-separated list of languages to download
- `--format`: Download format - `json` or `po` (default: `json`)
- `--include-completed`: Include completed translations only (default: `true`)
- `--include-draft`: Include draft translations (default: `false`)

#### Step 5: Deploy Translations to Application

```bash
npx translations-cli i18n deploy \
  --source-dir i18n \
  --target-dir src/locales \
  --languages "es,fr,de,ja,zh" \
  --format json \
  --backup \
  --validate
```

**Options:**

- `--source-dir`: Source directory containing downloaded translations (default: `i18n`)
- `--target-dir`: Target directory for language files (default: `src/locales`)
- `--languages`: Comma-separated list of languages to deploy
- `--format`: Input format - `json` or `po` (default: `json`)
- `--backup`: Create backup of existing language files (default: `true`)
- `--validate`: Validate translations before deploying (default: `true`)

### Option B: All-in-One Sync Command

For a complete workflow in one command:

```bash
npx translations-cli i18n sync \
  --source-dir src \
  --output-dir i18n \
  --locales-dir src/locales \
  --tms-url https://your-tms-api.com \
  --tms-token YOUR_API_TOKEN \
  --project-id YOUR_PROJECT_ID \
  --languages "es,fr,de,ja,zh"
```

**Options:**

- All options from individual commands
- `--skip-upload`: Skip upload step
- `--skip-download`: Skip download step
- `--skip-deploy`: Skip deploy step
- `--dry-run`: Show what would be done without executing

---

## Quick Start

### For a Typical Repository

#### 1. Complete Prerequisites (One-Time Setup)

**For Memsource Users:**

If you haven't completed the Memsource setup yet, follow the [Prerequisites](#prerequisites) section above:

```bash
# Complete the one-time setup (see Prerequisites section for details)
npx translations-cli i18n setup-memsource
source ~/.memsourcerc
```

#### 2. Initialize Project Configuration

```bash
# Initialize project configuration file
npx translations-cli i18n init
```

**For Memsource Users (Daily Workflow):**

1. **One-time setup** (already completed in Prerequisites):

   ```bash
   npx translations-cli i18n setup-memsource
   source ~/.memsourcerc
   ```

2. **Daily usage** (in each new shell):

   ```bash
   # Always source .memsourcerc first to set MEMSOURCE_TOKEN
   source ~/.memsourcerc

   # Then use CLI commands - they'll automatically use MEMSOURCE_TOKEN from environment
   npx translations-cli i18n generate
   npx translations-cli i18n upload --source-file i18n/reference.json
   ```

   **Why source first?** The `.memsourcerc` file sets `MEMSOURCE_TOKEN` in your environment. The CLI reads this automatically, avoiding redundant token generation.

3. **Optional**: Add to shell profile for automatic sourcing:
   ```bash
   echo "source ~/.memsourcerc" >> ~/.zshrc  # or ~/.bashrc
   ```

**For Other TMS Users:**
Edit `.i18n.config.json` with your TMS credentials, or set environment variables:

```bash
export I18N_TMS_URL="https://your-tms-api.com"
export I18N_TMS_TOKEN="your-api-token"
export I18N_TMS_PROJECT_ID="your-project-id"
export I18N_LANGUAGES="es,fr,de,ja,zh"
```

#### 2. Generate Reference File

```bash
npx translations-cli i18n generate
```

#### 3. Upload to TMS

```bash
npx translations-cli i18n upload --source-file i18n/reference.json
```

#### 4. Download Translations (After Translation is Complete)

```bash
npx translations-cli i18n download
```

#### 5. Deploy to Application

```bash
npx translations-cli i18n deploy
```

---

## Utility Commands

### Check Translation Status

```bash
npx translations-cli i18n status \
  --source-dir src \
  --i18n-dir i18n \
  --locales-dir src/locales \
  --format table
```

**Options:**

- `--source-dir`: Source directory to analyze (default: `src`)
- `--i18n-dir`: i18n directory to analyze (default: `i18n`)
- `--locales-dir`: Locales directory to analyze (default: `src/locales`)
- `--format`: Output format - `table` or `json` (default: `table`)
- `--include-stats`: Include detailed statistics (default: `true`)

**Output includes:**

- Total translation keys
- Languages configured
- Overall completion percentage
- Per-language completion status
- Missing keys
- Extra keys (keys in language files but not in reference)

### Clean Up Temporary Files

```bash
npx translations-cli i18n clean \
  --i18n-dir i18n \
  --force
```

**Options:**

- `--i18n-dir`: i18n directory to clean (default: `i18n`)
- `--cache-dir`: Cache directory to clean (default: `.i18n-cache`)
- `--backup-dir`: Backup directory to clean (default: `.i18n-backup`)
- `--force`: Force cleanup without confirmation (default: `false`)

---

## Command Reference

### Configuration Priority

When using commands, values are resolved in this order:

1. **Command-line options** (highest priority)
2. **Environment variables** (prefixed with `I18N_`)
3. **Config file** (`.i18n.config.json`)
4. **Default values** (lowest priority)

### Example: Using Config with Overrides

```bash
# Config file has: tms.url = "https://default-tms.com"
# Environment has: I18N_TMS_URL="https://env-tms.com"
# Command uses: --tms-url "https://override-tms.com"

# Result: Uses "https://override-tms.com" (command-line wins)
npx translations-cli i18n upload --tms-url "https://override-tms.com"
```

### Environment Variables Reference

| Variable               | Description                          | Example                           | Config File      |
| ---------------------- | ------------------------------------ | --------------------------------- | ---------------- |
| `I18N_TMS_URL`         | TMS API URL                          | `https://tms.example.com`         | Project          |
| `I18N_TMS_PROJECT_ID`  | TMS project ID                       | `project-123`                     | Project          |
| `I18N_LANGUAGES`       | Comma-separated languages            | `es,fr,de,ja,zh`                  | Project          |
| `I18N_FORMAT`          | File format                          | `json` or `po`                    | Project          |
| `I18N_SOURCE_DIR`      | Source directory                     | `src`                             | Project          |
| `I18N_OUTPUT_DIR`      | Output directory                     | `i18n`                            | Project          |
| `I18N_LOCALES_DIR`     | Locales directory                    | `src/locales`                     | Project          |
| `I18N_INCLUDE_PATTERN` | File pattern to include              | `**/*.{ts,tsx,js,jsx}`            | Project (config) |
| `I18N_EXCLUDE_PATTERN` | File pattern to exclude              | `**/node_modules/**`              | Project (config) |
| `I18N_TMS_TOKEN`       | TMS API token                        | `your-api-token`                  | Personal Auth    |
| `I18N_TMS_USERNAME`    | TMS username                         | `your-username`                   | Personal Auth    |
| `I18N_TMS_PASSWORD`    | TMS password                         | `your-password`                   | Personal Auth    |
| `MEMSOURCE_URL`        | Memsource URL (backward compat)      | `https://cloud.memsource.com/web` | Project          |
| `MEMSOURCE_TOKEN`      | Memsource token (backward compat)    | `your-token`                      | Personal Auth    |
| `MEMSOURCE_USERNAME`   | Memsource username (backward compat) | `your-username`                   | Personal Auth    |
| `MEMSOURCE_PASSWORD`   | Memsource password (backward compat) | `your-password`                   | Personal Auth    |

---

## Best Practices

1. **Separate Project and Personal Config**:

   - Store project settings in `.i18n.config.json` (can be committed)
   - Store personal credentials in `~/.i18n.auth.json` (should NOT be committed)
   - Add `~/.i18n.auth.json` to your global `.gitignore`

2. **Version Control**:

   - Commit `.i18n.config.json` with project-specific settings
   - Never commit `~/.i18n.auth.json` (contains personal credentials)
   - Use environment variables or CI/CD secrets for credentials in CI/CD pipelines

3. **Backup Before Deploy**: Always use `--backup` when deploying translations to preserve existing files.

4. **Validate Translations**: Use `--validate` to catch issues before deploying.

5. **Check Status Regularly**: Run `i18n status` to monitor translation progress.

6. **Clean Up**: Periodically run `i18n clean` to remove temporary files.

---

## Troubleshooting

### Missing TMS Configuration

If you get errors about missing TMS configuration:

**For Memsource Users:**

1. Make sure you've sourced `.memsourcerc`:
   ```bash
   source ~/.memsourcerc
   # Verify token is set
   echo $MEMSOURCE_TOKEN
   ```
2. If `.memsourcerc` doesn't exist, create it:
   ```bash
   npx translations-cli i18n setup-memsource
   source ~/.memsourcerc
   ```

**For Other TMS Users:**

1. Run `npx translations-cli i18n init` to create both config files
2. Edit `.i18n.config.json` with project settings (TMS URL, project ID)
3. Edit `~/.i18n.auth.json` with your personal credentials (username, password, token)
4. Or set environment variables: `I18N_TMS_URL`, `I18N_TMS_PROJECT_ID`, `I18N_TMS_TOKEN`

### Translation Keys Not Found

If translation keys aren't being extracted:

1. Check `--include-pattern` matches your file types
2. Verify source files contain one of these patterns:
   - `import { createTranslationRef } from '@backstage/core-plugin-api/alpha'`
   - `import { createTranslationMessages } from '@backstage/core-plugin-api/alpha'`
   - `import { createTranslationResource } from '@backstage/core-plugin-api/alpha'`
   - Or from `@backstage/frontend-plugin-api`
3. Check `--exclude-pattern` isn't excluding your source files
4. Ensure files are English reference files (not `de.ts`, `es.ts`, `fr.ts`, etc.)
5. For monorepos, verify your `sourceDir` and patterns are configured correctly

### File Format Issues

If you encounter format errors:

1. Ensure `--format` matches your file extensions (`.json` or `.po`)
2. Validate files with `i18n status` before deploying
3. Check TMS supports the format you're using

---

## Examples

### Example 1: Recommended Workflow for Memsource Users

```bash
# 1. One-time setup
npx translations-cli i18n setup-memsource
source ~/.memsourcerc

# 2. Daily usage (in each new shell, source first)
source ~/.memsourcerc  # Sets MEMSOURCE_TOKEN automatically

# 3. Use CLI commands - they automatically use MEMSOURCE_TOKEN from environment
npx translations-cli i18n generate
npx translations-cli i18n upload --source-file i18n/reference.json
npx translations-cli i18n download
npx translations-cli i18n deploy
```

### Example 2: Basic Workflow with Config Files (Other TMS)

```bash
# 1. Initialize config files
npx translations-cli i18n init

# 2. Edit .i18n.config.json with project settings (TMS URL, project ID, languages)
# 3. Edit ~/.i18n.auth.json with your credentials (username, password, token)

# 4. Generate (uses config defaults)
npx translations-cli i18n generate

# 5. Upload (uses config defaults)
npx translations-cli i18n upload --source-file i18n/reference.json

# 6. Download (uses config defaults)
npx translations-cli i18n download

# 7. Deploy (uses config defaults)
npx translations-cli i18n deploy
```

### Example 3: Monorepo Setup with Config Patterns

For monorepos or projects where you want to scan from the repo root:

```bash
# 1. Initialize config in repo root
cd /path/to/your/repo
npx translations-cli i18n init

# 2. Edit .i18n.config.json for monorepo scanning
```

```json
{
  "tms": {
    "url": "https://your-tms-api.com",
    "projectId": "your-project-id"
  },
  "directories": {
    "sourceDir": ".",
    "outputDir": "i18n",
    "localesDir": "src/locales"
  },
  "languages": ["es", "fr", "de", "ja", "zh"],
  "format": "json",
  "patterns": {
    "include": "**/*.{ts,tsx}",
    "exclude": "**/node_modules/**,**/dist/**,**/build/**,**/*.test.ts,**/*.spec.ts"
  }
}
```

```bash
# 3. Run generate - patterns are automatically used from config
npx translations-cli i18n generate

# No need to pass --include-pattern or --exclude-pattern every time!
# The command will scan from repo root (.) and find all reference files
```

This is especially useful when:

- Working with monorepos (multiple workspaces/plugins)
- Reference files are in different locations (e.g., `src/translations/ref.ts`, `plugins/*/src/translations/ref.ts`)
- You want project-specific patterns that can be committed to git

### Example 4: Using Environment Variables

```bash
# Set environment variables (project settings)
export I18N_TMS_URL="https://tms.example.com"
export I18N_TMS_PROJECT_ID="proj456"
export I18N_LANGUAGES="es,fr,de"

# Set environment variables (personal credentials)
export I18N_TMS_TOKEN="token123"
# Or use username/password:
# export I18N_TMS_USERNAME="your-username"
# export I18N_TMS_PASSWORD="your-password"

# Commands will use these values
npx translations-cli i18n generate
npx translations-cli i18n upload --source-file i18n/reference.json
npx translations-cli i18n download
npx translations-cli i18n deploy
```

### Example 4: Override Config with Command Options

```bash
# Config has default languages: ["es", "fr"]
# Override for this command only
npx translations-cli i18n download --languages "es,fr,de,ja,zh"
```

### Example 5: Complete Sync Workflow

```bash
# Run entire workflow in one command
npx translations-cli i18n sync \
  --languages "es,fr,de,ja,zh" \
  --tms-url "https://tms.example.com" \
  --tms-token "token123" \
  --project-id "proj456"
```

---

## Additional Resources

- For help with any command: `npx translations-cli i18n [command] --help`
- Check translation status: `npx translations-cli i18n status`
- Clean up files: `npx translations-cli i18n clean --force`

---

## Summary

The translations-cli i18n commands provide a complete solution for managing translations:

- ✅ Extract translation keys from source code
- ✅ Upload to Translation Management Systems
- ✅ Download completed translations
- ✅ Deploy translations to your application
- ✅ Monitor translation status
- ✅ Configure defaults via config file or environment variables
- ✅ Override settings per command as needed

Start with `npx translations-cli i18n init` to set up your configuration, then use the commands as needed for your translation workflow.
