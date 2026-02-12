# Testing Guide for Translations CLI

Complete guide for testing the translations CLI before release.

## Quick Test Commands

```bash
# Quick smoke test (fastest)
yarn test:quick

# Full integration test
yarn test:integration

# Unit tests (vitest)
yarn test

# Manual testing checklist
# See: test/manual-test-checklist.md
```

## Testing Strategy

### 1. Automated Tests

#### Quick Test (Recommended First)

```bash
yarn test:quick
```

- Builds the CLI
- Tests help command
- Tests generate command with sample files
- Verifies output structure
- Takes ~10 seconds

#### Integration Test

```bash
yarn test:integration
```

- Creates full test fixture
- Tests generate command
- Verifies English-only filtering
- Verifies non-English words are excluded
- Takes ~30 seconds

#### Unit Tests

```bash
yarn test
```

- Runs vitest test suite
- Tests individual functions
- Fast feedback during development

### 2. Manual Testing

Follow the comprehensive checklist:

```bash
# View checklist
cat test/manual-test-checklist.md
```

Key areas to test:

- ✅ All commands work
- ✅ Help text is correct
- ✅ Generate only includes English
- ✅ Non-English words excluded
- ✅ Error messages are helpful

### 3. Real Repository Testing

#### Test in community-plugins

```bash
cd /Users/yicai/redhat/community-plugins

# Build and link CLI first
cd /Users/yicai/redhat/rhdh-plugins/workspaces/translations/packages/cli
yarn build
yarn link  # or use: node bin/translations-cli

# Test generate
cd /Users/yicai/redhat/community-plugins
translations-cli i18n generate --source-dir . --output-dir i18n

# Verify:
# 1. reference.json only contains English
# 2. No Italian/German/French words
# 3. All plugins included
# 4. Language files excluded
```

#### Test in rhdh-plugins

```bash
cd /Users/yicai/redhat/rhdh-plugins/workspaces/translations
translations-cli i18n generate --source-dir . --output-dir i18n
```

## Pre-Release Checklist

### Build & Lint

- [ ] `yarn build` succeeds
- [ ] `yarn lint` passes (no errors)
- [ ] No TypeScript errors

### Automated Tests

- [ ] `yarn test:quick` passes
- [ ] `yarn test:integration` passes
- [ ] `yarn test` passes (if unit tests exist)

### Manual Tests

- [ ] All commands work (`--help` for each)
- [ ] Generate creates correct output
- [ ] Only English in reference.json
- [ ] Non-English words excluded
- [ ] Error handling works

### Real Repository Tests

- [ ] Tested in community-plugins
- [ ] Tested in rhdh-plugins (or similar)
- [ ] Output verified manually

### Documentation

- [ ] README is up to date
- [ ] TESTING.md is accurate
- [ ] All examples work

## Common Issues & Solutions

### Build Fails

```bash
# Clean and rebuild
yarn clean
rm -rf dist node_modules
yarn install
yarn build
```

### Tests Fail

```bash
# Ensure scripts are executable
chmod +x test/*.sh

# Rebuild
yarn build
```

### Command Not Found

```bash
# Use direct path
node bin/translations-cli i18n --help

# Or link globally
yarn link
```

## Testing Workflow

### Daily Development

1. `yarn test:quick` - before committing
2. `yarn lint` - ensure code quality

### Before PR

1. `yarn test:integration` - full test
2. Manual testing of key features
3. Test in at least one real repo

### Before Release

1. Complete pre-release checklist
2. Test in 2+ real repositories
3. Verify all documentation
4. Check version numbers

## Test Files Structure

```
test/
├── README.md                    # This guide
├── test-helpers.ts              # Test utilities
├── generate.test.ts             # Unit tests
├── integration-test.sh          # Full integration test
├── quick-test.sh                # Quick smoke test
└── manual-test-checklist.md     # Manual testing guide
```

## Next Steps

1. Run `yarn test:quick` to verify basic functionality
2. Review `test/manual-test-checklist.md` for comprehensive testing
3. Test in a real repository before release
4. Fix any issues found during testing
