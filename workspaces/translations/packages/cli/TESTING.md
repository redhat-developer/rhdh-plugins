# Testing the CLI Locally

This guide explains how to test the `translations-cli` locally before publishing to npm.

## Prerequisites

1. Build the project:

   ```bash
   npm run build
   ```

2. Ensure dependencies are installed:
   ```bash
   npm install
   ```

## Method 1: Using npm link (Recommended)

This method allows you to use `translations-cli` as if it were installed from npm.

### Step 1: Link the package globally

```bash
# From the translations-cli directory
npm run link
```

This will:

1. Build the project
2. Create a global symlink to your local package

### Step 2: Test in a target repository

```bash
# Navigate to a test repository
cd /path/to/your/test-repo

# Now you can use translations-cli as if it were installed
translations-cli i18n --help
translations-cli i18n init
translations-cli i18n generate
```

### Step 3: Unlink when done

```bash
# From the translations-cli directory
npm unlink -g translations-cli
```

## Method 2: Direct execution (Quick testing)

Run commands directly using the built binary:

```bash
# From the translations-cli directory
npm run build
node bin/translations-cli.js i18n --help
node bin/translations-cli.js i18n init
```

Or use the test script (builds first, then runs):

```bash
npm run test:local i18n --help
npm run test:local i18n init
```

**Note:** You can also pass arguments:

```bash
npm run test:local i18n generate --source-dir . --output-dir i18n
```

## Method 3: Using ts-node (Development)

For rapid iteration during development:

```bash
# Run directly from TypeScript source
npm run dev i18n --help
npm run dev i18n init
```

**Note:** This is slower but doesn't require building.

## Testing Workflow

### 1. Test Basic Commands

```bash
# Test help
translations-cli i18n --help

# Test init
translations-cli i18n init

# Test generate (in a test repo)
cd /path/to/test-repo
translations-cli i18n generate --source-dir . --output-dir i18n
```

### 2. Test Full Workflow

```bash
# In a test repository
cd /path/to/test-repo

# 1. Initialize
translations-cli i18n init

# 2. Generate reference file
translations-cli i18n generate

# 3. Upload (if TMS configured)
translations-cli i18n upload --source-file i18n/reference.json

# 4. Download
translations-cli i18n download

# 5. Deploy
translations-cli i18n deploy
```

### 3. Test with Different Options

```bash
# Test with custom patterns
translations-cli i18n generate \
  --source-dir . \
  --include-pattern "**/*.ts" \
  --exclude-pattern "**/node_modules/**,**/dist/**"

# Test dry-run
translations-cli i18n upload --source-file i18n/reference.json --dry-run

# Test force upload
translations-cli i18n upload --source-file i18n/reference.json --force
```

## Testing Cache Functionality

```bash
# First upload
translations-cli i18n upload --source-file i18n/reference.json

# Second upload (should skip - file unchanged)
translations-cli i18n upload --source-file i18n/reference.json

# Force upload (should upload anyway)
translations-cli i18n upload --source-file i18n/reference.json --force
```

## Testing in Multiple Repos

Since you mentioned testing across multiple repos:

```bash
# Link globally once
cd /Users/yicai/redhat/translations-cli
npm run link

# Then test in each repo
cd /Users/yicai/redhat/rhdh-plugins/workspaces/global-header/plugins/global-header
translations-cli i18n generate

cd /Users/yicai/redhat/rhdh/packages/app
translations-cli i18n generate

# etc.
```

## Troubleshooting

### Command not found

If `translations-cli` is not found:

1. Make sure you ran `npm run link`
2. Check that `npm prefix -g` is in your PATH
3. Try `npm run test:local` instead

### Build errors

If build fails:

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Cache issues

To clear cache during testing:

```bash
translations-cli i18n clean --force
```

## Pre-PR Checklist

Before making a PR, test:

- [ ] `translations-cli i18n --help` shows all commands
- [ ] `translations-cli i18n init` creates config files
- [ ] `translations-cli i18n generate` extracts keys correctly
- [ ] `translations-cli i18n upload` works (with --dry-run)
- [ ] `translations-cli i18n download` works (with --dry-run)
- [ ] `translations-cli i18n deploy` works (with --dry-run)
- [ ] Cache works (skips unchanged files)
- [ ] All commands show proper error messages
- [ ] Config file patterns are respected
- [ ] Unicode quotes are normalized
