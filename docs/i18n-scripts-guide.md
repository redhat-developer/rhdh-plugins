# Internationalization (i18n) Scripts Guide

This guide covers the complete workflow for managing translations in the RHDH Plugins repository using the automated i18n scripts.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Complete Workflow](#complete-workflow)
- [Script Reference](#script-reference)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

## Overview

The i18n scripts provide a complete automation solution for:

1. **Extracting** translatable messages from TypeScript source files
2. **Uploading** source messages to Translation Management System (TMS)
3. **Downloading** completed translations from TMS
4. **Deploying** translations to correct plugin directories
5. **Syncing** JSON translations with TypeScript translation files
6. **Managing** backup files and cleanup

## Prerequisites

### Required Tools

- **Node.js** (v22+)
- **jq** - JSON processor
- **memsource CLI** - TMS integration tool
- **yarn** - Package manager

### TMS Credentials Setup

Set up authentication following the [localization team instructions](https://docs.google.com/presentation/d/1qQH0Ppm8CR3QJX3CE8pcWiZQFtIvfDwDk1Y34PH-s-0/edit?usp=sharing):

Create `~/.memsourcerc` with the team's configuration:

```bash
cat > ~/.memsourcerc << 'EOF'
# Activate Memsource CLI virtual environment
source ${HOME}/git/memsource-cli-client/.memsource/bin/activate

# Set connection details
export MEMSOURCE_URL="https://cloud.memsource.com/web"
export MEMSOURCE_USERNAME="your-username"
export MEMSOURCE_PASSWORD="your-password"

# Generate token dynamically
export MEMSOURCE_TOKEN=$(memsource auth login --user-name $MEMSOURCE_USERNAME --password "${MEMSOURCE_PASSWORD}" -c token -f value)
EOF
```

Load the credentials in your shell:

```bash
source ~/.memsourcerc
```

**Prerequisites:**

- Memsource CLI client must be installed at `${HOME}/git/memsource-cli-client/`
- Refer to [localization team instructions](https://docs.google.com/presentation/d/1qQH0Ppm8CR3QJX3CE8pcWiZQFtIvfDwDk1Y34PH-s-0/edit?usp=sharing) for CLI client installation if missing

### Install Dependencies

```bash
# Install jq (macOS)
brew install jq

# Install memsource CLI (follow TMS provider instructions)
npm install -g @memsource/cli
```

## Quick Start

For a complete translation cycle:

```bash
# 1. Upload source messages to TMS
yarn i18n-upload

# 2. Wait for translations to be completed in TMS...

# 3. Download completed translations
yarn i18n-download

# 4. Deploy translations to plugin directories
yarn i18n-deploy

# 5. Sync JSON translations with TypeScript files
yarn i18n-sync

# 6. Clean up backup files (optional)
yarn i18n-cleanup --force
```

## Complete Workflow

### Step 1: Generate JSON Files (NEW - Recommended)

**🚀 Two-step workflow:** Generate first, then upload separately for better control.

```bash
# Generate JSON files from TypeScript
yarn i18n-generate

# Force regeneration (overwrite existing)
yarn i18n-generate -- --force

# Generate for specific release/sprint
yarn i18n-generate -- -r 1.9 -s 3280

# Get help
yarn i18n-generate:help
```

**What it does:**

- Scans for `ref.ts` files in plugin translation directories
- Extracts translatable messages using TypeScript AST parsing
- Generates English JSON files (`*-en.json`) in `ui-i18n/1.8/`
- Validates JSON syntax
- **Stops here** - allows you to review files before upload

### Step 1b: Upload to TMS

Upload the generated JSON files to TMS:

```bash
# Upload existing JSON files
yarn i18n-push

# Upload with custom target languages
yarn i18n-push -- -t 'fr,es,de'

# Get help
yarn i18n-push:help
```

**What it does:**

- Uploads existing JSON files from `ui-i18n/1.8/`
- Caches uploaded files to prevent re-upload
- Creates translation jobs in TMS

### Legacy: Single-Step Upload

**⚠️ Legacy mode:** Generate and upload in one step (includes confirmation prompt).

```bash
# Legacy single-step upload (with confirmation prompt)
yarn i18n-upload

# Force legacy mode (skip prompt)
yarn i18n-upload -- --legacy

# Get help
yarn i18n-upload:help
```

**What gets uploaded:**

- File: `workspaces/global-header/plugins/global-header/src/translations/ref.ts`
- Becomes: `rhdh-plugins__workspaces__global-header__plugins__global-header__src__translations__ref-en.json`
- Uploaded to TMS project with target languages

**Manual Review:**

- Generated files are saved in `ui-i18n/1.8/` for review
- Use standard tools to inspect: `ls -la ui-i18n/1.8/`, `jq . file.json`
- Modify files if needed before upload
- Upload when ready with `yarn i18n-push`

### Step 2: Translation Work (External)

Translators work on the uploaded files in the TMS:

- **Status**: NEW → IN_PROGRESS → COMPLETED
- **Languages**: French, Spanish, German, etc.
- **Quality**: Review and approval process

### Step 3: Download Completed Translations

The download script:

- Fetches only COMPLETED translations
- Downloads latest version of each file
- Uses human-readable filenames
- Implements caching to avoid re-downloads

```bash
# Download all completed translations
yarn i18n-download

# Download specific languages
yarn i18n-download -- --languages fr,es

# Preview what would be downloaded
yarn i18n-download -- --dry-run

# Get help
yarn i18n-download:help
```

**Download behavior:**

- **Caching**: Won't re-download same job ID
- **Latest version**: Automatically selects most recent translation
- **Organization**: Files organized by plugin structure

### Step 4: Deploy to Plugin Directories

The deploy script moves downloaded files to their correct locations:

```bash
# Deploy all translation files (with cleanup)
yarn i18n-deploy

# Deploy from specific directory
yarn i18n-deploy -- --source-dir ui-i18n-downloads/1.8/

# Preview deployment
yarn i18n-deploy -- --dry-run

# Get help
yarn i18n-deploy:help
```

**Deployment structure:**

```
workspaces/global-header/plugins/global-header/src/translations/
├── ref.ts                   # Source TypeScript messages
├── ref-fr.json              # French JSON (from TMS)
├── ref-es.json              # Spanish JSON (from TMS)
├── fr.ts                    # French TypeScript (AI-generated → synced)
└── es.ts                    # Spanish TypeScript (AI-generated → synced)
```

### Step 5: Sync JSON with TypeScript Files

The sync script updates existing TypeScript translation files with new JSON translations:

**Important:** The `fr.ts`, `es.ts` files start as AI-generated temporary content. Only after running the sync script do they contain accurate, human-translated strings from the TMS.

```bash
# Sync all languages with backup
yarn i18n-sync

# Sync specific language
yarn i18n-sync -- --language fr

# Sync specific plugin
yarn i18n-sync -- --plugin global-header

# Preview changes
yarn i18n-sync -- --dry-run

# Get help
yarn i18n-sync:help
```

**Sync features:**

- **Robust parsing**: Handles template variables (`{{count}}`, `{{period}}`)
- **Character escaping**: Proper handling of quotes and special characters
- **Syntax validation**: Automatically validates generated TypeScript files
- **Backup creation**: Creates `.bak` files for safety

### Step 6: Cleanup (Optional)

Remove backup files after verification:

```bash
# Preview cleanup
yarn i18n-cleanup

# Clean all backup files
yarn i18n-cleanup --force

# Clean files older than 7 days
yarn i18n-cleanup -- --older-than 7 --force

# Interactive cleanup
yarn i18n-cleanup -- --interactive

# Get help
yarn i18n-cleanup:help
```

## Script Reference

### Available Commands

| Command              | Description                           | Key Options                                       |
| -------------------- | ------------------------------------- | ------------------------------------------------- |
| `yarn i18n-generate` | Generate JSON files from TypeScript   | `-r`, `-s`, `--force`                             |
| `yarn i18n-push`     | Upload JSON files to TMS              | `-r`, `-p`, `-t`                                  |
| `yarn i18n-upload`   | Legacy: Generate + Upload in one step | `-r`, `-s`, `-t`, `-p`, `--legacy`                |
| `yarn i18n-download` | Download completed translations       | `--languages`, `--status`, `--dry-run`            |
| `yarn i18n-deploy`   | Deploy translations to plugins        | `--source-dir`, `--clean-source`, `--dry-run`     |
| `yarn i18n-sync`     | Sync JSON with TypeScript files       | `--language`, `--plugin`, `--backup`, `--dry-run` |
| `yarn i18n-cleanup`  | Clean up backup files                 | `--force`, `--older-than`, `--interactive`        |

### Help Commands

Each script has detailed help:

```bash
yarn i18n-generate:help
yarn i18n-push:help
yarn i18n-upload:help
yarn i18n-download:help
yarn i18n-deploy:help
yarn i18n-sync:help
yarn i18n-cleanup:help
```

## Configuration

### Main Configuration File

Edit `scripts/i18n-scripts/i18n.config.sh`:

```bash
# Release version
RHDH_RELEASE="${RHDH_RELEASE:-1.8}"

# Sprint number
SPRINT_NUMBER="${SPRINT_NUMBER:-3280}"

# TMS project ID
TMS_PROJECT_ID="${TMS_PROJECT_ID:-33299484}"

# Default target languages
DOWNLOAD_LANGS="${DOWNLOAD_LANGS:-fr}"

# TMS host
export MEMSOURCE_HOST="${MEMSOURCE_HOST:-https://cloud.memsource.com/web}"
```

### Directory Structure

```
scripts/i18n-scripts/
├── i18n.config.sh              # Main configuration
├── collect-and-upload.sh       # Upload orchestration
├── collect-and-download.sh     # Download orchestration
├── deploy-translations.sh      # Deployment logic
├── sync-translations.sh        # JSON to TypeScript sync
├── cleanup-backups.sh          # Backup file management
├── memsource-upload.sh         # TMS upload interface
├── memsource-download.sh       # TMS download interface
└── extract-ts-messages.mjs     # TypeScript message extraction
```

### Cache Directories

The scripts use caching to improve performance:

```
.ui-i18n-cache/1.8/              # Upload cache (prevents re-upload)
.ui-i18n-download-cache/1.8/     # Download cache (prevents re-download)
ui-i18n/1.8/                     # Staging directory for uploads
ui-i18n-downloads/1.8/           # Downloaded translations
```

## Troubleshooting

### Common Issues

#### 1. Upload Fails - Missing Dependencies

```bash
# Error: Missing dependency: jq
brew install jq

# Error: Missing dependency: memsource
npm install -g @memsource/cli

# Error: Missing dependency: node
# Install Node.js v22+
```

#### 2. Authentication Errors

```bash
# Error: MEMSOURCE_TOKEN not set
echo "Check ~/.memsourcerc file exists and is sourced"
source ~/.memsourcerc

# Error: Invalid credentials
echo "Check virtual environment and password"
source ${HOME}/git/memsource-cli-client/.memsource/bin/activate
memsource auth login --user-name $MEMSOURCE_USERNAME --password "${MEMSOURCE_PASSWORD}"

# Error: Virtual environment not found
echo "Install Memsource CLI client first"
echo "Check localization team instructions (see documentation for link)"

# Error: Permission denied on virtual environment
echo "Check CLI client installation and permissions"
ls -la ${HOME}/git/memsource-cli-client/.memsource/bin/activate
```

#### 3. Download Issues

```bash
# Error: No completed translations
yarn i18n-download -- --status NEW  # Check if jobs exist but not completed

# Error: Job not found
yarn i18n-download -- --dry-run     # Preview available jobs
```

#### 4. Sync Syntax Errors

```bash
# Error: Generated file has syntax errors
# The script automatically validates and reports issues
# Check the problematic translation strings for special characters

# Manual validation
node -c workspaces/plugin-name/plugins/plugin-name/src/translations/fr.ts
```

#### 5. Permission Issues

```bash
# Error: Permission denied
chmod +x scripts/i18n-scripts/*.sh

# Error: Cannot write to directory
# Check directory permissions and ownership
```

### Debug Mode

Enable verbose output for troubleshooting:

```bash
# Set debug environment variable
export DEBUG=1

# Run commands with debug output
yarn i18n-upload
```

### File Validation

Validate translation files manually:

```bash
# Check JSON syntax
jq . workspaces/plugin/plugins/plugin/src/translations/ref-fr.json

# Check TypeScript syntax
node -c workspaces/plugin/plugins/plugin/src/translations/fr.ts

# Check file encoding
file workspaces/plugin/plugins/plugin/src/translations/fr.ts
```

## Advanced Usage

### Custom Workflows

#### 1. Plugin-Specific Translation

```bash
# Upload only specific plugin
yarn i18n-upload
# Then manually filter in TMS

# Download and sync specific plugin
yarn i18n-download
yarn i18n-deploy
yarn i18n-sync -- --plugin global-header
```

#### 2. Language-Specific Workflows

```bash
# Work with specific languages
yarn i18n-download -- --languages es,de
yarn i18n-sync -- --language es
yarn i18n-sync -- --language de
```

#### 3. Batch Processing

```bash
# Process multiple plugins
for plugin in global-header adoption-insights quickstart; do
  yarn i18n-sync -- --plugin $plugin --language fr
done
```

#### 4. Quality Assurance

```bash
# Validate all translation files
find workspaces -name "*.ts" -path "*/translations/*" -exec node -c {} \;

# Check for missing translations
yarn i18n-sync -- --dry-run | grep "Missing"

# Backup before major changes
cp -r workspaces/*/plugins/*/src/translations/ /backup/translations/
```

### Environment Variables

Override configuration with environment variables:

```bash
# Custom release version
RHDH_RELEASE=2.0 yarn i18n-upload

# Custom target languages
TARGET_LANGS=fr,es,de,zh-CN yarn i18n-upload

# Clean up after upload
CLEAN_AFTER_UPLOAD=1 yarn i18n-upload

# Custom project ID
TMS_PROJECT_ID=12345 yarn i18n-download
```

### Integration with CI/CD

Example GitHub Actions workflow:

```yaml
name: i18n-sync
on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  sync-translations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install dependencies
        run: |
          sudo apt-get install jq
          npm install -g @memsource/cli

      - name: Setup TMS credentials
        run: |
          # Setup Memsource CLI client (see team setup documentation)
          # Assuming CLI client is pre-installed in CI environment

          echo "source \${HOME}/git/memsource-cli-client/.memsource/bin/activate" >> ~/.memsourcerc
          echo "export MEMSOURCE_URL=https://cloud.memsource.com/web" >> ~/.memsourcerc
          echo "export MEMSOURCE_USERNAME=${{ secrets.MEMSOURCE_USERNAME }}" >> ~/.memsourcerc
          echo "export MEMSOURCE_PASSWORD=${{ secrets.MEMSOURCE_PASSWORD }}" >> ~/.memsourcerc
          echo "export MEMSOURCE_TOKEN=\$(memsource auth login --user-name \$MEMSOURCE_USERNAME --password \"\${MEMSOURCE_PASSWORD}\" -c token -f value)" >> ~/.memsourcerc

          source ~/.memsourcerc

      - name: Download and sync translations
        run: |
          yarn i18n-download
          yarn i18n-deploy
          yarn i18n-sync

      - name: Create PR if changes
        uses: peter-evans/create-pull-request@v4
        with:
          title: 'chore: update translations'
          body: 'Automated translation sync from TMS'
```

## Best Practices

### 1. Regular Sync Schedule

- **Upload**: After adding new translatable strings
- **Download**: Weekly or when TMS notifications indicate completion
- **Sync**: Immediately after download
- **Cleanup**: Monthly or after major releases

### 2. Quality Control

- Always use `--dry-run` first for major operations
- Keep backup files until changes are verified
- Validate syntax after sync operations
- Test applications after translation updates

### 3. Version Control

- Commit translation files to git
- Use meaningful commit messages
- Tag releases with translation status
- Document translation coverage in release notes

### 4. Team Coordination

- Coordinate upload timing with translation team
- Communicate release schedules
- Document any custom translation requirements
- Maintain translation glossaries and style guides

## Support

For issues or questions:

1. Check this documentation
2. Review script help: `yarn i18n-*:help`
3. Check troubleshooting section
4. Validate configuration and credentials
5. Contact the development team

---

**Last updated**: September 2025  
**Version**: 1.0  
**Scripts version**: Compatible with RHDH 1.8+
