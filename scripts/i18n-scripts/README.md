# RHDH Plugins - i18n Workflow

Simplified translation management workflow for RHDH plugins.

## 🎯 Quick Start

```bash
# Full workflow (when you want to do everything)
yarn i18n sync

# Or step by step (recommended for most cases)
yarn i18n:generate    # Generate JSON from ref.ts files
yarn i18n:upload      # Upload to TMS
# ... wait for translations to be completed ...
yarn i18n:download    # Download completed translations
yarn i18n:deploy      # Deploy to TypeScript files
```

## 📋 Available Commands

### Core Commands

- `yarn i18n:generate` - Generate JSON files from ref.ts files
- `yarn i18n:upload` - Upload JSON files to TMS
- `yarn i18n:download` - Download completed translations from TMS
- `yarn i18n:deploy` - Deploy downloaded translations to TypeScript files

### Utility Commands

- `yarn i18n:status` - Show current status of files
- `yarn i18n:clean` - Clean up temporary files
- `yarn i18n:help` - Show help for the main workflow

### Full Workflow

- `yarn i18n sync` - Do everything in one command (generate + upload + download + deploy)

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
yarn i18n:download --languages fr,es,de --clean-before
```

- Downloads completed translations from TMS
- Use `--clean-before` to get fresh downloads
- Output: `ui-i18n-downloads/1.8/*.json`

### 4. Deploy to TypeScript

```bash
yarn i18n:deploy
```

- Deploys downloaded translations to TypeScript files
- Updates `fr.ts`, `es.ts`, etc. files in plugins
- Preserves existing keys and only updates values

## 🛠️ Options

Most commands support these options:

- `--dry-run` - Show what would be done without doing it
- `--force` - Force operations even if files exist
- `--languages LANGS` - Target languages (default: fr)
- `--release VER` - RHDH release version (default: from config)

## 📁 File Locations

- **Generated JSON**: `ui-i18n/1.8/*.json`
- **Downloaded Translations**: `ui-i18n-downloads/1.8/*.json`
- **TypeScript Files**: `workspaces/*/plugins/*/src/translations/*.ts`

## 🔐 Authentication Setup

Before using upload/download commands, ensure TMS authentication is configured:

```bash
# Set up authentication (if not already done)
source ~/.memsourcerc

# Or set environment variables manually
export MEMSOURCE_TOKEN="your-token-here"
export MEMSOURCE_USERNAME="your-username"
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

1. **Separate Upload/Download**: Upload and download happen at different times
2. **Smart Comparison**: Only regenerates/upload/downloads when files actually change
3. **Duplicate Prevention**: Prevents unnecessary uploads and downloads
4. **Clear Workflow**: Each step has a clear purpose and can be run independently
5. **Dry Run Support**: Check what would happen before doing it

## 📚 Migration from Old Scripts

| Old Command          | New Command          |
| -------------------- | -------------------- |
| `yarn i18n-generate` | `yarn i18n:generate` |
| `yarn i18n-push`     | `yarn i18n:upload`   |
| `yarn i18n-download` | `yarn i18n:download` |
| `yarn i18n-deploy`   | `yarn i18n:deploy`   |
| `yarn i18n-sync`     | `yarn i18n sync`     |
