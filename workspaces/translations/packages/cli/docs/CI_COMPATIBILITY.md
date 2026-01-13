# CI/CD Compatibility Analysis

This document analyzes the compatibility of the translation workflow with CI/CD pipelines and identifies what's needed for full CI support.

## Current CI Compatibility Status

### ✅ **Already CI-Compatible Features**

1. **Non-Interactive Mode Support**

   - `--no-input` flag available for all commands that require user input
   - Automatic detection of non-interactive terminals (`isTTY` checks)
   - Commands fail gracefully with clear error messages when input is required but not provided

2. **Environment Variable Support**

   - All credentials can be provided via environment variables:
     - `MEMSOURCE_TOKEN` or `I18N_TMS_TOKEN`
     - `MEMSOURCE_USERNAME` or `I18N_TMS_USERNAME`
     - `MEMSOURCE_PASSWORD` or `I18N_TMS_PASSWORD`
     - `MEMSOURCE_URL` or `I18N_TMS_URL`
     - `I18N_TMS_PROJECT_ID`
     - `I18N_LANGUAGES`
   - No need for interactive prompts in CI

3. **Configuration File Support**

   - Project config: `.i18n.config.json` (can be committed)
   - Auth config: `~/.i18n.auth.json` (fallback, not recommended for CI)
   - All settings can be provided via environment variables

4. **Command-Line Options**
   - All paths and settings can be provided via CLI flags
   - No hardcoded user-specific paths (after recent fixes)

### ⚠️ **Potential CI Blockers**

1. **Memsource CLI Dependency**

   - **Issue**: The workflow requires the `memsource` CLI command to be installed
   - **Current**: Assumes memsource CLI is installed in a Python virtual environment
   - **CI Impact**: CI runners need to:
     - Install Python
     - Install memsource-cli-client package
     - Set up virtual environment
     - Make `memsource` command available in PATH
   - **Workaround**: Use environment variables for token (bypasses CLI for some operations)

2. **Home Directory File Access**

   - **Issue**: Some commands read/write to `~/.memsourcerc` and `~/.i18n.auth.json`
   - **Current**: Uses `os.homedir()` which works in CI but may not be ideal
   - **CI Impact**:
     - CI runners have home directories, so this works
     - But credentials stored in home directory may not persist across jobs
   - **Recommendation**: Use environment variables or CI secrets instead

3. **Virtual Environment Path**

   - **Issue**: Memsource CLI requires a Python virtual environment
   - **Current**: Auto-detects or prompts for path (not CI-friendly if detection fails)
   - **CI Impact**: Need to provide `--memsource-venv` flag or ensure it's in PATH
   - **Solution**: Use `--memsource-venv` flag or install memsource CLI globally

4. **File System Assumptions**
   - **Issue**: Some commands assume certain directory structures exist
   - **CI Impact**: May need to create directories or adjust paths
   - **Solution**: Commands create directories as needed, but paths should be configurable

## Recommended CI Setup

### Option 1: Full CI Integration (Recommended for Production)

```yaml
# Example GitHub Actions workflow
name: Translation Workflow

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  translations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install memsource CLI
        run: |
          pip install memsource-cli-client
          # Or use virtual environment
          python -m venv .memsource
          source .memsource/bin/activate
          pip install memsource-cli-client
          echo "$(pwd)/.memsource/bin" >> $GITHUB_PATH

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: yarn install

      - name: Generate translation keys
        run: |
          yarn translations-cli i18n generate \
            --source-dir src \
            --output-dir i18n
        env:
          # Optional: Use config file or env vars
          I18N_TMS_URL: ${{ secrets.MEMSOURCE_URL }}
          I18N_TMS_PROJECT_ID: ${{ secrets.MEMSOURCE_PROJECT_ID }}

      - name: Upload to TMS
        run: |
          yarn translations-cli i18n upload \
            --source-file i18n/reference.json \
            --target-languages fr,it,ja \
            --no-input
        env:
          MEMSOURCE_TOKEN: ${{ secrets.MEMSOURCE_TOKEN }}
          MEMSOURCE_URL: ${{ secrets.MEMSOURCE_URL }}
          I18N_TMS_PROJECT_ID: ${{ secrets.MEMSOURCE_PROJECT_ID }}

      - name: Download translations
        run: |
          yarn translations-cli i18n download \
            --project-id ${{ secrets.MEMSOURCE_PROJECT_ID }} \
            --output-dir i18n/downloads \
            --no-input
        env:
          MEMSOURCE_TOKEN: ${{ secrets.MEMSOURCE_TOKEN }}
          MEMSOURCE_URL: ${{ secrets.MEMSOURCE_URL }}

      - name: Deploy translations
        run: |
          yarn translations-cli i18n deploy \
            --download-dir i18n/downloads \
            --no-input
```

### Option 2: Minimal CI (Generate Only)

For CI that only needs to generate translation keys (no TMS interaction):

```yaml
- name: Generate translation keys
  run: |
    yarn translations-cli i18n generate \
      --source-dir src \
      --output-dir i18n \
      --dry-run  # Optional: validate without writing files
```

### Option 3: Using Docker Image

If memsource CLI installation is complex, use a pre-built Docker image:

```yaml
- name: Run translation workflow
  run: |
    docker run \
      -v $PWD:/workspace \
      -e MEMSOURCE_TOKEN=${{ secrets.MEMSOURCE_TOKEN }} \
      -e MEMSOURCE_URL=${{ secrets.MEMSOURCE_URL }} \
      your-org/translations-cli:latest \
      i18n sync --no-input
```

## Required Improvements for Full CI Support

### High Priority

1. **✅ DONE**: Remove hardcoded paths (memsource venv path)
2. **✅ DONE**: Add `--no-input` flag support
3. **✅ DONE**: Environment variable support for all credentials

### Medium Priority

1. **Make home directory paths configurable**

   - Add `--config-dir` or `--auth-file` options
   - Allow overriding default paths via environment variables
   - Example: `I18N_AUTH_FILE=/path/to/auth.json`

2. **Improve memsource CLI detection**

   - Better error messages when memsource CLI is not found
   - Option to skip memsource CLI requirement for generate-only workflows
   - Support for memsource CLI installed via different methods (pip, npm, etc.)

3. **Add CI-specific documentation**
   - Examples for common CI platforms (GitHub Actions, GitLab CI, Jenkins)
   - Best practices for secret management
   - Troubleshooting guide for CI environments

### Low Priority

1. **Add dry-run mode for all commands**

   - Validate configuration without executing
   - Useful for CI validation steps

2. **Support for alternative authentication methods**

   - API keys instead of username/password
   - Service account tokens
   - OAuth2 flows

3. **CI-specific optimizations**
   - Caching for generated files
   - Parallel execution where possible
   - Better logging for CI environments

## Testing CI Compatibility

To test if your workflow is CI-compatible:

```bash
# Test non-interactive mode
CI=true translations-cli i18n generate --no-input

# Test with environment variables only
MEMSOURCE_TOKEN=test-token \
MEMSOURCE_URL=https://cloud.memsource.com/web \
I18N_TMS_PROJECT_ID=test-project \
translations-cli i18n upload --source-file test.json --no-input
```

## Current Limitations

1. **Memsource CLI is required** for upload/download operations

   - Cannot be fully bypassed
   - Must be installed in CI environment

2. **Python virtual environment** may be needed

   - Depends on how memsource CLI is installed
   - Can be worked around with global installation

3. **Home directory access** for config files
   - Works but not ideal for CI
   - Should use environment variables or project config files instead

## Conclusion

**Current Status**: The workflow is **mostly CI-compatible** with some limitations.

**For CI use today**:

- ✅ Can generate translation keys
- ✅ Can upload/download with proper setup (memsource CLI + env vars)
- ✅ All interactive prompts can be bypassed
- ⚠️ Requires memsource CLI installation in CI
- ⚠️ Home directory file access works but not ideal

**For full CI support**:

- Make config file paths configurable
- Improve memsource CLI installation documentation
- Add CI-specific examples and best practices

The workflow is **ready for CI integration** with proper setup, but some improvements would make it more CI-friendly.
