# RHDH Plugins - i18n Workflow

Simplified translation management workflow for RHDH plugins.

## 🎯 Quick Start

```bash
# Simplified workflow (recommended)
yarn i18n:generate    # Generate JSON from ref.ts files
yarn i18n:upload      # Upload to TMS
# ... wait for translations to be completed ...
yarn i18n:download    # Download directly to target locations (includes deploy)
```

## 📋 Available Commands

### Core Commands

- `yarn i18n:generate` - Generate JSON files from ref.ts files
- `yarn i18n:upload` - Upload JSON files to TMS
- `yarn i18n:download` - Download completed translations directly to target locations (includes deploy)

### Utility Commands

- `yarn i18n:status` - Show current status of files
- `yarn i18n:clean` - Clean up temporary files
- `yarn i18n:help` - Show help for the main workflow

### Full Workflow

- `yarn i18n sync` - Do everything in one command (generate + upload + download)

## 🔄 Typical Workflow

### 1. Generate JSON Files

```bash
yarn i18n:generate
```

- Scans all `ref.ts` files in the repository
- Generates corresponding JSON files with English translations
- Only regenerates if files have actually changed
- Output: `ui-i18n/1.8/*.json`

### 2. Upload to TMS

```bash
yarn i18n:upload
# or with options
yarn i18n:upload --languages fr,es,de --dry-run
```

- Uploads JSON files to Translation Management System
- Shows what would be uploaded with `--dry-run`
- Prevents duplicate uploads when possible
- **Note**: Upload and download are separate tasks that happen at different times

### 3. Download from TMS (Later)

```bash
yarn i18n:download
# or with options
yarn i18n:download --languages fr,es,de --dry-run
```

- Downloads completed translations from TMS **directly to target locations**
- No separate deploy step needed
- Output: `workspaces/*/plugins/*/src/translations/ref-*.json`
- **Ready to use immediately!**

### 4. Deploy to TypeScript Files

```bash
yarn i18n:deploy
# or with options
yarn i18n:deploy --languages fr,es,de --clean-json
```

- Merges downloaded JSON translations into TypeScript files
- Creates language-specific files (e.g., `fr.ts`, `es.ts`)
- Preserves original `ref.ts` structure, only updates string values
- `--clean-json` removes JSON files after successful deployment

## 🛠️ Options

Most commands support these options:

- `--dry-run` - Show what would be done without doing it
- `--force` - Force operations even if files exist
- `--languages LANGS` - Target languages (default: fr)
- `--release VER` - RHDH release version (default: from config)

## 🌍 Language Examples

### Default Language (French)

```bash
# These commands are equivalent (French is the default):
yarn i18n:download
yarn i18n:download --languages fr

yarn i18n:deploy
yarn i18n:deploy --languages fr
```

### Other Languages

```bash
# Download Spanish translations:
yarn i18n:download --languages es

# Download multiple languages:
yarn i18n:download --languages fr,es,de

# Deploy specific language:
yarn i18n:deploy --languages es

# Deploy with cleanup:
yarn i18n:deploy --languages es --clean-json
```

## 📁 File Locations

- **Generated JSON**: `ui-i18n/1.8/*.json`
- **Final Translations**: `workspaces/*/plugins/*/src/translations/ref-*.json`
- **TypeScript Files**: `workspaces/*/plugins/*/src/translations/*.ts`

## 🔐 Authentication Setup

Before using upload/download commands, ensure TMS authentication is configured:

### Option 1: Using .memsourcerc file (Recommended)

```bash
# Create ~/.memsourcerc with your credentials
export MEMSOURCE_TOKEN="your-token-here"
export MEMSOURCE_USERNAME="your-username"

# Source the file
source ~/.memsourcerc
```

### Option 2: Using environment variables

```bash
export MEMSOURCE_TOKEN="your-token-here"
export MEMSOURCE_USERNAME="your-username"
```

### Option 3: Test your setup

```bash
# Test memsource setup
bash scripts/i18n-scripts/memsource-setup.sh setup

# Test with project validation
bash scripts/i18n-scripts/memsource-setup.sh setup-with-project 33299484
```

## 🔍 Status and Troubleshooting

```bash
# Check current status
yarn i18n:status

# Clean up if needed
yarn i18n:clean

# Get help
yarn i18n:help
```

## 🚀 Why This Approach?

1. **Direct Download**: Downloads go straight to target locations - no temp directories
2. **Simplified Workflow**: 3 steps instead of 4 (generate → upload → download)
3. **No Deploy Step**: Deploy functionality is included in download
4. **Ready to Use**: Translations are immediately available after download
5. **Smart Comparison**: Only processes files when they actually change
6. **Dry Run Support**: Check what would happen before doing it

## 📚 Migration from Old Scripts

| Old Command          | New Command          |
| -------------------- | -------------------- |
| `yarn i18n-generate` | `yarn i18n:generate` |
| `yarn i18n-push`     | `yarn i18n:upload`   |
| `yarn i18n-download` | `yarn i18n:download` |
| `yarn i18n-deploy`   | `yarn i18n:deploy`   |
| `yarn i18n-sync`     | `yarn i18n sync`     |
