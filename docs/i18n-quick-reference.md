# i18n Scripts Quick Reference

## 🚀 Quick Commands

```bash
# NEW: Two-step workflow (recommended)
yarn i18n-generate        # 1. Generate JSON files
# Review files in ui-i18n/1.8/
yarn i18n-push            # 2. Upload to TMS
yarn i18n-download        # 3. Download translations
yarn i18n-deploy          # 4. Deploy to plugins
yarn i18n-sync            # 5. Sync with TypeScript (replaces AI-generated content)
yarn i18n-cleanup --force # 6. Clean backups

# Legacy: Single-step workflow
yarn i18n-upload          # Generate + Upload in one step

# File management
yarn i18n-generate --force           # Force regenerate files

# Get help
yarn i18n-*:help          # Help for any command
```

## 📋 Common Options

| Command           | Common Options                          | Example                                      |
| ----------------- | --------------------------------------- | -------------------------------------------- |
| `generate`        | `-r 1.9 -s 3280 --force`                | `yarn i18n-generate -- --force -r 1.9`       |
| `push`            | `-t 'fr,es' -r 1.9`                     | `yarn i18n-push -- -t 'fr,es,de'`            |
| `upload` (legacy) | `-r 1.9 -s 3280 -t 'fr,es' --legacy`    | `yarn i18n-upload -- --legacy -t 'fr,es,de'` |
| `download`        | `--languages fr,es --dry-run`           | `yarn i18n-download -- --languages fr,es`    |
| `deploy`          | `--dry-run --clean-source`              | `yarn i18n-deploy -- --dry-run`              |
| `sync`            | `--language fr --plugin name --dry-run` | `yarn i18n-sync -- --language fr`            |
| `cleanup`         | `--force --older-than 7 --interactive`  | `yarn i18n-cleanup -- --older-than 7`        |

## 🔧 Prerequisites Setup

```bash
# Install dependencies
brew install jq
npm install -g @memsource/cli

# Setup credentials (see team setup guide below)
cat > ~/.memsourcerc << 'EOF'
source ${HOME}/git/memsource-cli-client/.memsource/bin/activate
export MEMSOURCE_URL="https://cloud.memsource.com/web"
export MEMSOURCE_USERNAME="your-username"
export MEMSOURCE_PASSWORD="your-password"
export MEMSOURCE_TOKEN=$(memsource auth login --user-name $MEMSOURCE_USERNAME --password "${MEMSOURCE_PASSWORD}" -c token -f value)
EOF
source ~/.memsourcerc
```

## 🔗 Team Setup Guide

For detailed setup instructions including credentials and CLI client installation, see the [localization team instructions](https://docs.google.com/presentation/d/1qQH0Ppm8CR3QJX3CE8pcWiZQFtIvfDwDk1Y34PH-s-0/edit?usp=sharing).

## 📁 File Structure

```
workspaces/plugin/plugins/plugin/src/translations/
├── ref.ts           # Source messages (TypeScript)
├── ref-fr.json      # Downloaded from TMS
├── fr.ts           # AI-generated (temp) → Synced translations (after sync)
└── fr.ts.bak       # Backup (auto-created during sync)
```

## ⚠️ Troubleshooting

| Issue                | Solution                                           |
| -------------------- | -------------------------------------------------- |
| Missing dependencies | `brew install jq && npm install -g @memsource/cli` |
| Auth errors          | Check `~/.memsourcerc` and `source ~/.memsourcerc` |
| Virtual env missing  | Contact localization team for CLI client setup     |
| Syntax errors        | Run `node -c path/to/file.ts` to validate          |
| Permission denied    | `chmod +x scripts/i18n-scripts/*.sh`               |
| No translations      | Check TMS for COMPLETED status                     |

## 🎯 Best Practices

- ✅ Always use `--dry-run` first
- ✅ Keep backup files until verified
- ✅ Test syntax: `node -c translation-file.ts`
- ✅ Commit translation files to git
- ✅ Clean up backups regularly

## 📖 Full Documentation

See [i18n-scripts-guide.md](./i18n-scripts-guide.md) for complete documentation.
