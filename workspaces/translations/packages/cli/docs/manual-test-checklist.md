# Manual Testing Checklist

Use this checklist to manually test the CLI before release.

## Prerequisites

```bash
# Build the CLI
cd workspaces/translations/packages/cli
yarn build

# Link globally (optional, for easier testing)
yarn link
```

## 1. Basic Command Tests

### Help Commands

- [ ] `translations-cli i18n --help` shows all available commands
- [ ] `translations-cli i18n generate --help` shows generate command options
- [ ] `translations-cli i18n upload --help` shows upload command options
- [ ] `translations-cli i18n download --help` shows download command options

### Init Command

- [ ] `translations-cli i18n init` creates `.i18n.config.json`
- [ ] `translations-cli i18n init` creates `.i18n.auth.json` (if not exists)
- [ ] Config files have correct structure

## 2. Generate Command Tests

### Basic Generation

- [ ] `translations-cli i18n generate` creates `i18n/reference.json`
- [ ] Generated file has correct structure: `{ "plugin": { "en": { "key": "value" } } }`
- [ ] Only English reference keys are included
- [ ] Language files (de.ts, es.ts, fr.ts, etc.) are excluded

### Filtering Tests

- [ ] Files with `createTranslationRef` are included
- [ ] Files with `createTranslationMessages` are excluded (they may contain non-English)
- [ ] Files with `createTranslationResource` are excluded
- [ ] Non-English words (Italian, German, etc.) are NOT in reference.json

### Options Tests

- [ ] `--source-dir` option works
- [ ] `--output-dir` option works
- [ ] `--include-pattern` option works
- [ ] `--exclude-pattern` option works
- [ ] `--merge-existing` option works

### Test in Real Repo

```bash
cd /path/to/community-plugins
translations-cli i18n generate --source-dir . --output-dir i18n
# Check that reference.json only contains English
```

## 3. Upload Command Tests

### Basic Upload

- [ ] `translations-cli i18n upload --source-file i18n/reference.json --dry-run` works
- [ ] Dry-run shows what would be uploaded without actually uploading
- [ ] Actual upload works (if TMS configured)

### Cache Tests

- [ ] First upload creates cache
- [ ] Second upload (unchanged file) is skipped
- [ ] `--force` flag bypasses cache
- [ ] Cache file is created in `.i18n-cache/`

### Options Tests

- [ ] `--tms-url` option works
- [ ] `--tms-token` option works
- [ ] `--project-id` option works
- [ ] `--target-languages` option works
- [ ] `--upload-filename` option works

## 4. Download Command Tests

### Basic Download

- [ ] `translations-cli i18n download --dry-run` works
- [ ] Dry-run shows what would be downloaded
- [ ] Actual download works (if TMS configured)

### Options Tests

- [ ] `--output-dir` option works
- [ ] `--target-languages` option works
- [ ] `--format` option works (json, po)

## 5. Sync Command Tests

- [ ] `translations-cli i18n sync --dry-run` shows all steps
- [ ] Sync performs: generate → upload → download → deploy
- [ ] Each step can be skipped with flags

## 6. Deploy Command Tests

- [ ] `translations-cli i18n deploy --dry-run` works
- [ ] Deploy copies files to correct locations
- [ ] `--format` option works

## 7. Status Command Tests

- [ ] `translations-cli i18n status` shows translation status
- [ ] Shows missing translations
- [ ] Shows completion percentages

## 8. Clean Command Tests

- [ ] `translations-cli i18n clean` removes cache files
- [ ] `--force` flag works
- [ ] Cache directory is cleaned

## 9. Error Handling Tests

- [ ] Invalid command shows helpful error
- [ ] Missing config file shows helpful error
- [ ] Invalid file path shows helpful error
- [ ] Network errors show helpful messages
- [ ] Authentication errors show helpful messages

## 10. Integration Tests

### Full Workflow Test

```bash
# In a test repository
cd /path/to/test-repo

# 1. Initialize
translations-cli i18n init

# 2. Generate
translations-cli i18n generate

# 3. Upload (dry-run)
translations-cli i18n upload --source-file i18n/reference.json --dry-run

# 4. Download (dry-run)
translations-cli i18n download --dry-run

# 5. Deploy (dry-run)
translations-cli i18n deploy --dry-run
```

### Real Repository Test

```bash
# Test in community-plugins
cd /Users/yicai/redhat/community-plugins
translations-cli i18n generate --source-dir . --output-dir i18n

# Verify:
# - reference.json only contains English
# - No Italian/German/French words in reference.json
# - All plugins are included
# - Language files are excluded
```

## 11. Edge Cases

- [ ] Empty source directory
- [ ] No translation files found
- [ ] Invalid JSON in config
- [ ] Missing dependencies
- [ ] Large files (performance)
- [ ] Special characters in keys/values
- [ ] Unicode normalization

## 12. Performance Tests

- [ ] Generate on large codebase (< 30 seconds)
- [ ] Upload large file (< 60 seconds)
- [ ] Download large file (< 60 seconds)

## Pre-Release Checklist

Before releasing, ensure:

- [ ] All manual tests pass
- [ ] Automated tests pass: `yarn test`
- [ ] Linting passes: `yarn lint`
- [ ] Build succeeds: `yarn build`
- [ ] Documentation is up to date
- [ ] Version number is correct
- [ ] CHANGELOG is updated
- [ ] Tested in at least 2 different repositories
