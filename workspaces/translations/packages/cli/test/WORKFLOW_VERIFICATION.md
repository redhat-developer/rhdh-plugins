# Translation Workflow Verification Guide

This guide helps you verify that all improved commands and refactored functions work correctly.

## Quick Verification

Run the automated verification script:

```bash
cd workspaces/translations/packages/cli
yarn build  # Build the CLI first
yarn test:workflow
```

This will test:

- ✅ Direct function tests (mergeTranslationFiles, loadPoFile, savePoFile)
- ✅ Generate command (basic, merge-existing, PO format)
- ✅ Deploy command
- ✅ Upload command (dry-run)
- ✅ Sync command (dry-run)

## Manual Testing Steps

### 1. Test Generate Command

```bash
# Basic generate
yarn build
./bin/translations-cli i18n generate --sprint s9999 --source-dir src --output-dir i18n

# Verify output
ls -lh i18n/rhdh-s9999.json
cat i18n/rhdh-s9999.json | jq 'keys'  # Should show plugin names
```

**What this tests:**

- `extractKeys` function (refactored)
- `generateCommand` function (refactored)
- File generation with sprint-based naming

### 2. Test Generate with Merge Existing

```bash
# First generate
./bin/translations-cli i18n generate --sprint s9999 --source-dir src --output-dir i18n

# Modify source code to add a new key, then:
./bin/translations-cli i18n generate --sprint s9999 --source-dir src --output-dir i18n --merge-existing

# Verify old keys are preserved and new keys are added
cat i18n/rhdh-s9999.json | jq '.test-plugin.en | keys'
```

**What this tests:**

- `mergeTranslationFiles` function (refactored, complexity reduced from 20 to <15)
- Merging nested structures
- Merging flat structures

### 3. Test Generate with PO Format

```bash
./bin/translations-cli i18n generate --sprint s9999 --source-dir src --output-dir i18n --format po

# Verify PO file
cat i18n/rhdh-s9999.po | head -20
```

**What this tests:**

- `savePoFile` function (refactored, uses translationUtils)
- PO file format generation

### 4. Test Deploy Command

```bash
# Create a test downloaded file
mkdir -p i18n/downloads
cat > i18n/downloads/rhdh-s9999-it-C.json << 'EOF'
{
  "test-plugin": {
    "it": {
      "title": "Plugin di Test",
      "description": "Questo è un plugin di test"
    }
  }
}
EOF

# Run deploy
./bin/translations-cli i18n deploy --source-dir i18n/downloads
```

**What this tests:**

- `loadPoFile` function (refactored, complexity reduced from 17 to <15)
- `deploy-translations.ts` script (ReDoS fix, complexity reduced)
- File deployment to plugin directories

### 5. Test Upload Command (Dry-Run)

```bash
# Generate a file first
./bin/translations-cli i18n generate --sprint s9999 --source-dir src --output-dir i18n

# Test upload (dry-run)
./bin/translations-cli i18n upload --source-file i18n/rhdh-s9999.json --dry-run
```

**What this tests:**

- `generateUploadFileName` function (refactored, complexity reduced from 19 to <15)
- Sprint extraction from filename
- Upload filename generation

### 6. Test Sync Command (Dry-Run)

```bash
./bin/translations-cli i18n sync --sprint s9999 --source-dir src --output-dir i18n --dry-run
```

**What this tests:**

- Full workflow integration
- All commands working together
- Sprint parameter passing through workflow

## Testing Refactored Functions Directly

### Test mergeTranslationFiles

Create a test script:

```typescript
import { mergeTranslationFiles } from './src/lib/i18n/mergeFiles';
import fs from 'fs-extra';

// Test flat merge
const existingFile = 'test-existing.json';
await fs.writeJson(existingFile, {
  metadata: {
    generated: new Date().toISOString(),
    version: '1.0',
    totalKeys: 2,
  },
  translations: { key1: 'value1', key2: 'value2' },
});

await mergeTranslationFiles(
  { key2: 'value2-updated', key3: 'value3' },
  existingFile,
  'json',
);

const result = await fs.readJson(existingFile);
console.log(result.translations); // Should have key1, key2 (updated), key3
```

### Test loadPoFile and savePoFile

```typescript
import { loadPoFile } from './src/lib/i18n/loadFile';
import { saveTranslationFile } from './src/lib/i18n/saveFile';

const testData = {
  key1: 'value1',
  'key with "quotes"': 'value with "quotes"',
  'key\nwith\nnewlines': 'value\ttab',
};

await saveTranslationFile(testData, 'test.po', 'po');
const loaded = await loadPoFile('test.po');

console.log(JSON.stringify(loaded, null, 2)); // Should match testData
```

## Verification Checklist

- [ ] Generate command creates correct file structure
- [ ] Generate with --merge-existing preserves old keys and adds new ones
- [ ] Generate with --format po creates valid PO file
- [ ] Deploy command processes downloaded files correctly
- [ ] Upload command generates correct filename
- [ ] Sync command runs all steps without errors
- [ ] All TypeScript compilation passes (`yarn tsc:full`)
- [ ] All functions maintain same behavior (no breaking changes)

## Expected Improvements Verified

✅ **mergeTranslationFiles**: Complexity reduced from 20 to <15
✅ **loadPoFile**: Complexity reduced from 17 to <15
✅ **savePoFile**: Uses shared translationUtils (no duplication)
✅ **generateCommand**: Complexity reduced from 266 to <15
✅ **extractKeys**: Complexity reduced (visit: 97→<15, extractFromObjectLiteral: 30→<15)
✅ **uploadCommand**: Complexity reduced (generateUploadFileName: 19→<15)
✅ **deploy-translations.ts**: ReDoS fix, complexity reduced (extractNestedKeys: 25→<15)

## Troubleshooting

### Build fails

```bash
yarn build
# Check for TypeScript errors
yarn tsc:full
```

### CLI not found

```bash
# Make sure you're in the CLI package directory
cd workspaces/translations/packages/cli
yarn build
```

### Tests fail

- Check that test fixtures are created correctly
- Verify file permissions
- Check that all dependencies are installed (`yarn install`)
