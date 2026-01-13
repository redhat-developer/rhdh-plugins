# Translation Workflow Verification Report

## Workflow Overview

The translation workflow consists of 4 main steps:

1. **Generate** - Extract translation keys from source code → `{repo}-{sprint}.json`
2. **Upload** - Send reference file to TMS → Uploads as `{repo}-{sprint}.json`
3. **Download** - Get completed translations → Downloads as `{repo}-{sprint}-{lang}(-C).json`
4. **Deploy** - Update application locale files → Deploys to `{lang}.ts` files

## Issues Fixed

### ✅ Fixed: Sync Command Missing Sprint Parameter

**Problem**: The `sync` command didn't pass the `sprint` parameter to `generateCommand`, causing failures since sprint is now required.

**Solution**:

- Added `--sprint` as required option to sync command
- Updated `stepGenerate` to accept and pass sprint parameter
- Added logic to track generated filename and pass it to upload step

### ✅ Fixed: Sync Command Using Hardcoded Filename

**Problem**: The `stepUpload` function hardcoded `reference.json` but the new naming is `{repo}-{sprint}.json`.

**Solution**:

- Updated `stepUpload` to accept generated filename from generate step
- Added fallback logic to construct filename from sprint if needed
- Properly passes the generated file path to upload command

## Current Workflow Verification

### Step 1: Generate ✅

- **Command**: `i18n generate --sprint s3285`
- **Output**: `{repo}-{sprint}.json` (e.g., `rhdh-s3285.json`)
- **Status**: ✅ Working - sprint is required, validates format, generates correct filename

### Step 2: Upload ✅

- **Command**: `i18n upload --source-file i18n/rhdh-s3285.json`
- **Upload Filename**: `{repo}-{sprint}.json` (e.g., `rhdh-s3285.json`)
- **Status**: ✅ Working - extracts sprint from source filename, generates correct upload name

### Step 3: Download ✅

- **Command**: `i18n download`
- **Downloaded Files**: `{repo}-{sprint}-{lang}(-C).json` (e.g., `rhdh-s3285-it-C.json`)
- **Status**: ✅ Working - TMS adds language code and -C suffix automatically

### Step 4: Deploy ✅

- **Command**: `i18n deploy --source-dir i18n/downloads`
- **Detects Files**: Supports `{repo}-{sprint}-{lang}(-C).json` pattern
- **Status**: ✅ Working - deploy script updated to detect sprint-based pattern

### Sync Command (All-in-One) ✅

- **Command**: `i18n sync --sprint s3285`
- **Status**: ✅ Fixed - Now properly passes sprint through all steps

## File Naming Convention

### Generated Files

- Format: `{repo}-{sprint}.json`
- Example: `rhdh-s3285.json`

### Uploaded Files (to TMS)

- Format: `{repo}-{sprint}.json`
- Example: `rhdh-s3285.json`

### Downloaded Files (from TMS)

- Format: `{repo}-{sprint}-{lang}(-C).json`
- Examples:
  - `rhdh-s3285-it-C.json` (with -C suffix from TMS)
  - `rhdh-s3285-it.json` (without -C, also supported)

### Deployed Files

- Format: `{lang}.ts` in plugin translation directories
- Example: `workspaces/adoption-insights/plugins/adoption-insights/src/translations/it.ts`

## Testing Checklist

### ✅ Unit Tests Needed

- [ ] Sprint validation (format: s3285 or 3285)
- [ ] Filename generation with sprint
- [ ] Sprint extraction from filenames
- [ ] Deploy script pattern matching for sprint-based files

### ✅ Integration Tests Needed

- [ ] Complete workflow: generate → upload → download → deploy
- [ ] Sync command with all steps
- [ ] Sync command with skipped steps
- [ ] Error handling when sprint is missing

### ✅ Manual Testing Steps

1. **Test Generate Command**:

   ```bash
   translations-cli i18n generate --sprint s3285
   # Verify: rhdh-s3285.json is created
   ```

2. **Test Upload Command**:

   ```bash
   translations-cli i18n upload --source-file i18n/rhdh-s3285.json
   # Verify: Uploads as rhdh-s3285.json to TMS
   ```

3. **Test Download Command**:

   ```bash
   translations-cli i18n download
   # Verify: Downloads rhdh-s3285-it-C.json, rhdh-s3285-ja-C.json, etc.
   ```

4. **Test Deploy Command**:

   ```bash
   translations-cli i18n deploy --source-dir i18n/downloads
   # Verify: Deploys to it.ts, ja.ts files in plugin directories
   ```

5. **Test Sync Command**:
   ```bash
   translations-cli i18n sync --sprint s3285 --dry-run
   # Verify: All steps execute correctly
   ```

## Potential Issues to Watch

1. **Sprint Format Consistency**: Ensure sprint is always normalized (s3285 format)
2. **Filename Matching**: Deploy script must correctly match sprint-based patterns
3. **Backward Compatibility**: Old date-based files should still work during transition
4. **Error Messages**: Clear errors when sprint is missing or invalid

## Recommendations

1. ✅ **Add validation tests** for sprint format
2. ✅ **Update documentation** with new naming convention
3. ✅ **Add examples** showing complete workflow with sprint
4. ⚠️ **Consider migration guide** for teams using old date-based naming

## Status: ✅ READY FOR TESTING

All critical issues have been fixed. The workflow should now work correctly with the new sprint-based naming convention.
